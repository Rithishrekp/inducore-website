import React, { useState, useMemo } from "react";
import { Waves, Flame, Activity, Zap, Factory, ShieldAlert, Cpu } from "lucide-react";
import type { Product } from "../types";

interface IndustriesProps {
  onNavigate: (hash: string) => void;
  products: Product[];
}

interface IndustryData {
  id: string;
  name: string;
  description: string;
  challenges: string;
  icon: React.ReactNode;
  productIds: string[];
}

export const Industries: React.FC<IndustriesProps> = ({ onNavigate, products }) => {
  const industries: IndustryData[] = [
    {
      id: "water",
      name: "Water & Wastewater",
      description: "Pumping stations, drainage, wastewater treatment, filtration, and municipal distribution.",
      challenges: "Corrosive liquids, continuous operating cycles, and variable flow requirements.",
      icon: <Waves className="w-6 h-6" />,
      productIds: ["P-100", "P-104", "P-106", "P-107", "C-105", "V-102", "V-104"]
    },
    {
      id: "manufacturing",
      name: "General Manufacturing",
      description: "Conveyor drives, automated assembly lines, packaging machinery, and workshop air tools.",
      challenges: "Strict operating tolerances, high start-up torque, and energy cost optimization.",
      icon: <Factory className="w-6 h-6" />,
      productIds: ["M-100", "M-101", "C-100", "GB-100", "COMP-100", "GB-104"]
    },
    {
      id: "energy",
      name: "Energy & Utilities",
      description: "Boiler feedwater loops, circulation blowers, turbine operations, and power grids.",
      challenges: "Extremely high pressure thresholds, thermal loads, and mechanical efficiency standards.",
      icon: <Zap className="w-6 h-6" />,
      productIds: ["M-109", "C-101", "P-102", "V-101"]
    },
    {
      id: "oil-gas",
      name: "Oil & Gas Refining",
      description: "Hydrocarbon transport, process refining, hazard-zone pumping, and safety isolation.",
      challenges: "Highly flammable vapors (ATEX Zones), chemical resistance, and high-pressure gaskets.",
      icon: <Flame className="w-6 h-6" />,
      productIds: ["M-104", "P-103", "V-101", "V-104"]
    },
    {
      id: "mining",
      name: "Mining & Heavy Minerals",
      description: "Ore crushers, high-load slurry handling, materials milling, and high-duty conveyors.",
      challenges: "Extreme starting shock loads, dust ingress, and high mechanical abrasive wear.",
      icon: <Activity className="w-6 h-6" />,
      productIds: ["M-103", "M-106", "C-101", "GB-103"]
    },
    {
      id: "chemical",
      name: "Chemical Processing",
      description: "Acid and alkaline transfer, process loop mixing, washdowns, and pneumatic regulation.",
      challenges: "Corrosive acids, harsh solvents, seal degradation, and precise speed regulation.",
      icon: <Cpu className="w-6 h-6" />,
      productIds: ["P-103", "V-100", "M-104", "C-105"]
    }
  ];

  const [activeTab, setActiveTab] = useState(industries[0].id);

  const selectedIndustry = useMemo(() => {
    return industries.find((ind) => ind.id === activeTab) || industries[0];
  }, [activeTab]);

  const industryProducts = useMemo(() => {
    return selectedIndustry.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [selectedIndustry, products]);

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans bg-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-3">
            Industries & Applications
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto">
            InduCore designs and manufactures components targeted for the specific operational challenges of key industrial sectors.
          </p>
        </div>

        {/* Industry Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-10 shadow-sm flex flex-wrap gap-2 justify-center">
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => setActiveTab(ind.id)}
              className={`flex items-center space-x-2 px-5 py-3 text-xs font-semibold rounded uppercase tracking-wider transition-smooth cursor-pointer ${
                activeTab === ind.id
                  ? "bg-slate-900 text-white shadow"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {ind.icon}
              <span>{ind.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Industry Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Sector Overview */}
          <div className="bg-slate-900 text-white rounded-lg p-8 self-start shadow border border-slate-800 space-y-6">
            <div className="flex items-center space-x-3 text-brand-500">
              {selectedIndustry.icon}
              <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                {selectedIndustry.name}
              </h2>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              {selectedIndustry.description}
            </p>

            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                Operational Challenges
              </div>
              <div className="flex items-start text-xs text-slate-300 bg-slate-950 p-4 rounded border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-brand-500 mr-2.5 shrink-0 mt-0.5" />
                <span>{selectedIndustry.challenges}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate("#quote")}
                className="w-full text-center bg-brand-500 hover:bg-brand-600 text-white py-3 rounded text-xs font-semibold uppercase tracking-wider transition-smooth shadow-lg shadow-brand-500/10"
              >
                Request Consultation
              </button>
            </div>
          </div>

          {/* Right Columns: Target Equipment Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900">
                Verified Equipment & Sizing Mappings
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {industryProducts.length} Models mapped
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {industryProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-smooth"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {product.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      {product.name}
                    </h4>
                    <p className="text-slate-400 text-xs font-mono mb-3">
                      Model: {product.model}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded border border-slate-100 mb-4 font-mono">
                      {Object.entries(product.specifications).slice(0, 4).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-slate-500 block">{key}</span>
                          <span className="text-slate-950 font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onNavigate(`#products/${product.id}`)}
                      className="text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-smooth"
                    >
                      Specs
                    </button>
                    <button
                      onClick={() => onNavigate(`#quote?productId=${product.id}`)}
                      className="text-center bg-brand-500 hover:bg-brand-600 text-white py-1.5 rounded text-[10px] font-bold transition-smooth"
                    >
                      Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
