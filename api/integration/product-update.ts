import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRedis,
  REDIS_CONFIGURED,
  noCache,
  setCors,
  sendStorageError,
  getProductFromRedis,
  saveProductToRedis,
  getUpdateLog,
  saveUpdateLog,
  appendHistory,
} from "../_lib/redis.js";
import { resolveSpecKey, isSupplierOnlyField, formatDate } from "../_lib/resolver.js";
import type { Product, HistoryEntry } from "../_lib/types.js";

/**
 * POST /api/integration/product-update
 *
 * Validates, applies, and persists an approved product update to Redis.
 * Generic: works for any product ID and any approved customer-facing field.
 * No product IDs, field names, or values are hardcoded.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  noCache(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed. Use POST." });
  }

  // Vercel parses JSON body automatically for application/json content-type
  const payload = (req.body || {}) as {
    requestId?: string;
    productId?: string;
    modelNumber?: string;
    expectedVersion?: number;
    newVersion?: number;
    updates?: Record<string, unknown>;
    source?: { documentName?: string; documentVersion?: string };
    approval?: { approved?: boolean; approvedBy?: string; approvalId?: string };
  };

  const { requestId, productId, modelNumber, expectedVersion, newVersion, updates, source, approval } = payload;

  // ── requestId required ───────────────────────────────────────────────────
  if (!requestId?.trim()) {
    return res.status(400).json({
      success: false,
      status: "invalid_request",
      message: "Missing required field: requestId.",
    });
  }

  // ── Redis must be configured ─────────────────────────────────────────────
  if (!REDIS_CONFIGURED) {
    return res.status(503).json({
      success: false,
      status: "storage_not_configured",
      message:
        "Persistent storage is not configured. " +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      action:
        "1. Go to https://vercel.com/marketplace → install Upstash Redis. " +
        "2. Link to the inducore-website Vercel project. " +
        "3. Redeploy (env vars are auto-injected).",
    });
  }

  let redis: ReturnType<typeof getRedis>;
  try {
    redis = getRedis();
  } catch (err) {
    return sendStorageError(err, res);
  }

  // ── Idempotency ──────────────────────────────────────────────────────────
  try {
    const cached = await getUpdateLog(redis, requestId);
    if (cached) {
      return res.status(cached.httpStatus || 200).json(cached.responseBody);
    }
  } catch (err) {
    return sendStorageError(err, res);
  }

  // ── Helper: reject and record ────────────────────────────────────────────
  const rejectRequest = async (
    status: string,
    message: string,
    httpCode: number,
    additional: Record<string, unknown> = {}
  ): Promise<VercelResponse> => {
    const body = { success: false, status, message, ...additional };
    try {
      await saveUpdateLog(redis, requestId, {
        status: "rejected",
        httpStatus: httpCode,
        responseBody: body,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* best-effort */ }
    return res.status(httpCode).json(body);
  };

  // ── Approval ─────────────────────────────────────────────────────────────
  if (!approval || approval.approved !== true) {
    return rejectRequest(
      "approval_required",
      "Human approval is required. Set approval.approved = true.",
      403
    );
  }

  // ── Updates object ───────────────────────────────────────────────────────
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates) ||
    Object.keys(updates).length === 0
  ) {
    return rejectRequest(
      "invalid_updates",
      "The 'updates' field must be a non-empty JSON object mapping field names to new values.",
      400
    );
  }

  // ── Reject supplier-only fields ──────────────────────────────────────────
  const supplierFields = Object.keys(updates).filter(isSupplierOnlyField);
  if (supplierFields.length > 0) {
    return rejectRequest(
      "supplier_fields_rejected",
      `These fields are supplier-only and cannot be published to the customer catalog: ${supplierFields.join(", ")}.`,
      400,
      { rejectedFields: supplierFields }
    );
  }

  // ── Load product ─────────────────────────────────────────────────────────
  let matchedProduct: Product | null = null;
  try {
    if (productId?.trim()) {
      matchedProduct = await getProductFromRedis(redis, productId);
    }
    if (!matchedProduct && modelNumber?.trim()) {
      matchedProduct = await getProductFromRedis(redis, modelNumber);
    }
  } catch (err) {
    return sendStorageError(err, res);
  }

  if (!matchedProduct) {
    return rejectRequest(
      "product_not_found",
      `No product found with ID '${productId || ""}' or model '${modelNumber || ""}' in the persistent catalog.`,
      404
    );
  }

  // ── Version safety ────────────────────────────────────────────────────────
  const currentVersion = matchedProduct.version;
  if (
    typeof expectedVersion === "number" &&
    expectedVersion !== currentVersion
  ) {
    return rejectRequest(
      "version_conflict",
      `Version mismatch: expected v${expectedVersion}, but product is at v${currentVersion}. ` +
        "Fetch the latest product data before applying this update.",
      409,
      { currentVersion }
    );
  }

  // ── Apply updates ─────────────────────────────────────────────────────────
  const TOP_LEVEL_FIELDS: Array<keyof Product> = ["name", "description", "category", "image"];
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const changedFields: string[] = [];

  const updatedProduct: Product = {
    ...matchedProduct,
    specifications: { ...matchedProduct.specifications },
    documents: matchedProduct.documents?.map((d) => ({ ...d })) ?? [],
  };

  for (const [rawKey, rawValue] of Object.entries(updates)) {
    if (rawValue === undefined || rawValue === null) continue;
    const strValue = String(rawValue);

    const topKey = TOP_LEVEL_FIELDS.find(
      (k) => k.toLowerCase() === rawKey.toLowerCase()
    );
    if (topKey) {
      const oldVal = updatedProduct[topKey] as string;
      if (oldVal !== strValue) {
        changes[topKey as string] = { old: oldVal, new: strValue };
        changedFields.push(topKey as string);
        (updatedProduct as Record<string, unknown>)[topKey] = strValue;
      }
      continue;
    }

    const resolvedKey = resolveSpecKey(rawKey, Object.keys(updatedProduct.specifications));
    const oldSpecVal = updatedProduct.specifications[resolvedKey];
    if (oldSpecVal !== strValue) {
      changes[resolvedKey] = { old: oldSpecVal ?? null, new: strValue };
      changedFields.push(resolvedKey);
      updatedProduct.specifications[resolvedKey] = strValue;
    }
  }

  // ── Version + timestamp ───────────────────────────────────────────────────
  const targetNewVersion =
    typeof newVersion === "number" && newVersion > currentVersion
      ? newVersion
      : currentVersion + 1;
  updatedProduct.version = targetNewVersion;
  updatedProduct.lastUpdated = formatDate(new Date());

  // ── Update Technical Datasheet version if source.documentVersion provided ─
  if (source?.documentVersion) {
    const dsIdx = updatedProduct.documents.findIndex(
      (d) => d.type === "Technical Datasheet"
    );
    if (dsIdx !== -1) {
      const oldDocVersion = matchedProduct.documents[dsIdx]?.version ?? null;
      updatedProduct.documents[dsIdx] = {
        ...updatedProduct.documents[dsIdx],
        version: source.documentVersion,
        publishDate: updatedProduct.lastUpdated,
      };
      changes["documentVersion"] = { old: oldDocVersion, new: source.documentVersion };
      changedFields.push("documentVersion");
    }
  }

  // ── Persist to Redis ──────────────────────────────────────────────────────
  const historyEntry: HistoryEntry = {
    requestId,
    previousVersion: currentVersion,
    newVersion: targetNewVersion,
    changes,
    approvedBy: approval.approvedBy || "UNKNOWN",
    approvalId: approval.approvalId || "UNKNOWN",
    source: {
      documentName: source?.documentName,
      documentVersion: source?.documentVersion,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await saveProductToRedis(redis, updatedProduct);
    await appendHistory(redis, updatedProduct.id, historyEntry);
  } catch (err) {
    return sendStorageError(err, res);
  }

  // ── Build and cache success response ──────────────────────────────────────
  const successResponse = {
    success: true,
    status: "updated",
    message: `Product ${updatedProduct.id} (${updatedProduct.name}) updated to v${targetNewVersion}.`,
    requestId,
    productId: updatedProduct.id,
    modelNumber: updatedProduct.model,
    category: updatedProduct.category,
    previousVersion: currentVersion,
    newVersion: targetNewVersion,
    changedFields,
    changes,
    updatedProduct,
  };

  try {
    await saveUpdateLog(redis, requestId, {
      status: "applied",
      httpStatus: 200,
      responseBody: successResponse,
      timestamp: new Date().toISOString(),
      details: {
        productId: updatedProduct.id,
        category: updatedProduct.category,
        previousVersion: currentVersion,
        newVersion: targetNewVersion,
        changedFields,
      },
    });
  } catch (err) {
    console.warn("[product-update] Failed to cache update log:", err);
  }

  console.log(
    `[InduCore] ${updatedProduct.id} (${updatedProduct.category}) ` +
    `v${currentVersion} → v${targetNewVersion} | changed: ${changedFields.join(", ")}`
  );

  return res.status(200).json(successResponse);
}
