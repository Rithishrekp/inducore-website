import React, { useState, useRef, useEffect } from "react";
import { Search, Scale, ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { CATEGORIES } from "../data/products";
import type { Product } from "../types";

interface HeaderProps {
  currentHash: string;
  products: Product[];
  compareCount: number;
  onNavigate: (hash: string) => void;
  onSearchSelect: (productId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentHash,
  products,
  compareCount,
  onNavigate,
  onSearchSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products for the live search dropdown
  const filteredProducts = searchQuery.trim()
    ? products.filter((product) => {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query) ||
          product.model.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          Object.values(product.specifications).some((spec) =>
            spec.toLowerCase().includes(query)
          ) ||
          product.applications.some((app) => app.toLowerCase().includes(query))
        );
      })
    : [];

  const handleSearchResultClick = (productId: string) => {
    onSearchSelect(productId);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const isActive = (hash: string) => {
    if (hash === "#home" && (currentHash === "" || currentHash === "#home")) return true;
    return currentHash.startsWith(hash);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="#home"
              onClick={() => onNavigate("#home")}
              className="flex items-center space-x-2 group"
            >
              <div className="w-10 h-10 bg-brand-500 rounded flex items-center justify-center font-display font-black text-xl tracking-wider text-white shadow-lg shadow-brand-500/20 group-hover:bg-brand-600 transition-colors duration-200">
                IC
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                Indu<span className="text-brand-500">Core</span>
              </span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <a
              href="#home"
              onClick={() => onNavigate("#home")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                isActive("#home") ? "text-brand-500 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              Home
            </a>

            {/* Products Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsProductsDropdownOpen(true)}
              onMouseLeave={() => setIsProductsDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  onNavigate("#products");
                  setIsProductsDropdownOpen(false);
                }}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-smooth outline-none cursor-pointer ${
                  isActive("#products") || isActive("#category")
                    ? "text-brand-500 font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span>Products</span>
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>

              {/* Mega Dropdown menu */}
              {isProductsDropdownOpen && (
                <div className="absolute left-0 mt-0 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                    Product Categories
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {CATEGORIES.map((cat) => (
                      <a
                        key={cat.id}
                        href={`#category/${cat.id}`}
                        onClick={() => {
                          onNavigate(`#category/${cat.id}`);
                          setIsProductsDropdownOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition-smooth"
                      >
                        <div>
                          <div className="text-sm font-semibold">{cat.name}</div>
                          <div className="text-xs text-slate-400 font-normal line-clamp-1">
                            {cat.description}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                          {cat.productCount}
                        </span>
                      </a>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 mt-3 pt-3 flex justify-between px-2">
                    <a
                      href="#products"
                      onClick={() => {
                        onNavigate("#products");
                        setIsProductsDropdownOpen(false);
                      }}
                      className="text-xs font-semibold text-brand-500 hover:text-brand-400 flex items-center"
                    >
                      Browse Entire Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a
              href="#industries"
              onClick={() => onNavigate("#industries")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                isActive("#industries") ? "text-brand-500 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              Industries
            </a>

            <a
              href="#resources"
              onClick={() => onNavigate("#resources")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                isActive("#resources") ? "text-brand-500 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              Resources
            </a>

            <a
              href="#about"
              onClick={() => onNavigate("#about")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                isActive("#about") ? "text-brand-500 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              About
            </a>

            <a
              href="#contact"
              onClick={() => onNavigate("#contact")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                isActive("#contact") ? "text-brand-500 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              Contact
            </a>
          </nav>

          {/* Search Bar + Compare + RFQ Button */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Live Search */}
            <div ref={searchRef} className="relative w-64 xl:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search catalog, model, specs..."
                className="block w-full pl-9 pr-4 py-2 border border-slate-700 bg-slate-800/80 rounded-md text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-smooth"
              />
              {/* Autocomplete Dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute left-0 mt-2 w-full max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-md shadow-2xl z-50">
                  {filteredProducts.length > 0 ? (
                    <div className="py-1">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase bg-slate-950/40">
                        Products ({filteredProducts.length})
                      </div>
                      {filteredProducts.slice(0, 8).map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => handleSearchResultClick(prod.id)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white flex flex-col cursor-pointer transition-smooth border-b border-slate-800/40 last:border-0"
                        >
                          <span className="font-semibold text-slate-100">{prod.name}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            Model: {prod.model} | Category: {prod.category}
                          </span>
                        </button>
                      ))}
                      {filteredProducts.length > 8 && (
                        <button
                          onClick={() => {
                            onNavigate(`#products?q=${encodeURIComponent(searchQuery)}`);
                            setShowSearchResults(false);
                          }}
                          className="w-full text-center px-4 py-2 text-xs font-semibold text-brand-500 hover:bg-slate-800 hover:text-brand-400 border-t border-slate-800"
                        >
                          View all {filteredProducts.length} results
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                      No matching products found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compare Button */}
            <a
              href="#compare"
              onClick={() => onNavigate("#compare")}
              className="relative p-2 text-slate-300 hover:text-white transition-smooth flex items-center"
              title="Compare Products"
            >
              <Scale className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white font-mono text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {compareCount}
                </span>
              )}
            </a>

            {/* Request Quote Button */}
            <a
              href="#quote"
              onClick={() => onNavigate("#quote")}
              className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded text-sm font-semibold tracking-wide transition-smooth shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20"
            >
              Request Quote
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Compare Button Mobile */}
            <a
              href="#compare"
              onClick={() => onNavigate("#compare")}
              className="relative p-2 text-slate-300 hover:text-white transition-smooth flex items-center"
            >
              <Scale className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white font-mono text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {compareCount}
                </span>
              )}
            </a>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-4 pb-6 space-y-3">
            {/* Mobile Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog, model, specs..."
                className="block w-full pl-9 pr-4 py-2 border border-slate-700 bg-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
              {searchQuery.trim() && (
                <div className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-md shadow-2xl z-50">
                  {filteredProducts.slice(0, 5).map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        handleSearchResultClick(prod.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex flex-col cursor-pointer border-b border-slate-800 last:border-0"
                    >
                      <span className="font-semibold text-slate-100">{prod.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{prod.id} | {prod.model}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1 py-2">
              <a
                href="#home"
                onClick={() => {
                  onNavigate("#home");
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("#home") ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Home
              </a>
              <a
                href="#products"
                onClick={() => {
                  onNavigate("#products");
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("#products") ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Browse All Products
              </a>

              {/* Mobile Categories list */}
              <div className="pl-4 py-1 border-l-2 border-slate-700 space-y-1">
                {CATEGORIES.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#category/${cat.id}`}
                    onClick={() => {
                      onNavigate(`#category/${cat.id}`);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>

              <a
                href="#industries"
                onClick={() => {
                  onNavigate("#industries");
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("#industries") ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Industries
              </a>
              <a
                href="#resources"
                onClick={() => {
                  onNavigate("#resources");
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("#resources") ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Resources
              </a>
              <a
                href="#about"
                onClick={() => {
                  onNavigate("#about");
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("#about") ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                About
              </a>
              <a
                href="#contact"
                onClick={() => {
                  onNavigate("#contact");
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("#contact") ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Contact
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <a
                href="#quote"
                onClick={() => {
                  onNavigate("#quote");
                  setIsMobileMenuOpen(false);
                }}
                className="block text-center w-full bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded text-sm font-semibold tracking-wide"
              >
                Request a Quote
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
