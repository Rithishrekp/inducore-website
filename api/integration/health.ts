import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis, REDIS_CONFIGURED, noCache, setCors } from "../_lib/redis.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  noCache(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!REDIS_CONFIGURED) {
    return res.status(503).json({
      status: "degraded",
      service: "InduCore E-commerce API",
      version: "3.0",
      storage: "NOT_CONFIGURED",
      message:
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. " +
        "Install Upstash Redis from the Vercel Marketplace and link to this project.",
    });
  }

  try {
    const redis = getRedis();
    const ids = (await redis.smembers("products:ids")) as string[];
    return res.status(200).json({
      status: "ok",
      service: "InduCore E-commerce API",
      version: "3.0",
      storage: "UPSTASH_REDIS_CONNECTED",
      totalProducts: ids.length,
    });
  } catch (err) {
    console.error("[health] Redis error:", err);
    return res.status(503).json({
      status: "degraded",
      service: "InduCore E-commerce API",
      version: "3.0",
      storage: "REDIS_ERROR",
      message: `Redis connectivity error: ${(err as Error).message}`,
    });
  }
}
