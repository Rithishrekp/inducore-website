// Shared types used by all API handlers and the local development server.
// Keep in sync with src/types/index.ts — the frontend uses the same shape.

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

export interface StorageError extends Error {
  code: "REDIS_NOT_CONFIGURED" | "REDIS_ERROR";
}
