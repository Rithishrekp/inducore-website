/**
 * This file is intentionally not used as a Vercel serverless handler.
 *
 * The production API is served by individual handlers:
 *   api/integration/health.ts
 *   api/integration/product-update.ts
 *   api/products/index.ts
 *   api/products/[productId].ts
 *
 * Local development uses server/index.ts (Express, localhost:5000).
 *
 * DO NOT add imports to server/index.ts here — that caused
 * ERR_MODULE_NOT_FOUND at /var/task/server/index on Vercel.
 */
export {};
