import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve DB file paths
const PRODUCTS_DB_PATH = path.join(process.cwd(), "server/data/products.json");
const AUDITS_DB_PATH = path.join(process.cwd(), "server/data/audits.json");
const UPDATES_DB_PATH = path.join(process.cwd(), "server/data/updates.json");

// Middleware
app.use(express.json());

// Configure CORS for local development - allow localhost origins and specific preview ports
const allowedOrigins = [
  "http://localhost:5173", // default Vite dev port
  "http://localhost:4173", // default Vite preview port
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or tools like Curl/Postman (no origin)
      if (!origin) return callback(null, true);

      // Allow any local development origin
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS Policy: Origin not allowed"), false);
    },
    credentials: true,
  })
);

// Helper functions to read/write JSON files safely
const readJSONFile = (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return null;
  }
};

const writeJSONFile = (filePath: string, content: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    return false;
  }
};

// 0. Root Landing Page info
app.get("/", (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>InduCore E-Commerce Integration Server</title>
        <style>
          body { font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          a { color: #0284c7; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
          .code { font-family: monospace; background: #e2e8f0; padding: 3px 6px; border-radius: 4px; font-size: 13px; }
          .container { background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>InduCore API Backend</h1>
          <p>The backend integration server is running successfully on port <strong>5000</strong>.</p>
          <p>Available endpoints:</p>
          <ul>
            <li><strong>Health Check</strong>: <a href="/api/integration/health">/api/integration/health</a></li>
            <li><strong>Current Products List</strong>: <a href="/api/products">/api/products</a></li>
            <li><strong>Update Endpoint</strong>: <span class="code">POST /api/integration/product-update</span></li>
          </ul>
          <p>To view the customer-facing industrial e-commerce catalog, go to:<br/>
          👉 <a href="http://localhost:5173/">http://localhost:5173/</a></p>
        </div>
      </body>
    </html>
  `);
});

// 1. Health Check API
app.get("/api/integration/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "InduCore E-commerce API",
    version: "1.0",
  });
});

// 2. Serves current products database to the frontend React application
app.get("/api/products", (req: Request, res: Response) => {
  const products = readJSONFile(PRODUCTS_DB_PATH);
  if (!products) {
    return res.status(500).json({ success: false, message: "Failed to read database." });
  }
  res.json(products);
});

// 3. Update Status API
app.get("/api/integration/product-update/status/:requestId", (req: Request, res: Response) => {
  const { requestId } = req.params;
  const updatesLog = readJSONFile(UPDATES_DB_PATH) || {};
  
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
    status: updatesLog[requestId].status, // pending | applied | rejected | failed
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
  const updatesLog = readJSONFile(UPDATES_DB_PATH) || {};

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
    writeJSONFile(UPDATES_DB_PATH, updatesLog);
    return res.status(httpCode).json(responseBody);
  };

  // Rule 3: Approval is mandatory
  if (!approval || approval.approved !== true) {
    return rejectRequest(
      "approval_required",
      "Human approval is required before product data can be updated.",
      403
    );
  }

  // Load current products
  const products: any[] = readJSONFile(PRODUCTS_DB_PATH);
  if (!products) {
    return res.status(500).json({ success: false, message: "Database failure. Cannot read products." });
  }

  // Rule 2: Correct Product Matching using stronger identifiers in order
  let matchedProduct: any = null;
  let candidates: any[] = [];

  // Match Step 1: Search by exact Product ID / SKU
  if (productId) {
    matchedProduct = products.find((p) => p.id === productId);
  }

  // Match Step 2: Search by exact Model Number (if not matched or to double check)
  if (!matchedProduct && modelNumber) {
    // Model field is stored in p.model, and sometimes case-insensitive in specs
    candidates = products.filter((p) => {
      const matchTopModel = p.model.toLowerCase() === modelNumber.toLowerCase();
      const matchSpecModel = p.specifications && p.specifications["Model"] && 
                            p.specifications["Model"].toLowerCase() === modelNumber.toLowerCase();
      return matchTopModel || matchSpecModel;
    });

    if (candidates.length === 1) {
      matchedProduct = candidates[0];
    }
  }

  // Rule 2 check: If ambiguous or couldn't resolve exactly one product
  if (!matchedProduct) {
    if (candidates.length > 1) {
      const candidateList = candidates.map((c) => ({
        productId: c.id,
        modelNumber: c.model,
        confidence: 0.9,
      }));
      return rejectRequest(
        "ambiguous_product",
        "Multiple possible products found. No update applied.",
        409,
        { candidates: candidateList }
      );
    } else {
      return rejectRequest(
        "product_not_found",
        `Product could not be identified using ID: '${productId || ""}' or Model: '${modelNumber || ""}'.`,
        404
      );
    }
  }

  // Rule 4: Version / Stale Update Protection
  const currentVersion = matchedProduct.version || 1;
  if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
    return rejectRequest(
      "version_conflict",
      "Product has already been updated. Refresh product data before applying this change.",
      409,
      { currentVersion }
    );
  }

  // Rule 6: Validate the Updates before saving
  if (!updates || typeof updates !== "object") {
    return rejectRequest("invalid_field", "The 'updates' field must be a valid JSON object.", 400);
  }

  // Keep track of change history for audits
  const changes: { [key: string]: { old: any; new: any } } = {};
  const changedFields: string[] = [];

  // Copy product for mutation
  const updatedProduct = { ...matchedProduct };
  if (!updatedProduct.specifications) {
    updatedProduct.specifications = {};
  }

  // Helper to format timestamps (e.g. "18 Aug 2026")
  const formatTimestamp = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options); // resolves e.g. "18 Aug 2026"
  };

  // Rule 5: Update only the approved fields
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) {
      continue; // do not clear or set null
    }

    const strValue = String(value);

    // Check if key matches top-level product property (case-insensitive)
    const topLevelKeys = ["name", "description", "category", "image"];
    const matchedTopKey = topLevelKeys.find((k) => k.toLowerCase() === key.toLowerCase());

    if (matchedTopKey) {
      // Update top-level property
      const oldValue = updatedProduct[matchedTopKey];
      if (oldValue !== strValue) {
        changes[matchedTopKey] = { old: oldValue, new: strValue };
        changedFields.push(matchedTopKey);
        updatedProduct[matchedTopKey] = strValue;
      }
    } else {
      // Treat as specification update
      const specKeys = Object.keys(updatedProduct.specifications);
      
      // Try to find case-insensitive matching specification key
      let matchedSpecKey = specKeys.find((k) => k.toLowerCase() === key.toLowerCase());
      
      if (!matchedSpecKey) {
        // If not found, format key cleanly (e.g., capitalize first letter)
        matchedSpecKey = key.charAt(0).toUpperCase() + key.slice(1);
      }

      const oldValue = updatedProduct.specifications[matchedSpecKey];
      if (oldValue !== strValue) {
        changes[matchedSpecKey] = { old: oldValue || null, new: strValue };
        changedFields.push(key);
        updatedProduct.specifications[matchedSpecKey] = strValue;
      }
    }
  }

  // Rule 10: Associate documents version if they exist in the product record
  if (source && source.documentVersion) {
    if (!updatedProduct.documents) {
      updatedProduct.documents = [];
    }

    // Try to find the Technical Datasheet
    let datasheet = updatedProduct.documents.find(
      (doc: any) => doc.type === "Technical Datasheet"
    );

    if (datasheet) {
      const oldDocVer = datasheet.version;
      if (oldDocVer !== source.documentVersion) {
        changes["documentVersion"] = { old: oldDocVer, new: source.documentVersion };
        changedFields.push("documentVersion");
        datasheet.version = source.documentVersion;
        datasheet.publishDate = formatTimestamp(new Date());
      }
    } else {
      // Create a mock datasheet entry if missing
      const newDs = {
        id: `DOC-${updatedProduct.id}-DS`,
        productId: updatedProduct.id,
        type: "Technical Datasheet",
        version: source.documentVersion,
        file: `/documents/${updatedProduct.id}-datasheet.pdf`,
        title: `${updatedProduct.name} ${updatedProduct.id} - Technical Datasheet`,
        fileSize: "1.5 MB",
        publishDate: formatTimestamp(new Date()),
      };
      updatedProduct.documents.push(newDs);
      changes["documentVersion"] = { old: null, new: source.documentVersion };
      changedFields.push("documentVersion");
    }
  }

  // If no fields actually changed, increment version anyway or return success
  const targetNewVersion = newVersion || (currentVersion + 1);
  updatedProduct.version = targetNewVersion;
  updatedProduct.lastUpdated = formatTimestamp(new Date());

  // Save the updated product back to the list
  const updatedProductsList = products.map((p) =>
    p.id === updatedProduct.id ? updatedProduct : p
  );

  // Write changes to database files
  const pSaved = writeJSONFile(PRODUCTS_DB_PATH, updatedProductsList);
  if (!pSaved) {
    return res.status(500).json({ success: false, message: "Database write error. Product not updated." });
  }

  // Rule 7: Save Audit History
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

  const audits = readJSONFile(AUDITS_DB_PATH) || [];
  audits.push(auditRecord);
  writeJSONFile(AUDITS_DB_PATH, audits);

  // Success response format (Rule 16)
  const successResponse = {
    success: true,
    status: "updated",
    message: "Product updated successfully.",
    requestId,
    productId: updatedProduct.id,
    modelNumber: updatedProduct.model,
    previousVersion: currentVersion,
    newVersion: targetNewVersion,
    changedFields,
    updatedProduct,
  };

  // Cache response for idempotency checks
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
  writeJSONFile(UPDATES_DB_PATH, updatesLog);

  console.log(`Successfully applied product update request: ${requestId} for product: ${updatedProduct.id}`);
  res.json(successResponse);
});

// Serve frontend static assets in production
const distPath = path.join(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  console.log(`Serving static files from frontend build folder: ${distPath}`);
  app.use(express.static(distPath));
  
  // Direct unmatched GET routes (non-API) to Vite's index.html
  app.get("(.*)", (req: Request, res: Response, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log(`Frontend build folder not found at ${distPath}. Running in API-only mode.`);
}

// Start the Express app
app.listen(PORT, () => {
  console.log(`InduCore Integration Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/integration/health`);
});
