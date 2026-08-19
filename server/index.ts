import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { PRODUCTS } from "../src/data/products";
import type { Product } from "../src/types";

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve DB file paths dynamically to support Vercel serverless functions (writeable /tmp)
const IS_VERCEL = !!process.env.VERCEL;
const BASE_DATA_DIR = IS_VERCEL ? "/tmp" : path.join(process.cwd(), "server/data");

const PRODUCTS_DB_PATH = path.join(BASE_DATA_DIR, "products.json");
const AUDITS_DB_PATH = path.join(BASE_DATA_DIR, "audits.json");
const UPDATES_DB_PATH = path.join(BASE_DATA_DIR, "updates.json");

// In-Memory fallback store to guarantee 100% serverless availability and zero 500 errors
let memoryProducts: Product[] = PRODUCTS.map((p) => ({
  ...p,
  version: p.version || 1,
  lastUpdated: p.lastUpdated || "18 Aug 2026",
}));

let memoryAudits: any[] = [];
let memoryUpdates: { [requestId: string]: any } = {};

// Ensure JSON database files are initialized
try {
  if (!fs.existsSync(BASE_DATA_DIR)) {
    fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_DB_PATH)) {
    fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify(memoryProducts, null, 2), "utf-8");
  } else {
    const diskData = JSON.parse(fs.readFileSync(PRODUCTS_DB_PATH, "utf-8"));
    if (Array.isArray(diskData) && diskData.length > 0) {
      memoryProducts = diskData;
    }
  }
  if (!fs.existsSync(AUDITS_DB_PATH)) {
    fs.writeFileSync(AUDITS_DB_PATH, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(UPDATES_DB_PATH)) {
    fs.writeFileSync(UPDATES_DB_PATH, JSON.stringify({}, null, 2), "utf-8");
  }
} catch (err) {
  console.warn("Storage init warning (operating in memory mode):", err);
}

// Middleware
app.use(express.json());

