import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRedis,
  REDIS_CONFIGURED,
  noCache,
  setCors,
  sendStorageError,
  getHistory,
} from "../../_lib/redis.js";

/**
 * GET /api/products/:productId/history
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
    const history = await getHistory(redis, productId.toUpperCase());
    return res.status(200).json({ productId: productId.toUpperCase(), history });
  } catch (err) {
    return sendStorageError(err, res);
  }
}
