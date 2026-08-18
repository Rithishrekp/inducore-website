import React from "react";
import { ShieldCheck, HardHat, Settings, GraduationCap } from "lucide-react";

export const About: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans bg-dot-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Section */}
        <div className="bg-slate-900 text-white rounded-lg p-8 sm:p-12 mb-12 shadow-md">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
              InduCore Technologies
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              InduCore delivers engineered industrial equipment and components for demanding applications across manufacturing, energy, infrastructure, and process industries. Our focus is mechanical precision and digital accountability.
            </p>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">Our Mission</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              To supply standardized, high-reliability industrial components backed by complete structured metadata and datasheets. We aim to bridge the gap between heavy physical operations and modern, database-driven industrial automation.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">Our Standards</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We operate under registered ISO 9001:2015 Quality Management protocols. Every product series is fully compliance-tested and certified by standard regulatory bodies (UL, CE, NEMA, ATEX flameproof) to guarantee field safety.
            </p>
          </div>
        </div>

        {/* Corporate Pillars */}
        <div className="space-y-8">
          <h2 className="text-2xl font-display font-extrabold text-slate-900 text-center mb-8">
            Our Core Operating Pillars
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-start space-x-4 shadow-sm">
              <div className="w-12 h-12 bg-brand-50 rounded flex items-center justify-center shrink-0 text-brand-500">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Engineering Excellence</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Our mechanical designs undergo rigorous finite element analysis (FEA) and computational fluid dynamics (CFD) tests to optimize efficiency ratings and thermal performance.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-start space-x-4 shadow-sm">
              <div className="w-12 h-12 bg-brand-50 rounded flex items-center justify-center shrink-0 text-brand-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Quality Assurance Protocols</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Each production run is subject to dynamic load testing, vibration analysis, and insulation resistance audits. We enforce zero-defect quality thresholds.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-start space-x-4 shadow-sm">
              <div className="w-12 h-12 bg-brand-50 rounded flex items-center justify-center shrink-0 text-brand-500">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Global Systems Integration</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Our systems are designed for instant physical and electrical mapping. Standard communication protocols like Modbus and Profinet come pre-integrated.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-start space-x-4 shadow-sm">
              <div className="w-12 h-12 bg-brand-50 rounded flex items-center justify-center shrink-0 text-brand-500">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Engineering Consultation</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  We supply active client-side technical support. Our engineers collaborate directly with system integrators to size and select optimized equipment packages.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
