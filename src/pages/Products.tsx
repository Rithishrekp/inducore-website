import React, { useState, useEffect, useMemo } from "react";
import { Search, Scale, Filter, SlidersHorizontal, RefreshCw, X } from "lucide-react";
import type { Product } from "../types";

interface ProductsProps {
  onNavigate: (hash: string) => void;
  products: Product[];
  compareProductIds: string[];
  onToggleCompare: (productId: string) => void;
  initialSearchQuery?: string;
  categoryFilter?: string; // e.g., "Motors", "Pumps", etc.
}

export const Products: React.FC<ProductsProps> = ({
  onNavigate,
  products,
  compareProductIds,
  onToggleCompare,
  initialSearchQuery = "",
  categoryFilter = "All",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeCategory, setActiveCategory] = useState(categoryFilter);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Dynamic spec filter states
  const [selectedPower, setSelectedPower] = useState<string[]>([]);
  const [selectedVoltage, setSelectedVoltage] = useState<string[]>([]);
  const [selectedIPRating, setSelectedIPRating] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string[]>([]);
  const [selectedValveType, setSelectedValveType] = useState<string[]>([]);
  const [selectedGearRatio, setSelectedGearRatio] = useState<string[]>([]);

  // Sync state if props change (e.g. clicked category from Header mega-menu)
  useEffect(() => {
    setActiveCategory(categoryFilter);
    // Reset spec filters when category changes to prevent cross-contamination
    setSelectedPower([]);
    setSelectedVoltage([]);
    setSelectedIPRating([]);
    setSelectedMaterial([]);
    setSelectedValveType([]);
    setSelectedGearRatio([]);
  }, [categoryFilter]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Extract all unique values for filters based on current category
  const filterOptions = useMemo(() => {
    return {
      motorPowers: ["5.5 kW", "7.5 kW", "11/15 kW", "11 kW", "15 kW", "18.5 kW", "2.2 kW"],
      motorVoltages: ["230 V", "415 V"],
      motorIPs: ["IP44", "IP55", "IP65"],
      pumpMaterials: ["Stainless Steel 304", "Stainless Steel 316", "Cast Iron / SS316", "Hardened Cast Iron", "Marine Bronze"],
      valveTypes: ["Ball Valve", "Gate Valve", "Butterfly Valve", "Globe Valve", "Check Valve"],
      gearRatios: ["5:1", "10:1", "20:1", "40:1", "60:1"],
    };
  }, []);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedPower([]);
    setSelectedVoltage([]);
    setSelectedIPRating([]);
    setSelectedMaterial([]);
    setSelectedValveType([]);
    setSelectedGearRatio([]);
  };

  const handleToggleFilter = (value: string, selectedList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selectedList.includes(value)) {
      setter(selectedList.filter((item) => item !== value));
    } else {
      setter([...selectedList, value]);
    }
  };

  // Perform client-side searching and filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Category Filter
      if (activeCategory !== "All" && product.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesId = product.id.toLowerCase().includes(query);
        const matchesModel = product.model.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesSpecs = Object.entries(product.specifications).some(([key, val]) =>
          val.toLowerCase().includes(query) || key.toLowerCase().includes(query)
        );
        const matchesApps = product.applications.some((app) => app.toLowerCase().includes(query));

        if (!matchesName && !matchesId && !matchesModel && !matchesCategory && !matchesSpecs && !matchesApps) {
          return false;
        }
      }

      // 3. Dynamic Spec Filters (Only apply if relevant to active category or if showing All)
      // Power (Motors / Pumps / Compressors)
      if (selectedPower.length > 0) {
        const pPower = product.specifications["Power"] || product.specifications["Input Power"];
        if (!pPower || !selectedPower.some((p) => pPower.includes(p))) return false;
      }

      // Voltage (Motors / Controllers)
      if (selectedVoltage.length > 0) {
        const pVoltage = product.specifications["Voltage"] || product.specifications["Input Voltage"] || product.specifications["Output Voltage"];
        if (!pVoltage || !selectedVoltage.some((v) => pVoltage.includes(v))) return false;
      }

      // IP Rating (Motors / Controllers)
      if (selectedIPRating.length > 0) {
        const pIP = product.specifications["IP Rating"] || product.specifications["Protection Rating"];
        if (!pIP || !selectedIPRating.some((ip) => pIP.includes(ip))) return false;
      }

      // Material (Pumps / Valves)
      if (selectedMaterial.length > 0) {
        const pMat = product.specifications["Material"];
        if (!pMat || !selectedMaterial.includes(pMat)) return false;
      }

      // Valve Type
      if (selectedValveType.length > 0) {
        const pType = product.specifications["Valve Type"];
        if (!pType || !selectedValveType.includes(pType)) return false;
      }

      // Gear Ratio
      if (selectedGearRatio.length > 0) {
        const pRatio = product.specifications["Gear Ratio"];
        if (!pRatio || !selectedGearRatio.includes(pRatio)) return false;
      }

      return true;
    });
  }, [
    activeCategory,
    searchQuery,
    selectedPower,
    selectedVoltage,
    selectedIPRating,
    selectedMaterial,
    selectedValveType,
    selectedGearRatio,
  ]);

  const categoriesList = ["All", "Motors", "Pumps", "Controllers", "Gearboxes", "Valves", "Compressors"];

  return (
    <div className="bg-slate-50 min-h-screen py-12 bg-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-3">
            Industrial Product Catalog
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-3xl">
            Explore our complete catalog of certified industrial motors, pumps, drives, gearboxes, valves, and compressors. Search or use filters to isolate specific models.
          </p>
        </div>

        {/* Search and Category Tabs */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product ID, model (e.g. M-101), specs (e.g. 7.5 kW), or applications..."
                className="block w-full pl-11 pr-10 py-3.5 border border-slate-200 rounded-md bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-smooth"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Total Results & Reset */}
            <div className="flex items-center justify-between lg:justify-end space-x-4">
              <span className="text-sm font-mono text-slate-500">
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> of {products.length} Products
              </span>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-brand-500 uppercase tracking-wider transition-smooth cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
            {categoriesList.map((catName) => (
              <button
                key={catName}
                onClick={() => {
                  setActiveCategory(catName);
                  onNavigate(catName === "All" ? "#products" : `#category/${catName.toLowerCase()}`);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded uppercase tracking-wider transition-smooth cursor-pointer border ${
                  activeCategory.toLowerCase() === catName.toLowerCase()
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block bg-white border border-slate-200 rounded-lg p-6 self-start shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-display font-bold text-base text-slate-900 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-brand-500" />
                Technical Filters
              </span>
            </div>

            {/* MOTORS FILTERS */}
            {(activeCategory === "All" || activeCategory === "Motors") && (
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Motor Power
                </div>
                <div className="space-y-2">
                  {filterOptions.motorPowers.map((pow) => (
                    <label key={pow} className="flex items-center text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPower.includes(pow)}
                        onChange={() => handleToggleFilter(pow, selectedPower, setSelectedPower)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mr-2.5 h-4 w-4"
                      />
                      <span className="font-mono">{pow}</span>
                    </label>
                  ))}
                </div>

                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pt-4 border-t border-slate-100">
                  Motor Voltage
                </div>
                <div className="space-y-2">
                  {filterOptions.motorVoltages.map((volt) => (
                    <label key={volt} className="flex items-center text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVoltage.includes(volt)}
                        onChange={() => handleToggleFilter(volt, selectedVoltage, setSelectedVoltage)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mr-2.5 h-4 w-4"
                      />
                      <span className="font-mono">{volt}</span>
                    </label>
                  ))}
                </div>

                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pt-4 border-t border-slate-100">
                  IP Enclosure Rating
                </div>
                <div className="space-y-2">
                  {filterOptions.motorIPs.map((ip) => (
                    <label key={ip} className="flex items-center text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIPRating.includes(ip)}
                        onChange={() => handleToggleFilter(ip, selectedIPRating, setSelectedIPRating)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mr-2.5 h-4 w-4"
                      />
                      <span className="font-mono">{ip}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* PUMPS FILTERS */}
            {(activeCategory === "All" || activeCategory === "Pumps") && (
              <div className="space-y-4 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Pump Casing Material
                </div>
                <div className="space-y-2">
                  {filterOptions.pumpMaterials.map((mat) => (
                    <label key={mat} className="flex items-center text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMaterial.includes(mat)}
                        onChange={() => handleToggleFilter(mat, selectedMaterial, setSelectedMaterial)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mr-2.5 h-4 w-4"
                      />
                      <span className="text-xs">{mat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* VALVES FILTERS */}
            {(activeCategory === "All" || activeCategory === "Valves") && (
              <div className="space-y-4 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Valve Configuration
                </div>
                <div className="space-y-2">
                  {filterOptions.valveTypes.map((type) => (
                    <label key={type} className="flex items-center text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedValveType.includes(type)}
                        onChange={() => handleToggleFilter(type, selectedValveType, setSelectedValveType)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mr-2.5 h-4 w-4"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* GEARBOX FILTERS */}
            {(activeCategory === "All" || activeCategory === "Gearboxes") && (
              <div className="space-y-4 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Gear Ratio
                </div>
                <div className="space-y-2">
                  {filterOptions.gearRatios.map((ratio) => (
                    <label key={ratio} className="flex items-center text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGearRatio.includes(ratio)}
                        onChange={() => handleToggleFilter(ratio, selectedGearRatio, setSelectedGearRatio)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mr-2.5 h-4 w-4"
                      />
                      <span className="font-mono">{ratio}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Product Grid Panel */}
          <main className="lg:col-span-3">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-6 flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
              <button
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="inline-flex items-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded transition-smooth cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {isMobileFiltersOpen ? "Hide Filters" : "Show Technical Filters"}
              </button>
            </div>

            {/* Mobile Filters Drawer */}
            {isMobileFiltersOpen && (
              <div className="lg:hidden bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="font-display font-bold text-slate-900">Technical Filters</div>
                
                {/* Same checkbox filters but optimized for mobile stack */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">Power</div>
                    <div className="space-y-1.5">
                      {filterOptions.motorPowers.slice(0, 5).map((pow) => (
                        <label key={pow} className="flex items-center text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={selectedPower.includes(pow)}
                            onChange={() => handleToggleFilter(pow, selectedPower, setSelectedPower)}
                            className="rounded border-slate-300 text-brand-500 mr-2 h-3.5 w-3.5"
                          />
                          <span>{pow}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">IP Rating</div>
                    <div className="space-y-1.5">
                      {filterOptions.motorIPs.map((ip) => (
                        <label key={ip} className="flex items-center text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={selectedIPRating.includes(ip)}
                            onChange={() => handleToggleFilter(ip, selectedIPRating, setSelectedIPRating)}
                            className="rounded border-slate-300 text-brand-500 mr-2 h-3.5 w-3.5"
                          />
                          <span>{ip}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full text-center bg-slate-900 text-white py-2 rounded text-xs font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const isCompared = compareProductIds.includes(product.id);
                  const specKeys = Object.keys(product.specifications).slice(0, 4);

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-6 hover:shadow-md transition-smooth flex flex-col justify-between group"
                    >
                      <div>
                        {/* ID + Category Label */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            {product.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {product.category}
                          </span>
                        </div>

                        {/* Product Image */}
                        <div className="h-36 w-full overflow-hidden bg-slate-50 rounded border border-slate-100 mb-4 flex items-center justify-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-102 transition-smooth"
                          />
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-display font-bold text-slate-900 mb-0.5 leading-snug">
                          {product.name}
                        </h3>
                        <p className="text-slate-400 text-xs font-mono mb-3">
                          Model: {product.model}
                        </p>

                        {/* Specifications List */}
                        <div className="bg-slate-50/70 rounded p-3 mb-4 border border-slate-100/60">
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                            {specKeys.map((key) => (
                              <div key={key} className="text-[11px] leading-tight">
                                <span className="text-slate-500 font-normal block">{key}</span>
                                <span className="text-slate-900 font-mono font-bold">
                                  {product.specifications[key]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Applications Tagline */}
                        <div className="text-[11px] text-slate-500 line-clamp-1 mb-4">
                          <strong>Applications:</strong> {product.applications.join(", ")}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        {/* Compare Toggle Checkbox Style */}
                        <button
                          onClick={() => onToggleCompare(product.id)}
                          className={`w-full inline-flex items-center justify-center py-2 rounded text-xs font-semibold border transition-smooth cursor-pointer ${
                            isCompared
                              ? "bg-brand-50 border-brand-200 text-brand-600"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5 mr-1.5" />
                          {isCompared ? "Added to Compare" : "Add to Compare"}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`#products/${product.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate(`#products/${product.id}`);
                            }}
                            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white py-2 rounded text-xs font-semibold tracking-wide transition-smooth cursor-pointer"
                          >
                            View Details
                          </a>
                          <a
                            href={`#quote?productId=${product.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate(`#quote?productId=${product.id}`);
                            }}
                            className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white py-2 rounded text-xs font-semibold tracking-wide transition-smooth cursor-pointer"
                          >
                            Get Quote
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-sm">
                <div className="text-slate-300 mb-4 flex justify-center">
                  <SlidersHorizontal className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
                  No matching industrial products found
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  We couldn't find any products in category "{activeCategory}" matching your filter selections or query "{searchQuery}".
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-smooth"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
};
