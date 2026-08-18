import React, { useMemo, useState } from "react";
import { Scale, X, Plus, AlertCircle } from "lucide-react";
import type { Product } from "../types";

interface CompareProps {
  compareProductIds: string[];
  products: Product[];
  onRemoveCompare: (productId: string) => void;
  onClearCompare: () => void;
  onNavigate: (hash: string) => void;
}

export const Compare: React.FC<CompareProps> = ({
  compareProductIds,
  products,
  onRemoveCompare,
  onClearCompare,
  onNavigate,
}) => {
  const [selectedAddId, setSelectedAddId] = useState("");

  // Retrieve products in comparison list from dynamic products prop
  const comparedProducts = useMemo(() => {
    return compareProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [compareProductIds, products]);

  // Extract all unique specification keys present in these products
  const uniqueSpecKeys = useMemo(() => {
    const keysSet = new Set<string>();
    comparedProducts.forEach((p) => {
      Object.keys(p.specifications).forEach((k) => keysSet.add(k));
    });
    return Array.from(keysSet);
  }, [comparedProducts]);

  // List of other products the user can add to the comparison
  const addableProducts = useMemo(() => {
    // If we have products, limit the list to the same category to keep comparison meaningful
    const baseCategory = comparedProducts[0]?.category;
    return products.filter((p) => {
      const isNotAlreadyCompared = !compareProductIds.includes(p.id);
      const matchesCategory = baseCategory ? p.category === baseCategory : true;
      return isNotAlreadyCompared && matchesCategory;
    });
  }, [comparedProducts, compareProductIds, products]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAddId) {
      onRemoveCompare(selectedAddId); // This toggle logic is standard.
      setSelectedAddId("");
    }
  };

  // Helper to check if values differ across compared products for a given spec key
  const hasDifference = (key: string) => {
    if (comparedProducts.length < 2) return false;
    const firstVal = comparedProducts[0].specifications[key] || "";
    return comparedProducts.some((p) => (p.specifications[key] || "") !== firstVal);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans bg-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2 flex items-center">
              <Scale className="w-8 h-8 mr-3 text-brand-500" />
              Technical Comparison
            </h1>
            <p className="text-slate-500 text-sm">
              Compare industrial specifications side-by-side to evaluate system compatibility and operating parameters.
            </p>
          </div>
          {comparedProducts.length > 0 && (
            <button
              onClick={onClearCompare}
              className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-smooth cursor-pointer"
            >
              Clear Comparison List
            </button>
          )}
        </div>

        {comparedProducts.length > 0 ? (
          <div className="space-y-8">
            
            {/* Horizontal Compare Grid Container */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                
                {/* Table Header containing Product Cards */}
                <thead>
                  <tr className="border-b border-slate-100 divide-x divide-slate-100">
                    {/* Row label header */}
                    <th className="p-6 text-left w-64 bg-slate-50/50 shrink-0">
                      {addableProducts.length > 0 && comparedProducts.length < 4 && (
                        <div className="space-y-3">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Compare Additional Unit
                          </div>
                          <form onSubmit={handleAddProduct} className="flex gap-2">
                            <select
                              value={selectedAddId}
                              onChange={(e) => setSelectedAddId(e.target.value)}
                              className="block w-full text-xs bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-brand-500"
                            >
                              <option value="">Select compatible model...</option>
                              {addableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.id}] {p.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              disabled={!selectedAddId}
                              className="bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white p-2 rounded transition-smooth flex items-center justify-center cursor-pointer"
                              title="Add to compare"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      )}
                    </th>
                    
                    {/* Product Cards columns */}
                    {comparedProducts.map((product) => (
                      <th key={product.id} className="p-6 text-left relative min-w-[200px] align-top bg-white">
                        <button
                          onClick={() => onRemoveCompare(product.id)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-smooth cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        {/* ID tag */}
                        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide mb-2">
                          {product.id}
                        </div>
                        {/* Title */}
                        <div className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mb-4">
                          Model: {product.model}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onNavigate(`#products/${product.id}`)}
                            className="text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-smooth"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => onNavigate(`#quote?productId=${product.id}`)}
                            className="text-center bg-brand-500 hover:bg-brand-600 text-white py-1.5 rounded text-[10px] font-bold transition-smooth"
                          >
                            Get Quote
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body containing attributes */}
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  
                  {/* Category row */}
                  <tr className="divide-x divide-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-sans font-semibold text-slate-500 bg-slate-50/30">Category</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-4 text-slate-900 font-semibold">{p.category}</td>
                    ))}
                  </tr>

                  {/* Core specifications rows */}
                  {uniqueSpecKeys.map((key) => {
                    const isDiff = hasDifference(key);

                    return (
                      <tr
                        key={key}
                        className={`divide-x divide-slate-100 hover:bg-slate-50/50 transition-smooth ${
                          isDiff ? "bg-amber-50/30" : ""
                        }`}
                      >
                        <td className={`p-4 font-sans font-semibold text-slate-500 bg-slate-50/30 flex items-center justify-between`}>
                          <span>{key}</span>
                          {isDiff && (
                            <span
                              className="text-[9px] font-bold text-amber-600 bg-amber-100/60 px-1.5 py-0.5 rounded uppercase tracking-wider font-sans ml-1.5 shrink-0"
                              title="Values differ across models"
                            >
                              Diff
                            </span>
                          )}
                        </td>
                        {comparedProducts.map((p) => (
                          <td
                            key={p.id}
                            className={`p-4 ${
                              isDiff ? "text-amber-800 font-bold" : "text-slate-900"
                            }`}
                          >
                            {p.specifications[key] || <span className="text-slate-300">-</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>

            {/* Quick Helper Notice */}
            <div className="flex items-start bg-blue-50 border border-blue-100 text-blue-800 rounded p-4 text-xs font-sans">
              <AlertCircle className="w-4 h-4 mr-2.5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Understanding Comparison:</strong>
                Highlight rows labeled with <span className="font-bold text-amber-600 bg-amber-100 px-1 py-0.5 rounded font-mono">Diff</span> indicate a variation in technical parameters, which helps verify exact load characteristics (e.g. speed, power, sizing) for system mapping.
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-sm">
            <div className="text-slate-300 mb-6 flex justify-center">
              <Scale className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
              Your Comparison List is Empty
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
              Explore the InduCore catalog and click "Add to Compare" on multiple motors, pumps, or control units to compare them side-by-side.
            </p>
            <button
              onClick={() => onNavigate("#products")}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded text-xs font-semibold uppercase tracking-wider transition-smooth cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
