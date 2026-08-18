import React, { useState, useMemo } from "react";
import { Search, FileText, Download } from "lucide-react";
import type { Product, ProductDocument } from "../types";

interface ResourcesProps {
  onNavigate: (hash: string) => void;
  products: Product[];
}

export const Resources: React.FC<ResourcesProps> = ({ onNavigate, products }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDocType, setActiveDocType] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");

  // Compile all documents across all products
  const allDocuments = useMemo(() => {
    const list: (ProductDocument & { productName: string; productCategory: string })[] = [];
    products.forEach((product) => {
      product.documents.forEach((doc) => {
        list.push({
          ...doc,
          productName: product.name,
          productCategory: product.category,
        });
      });
    });
    return list;
  }, [products]);

  const docTypes = ["All", "Technical Datasheet", "Installation Manual", "Product Brochure"];
  const categories = ["All", "Motors", "Pumps", "Controllers", "Gearboxes", "Valves", "Compressors"];

  // Filter documents dynamically
  const filteredDocs = useMemo(() => {
    return allDocuments.filter((doc) => {
      // 1. Doc Type filter
      if (activeDocType !== "All" && doc.type !== activeDocType) {
        return false;
      }

      // 2. Product Category filter
      if (activeCategory !== "All" && doc.productCategory.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesId = doc.id.toLowerCase().includes(query);
        const matchesProductId = doc.productId.toLowerCase().includes(query);
        const matchesProdName = doc.productName.toLowerCase().includes(query);

        if (!matchesTitle && !matchesId && !matchesProductId && !matchesProdName) {
          return false;
        }
      }

      return true;
    });
  }, [allDocuments, activeDocType, activeCategory, searchQuery]);

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans bg-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-3">
            Technical Resource Center
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-3xl">
            Access and download certified datasheets, installation guides, and brochures for all InduCore models. Filter by equipment category or document type.
          </p>
        </div>

        {/* Filter controls panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, model, product..."
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">
                Document Type
              </label>
              <select
                value={activeDocType}
                onChange={(e) => setActiveDocType(e.target.value)}
                className="block w-full border border-slate-200 rounded p-2.5 text-xs bg-white focus:outline-none focus:border-brand-500"
              >
                {docTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Document Types" : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">
                Equipment Category
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="block w-full border border-slate-200 rounded p-2.5 text-xs bg-white focus:outline-none focus:border-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Equipment Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 w-12 text-center">Type</th>
                  <th className="p-4">Document Title</th>
                  <th className="p-4">Product ID</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">File Size</th>
                  <th className="p-4">Publish Date</th>
                  <th className="p-4 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-mono">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-smooth">
                      <td className="p-4 text-center shrink-0">
                        <FileText className="w-5 h-5 mx-auto text-slate-400" />
                      </td>
                      <td className="p-4 font-sans text-slate-900 font-semibold">
                        <div>
                          <span>{doc.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                            Product Ref: {doc.productName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <a
                          href={`#products/${doc.productId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(`#products/${doc.productId}`);
                          }}
                          className="text-brand-600 hover:underline font-bold"
                        >
                          {doc.productId}
                        </a>
                      </td>
                      <td className="p-4">{doc.version}</td>
                      <td className="p-4 text-slate-500">{doc.fileSize || "1.5 MB"}</td>
                      <td className="p-4 text-slate-500">{doc.publishDate || "2025-06-15"}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alert(`Starting mock PDF download: ${doc.file}`)}
                          className="inline-flex items-center justify-center bg-slate-900 hover:bg-brand-600 text-white p-2 rounded transition-smooth cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center font-sans text-slate-400">
                      No documents found matching search and filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
