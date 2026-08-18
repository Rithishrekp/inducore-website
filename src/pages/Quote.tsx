import React, { useState, useEffect, useMemo } from "react";
import { Send, CheckCircle2, Building2 } from "lucide-react";
import type { Product } from "../types";

interface QuoteProps {
  currentHash: string;
  products: Product[];
  onNavigate: (hash: string) => void;
}

export const Quote: React.FC<QuoteProps> = ({ currentHash, products, onNavigate }) => {
  // Parse query parameter: e.g. #quote?productId=M-101
  const preSelectedId = useMemo(() => {
    if (!currentHash.includes("?")) return "";
    const queryStr = currentHash.split("?")[1];
    const params = new URLSearchParams(queryStr);
    return params.get("productId") || "";
  }, [currentHash]);

  const [productId, setProductId] = useState(preSelectedId);
  const [quantity, setQuantity] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United States");
  const [application, setApplication] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rfqNumber, setRfqNumber] = useState("");

  // Sync state if preSelectedId changes (e.g., user navigated with a different query)
  useEffect(() => {
    if (preSelectedId) {
      setProductId(preSelectedId);
    }
  }, [preSelectedId]);

  // Lookup selected product details from dynamic products prop
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === productId);
  }, [productId, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check basic validations
    if (!companyName || !contactName || !email || !productId) {
      alert("Please fill in all required corporate contact details and select a product.");
      return;
    }

    // Generate mock B2B RFQ tracking code
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(10);
    const trackingCode = `RFQ-2026-${randomHex}`;
    setRfqNumber(trackingCode);
    setIsSubmitted(true);
  };

  const handleResetForm = () => {
    setProductId("");
    setQuantity(1);
    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setCountry("United States");
    setApplication("");
    setMessage("");
    setIsSubmitted(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans bg-dot-grid">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success State */}
        {isSubmitted ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-lg animate-in fade-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-brand-500 mx-auto mb-6" />
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2">
              Quotation Request Received
            </h1>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              Your Request for Quote has been logged in the InduCore B2B processing portal. An industrial application engineer will review your specifications and issue a formal quote within 1 business day.
            </p>

            {/* RFQ Meta Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-w-md mx-auto mb-8 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">RFQ Tracking ID:</span>
                <span className="text-slate-900 font-bold">{rfqNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Selected Model:</span>
                <span className="text-slate-950 font-bold">{selectedProduct?.model} ({selectedProduct?.id})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-slate-900 font-bold">{quantity} Unit(s)</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">Company:</span>
                <span className="text-slate-900 font-bold">{companyName}</span>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => onNavigate("#products")}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded text-xs font-semibold uppercase tracking-wider transition-smooth cursor-pointer"
              >
                Return to Catalog
              </button>
              <button
                onClick={handleResetForm}
                className="bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-3 rounded text-xs font-semibold uppercase tracking-wider transition-smooth cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            
            {/* Form Banner Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Request for Quote (RFQ)
                </h1>
                <p className="text-slate-400 text-xs mt-1 font-sans">
                  Submit this specification checklist to our sales & engineering divisions.
                </p>
              </div>
              <Building2 className="w-10 h-10 text-brand-500 opacity-60 hidden sm:block" />
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Product Sizing Group */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  1. Component Selection
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Equipment Model *
                    </label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      required
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Choose Component --</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          [{prod.id}] {prod.name} (Model: {prod.model})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Required Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      required
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                {selectedProduct && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150">
                    <div>
                      <span className="font-semibold text-slate-900 block">{selectedProduct.name}</span>
                      <span className="text-slate-500 font-mono">Category: {selectedProduct.category} | Model: {selectedProduct.model}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(`#products/${selectedProduct.id}`)}
                      className="text-brand-600 hover:underline font-semibold"
                    >
                      View Specs Table
                    </button>
                  </div>
                )}
              </div>

              {/* Corporate Contact Info Group */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  2. Corporate Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Company Registered Name *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder="e.g. Cleveland Industrial Systems LLC"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Contact Full Name *
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Robert Vance"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Corporate Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. engineering@clevelandsys.com"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="e.g. +1 (216) 555-0182"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Destination Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Operating Application / Sector
                    </label>
                    <input
                      type="text"
                      value={application}
                      onChange={(e) => setApplication(e.target.value)}
                      placeholder="e.g. Wastewater Aeration / Mining Conveyor"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Message Group */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  3. Requirements & Messages
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Operating Tolerances & Custom Demands
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter any additional requirements, such as special mounting requests, shaft size limits, specific protection classes, or ambient extreme temperatures..."
                    className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                  ></textarea>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white px-8 py-3.5 rounded text-sm font-semibold tracking-wide transition-smooth cursor-pointer shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20"
                >
                  Submit RFQ Request
                  <Send className="w-4 h-4 ml-2.5" />
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
