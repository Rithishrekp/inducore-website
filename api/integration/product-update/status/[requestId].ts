import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRedis,
  REDIS_CONFIGURED,
  noCache,
  setCors,
  sendStorageError,
  getUpdateLog,
} from "../../../_lib/redis.js";

/**
 * GET /api/integration/product-update/status/:requestId
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  noCache(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  const requestId = (req.query.requestId as string | undefined)?.trim();
  if (!requestId) {
    return res.status(400).json({ success: false, message: "Missing requestId." });
  }

  if (!REDIS_CONFIGURED) {
    return sendStorageError(
      Object.assign(new Error("Redis not configured."), { code: "REDIS_NOT_CONFIGURED" }),
      res
    );
  }

  try {
    const redis = getRedis();
    const log = await getUpdateLog(redis, requestId);
    if (!log) {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: `Request ID '${requestId}' does not exist.`,
      });
    }
    return res.status(200).json({
      success: true,
      requestId,
      status: log.status,
      details: log.details || null,
    });
  } catch (err) {
    return sendStorageError(err, res);
  }
}
