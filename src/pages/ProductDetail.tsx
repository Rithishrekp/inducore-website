import React, { useMemo } from "react";
import { ArrowLeft, Scale, FileText, AlertCircle, Download, ExternalLink } from "lucide-react";
import type { Product } from "../types";

interface ProductDetailProps {
  productId: string;
  products: Product[];
  onNavigate: (hash: string) => void;
  compareProductIds: string[];
  onToggleCompare: (productId: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  products,
  onNavigate,
  compareProductIds,
  onToggleCompare,
}) => {
  // Find product by ID from the dynamic products prop
  const product = useMemo(() => {
    return products.find((p) => p.id === productId);
  }, [productId, products]);

  // Handle case where product doesn't exist
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-display font-black text-slate-900 mb-2">
          Industrial Product Not Found
        </h1>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          The requested product ID "{productId}" could not be located in InduCore's registered database records.
        </p>
        <button
          onClick={() => onNavigate("#products")}
          className="bg-slate-900 text-white px-6 py-2.5 rounded font-semibold text-xs uppercase tracking-wider"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Resolve compatibility mappings (lookup products by ID)
  const compatibleProductsList = useMemo(() => {
    return product.compatibleProducts
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [product, products]);

  // Resolve related products list
  const relatedProductsList = useMemo(() => {
    return product.relatedProducts
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [product, products]);

  const isCompared = compareProductIds.includes(product.id);

  // Group specs into engineering sections
  const groupedSpecs = useMemo(() => {
    const specs = product.specifications;
    const groups: { [title: string]: { [key: string]: string } } = {
      "GENERAL SPECIFICATIONS": {},
      "PERFORMANCE CHARACTERISTICS": {},
      "PHYSICAL & MECHANICAL PROPORTIONS": {},
      "ENVIRONMENTAL & RATINGS": {},
    };

    Object.entries(specs).forEach(([key, value]) => {
      const uKey = key.toUpperCase();
      if (
        uKey.includes("POWER") ||
        uKey.includes("VOLTAGE") ||
        uKey.includes("SPEED") ||
        uKey.includes("FREQUENCY") ||
        uKey.includes("FLOW RATE") ||
        uKey.includes("PRESSURE") ||
        uKey.includes("HEAD") ||
        uKey.includes("TORQUE") ||
        uKey.includes("GEAR RATIO") ||
        uKey.includes("VALVE TYPE")
      ) {
        groups["GENERAL SPECIFICATIONS"][key] = value;
      } else if (
        uKey.includes("EFFICIENCY") ||
        uKey.includes("POWER FACTOR") ||
        uKey.includes("CURRENT") ||
        uKey.includes("DUTY") ||
        uKey.includes("NOISE LEVEL") ||
        uKey.includes("CV")
      ) {
        groups["PERFORMANCE CHARACTERISTICS"][key] = value;
      } else if (
        uKey.includes("FRAME SIZE") ||
        uKey.includes("MOUNTING") ||
        uKey.includes("WEIGHT") ||
        uKey.includes("MATERIAL") ||
        uKey.includes("SIZE") ||
        uKey.includes("HOUSING") ||
        uKey.includes("TANK CAPACITY")
      ) {
        groups["PHYSICAL & MECHANICAL PROPORTIONS"][key] = value;
      } else {
        groups["ENVIRONMENTAL & RATINGS"][key] = value;
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => Object.keys(items).length > 0)
    );
  }, [product]);

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans bg-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <button
          onClick={() => onNavigate("#products")}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider mb-8 transition-smooth cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Catalog
        </button>

        {/* Main Product Layout */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 lg:p-10 shadow-sm mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Product Image & Thumbnail Grid */}
            <div className="space-y-6">
              <div className="h-96 w-full overflow-hidden bg-slate-50 rounded border border-slate-100 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain p-4"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-slate-50 rounded border border-slate-200 overflow-hidden cursor-pointer flex items-center justify-center p-2 opacity-100 hover:opacity-80 transition-smooth">
                  <img src={product.image} alt="Thumbnail 1" className="max-h-full object-contain" />
                </div>
                <div className="h-24 bg-slate-50 rounded border border-slate-100 overflow-hidden cursor-pointer flex items-center justify-center p-2 opacity-50 hover:opacity-100 transition-smooth">
                  <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=300" alt="Thumbnail 2" className="max-h-full object-contain" />
                </div>
                <div className="h-24 bg-slate-50 rounded border border-slate-100 overflow-hidden cursor-pointer flex items-center justify-center p-2 opacity-50 hover:opacity-100 transition-smooth">
                  <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=300" alt="Thumbnail 3" className="max-h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Right Column: Key Details & Quick Actions */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Category & ID Tags */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    ID: {product.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>

                {/* Title & Model */}
                <h1 className="text-3xl font-display font-black text-slate-900 mb-1 leading-tight">
                  {product.name}
                </h1>
                <p className="text-slate-500 font-mono text-sm mb-6">
                  Model Reference: <strong className="text-slate-900 font-medium">{product.model}</strong>
                </p>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  {product.description}
                </p>

                {/* Key Specs Quick Glance */}
                <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 mb-8">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Key Performance Attributes
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
                    {Object.entries(product.specifications).slice(0, 6).map(([key, val]) => (
                      <div key={key} className="text-xs">
                        <span className="text-slate-500 font-normal block mb-0.5">{key}</span>
                        <span className="text-slate-950 font-mono font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Verified Product Data Section */}
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100/50 rounded-md p-3 mb-6 border border-slate-200/60 font-mono">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[10px]">Verified Product Data</span>
                    <span>Version: {product.version || 1}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-semibold block uppercase text-[10px]">Last Checked</span>
                    <span>{product.lastUpdated || "18 Aug 2026"}</span>
                  </div>
                </div>
              </div>

              {/* B2B Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`#quote?productId=${product.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`#quote?productId=${product.id}`);
                    }}
                    className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white py-3.5 px-6 rounded font-semibold text-sm tracking-wide transition-smooth cursor-pointer shadow-md shadow-brand-500/10 hover:shadow-brand-500/25"
                  >
                    Request a Quotation
                  </a>
                  <button
                    onClick={() => onToggleCompare(product.id)}
                    className={`inline-flex items-center justify-center py-3.5 px-6 rounded font-semibold text-sm tracking-wide border transition-smooth cursor-pointer ${
                      isCompared
                        ? "bg-brand-50 border-brand-200 text-brand-600"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Scale className="w-4 h-4 mr-2" />
                    {isCompared ? "Added to Compare" : "Add to Comparison"}
                  </button>
                </div>

                <a
                  href={`/documents/${product.id}-datasheet.pdf`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Initiating mock download: ${product.id}-datasheet.pdf. Values inside match this page exactly.`);
                  }}
                  className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white py-3 rounded text-xs font-semibold uppercase tracking-wider transition-smooth"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Download Technical Datasheet (PDF)
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Sections Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Large Column: Tech Specs & Overview */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Technical Specifications Table */}
            <section id="specifications" className="bg-white border border-slate-200 rounded-lg p-6 lg:p-8 shadow-sm">
              <h2 className="text-xl font-display font-extrabold text-slate-900 mb-6 pb-3 border-b border-slate-100">
                Technical Specifications Table
              </h2>
              
              <div className="space-y-6">
                {Object.entries(groupedSpecs).map(([groupTitle, specs]) => (
                  <div key={groupTitle} className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded tracking-wide">
                      {groupTitle}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {Object.entries(specs).map(([key, val]) => (
                        <div key={key} className="grid grid-cols-2 py-3 px-3 text-xs sm:text-sm">
                          <span className="text-slate-500 font-medium">{key}</span>
                          <span className="text-slate-900 font-mono font-bold text-right sm:text-left">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Applications Section */}
            <section id="applications" className="bg-white border border-slate-200 rounded-lg p-6 lg:p-8 shadow-sm">
              <h2 className="text-xl font-display font-extrabold text-slate-900 mb-6 pb-3 border-b border-slate-100">
                Operating Applications
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                This unit is optimized for the following processes, systems, and operating environments:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.applications.map((app) => (
                  <div key={app} className="flex items-center text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded p-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mr-3"></div>
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Compatibility Section */}
            <section id="compatibility" className="bg-white border border-slate-200 rounded-lg p-6 lg:p-8 shadow-sm">
              <h2 className="text-xl font-display font-extrabold text-slate-900 mb-6 pb-3 border-b border-slate-100">
                System Compatibility Mappings
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                This product is engineered to interconnect with the following registered InduCore models. Mapped relationships are verified for signal & load matching:
              </p>
              {compatibleProductsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {compatibleProductsList.map((compProd) => (
                    <div
                      key={compProd.id}
                      onClick={() => onNavigate(`#products/${compProd.id}`)}
                      className="border border-slate-200 hover:border-slate-300 rounded p-4 flex items-center justify-between hover:shadow-sm cursor-pointer transition-smooth group"
                    >
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded mr-2">
                          {compProd.id}
                        </span>
                        <div className="text-sm font-semibold text-slate-900 mt-1.5 group-hover:text-brand-500 transition-smooth">
                          {compProd.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Model: {compProd.model}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-smooth" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-xs italic bg-slate-50 border border-slate-100 p-4 rounded text-center">
                  No direct model-level dependencies mapped. Suitable for standalone operations.
                </div>
              )}
            </section>

          </div>

          {/* Right Small Column: Documents & Related Products */}
          <div className="space-y-8">
            
            {/* Documents Section */}
            <section id="documents" className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-display font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Documentation Library
              </h2>
              <div className="space-y-3">
                {product.documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => alert(`Opening ${doc.type} version ${doc.version} for verification. All variables match the product configuration.`)}
                    className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 p-3 rounded flex items-start justify-between cursor-pointer transition-smooth group"
                  >
                    <div className="flex items-start">
                      <FileText className="w-5 h-5 text-slate-400 group-hover:text-brand-500 shrink-0 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs font-semibold text-slate-950 leading-tight">
                          {doc.type}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Ref: {doc.id} | Ver: {doc.version} | {doc.fileSize || "1.5 MB"}
                        </div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-smooth shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </section>

            {/* Related Products Section */}
            <section id="related" className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-display font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Related Equipment
              </h2>
              <div className="space-y-4">
                {relatedProductsList.map((relProd) => (
                  <div
                    key={relProd.id}
                    onClick={() => onNavigate(`#products/${relProd.id}`)}
                    className="flex items-center space-x-3.5 cursor-pointer group pb-3 last:pb-0 border-b border-slate-100/60 last:border-0"
                  >
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                      <img src={relProd.image} alt={relProd.name} className="h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-slate-500 flex items-center">
                        <span>{relProd.id}</span>
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span>{relProd.category}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-brand-500 transition-smooth mt-0.5">
                        {relProd.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {Object.values(relProd.specifications)[0]} | {Object.values(relProd.specifications)[1]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
};
