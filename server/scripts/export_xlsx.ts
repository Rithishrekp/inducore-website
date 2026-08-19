import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const productsPath = path.join(process.cwd(), "server/data/products.json");
if (!fs.existsSync(productsPath)) {
  console.error("Products database not found! Please run server init first.");
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

// 1. Gather all unique specification keys across all products
const specKeysSet = new Set<string>();
products.forEach((p: any) => {
  if (p.specifications) {
    Object.keys(p.specifications).forEach((k) => specKeysSet.add(k));
  }
});
const specKeys = Array.from(specKeysSet).sort();

// 2. Prepare JSON rows for SheetJS
const data = products.map((p: any) => {
  const row: any = {
    "Product ID": p.id,
    "Model Reference": p.model,
    "Name": p.name,
    "Category": p.category,
    "Description": p.description,
    "Database Version": p.version || 1,
    "Last Checked Date": p.lastUpdated || "18 Aug 2026",
  };

  // Add cell value for every specification column
  specKeys.forEach((key) => {
    row[key] = p.specifications && p.specifications[key] ? p.specifications[key] : "";
  });

  return row;
});

// 3. Create Excel worksheet and workbook
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "InduCore Catalog");

// Set column widths dynamically for professional Excel formatting
const colWidths = [
  { wch: 12 }, // ID
  { wch: 18 }, // Model
  { wch: 35 }, // Name
  { wch: 15 }, // Category
  { wch: 50 }, // Description
  { wch: 15 }, // Version
  { wch: 18 }, // Last Checked
];
// Append default widths for specification columns
specKeys.forEach(() => colWidths.push({ wch: 15 }));
worksheet["!cols"] = colWidths;

// 4. Write workbook file
const outputPath = path.join(process.cwd(), "products_datasheet.xlsx");
XLSX.writeFile(workbook, outputPath);
console.log(`Successfully compiled Excel datasheet to ${outputPath}`);
