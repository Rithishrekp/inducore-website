/**
 * Shared Redis storage layer — used by all Vercel API handlers.
 *
 * DESIGN RULES
 * ────────────
 * • Every function receives a `Redis` instance — callers create/cache it.
 * • `getRedis()` throws a typed StorageError when env vars are missing.
 *   Callers propagate this as HTTP 503.
 * • Seed data is loaded from server/data/products.json via fs.readFileSync.
 *   Vercel includes this file because vercel.json specifies includeFiles.
 *
 * KV key schema
 * ─────────────
 *   products:ids              SET<string>   all known product IDs
 *   product:{id}              string(JSON)  full Product record
 *   update:{requestId}        string(JSON)  UpdateLog — idempotency cache
 *   history:{productId}       string(JSON)  HistoryEntry[]
 */

import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import type { Product, HistoryEntry, UpdateLog, StorageError } from "./types.js";

// ── Redis client ──────────────────────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const REDIS_CONFIGURED =
  typeof REDIS_URL === "string" && REDIS_URL.length > 0 &&
  typeof REDIS_TOKEN === "string" && REDIS_TOKEN.length > 0;

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!REDIS_CONFIGURED) {
    const err = new Error(
      "Persistent storage is not configured. " +
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set. " +
      "Install Upstash Redis from the Vercel Marketplace " +
      "(vercel.com/marketplace) and link it to the inducore-website project."
    ) as StorageError;
    err.code = "REDIS_NOT_CONFIGURED";
    throw err;
  }
  if (!_redis) {
    _redis = new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! });
  }
  return _redis;
}

// ── Seed data ─────────────────────────────────────────────────────────────
// products.json is included in every function bundle via vercel.json:includeFiles.
// process.cwd() = /var/task in Vercel runtime.

let _seedProducts: Product[] | null = null;

export function getSeedProducts(): Product[] {
  if (_seedProducts) return _seedProducts;

  const candidates = [
    path.join(process.cwd(), "server", "data", "products.json"),
    path.join(process.cwd(), "api", "_lib", "products.json"),
    path.join(process.cwd(), "products.json"),
  ];

  for (const jsonPath of candidates) {
    try {
      if (fs.existsSync(jsonPath)) {
        const parsed: Product[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        if (Array.isArray(parsed) && parsed.length > 0) {
          _seedProducts = parsed.map((p) => ({
            ...p,
            version: typeof p.version === "number" ? p.version : 1,
            lastUpdated: p.lastUpdated || "18 Aug 2026",
          }));
          return _seedProducts;
        }
      }
    } catch (_) {
      // try next candidate
    }
  }

  throw new Error(
    "Seed file not found in candidates: " + candidates.join(", ") +
    ". Ensure server/data/products.json or api/_lib/products.json is committed."
  );
}

// ── Storage operations ────────────────────────────────────────────────────

function parseRecord<T>(raw: unknown): T {
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

async function seedProductToRedis(redis: Redis, product: Product): Promise<void> {
  await redis.set(`product:${product.id}`, JSON.stringify(product));
  await redis.sadd("products:ids", product.id);
}

/** Lazy-seed all products that are missing from KV. Called on first GET /api/products. */
export async function ensureAllProductsSeeded(redis: Redis): Promise<void> {
  const existing = (await redis.smembers("products:ids")) as string[];
  const existingSet = new Set(existing);
  const seed = getSeedProducts();
  const toSeed = seed.filter((p) => !existingSet.has(p.id));
  if (toSeed.length > 0) {
    await Promise.all(toSeed.map((p) => seedProductToRedis(redis, p)));
    console.log(`[InduCore] Seeded ${toSeed.length} products to Redis.`);
  }
}

/** Return all products. Triggers seeding if store is empty. */
export async function getAllProducts(redis: Redis): Promise<Product[]> {
  await ensureAllProductsSeeded(redis);
  const ids = (await redis.smembers("products:ids")) as string[];
  if (!ids || ids.length === 0) return [];
  const records = await Promise.all(
    ids.map(async (id) => {
      const raw = await redis.get(`product:${id}`);
      return raw ? parseRecord<Product>(raw) : null;
    })
  );
  return records.filter((p): p is Product => p !== null);
}

/** Return a single product by ID or model number. Lazy-seeds from JSON if not in KV. */
export async function getProductFromRedis(
  redis: Redis,
  productId: string
): Promise<Product | null> {
  const cleanId = productId.trim().toUpperCase();

  // 1. O(1) key lookup
  const raw = await redis.get(`product:${cleanId}`);
  if (raw) return parseRecord<Product>(raw);

  // 2. Seed from JSON if present there (handles first-time access per product)
  const seed = getSeedProducts();
  const seedMatch = seed.find(
    (p) => p.id.toUpperCase() === cleanId || p.model.toUpperCase() === cleanId
  );
  if (seedMatch) {
    await seedProductToRedis(redis, seedMatch);
    return seedMatch;
  }

  // 3. Scan index for model-number match (O(n), last resort)
  const ids = (await redis.smembers("products:ids")) as string[];
  for (const id of ids) {
    const candidateRaw = await redis.get(`product:${id}`);
    if (!candidateRaw) continue;
    const candidate = parseRecord<Product>(candidateRaw);
    if (
      candidate.id.toUpperCase() === cleanId ||
      candidate.model.toUpperCase() === cleanId
    ) {
      return candidate;
    }
  }

  return null;
}

export async function saveProductToRedis(redis: Redis, product: Product): Promise<void> {
  await redis.set(`product:${product.id}`, JSON.stringify(product));
  await redis.sadd("products:ids", product.id);
}

export async function getUpdateLog(redis: Redis, requestId: string): Promise<UpdateLog | null> {
  const raw = await redis.get(`update:${requestId}`);
  return raw ? parseRecord<UpdateLog>(raw) : null;
}

export async function saveUpdateLog(
  redis: Redis,
  requestId: string,
  log: UpdateLog
): Promise<void> {
  await redis.set(`update:${requestId}`, JSON.stringify(log));
}

export async function appendHistory(
  redis: Redis,
  productId: string,
  entry: HistoryEntry
): Promise<void> {
  const raw = await redis.get(`history:${productId}`);
  const existing: HistoryEntry[] = raw ? parseRecord<HistoryEntry[]>(raw) : [];
  existing.push(entry);
  await redis.set(`history:${productId}`, JSON.stringify(existing));
}

export async function getHistory(redis: Redis, productId: string): Promise<HistoryEntry[]> {
  const raw = await redis.get(`history:${productId}`);
  return raw ? parseRecord<HistoryEntry[]>(raw) : [];
}

// ── HTTP response helpers ─────────────────────────────────────────────────

import type { VercelResponse } from "@vercel/node";

export function noCache(res: VercelResponse): void {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

export function setCors(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function sendStorageError(err: unknown, res: VercelResponse): void {
  const error = err as StorageError;
  if (error.code === "REDIS_NOT_CONFIGURED") {
    res.status(503).json({
      success: false,
      status: "storage_not_configured",
      message: error.message,
      action:
        "1. Go to https://vercel.com/marketplace and install Upstash Redis. " +
        "2. Link the store to the inducore-website project. " +
        "3. Redeploy — Vercel will inject UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN automatically.",
    });
  } else {
    console.error("[InduCore] Storage error:", err);
    res.status(500).json({
      success: false,
      status: "storage_error",
      message: `Storage operation failed: ${(error as Error).message || String(err)}`,
    });
  }
}
