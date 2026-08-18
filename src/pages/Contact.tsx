import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from "lucide-react";

export const Contact: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Sales Inquiry");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert("Please fill in all required fields.");
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans bg-dot-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-3">
            Contact InduCore
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Get in touch with our global offices, sales department, or connect directly with our engineering division for design inquiries.
          </p>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in duration-200">
                <CheckCircle2 className="w-14 h-14 text-brand-500 mx-auto" />
                <h3 className="text-xl font-display font-bold text-slate-900">
                  Message Sent Successfully
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Thank you for contacting InduCore. A customer relationship manager or designated systems engineer will respond to your request within 24 hours.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-slate-950 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl font-display font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Submit an Inquiry
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Corporate Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sconnor@cyberdyne.com"
                      className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Inquiry Routing Option
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="block w-full border border-slate-200 rounded-md p-3 text-sm bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="General Sales Inquiry">General Sales & Catalog Inquiry</option>
                    <option value="Talk to an Engineer">Talk to an Application Engineer (Technical Sizing)</option>
                    <option value="Custom Machining Requests">Custom Mounting & Material Requirements</option>
                    <option value="Logistics and Freight">B2B Logistics, Delivery & Freight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Inquiry Details *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your project, target specifications, flow rates, operating environment, voltage constraints, or motor mounts..."
                    className="block w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:border-brand-500"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white px-8 py-3.5 rounded text-sm font-semibold tracking-wide transition-smooth cursor-pointer shadow shadow-brand-500/15"
                  >
                    Send Message
                    <Send className="w-4 h-4 ml-2.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Column 3: Corporate Info & Engineering Hotline */}
          <div className="space-y-6">
            
            {/* Corporate Info */}
            <div className="bg-slate-900 text-white rounded-lg p-6 shadow-sm border border-slate-800 space-y-4">
              <h3 className="text-base font-display font-bold text-white">
                Global Headquarters
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start">
                  <MapPin className="w-4.5 h-4.5 text-brand-500 mr-2.5 shrink-0 mt-0.5" />
                  <span>100 Industrial Pkwy, Suite 400, Cleveland, OH 44101</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4.5 h-4.5 text-brand-500 mr-2.5 shrink-0" />
                  <span>+1 (800) 555-0199</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4.5 h-4.5 text-brand-500 mr-2.5 shrink-0" />
                  <span>info@inducore.com</span>
                </div>
              </div>
            </div>

            {/* Talk to an Engineer Box */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Direct Engineering Hotline
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Need to verify shaft loads, torque margins, or valve flow coefficients? Contact our technical sizing office directly to speak with an application expert.
              </p>
              <div className="border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-400 block font-mono">Engineering Office Hours:</span>
                <span className="text-slate-900 font-bold font-mono">08:00 - 17:00 EST (Mon-Fri)</span>
                <a href="tel:+18005550190" className="text-brand-600 font-bold block mt-1.5">
                  Call: +1 (800) 555-0190 ext. 4
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
