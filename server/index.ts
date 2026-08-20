/**
 * InduCore Integration Server — v3.0
 *
 * Persistent store: Upstash Redis (via @upstash/redis)
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL   — provided automatically by Vercel when you
 *   UPSTASH_REDIS_REST_TOKEN   link the Upstash Redis integration
 *
 * KV key schema:
 *   products:ids              → SMEMBERS → Set<productId>
 *   product:{id}              → JSON Product record (full, persisted)
 *   update:{requestId}        → UpdateLog (idempotency)
 *   history:{productId}       → HistoryEntry[] (full change history)
 *
 * Hard-fail policy:
 *   If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set,
 *   every storage call returns HTTP 503 with a clear action message.
 *   There is NO silent fallback to seed data in production.
 *
 * Seeding:
 *   Products are lazy-seeded from server/data/products.json on first access.
 *   Each product is seeded exactly once into Redis per store lifetime.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductDocument {
  id: string;
  productId: string;
  type: string;
  version: string;
  file: string;
  title: string;
  fileSize?: string;
  publishDate?: string;
}

export interface Product {
  id: string;
  model: string;
  name: string;
  category: string;
  description: string;
  image: string;
  specifications: Record<string, string>;
  applications: string[];
  compatibleProducts: string[];
  relatedProducts: string[];
  documents: ProductDocument[];
  version: number;
  lastUpdated: string;
}

export interface HistoryEntry {
  requestId: string;
  previousVersion: number;
  newVersion: number;
  changes: Record<string, { old: unknown; new: unknown }>;
  approvedBy: string;
  approvalId: string;
  source: { documentName?: string; documentVersion?: string };
  timestamp: string;
}

export interface UpdateLog {
  status: "applied" | "rejected";
  httpStatus: number;
  responseBody: unknown;
  timestamp: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Redis client — lazy initialisation
// ---------------------------------------------------------------------------

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.REDIS_REST_API_URL ||
  process.env.UPSTASH_REDIS_URL;

const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.REDIS_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_TOKEN;

const REDIS_CONFIGURED =
  typeof REDIS_URL === "string" && REDIS_URL.trim().length > 0 &&
  typeof REDIS_TOKEN === "string" && REDIS_TOKEN.trim().length > 0;

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!REDIS_CONFIGURED) {
    const err = new Error(
      "Persistent storage is not configured. " +
      "UPSTASH_REDIS_REST_URL / KV_REST_API_URL and UPSTASH_REDIS_REST_TOKEN / KV_REST_API_TOKEN must be set. " +
      "Install the Upstash Redis integration from the Vercel Marketplace " +
      "(vercel.com/marketplace) and link it to this project, then redeploy."
    ) as NodeJS.ErrnoException;
    err.code = "REDIS_NOT_CONFIGURED";
    throw err;
  }
  if (!_redis) {
    _redis = new Redis({ url: REDIS_URL!.trim(), token: REDIS_TOKEN!.trim() });
  }
  return _redis;
}

const IS_VERCEL = !!process.env.VERCEL;
const IS_LOCAL = !IS_VERCEL;

// ---------------------------------------------------------------------------
// Seed data loader — reads server/data/products.json at runtime
// ---------------------------------------------------------------------------

let _seedProducts: Product[] | null = null;

function getSeedProducts(): Product[] {
  if (_seedProducts) return _seedProducts;
  const jsonPath = path.join(process.cwd(), "server", "data", "products.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Seed data file not found: ${jsonPath}`);
  }
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const parsed: Product[] = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Seed data file is empty or malformed.");
  }
  _seedProducts = parsed.map((p) => ({
    ...p,
    version: typeof p.version === "number" ? p.version : 1,
    lastUpdated: p.lastUpdated || "18 Aug 2026",
  }));
  return _seedProducts;
}

// In-memory fallback for local development when Redis is not configured
const localProducts = new Map<string, Product>();
const localLogs = new Map<string, UpdateLog>();
const localHistory = new Map<string, HistoryEntry[]>();

function ensureLocalSeeded() {
  if (localProducts.size === 0) {
    const seed = getSeedProducts();
    for (const p of seed) {
      localProducts.set(p.id.toUpperCase(), { ...p });
    }
  }
}

async function seedProductToRedis(redis: Redis, product: Product): Promise<void> {
  await redis.set(`product:${product.id}`, JSON.stringify(product));
  await redis.sadd("products:ids", product.id);
}

async function ensureAllProductsSeeded(redis?: Redis): Promise<void> {
  if (redis) {
    const existing = await redis.smembers("products:ids") as string[];
    const existingSet = new Set(existing);
    const seed = getSeedProducts();
    const toSeed = seed.filter((p) => !existingSet.has(p.id));
    if (toSeed.length > 0) {
      await Promise.all(toSeed.map((p) => seedProductToRedis(redis, p)));
      console.log(`[InduCore] Seeded ${toSeed.length} products to Redis.`);
    }
  } else {
    ensureLocalSeeded();
  }
}

async function getAllProducts(redis?: Redis): Promise<Product[]> {
  if (redis) {
    await ensureAllProductsSeeded(redis);
    const ids = await redis.smembers("products:ids") as string[];
    if (!ids || ids.length === 0) return [];
    const records = await Promise.all(
      ids.map(async (id) => {
        const raw = await redis.get(`product:${id}`);
        if (!raw) return null;
        return typeof raw === "string" ? JSON.parse(raw) as Product : raw as Product;
      })
    );
    return records.filter((p): p is Product => p !== null);
  }
  ensureLocalSeeded();
  return Array.from(localProducts.values());
}

async function getProductFromStore(
  productId: string,
  redis?: Redis
): Promise<Product | null> {
  const cleanId = productId.trim().toUpperCase();

  if (redis) {
    // 1. Direct key lookup (O(1))
    const raw = await redis.get(`product:${cleanId}`);
    if (raw) {
      return typeof raw === "string" ? JSON.parse(raw) as Product : raw as Product;
    }

    // 2. Try seed data
    const seed = getSeedProducts();
    const seedMatch = seed.find(
      (p) => p.id.toUpperCase() === cleanId || p.model.toUpperCase() === cleanId
    );
    if (seedMatch) {
      await seedProductToRedis(redis, seedMatch);
      return seedMatch;
    }

    // 3. Scan KV index for model match
    const ids = await redis.smembers("products:ids") as string[];
    for (const id of ids) {
      const candidateRaw = await redis.get(`product:${id}`);
      if (!candidateRaw) continue;
      const candidate: Product = typeof candidateRaw === "string"
        ? JSON.parse(candidateRaw)
        : candidateRaw as Product;
      if (
        candidate.id.toUpperCase() === cleanId ||
        candidate.model.toUpperCase() === cleanId
      ) {
        return candidate;
      }
    }
    return null;
  }

  ensureLocalSeeded();
  const direct = localProducts.get(cleanId);
  if (direct) return direct;

  for (const p of localProducts.values()) {
    if (p.model.toUpperCase() === cleanId) return p;
  }
  return null;
}

async function saveProductToStore(product: Product, redis?: Redis): Promise<void> {
  if (redis) {
    await redis.set(`product:${product.id}`, JSON.stringify(product));
    await redis.sadd("products:ids", product.id);
  } else {
    ensureLocalSeeded();
    localProducts.set(product.id.toUpperCase(), { ...product });
  }
}

async function getUpdateLog(requestId: string, redis?: Redis): Promise<UpdateLog | null> {
  if (redis) {
    const raw = await redis.get(`update:${requestId}`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) as UpdateLog : raw as UpdateLog;
  }
  return localLogs.get(requestId) || null;
}

async function saveUpdateLog(
  requestId: string,
  log: UpdateLog,
  redis?: Redis
): Promise<void> {
  if (redis) {
    await redis.set(`update:${requestId}`, JSON.stringify(log));
  } else {
    localLogs.set(requestId, log);
  }
}

async function appendHistory(
  productId: string,
  entry: HistoryEntry,
  redis?: Redis
): Promise<void> {
  if (redis) {
    const raw = await redis.get(`history:${productId}`);
    const existing: HistoryEntry[] = raw
      ? (typeof raw === "string" ? JSON.parse(raw) : raw as HistoryEntry[])
      : [];
    existing.push(entry);
    await redis.set(`history:${productId}`, JSON.stringify(existing));
  } else {
    const key = productId.toUpperCase();
    const existing = localHistory.get(key) || [];
    existing.push(entry);
    localHistory.set(key, existing);
  }
}

async function getHistory(productId: string, redis?: Redis): Promise<HistoryEntry[]> {
  if (redis) {
    const raw = await redis.get(`history:${productId}`);
    if (!raw) return [];
    return typeof raw === "string" ? JSON.parse(raw) : raw as HistoryEntry[];
  }
  return localHistory.get(productId.toUpperCase()) || [];
}

// ---------------------------------------------------------------------------
// Supplier-only field guard — never published to the customer catalog
// ---------------------------------------------------------------------------

const SUPPLIER_ONLY_NORMALISED = new Set([
  "supplierid", "suppliername", "unitprice", "stockqty",
  "deliverydays", "moq", "paymentterms", "incoterms",
  "supplierstatus", "purchaseprice", "marginpercent", "leadtime",
]);

function isSupplierOnlyField(key: string): boolean {
  return SUPPLIER_ONLY_NORMALISED.has(key.toLowerCase().replace(/[\s_-]/g, ""));
}

// ---------------------------------------------------------------------------
// Spec key resolver — maps incoming field name to existing spec key
// ---------------------------------------------------------------------------

const SPEC_ALIASES: Record<string, string> = {
  ratio: "Gear Ratio",
  gearratio: "Gear Ratio",
  flowrate: "Flow Rate",
  inputpower: "Input Power",
  outputtorque: "Output Torque",
  inputspeed: "Input Speed",
  outputspeed: "Output Speed",
  housingmaterial: "Housing Material",
  valvetype: "Valve Type",
  nominaldiameter: "Nominal Diameter",
  pressurerating: "Pressure Rating",
  maximumpressure: "Maximum Pressure",
  airflow: "Air Flow",
  tankcapacity: "Tank Capacity",
  noiselevel: "Noise Level",
  noiselvl: "Noise Level",
  powerfactor: "Power Factor",
};

function resolveSpecKey(incomingKey: string, existingSpecKeys: string[]): string {
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normIncoming = normalise(incomingKey);

  // 1. Exact case-insensitive match against existing keys
  const exact = existingSpecKeys.find(
    (k) => k.toLowerCase() === incomingKey.toLowerCase()
  );
  if (exact) return exact;

  // 2. Normalised (strip non-alphanum) match against existing keys
  const fuzzy = existingSpecKeys.find((k) => normalise(k) === normIncoming);
  if (fuzzy) return fuzzy;

  // 3. Known alias
  if (SPEC_ALIASES[normIncoming]) return SPEC_ALIASES[normIncoming];

  // 4. Create new key with proper capitalisation
  return incomingKey.charAt(0).toUpperCase() + incomingKey.slice(1);
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

function noCache(res: Response): void {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

function handleStorageError(err: unknown, res: Response): Response {
  const error = err as NodeJS.ErrnoException;
  if (error.code === "REDIS_NOT_CONFIGURED") {
    return res.status(503).json({
      success: false,
      status: "storage_not_configured",
      message: error.message,
      action:
        "1. Go to https://vercel.com/marketplace and install Upstash Redis. " +
        "2. Link the store to the inducore-website project. " +
        "3. Redeploy — Vercel will inject UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN automatically.",
    });
  }
  console.error("[InduCore] Storage error:", err);
  return res.status(500).json({
    success: false,
    status: "storage_error",
    message: `Storage operation failed: ${error.message || String(err)}`,
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// 1. Health check
app.get("/api/integration/health", async (_req: Request, res: Response) => {
  noCache(res);
  if (!REDIS_CONFIGURED) {
    ensureLocalSeeded();
    return res.json({
      status: "ok",
      service: "InduCore E-commerce API (Local Dev)",
      version: "3.0",
      storage: "LOCAL_IN_MEMORY",
      totalProducts: localProducts.size,
    });
  }
  try {
    const redis = getRedis();
    const ids = await redis.smembers("products:ids") as string[];
    return res.json({
      status: "ok",
      service: "InduCore E-commerce API",
      version: "3.0",
      storage: "UPSTASH_REDIS_CONNECTED",
      totalProducts: ids.length,
    });
  } catch (err) {
    return res.status(503).json({
      status: "degraded",
      service: "InduCore E-commerce API",
      version: "3.0",
      storage: "REDIS_ERROR",
      message: `Redis connectivity error: ${(err as Error).message}`,
    });
  }
});

// 2. GET all products
app.get("/api/products", async (_req: Request, res: Response) => {
  noCache(res);
  try {
    const redis = REDIS_CONFIGURED ? getRedis() : undefined;
    const products = await getAllProducts(redis);
    return res.json(products);
  } catch (err) {
    return handleStorageError(err, res);
  }
});

// 2b. GET single product by ID or model
app.get("/api/products/:productId", async (req: Request, res: Response) => {
  noCache(res);
  const { productId } = req.params;
  if (!productId?.trim()) {
    return res.status(400).json({ success: false, message: "Missing productId." });
  }
  try {
    const redis = REDIS_CONFIGURED ? getRedis() : undefined;
    const product = await getProductFromStore(productId, redis);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product '${productId}' not found in the catalog.`,
      });
    }
    return res.json(product);
  } catch (err) {
    return handleStorageError(err, res);
  }
});

// 2c. Storefront alias
app.get(
  ["/api/storefront/:productId", "/api/ecommerce/storefront/:productId"],
  async (req: Request, res: Response) => {
    noCache(res);
    const { productId } = req.params;
    try {
      const redis = REDIS_CONFIGURED ? getRedis() : undefined;
      const product = await getProductFromStore(productId, redis);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product '${productId}' not found.` });
      }
      return res.json({
        product_code: product.id,
        name: product.name,
        category: product.category,
        version: `v${product.version}.0`,
        specifications: product.specifications,
        last_synced_at: product.lastUpdated,
      });
    } catch (err) {
      return handleStorageError(err, res);
    }
  }
);

// 3. GET change history for a product
app.get("/api/products/:productId/history", async (req: Request, res: Response) => {
  noCache(res);
  const { productId } = req.params;
  try {
    const redis = REDIS_CONFIGURED ? getRedis() : undefined;
    const history = await getHistory(productId.toUpperCase(), redis);
    return res.json({ productId: productId.toUpperCase(), history });
  } catch (err) {
    return handleStorageError(err, res);
  }
});

// 4. GET update request status
app.get(
  "/api/integration/product-update/status/:requestId",
  async (req: Request, res: Response) => {
    noCache(res);
    const { requestId } = req.params;
    try {
      const redis = REDIS_CONFIGURED ? getRedis() : undefined;
      const log = await getUpdateLog(requestId, redis);
      if (!log) {
        return res.status(404).json({
          success: false,
          status: "not_found",
          message: `Request ID '${requestId}' does not exist.`,
        });
      }
      return res.json({ success: true, requestId, status: log.status, details: log.details || null });
    } catch (err) {
      return handleStorageError(err, res);
    }
  }
);

// 5. POST product-update — the main integration endpoint
app.post("/api/integration/product-update", async (req: Request, res: Response) => {
  noCache(res);

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

  if (!requestId?.trim()) {
    return res.status(400).json({
      success: false,
      status: "invalid_request",
      message: "Missing required field: requestId.",
    });
  }

  const redis = REDIS_CONFIGURED ? getRedis() : undefined;

  // ── Idempotency check ────────────────────────────────────────────────────
  try {
    const cached = await getUpdateLog(requestId, redis);
    if (cached) {
      return res.status(cached.httpStatus || 200).json(cached.responseBody);
    }
  } catch (err) {
    return handleStorageError(err, res);
  }

  // ── Helper: reject and record ────────────────────────────────────────────
  const rejectRequest = async (
    status: string,
    message: string,
    httpCode: number,
    additional: Record<string, unknown> = {}
  ): Promise<Response> => {
    const body = { success: false, status, message, ...additional };
    try {
      await saveUpdateLog(requestId, {
        status: "rejected",
        httpStatus: httpCode,
        responseBody: body,
        timestamp: new Date().toISOString(),
      }, redis);
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

  // ── Reject supplier-only fields before touching the DB ───────────────────
  const supplierFieldsFound = Object.keys(updates).filter(isSupplierOnlyField);
  if (supplierFieldsFound.length > 0) {
    return rejectRequest(
      "supplier_fields_rejected",
      `These fields are supplier-only and cannot be published to the customer catalog: ${supplierFieldsFound.join(", ")}.`,
      400,
      { rejectedFields: supplierFieldsFound }
    );
  }

  // ── Load product ─────────────────────────────────────────────────────────
  let matchedProduct: Product | null = null;
  try {
    if (productId?.trim()) {
      matchedProduct = await getProductFromStore(productId, redis);
    }
    if (!matchedProduct && modelNumber?.trim()) {
      matchedProduct = await getProductFromStore(modelNumber, redis);
    }
  } catch (err) {
    return handleStorageError(err, res);
  }

  if (!matchedProduct) {
    return rejectRequest(
      "product_not_found",
      `No product found with ID '${productId || ""}' or model '${modelNumber || ""}' in the catalog.`,
      404
    );
  }

  // ── Version safety ───────────────────────────────────────────────────────
  const currentVersion = matchedProduct.version;
  if (
    expectedVersion !== undefined &&
    expectedVersion !== null &&
    typeof expectedVersion === "number" &&
    expectedVersion !== currentVersion
  ) {
    return rejectRequest(
      "version_conflict",
      `Version mismatch: expected v${expectedVersion}, but product is currently at v${currentVersion}. ` +
        "Fetch the latest product data before applying this update.",
      409,
      { currentVersion }
    );
  }

  // ── Apply updates to a working copy ─────────────────────────────────────
  const TOP_LEVEL_FIELDS: Array<keyof Product> = ["name", "description", "category", "image"];
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const changedFields: string[] = [];

  const updatedProduct: Product = {
    ...matchedProduct,
    specifications: { ...matchedProduct.specifications },
    documents: matchedProduct.documents ? matchedProduct.documents.map((d) => ({ ...d })) : [],
  };

  for (const [rawKey, rawValue] of Object.entries(updates)) {
    if (rawValue === undefined || rawValue === null) continue;
    const strValue = String(rawValue);

    // Top-level field?
    const topKey = TOP_LEVEL_FIELDS.find(
      (k) => k.toLowerCase() === rawKey.toLowerCase()
    );
    if (topKey) {
      const oldVal = updatedProduct[topKey] as string;
      if (oldVal !== strValue) {
        changes[topKey] = { old: oldVal, new: strValue };
        changedFields.push(topKey as string);
        (updatedProduct as Record<string, unknown>)[topKey] = strValue;
      }
      continue;
    }

    // Spec field
    const resolvedKey = resolveSpecKey(rawKey, Object.keys(updatedProduct.specifications));
    const oldSpecVal = updatedProduct.specifications[resolvedKey];
    if (oldSpecVal !== strValue) {
      changes[resolvedKey] = { old: oldSpecVal ?? null, new: strValue };
      changedFields.push(resolvedKey);
      updatedProduct.specifications[resolvedKey] = strValue;
    }
  }

  // ── Version + timestamp ──────────────────────────────────────────────────
  const targetNewVersion = typeof newVersion === "number" && newVersion > currentVersion
    ? newVersion
    : currentVersion + 1;
  updatedProduct.version = targetNewVersion;
  updatedProduct.lastUpdated = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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

  // ── Persist (product + history) ──────────────────────────────────────────
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
    await saveProductToStore(updatedProduct, redis);
    await appendHistory(updatedProduct.id, historyEntry, redis);
  } catch (err) {
    return handleStorageError(err, res);
  }

  // ── Build success response and cache it ──────────────────────────────────
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
    await saveUpdateLog(requestId, {
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
    }, redis);
  } catch (err) {
    console.warn("[InduCore] Failed to cache update log:", err);
  }

  console.log(
    `[InduCore] ${updatedProduct.id} (${updatedProduct.category}) ` +
    `v${currentVersion} → v${targetNewVersion} | ` +
    `changed: ${changedFields.join(", ")}`
  );

  return res.json(successResponse);
});

// ---------------------------------------------------------------------------
// Static frontend (local dev only)
// ---------------------------------------------------------------------------

if (IS_LOCAL) {
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response, _next: NextFunction) => {
      if (_req.path.startsWith("/api")) return _next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

if (IS_LOCAL) {
  app.listen(PORT, () => {
    console.log(`InduCore API → http://localhost:${PORT}`);
    if (!REDIS_CONFIGURED) {
      console.warn(
        "⚠  Redis not configured. " +
        "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable persistence. " +
        "All storage calls will return HTTP 503 until configured."
      );
    }
  });
}

export default app;
