import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRedis,
  REDIS_CONFIGURED,
  noCache,
  setCors,
  sendStorageError,
  getProductFromRedis,
} from "../_lib/redis.js";

/**
 * GET /api/storefront/:productId
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
    const product = await getProductFromRedis(redis, productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product '${productId}' not found.`,
      });
    }
    return res.status(200).json({
      product_code: product.id,
      name: product.name,
      category: product.category,
      version: `v${product.version}.0`,
      specifications: product.specifications,
      last_synced_at: product.lastUpdated,
    });
  } catch (err) {
    return sendStorageError(err, res);
  }
}