// Enable permissive CORS for all client interfaces and API integrations
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Safe storage accessors
const getProductsData = (): Product[] => {
  try {
    if (fs.existsSync(PRODUCTS_DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(PRODUCTS_DB_PATH, "utf-8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryProducts = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading products db file, falling back to memory:", err);
  }
  return memoryProducts;
};

const saveProductsData = (products: Product[]): boolean => {
  memoryProducts = products;
  try {
    fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify(products, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Error writing products db file (memory updated):", err);
    return true;
  }
};

const getAuditsData = (): any[] => {
  try {
    if (fs.existsSync(AUDITS_DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(AUDITS_DB_PATH, "utf-8"));
      if (Array.isArray(parsed)) {
        memoryAudits = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading audits db file:", err);
  }
  return memoryAudits;
};

const saveAuditsData = (audits: any[]): boolean => {
  memoryAudits = audits;
  try {
    fs.writeFileSync(AUDITS_DB_PATH, JSON.stringify(audits, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Error writing audits db file:", err);
    return true;
  }
};

const getUpdatesData = (): { [requestId: string]: any } => {
  try {
    if (fs.existsSync(UPDATES_DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(UPDATES_DB_PATH, "utf-8"));
      if (parsed && typeof parsed === "object") {
        memoryUpdates = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading updates db file:", err);
  }
  return memoryUpdates;
};

const saveUpdatesData = (updates: { [requestId: string]: any }): boolean => {
  memoryUpdates = updates;
  try {
    fs.writeFileSync(UPDATES_DB_PATH, JSON.stringify(updates, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Error writing updates db file:", err);
    return true;
  }
};

// 1. Health Check API
app.get("/api/integration/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "InduCore E-commerce API",
    version: "2.0",
    totalProducts: memoryProducts.length,
  });
});

// 2. Serves current products database to the frontend React application
app.get("/api/products", (req: Request, res: Response) => {
  const products = getProductsData();
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json(products);
});

// 2b. Serves single product by ID / SKU / Model
app.get("/api/products/:productId", (req: Request, res: Response) => {
  const { productId } = req.params;
  const products = getProductsData();
  const cleanId = (productId || "").toUpperCase();
  const product = products.find(
    (p) => p.id.toUpperCase() === cleanId || p.model.toUpperCase() === cleanId
  );
  if (!product) {
    return res.status(404).json({ success: false, message: `Product ${productId} not found.` });
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json(product);
});

// 2c. Storefront API alias for compatibility
app.get(["/api/storefront/:productId", "/api/ecommerce/storefront/:productId"], (req: Request, res: Response) => {
  const { productId } = req.params;
  const products = getProductsData();
  const cleanId = (productId || "").toUpperCase();
  const product = products.find(
    (p) => p.id.toUpperCase() === cleanId || p.model.toUpperCase() === cleanId
  );
  if (!product) {
    return res.status(404).json({ success: false, message: `Product ${productId} not found.` });
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    product_code: product.id,
    name: product.name,
    category: product.category,
    version: `v${product.version || 1}.0`,
    specifications: product.specifications,
    last_synced_at: product.lastUpdated,
  });
});

// 3. Update Status API
app.get("/api/integration/product-update/status/:requestId", (req: Request, res: Response) => {
  const { requestId } = req.params;
  const updatesLog = getUpdatesData();
  
  if (!updatesLog[requestId]) {
    return res.status(404).json({
      success: false,
      status: "not_found",
      message: `Request ID ${requestId} does not exist.`,
    });
  }

  res.json({
    success: true,
    requestId,
    status: updatesLog[requestId].status,
    details: updatesLog[requestId].details || null,
  });
});

// 4. Product Update API (POST /api/integration/product-update)
app.post("/api/integration/product-update", (req: Request, res: Response) => {
  const payload = req.body || {};
  const {
    requestId,
    productId,
    modelNumber,
    expectedVersion,
    newVersion,
    updates,
    source,
    approval,
  } = payload;

  // Basic validation of required payload properties
  if (!requestId) {
    return res.status(400).json({ success: false, message: "Missing required field: requestId." });
  }

  // Read current logs for idempotency
  const updatesLog = getUpdatesData();

  // Idempotency: If request ID already processed, return cached response
  if (updatesLog[requestId]) {
    console.log(`Idempotency check passed for request: ${requestId}`);
    const cached = updatesLog[requestId];
    return res.status(cached.httpStatus || 200).json(cached.responseBody);
  }

  // Helper to log rejection status in updates database and respond
  const rejectRequest = (status: string, message: string, httpCode: number, additionalData = {}) => {
    const responseBody = {
      success: false,
      status,
      message,
      ...additionalData,
    };
    updatesLog[requestId] = {
      status: "rejected",
      httpStatus: httpCode,
      responseBody,
      timestamp: new Date().toISOString(),
    };
    saveUpdatesData(updatesLog);
    return res.status(httpCode).json(responseBody);
  };

  // Human approval check
  if (!approval || approval.approved !== true) {
    return rejectRequest(
      "approval_required",
      "Human approval is required before product data can be updated.",
      403
    );
  }

  // Load current products
  const products = getProductsData();

  // Product Matching
  let matchedProduct: any = null;
  const targetId = (productId || "").toUpperCase();
  const targetModel = (modelNumber || "").toUpperCase();

  if (targetId) {
    matchedProduct = products.find((p) => p.id.toUpperCase() === targetId);
  }
  if (!matchedProduct && targetModel) {
    matchedProduct = products.find((p) => p.model.toUpperCase() === targetModel);
  }

  if (!matchedProduct) {
    return rejectRequest(
      "product_not_found",
      `Product could not be identified using ID: '${productId || ""}' or Model: '${modelNumber || ""}'.`,
      404
    );
  }

  // Version Safety
  const currentVersion = matchedProduct.version || 1;
  if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
    return rejectRequest(
      "version_conflict",
      `Version mismatch. Expected v${expectedVersion}, but product is currently at v${currentVersion}.`,
      409,
      { currentVersion }
    );
  }

  // Validate updates
  if (!updates || typeof updates !== "object") {
    return rejectRequest("invalid_field", "The 'updates' field must be a valid JSON object.", 400);
  }

  const changes: { [key: string]: { old: any; new: any } } = {};
  const changedFields: string[] = [];

  const updatedProduct = { ...matchedProduct };
  if (!updatedProduct.specifications) {
    updatedProduct.specifications = {};
  }

  const formatTimestamp = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  // Apply approved changed fields
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;
    const strValue = String(value);

    const topLevelKeys = ["name", "description", "category", "image"];
    const matchedTopKey = topLevelKeys.find((k) => k.toLowerCase() === key.toLowerCase());

    if (matchedTopKey) {
      const oldValue = updatedProduct[matchedTopKey];
      if (oldValue !== strValue) {
        changes[matchedTopKey] = { old: oldValue, new: strValue };
        changedFields.push(matchedTopKey);
        updatedProduct[matchedTopKey] = strValue;
      }
    } else {
      const specKeys = Object.keys(updatedProduct.specifications);
      let matchedSpecKey = specKeys.find((k) => k.toLowerCase() === key.toLowerCase() || k.toLowerCase().replace(/[^a-z0-9]/g, "") === key.toLowerCase().replace(/[^a-z0-9]/g, ""));
      
      if (!matchedSpecKey) {
        if (key.toLowerCase() === "ratio" || key.toLowerCase() === "gearratio") {
          matchedSpecKey = "Gear Ratio";
        } else {
          matchedSpecKey = key.charAt(0).toUpperCase() + key.slice(1);
        }
      }

      const oldValue = updatedProduct.specifications[matchedSpecKey];
      if (oldValue !== strValue) {
        changes[matchedSpecKey] = { old: oldValue || null, new: strValue };
        changedFields.push(matchedSpecKey);
        updatedProduct.specifications[matchedSpecKey] = strValue;
      }
    }
  }

  // Update version
  const targetNewVersion = newVersion || (currentVersion + 1);
  updatedProduct.version = targetNewVersion;
  updatedProduct.lastUpdated = formatTimestamp(new Date());

  // Save updated product
  const updatedProductsList = products.map((p) =>
    p.id === updatedProduct.id ? updatedProduct : p
  );
  saveProductsData(updatedProductsList);

  // Record Audit
  const auditRecord = {
    requestId,
    productId: updatedProduct.id,
    changes,
    approvalId: approval.approvalId || "UNKNOWN_APP",
    approvedBy: approval.approvedBy || "UNKNOWN_ADMIN",
    previousVersion: currentVersion,
    newVersion: targetNewVersion,
    documentName: source?.documentName || "N/A",
    documentVersion: source?.documentVersion || "N/A",
    timestamp: new Date().toISOString(),
  };

  const audits = getAuditsData();
  audits.push(auditRecord);
  saveAuditsData(audits);

  const successResponse = {
    success: true,
    status: "updated",
    message: `Product ${updatedProduct.id} specifications updated successfully.`,
    requestId,
    productId: updatedProduct.id,
    modelNumber: updatedProduct.model,
    previousVersion: currentVersion,
    newVersion: targetNewVersion,
    changedFields,
    updatedProduct,
  };

  updatesLog[requestId] = {
    status: "applied",
    httpStatus: 200,
    responseBody: successResponse,
    timestamp: new Date().toISOString(),
    details: {
      productId: updatedProduct.id,
      previousVersion: currentVersion,
      newVersion: targetNewVersion,
    },
  };
  saveUpdatesData(updatesLog);

  console.log(`Successfully updated ${updatedProduct.id} to version ${targetNewVersion}`);
  res.json(successResponse);
});

// Serve frontend static files
const distPath = path.join(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req: Request, res: Response, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`InduCore Integration Server running on http://localhost:${PORT}`);
  });
}

export default app;
