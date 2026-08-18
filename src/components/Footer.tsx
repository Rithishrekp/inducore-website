import React from "react";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "../data/products";

interface FooterProps {
  onNavigate: (hash: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 font-sans">
      {/* Upper Footer section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-brand-500 rounded flex items-center justify-center font-display font-black text-lg tracking-wider text-white shadow-lg">
                IC
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                Indu<span className="text-brand-500">Core</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              InduCore delivers engineered, high-performance industrial equipment, motors, and automation control systems for demanding applications in global manufacturing, process, and energy infrastructure.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-slate-300">
                <MapPin className="w-4 h-4 mr-2.5 text-brand-500 shrink-0" />
                <span>100 Industrial Pkwy, Suite 400, Cleveland, OH 44101</span>
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <Phone className="w-4 h-4 mr-2.5 text-brand-500 shrink-0" />
                <a href="tel:+18005550199" className="hover:text-white transition-smooth">
                  +1 (800) 555-0199 (Tech Support)
                </a>
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <Mail className="w-4 h-4 mr-2.5 text-brand-500 shrink-0" />
                <a href="mailto:engineering@inducore.com" className="hover:text-white transition-smooth">
                  engineering@inducore.com
                </a>
              </div>
            </div>
          </div>

          {/* Product Categories Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Products
            </h3>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#category/${cat.id}`}
                    onClick={() => onNavigate(`#category/${cat.id}`)}
                    className="hover:text-white transition-smooth flex items-center"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
              <li className="pt-2 border-t border-slate-800">
                <a
                  href="#products"
                  onClick={() => onNavigate("#products")}
                  className="text-brand-500 hover:text-brand-400 font-semibold transition-smooth flex items-center"
                >
                  Entire Catalog <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Industries Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Industries
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#industries" onClick={() => onNavigate("#industries")} className="hover:text-white transition-smooth">
                  Manufacturing
                </a>
              </li>
              <li>
                <a href="#industries" onClick={() => onNavigate("#industries")} className="hover:text-white transition-smooth">
                  Water & Wastewater
                </a>
              </li>
              <li>
                <a href="#industries" onClick={() => onNavigate("#industries")} className="hover:text-white transition-smooth">
                  Energy & Utilities
                </a>
              </li>
              <li>
                <a href="#industries" onClick={() => onNavigate("#industries")} className="hover:text-white transition-smooth">
                  Oil & Gas Refining
                </a>
              </li>
              <li>
                <a href="#industries" onClick={() => onNavigate("#industries")} className="hover:text-white transition-smooth">
                  Chemical Processing
                </a>
              </li>
              <li>
                <a href="#industries" onClick={() => onNavigate("#industries")} className="hover:text-white transition-smooth">
                  Mining & Minerals
                </a>
              </li>
            </ul>
          </div>

          {/* Resources & Quick Links Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Resources & Support
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#resources" onClick={() => onNavigate("#resources")} className="hover:text-white transition-smooth">
                  Technical Datasheets
                </a>
              </li>
              <li>
                <a href="#resources" onClick={() => onNavigate("#resources")} className="hover:text-white transition-smooth">
                  Installation Guides
                </a>
              </li>
              <li>
                <a href="#resources" onClick={() => onNavigate("#resources")} className="hover:text-white transition-smooth">
                  Product Brochures
                </a>
              </li>
              <li>
                <a href="#about" onClick={() => onNavigate("#about")} className="hover:text-white transition-smooth">
                  About Our Company
                </a>
              </li>
              <li>
                <a href="#contact" onClick={() => onNavigate("#contact")} className="hover:text-white transition-smooth">
                  Contact an Engineer
                </a>
              </li>
              <li>
                <a href="#quote" onClick={() => onNavigate("#quote")} className="text-brand-500 hover:text-brand-400 font-semibold transition-smooth">
                  Request a B2B Quote
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Middle Line Section */}
      <div className="border-t border-slate-800 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex space-x-6">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-smooth" title="LinkedIn">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-smooth" title="Twitter">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-smooth" title="YouTube">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.525 3.5 12 3.5 12 3.5s-7.525 0-9.388.555a3.002 3.002 0 0 0-2.11 2.108C0 8.025 0 12 0 12s0 3.975.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.475 20.5 12 20.5 12 20.5s7.525 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.975 24 12 24 12s0-3.975-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
          <div className="text-xs text-slate-500">
            Disclaimer: InduCore is a mock industrial manufacturer demonstrating the AI-ready product-intelligence platform structure.
          </div>
        </div>
      </div>

      {/* Bottom Legal section */}
      <div className="border-t border-slate-800/60 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; {currentYear} InduCore Corp. All rights reserved. Registered ISO 9001:2015.</span>
          <div className="flex space-x-6 text-slate-500">
            <a href="#privacy" className="hover:text-slate-300 transition-smooth">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-300 transition-smooth">Terms of Sale</a>
            <a href="#cookies" className="hover:text-slate-300 transition-smooth">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
