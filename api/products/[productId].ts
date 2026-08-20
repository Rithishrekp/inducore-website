import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRedis,
  REDIS_CONFIGURED,
  noCache,
  setCors,
  sendStorageError,
  getProductFromRedis,
  getHistory,
} from "../_lib/redis.js";

/**
 * GET /api/products/:productId
 * GET /api/products/:productId/history  (append ?history=true OR sub-path)
 *
 * Dynamic param: req.query.productId
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  noCache(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  const productId = (req.query.productId as string | undefined)?.trim();
  if (!productId) {
    return res.status(400).json({ success: false, message: "Missing productId." });
  }

  if (!REDIS_CONFIGURED) {
    return sendStorageError(
      Object.assign(new Error("Redis not configured."), { code: "REDIS_NOT_CONFIGURED" }),
      res
    );
  }

  try {
    const redis = getRedis();

    // History sub-path: /api/products/:productId/history
    // Vercel calls [productId].ts for /api/products/:productId
    // but also for /api/products/:productId/history if no deeper handler exists.
    // Detect via the raw URL path.
    const rawPath = (req.url || "").split("?")[0];
    if (rawPath.endsWith("/history")) {
      const history = await getHistory(redis, productId.toUpperCase());
      return res.status(200).json({ productId: productId.toUpperCase(), history });
    }

    const product = await getProductFromRedis(redis, productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product '${productId}' not found in the persistent catalog.`,
      });
    }
    return res.status(200).json(product);
  } catch (err) {
    return sendStorageError(err, res);
  }
}
