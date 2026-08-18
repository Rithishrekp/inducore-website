import fs from "fs";
import path from "path";
import { PRODUCTS } from "../../src/data/products";

const dataDir = path.join(process.cwd(), "server/data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Map products and add default version and lastUpdated fields
const dbProducts = PRODUCTS.map((p) => ({
  ...p,
  version: 1,
  lastUpdated: "18 Aug 2026",
}));

fs.writeFileSync(
  path.join(dataDir, "products.json"),
  JSON.stringify(dbProducts, null, 2),
  "utf-8"
);

// Initialize empty tracking stores
fs.writeFileSync(
  path.join(dataDir, "audits.json"),
  JSON.stringify([], null, 2),
  "utf-8"
);
fs.writeFileSync(
  path.join(dataDir, "updates.json"),
  JSON.stringify({}, null, 2),
  "utf-8"
);

console.log("Database initialized successfully!");
