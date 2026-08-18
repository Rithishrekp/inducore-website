import React from "react";
import { ArrowRight, Settings, ShieldCheck, Database, FileText } from "lucide-react";
import { CATEGORIES } from "../data/products";
import type { Product } from "../types";

interface HomeProps {
  onNavigate: (hash: string) => void;
  products: Product[];
}

export const Home: React.FC<HomeProps> = ({ onNavigate, products }) => {
  // Flagship products mentioned in user request
  const featuredIds = ["M-101", "P-100", "C-100", "GB-101", "V-100", "COMP-100"];
  const featuredProducts = products.filter((p) => featuredIds.includes(p.id));

  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white bg-dot-grid-dark py-24 sm:py-32 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0" />
        
        {/* Decorative subtle industrial gear illustration background */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-15 hidden lg:flex items-center justify-center z-0 pointer-events-none">
          <Settings className="w-[500px] h-[500px] text-brand-500 animate-spin" style={{ animationDuration: '60s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-3xl">
            {/* Tagline */}
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full text-xs font-mono text-brand-500 mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              <span>ISO 9001:2015 Certified B2B Supplier</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-white mb-6 leading-[1.1]">
              Engineered for Industry. <br />
              <span className="text-brand-500">Built for Performance.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
              Explore industrial motors, pumps, controllers, and engineered components designed for demanding applications across energy, processing, and heavy manufacturing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#products"
                onClick={() => onNavigate("#products")}
                className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded text-base font-semibold tracking-wide transition-smooth shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35"
              >
                Explore Products
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
              <a
                href="#quote"
                onClick={() => onNavigate("#quote")}
                className="inline-flex items-center justify-center bg-transparent hover:bg-slate-900 text-white border border-slate-700 hover:border-slate-500 px-8 py-4 rounded text-base font-semibold tracking-wide transition-smooth"
              >
                Request a Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Stats Section */}
      <section className="bg-slate-900 border-b border-slate-800 py-10 text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-3xl font-display font-black text-brand-500">38+</div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1">Industrial Models</div>
          </div>
          <div>
            <div className="text-3xl font-display font-black text-brand-500">100%</div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1">Datasheet Accuracy</div>
          </div>
          <div>
            <div className="text-3xl font-display font-black text-brand-500">&lt; 0.1mm</div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1">Precision Tolerance</div>
          </div>
          <div>
            <div className="text-3xl font-display font-black text-brand-500">24/7</div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1">Engineering Support</div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="py-20 sm:py-24 bg-slate-50 bg-dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-4">
              Explore Our Product Range
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              InduCore manufactures a comprehensive catalog of industrial parts and machinery. Select a category below to explore models, technical specifications, and documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-xl hover:border-slate-300 transition-smooth group flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-mono font-bold px-2.5 py-1 rounded">
                      {category.productCount} Models
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-2.5">
                      {category.name}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <a
                    href={`#category/${category.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`#category/${category.id}`);
                    }}
                    className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-brand-600 text-white py-3 rounded text-sm font-semibold transition-smooth cursor-pointer"
                  >
                    View Products
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 sm:py-24 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-16 gap-4">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-slate-900 mb-2">
                Featured Engineered Products
              </h2>
              <p className="text-slate-600 text-sm">
                Flagship products representing our highest standards of mechanical precision.
              </p>
            </div>
            <a
              href="#products"
              onClick={() => onNavigate("#products")}
              className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center transition-smooth"
            >
              Browse Full Catalog ({products.length})
              <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => {
              // Extract a couple of key specs to show on the card
              const specKeys = Object.keys(product.specifications).slice(0, 4);

              return (
                <div
                  key={product.id}
                  className="border border-slate-200 hover:border-slate-300 rounded-lg p-6 hover:shadow-lg transition-smooth bg-white flex flex-col justify-between"
                >
                  <div>
                    {/* ID + Category Label */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">
                        {product.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>

                    {/* Image Placeholder */}
                    <div className="h-40 w-full overflow-hidden bg-slate-50 rounded-md border border-slate-100 mb-4 flex items-center justify-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-slate-400 text-xs font-mono mb-4">
                      Model: {product.model}
                    </p>

                    {/* Specifications List */}
                    <div className="bg-slate-50 rounded p-4 mb-6 border border-slate-100">
                      <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                        Technical Summary
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        {specKeys.map((key) => (
                          <div key={key} className="text-xs">
                            <span className="text-slate-500 font-normal block">{key}</span>
                            <span className="text-slate-900 font-mono font-bold">
                              {product.specifications[key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a
                      href={`#products/${product.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`#products/${product.id}`);
                      }}
                      className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded text-xs font-semibold tracking-wide transition-smooth cursor-pointer"
                    >
                      View Details
                    </a>
                    <a
                      href={`#quote?productId=${product.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`#quote?productId=${product.id}`);
                      }}
                      className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded text-xs font-semibold tracking-wide transition-smooth cursor-pointer"
                    >
                      Request Quote
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Engineering Value Proposition */}
      <section className="py-20 sm:py-24 bg-slate-900 text-white bg-dot-grid-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-extrabold text-white mb-4">
              InduCore B2B Engineering Excellence
            </h2>
            <p className="text-slate-400 text-base">
              Providing standardized, fully documented mechanical products to speed up system integration, verification, and logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="bg-slate-950 p-8 rounded-lg border border-slate-800 text-left">
              <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-3">
                100% Quality & Certification
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                All components are manufactured in ISO-certified plants, meeting strict DIN, CE, NEMA, and ATEX regulatory standards.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-950 p-8 rounded-lg border border-slate-800 text-left">
              <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded flex items-center justify-center mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-3">
                Structured Technical Data
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Clean, machine-readable specifications and metadata map to every component, easing digital integration into engineering schemas.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-950 p-8 rounded-lg border border-slate-800 text-left">
              <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-3">
                Detailed Documentation
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every component matches a registered physical datasheet, installation guide, and dimensional drawing for layout validation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
