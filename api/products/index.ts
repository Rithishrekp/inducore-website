import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRedis,
  REDIS_CONFIGURED,
  noCache,
  setCors,
  sendStorageError,
  getAllProducts,
} from "../_lib/redis.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  noCache(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!REDIS_CONFIGURED) {
    return sendStorageError(
      Object.assign(new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set."
      ), { code: "REDIS_NOT_CONFIGURED" }),
      res
    );
  }

  try {
    const redis = getRedis();
    const products = await getAllProducts(redis);
    return res.status(200).json(products);
  } catch (err) {
    return sendStorageError(err, res);
  }
}
