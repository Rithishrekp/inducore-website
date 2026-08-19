import fs from "fs";
import path from "path";

const productsPath = path.join(process.cwd(), "server/data/products.json");
if (!fs.existsSync(productsPath)) {
  console.error("Products database not found! Please run server init first.");
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

// 1. Compile all unique specification keys across the entire database to act as columns
const specKeysSet = new Set<string>();
products.forEach((p: any) => {
  if (p.specifications) {
    Object.keys(p.specifications).forEach((k) => specKeysSet.add(k));
  }
});
const specKeys = Array.from(specKeysSet).sort();

// 2. Build CSV column headers
const baseHeaders = ["Product ID", "Model Reference", "Name", "Category", "Description", "Database Version", "Last Checked Date"];
const headers = [...baseHeaders, ...specKeys];

// Helper to escape special characters and commas for Excel CSV compatibility
const escapeCSV = (val: any) => {
  if (val === undefined || val === null) return '""';
  const str = String(val).trim();
  const escaped = str.replace(/"/g, '""'); // escape double quotes
  return `"${escaped}"`;
};

// 3. Map products into CSV rows
const csvRows: string[] = [];
csvRows.push(headers.map(escapeCSV).join(","));

products.forEach((p: any) => {
  const row: any[] = [];
  row.push(p.id);
  row.push(p.model);
  row.push(p.name);
  row.push(p.category);
  row.push(p.description);
  row.push(p.version || 1);
  row.push(p.lastUpdated || "18 Aug 2026");

  // Add cell values for every possible spec column, leaving it blank if not applicable to this product category
  specKeys.forEach((key) => {
    const val = p.specifications && p.specifications[key] ? p.specifications[key] : "";
    row.push(val);
  });

  csvRows.push(row.map(escapeCSV).join(","));
});

// Write output file
const outputPath = path.join(process.cwd(), "products_datasheet.csv");
fs.writeFileSync(outputPath, csvRows.join("\n"), "utf-8");
console.log(`Successfully exported datasheet to ${outputPath}`);
