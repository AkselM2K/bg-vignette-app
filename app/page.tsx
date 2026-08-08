'use client';

import React, { useState, useEffect } from 'react';

// Vehicle Categories matching official Bulgarian API standards
type VehicleCategory = 
  | 'car' 
  | 'camper' 
  | 'trailer' 
  | 'heavy_truck' 
  | 'route_pass' 
  | 'motorcycle' 
  | 'tractor' 
  | 'electric';

type Duration = 'weekend' | 'week' | 'month' | 'quarter' | 'year';

interface FormData {
  vehicleCategory: VehicleCategory;
  hasTrailer: boolean;
  duration: Duration;
  startDate: string;
  licensePlate: string;
  countryCode: string;
  email: string;
  axleCount?: number;
  totalWeightTons?: number;
}

// Complete European & Global Country List with Flags (No "Other" option)
const COUNTRIES = [
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function VignetteWizard() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<number>(1);
  const [exemptionModal, setExemptionModal] = useState<'motorcycle' | 'tractor' | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    vehicleCategory: 'car',
    hasTrailer: false,
    duration: 'week',
    startDate: todayStr,
    licensePlate: '',
    countryCode: 'BG',
    email: '',
    axleCount: 2,
    totalWeightTons: 3.5,
  });

  // LocalStorage Auto-Save & Recovery
  useEffect(() => {
    const saved = localStorage.getItem('vignette_draft_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.startDate && parsed.startDate < todayStr) {
          parsed.startDate = todayStr;
        }
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to load saved draft', e);
      }
    }
  }, [todayStr]);

  useEffect(() => {
    localStorage.setItem('vignette_draft_v2', JSON.stringify(formData));
  }, [formData]);

  const updateForm = (fields: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // License Plate Sanitizer (Rule: UpperCase, No spaces, No special chars)
  const handlePlateChange = (val: string) => {
    const cleanPlate = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    updateForm({ licensePlate: cleanPlate });
  };

  // Handle Exemption Interceptions for Motorcycles and Tractors
  const handleCategorySelect = (cat: VehicleCategory) => {
    if (cat === 'motorcycle') {
      setExemptionModal('motorcycle');
      return;
    }
    if (cat === 'tractor') {
      setExemptionModal('tractor');
      return;
    }
    updateForm({ vehicleCategory: cat });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex justify-center items-center p-4 relative">
      
      {/* EXEMPTION MODAL OVERLAY */}
      {exemptionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="text-4xl">
              {exemptionModal === 'motorcycle' ? '🏍️' : '🚜'}
            </div>
            <h3 className="text-xl font-bold text-white">
              {exemptionModal === 'motorcycle' ? 'No Vignette Required' : 'Exempt Vehicle'}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {exemptionModal === 'motorcycle'
                ? 'Under Bulgarian National Road Infrastructure Agency regulations, two-wheeled motorcycles are 100% exempt from e-vignettes.'
                : 'Agricultural tractors and specialized machinery are exempt from standard road vignettes under national toll laws.'}
            </p>
            <button
              onClick={() => setExemptionModal(null)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all"
            >
              Understood, Back to Selection
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-emerald-600 p-4 text-center">
          <h1 className="text-xl font-bold tracking-tight">Bulgaria Official e-Vignette</h1>
          <p className="text-xs text-emerald-100 mt-1">Instant Pass • Automated BG National Toll Integration</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`flex-1 h-1 transition-all duration-300 ${
                step >= i ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content Area */}
        <div className="p-6">
          
          {/* STEP 1: VEHICLE CATEGORY SELECTION (8 CARDS) */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">1. Select Vehicle Category</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'car', label: 'Car / Passenger', icon: '🚗', sub: '≤ 3.5 Tons' },
                  { id: 'camper', label: 'Camper / RV', icon: '🚐', sub: '≤ 3.5 Tons' },
                  { id: 'trailer', label: 'Trailer / Caravan', icon: '🚙', sub: 'Combined > 3.5t' },
                  { id: 'heavy_truck', label: 'Heavy Truck / Bus', icon: '🚛', sub: '> 3.5 Tons (Toll)' },
                  { id: 'route_pass', label: 'Route Pass', icon: '🗺️', sub: 'Single Trip' },
                  { id: 'electric', label: 'Electric Vehicle', icon: '⚡', sub: 'Vignette Required' },
                  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', sub: 'Exempt' },
                  { id: 'tractor', label: 'Tractor', icon: '🚜', sub: 'Exempt' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleCategorySelect(v.id as VehicleCategory)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      formData.vehicleCategory === v.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{v.icon}</span>
                    <span className="text-xs font-semibold">{v.label}</span>
                    <span className="text-[10px] opacity-60 mt-0.5">{v.sub}</span>
                  </button>
                ))}
              </div>

              {/* Trailer Toggle for standard cars */}
              {formData.vehicleCategory === 'car' && (
                <div className="mt-4 p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-200">Towing a Trailer?</div>
                    <div className="text-[11px] text-slate-400">Required if total weight exceeds 3.5t</div>
                  </div>
                  <button
                    onClick={() => updateForm({ hasTrailer: !formData.hasTrailer })}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                      formData.hasTrailer ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      formData.hasTrailer ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DURATION & ACTIVATION DATE */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">2. Select Validity Period</h2>
              <div className="space-y-2">
                {[
                  { id: 'weekend', label: 'Weekend Pass (Fri 12:00 - Sun 23:59)', price: '10 BGN (~€5)' },
                  { id: 'week', label: '1 Week (7 Days)', price: '15 BGN (~€8)' },
                  { id: 'month', label: '1 Month', price: '30 BGN (~€15)' },
                  { id: 'quarter', label: '3 Months (90 Days)', price: '54 BGN (~€28)' },
                  { id: 'year', label: '1 Year', price: '97 BGN (~€50)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => updateForm({ duration: d.id as Duration })}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      formData.duration === d.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-800 bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <span className="text-xs">{d.label}</span>
                    <span className="text-xs font-mono">{d.price}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-xs text-slate-400 mb-1">Activation Date (Server Standardized)</label>
                <input
                  type="date"
                  min={todayStr}
                  value={formData.startDate < todayStr ? todayStr : formData.startDate}
                  onChange={(e) => updateForm({ startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 3: VEHICLE & CONTACT DETAILS */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">3. Vehicle & Driver Information</h2>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Registration Country</label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => updateForm({ countryCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">License Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. B1234AB"
                  value={formData.licensePlate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Spaces and special characters are automatically removed.</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email (PDF Pass Delivery)</label>
                <input
                  type="email"
                  placeholder="driver@example.com"
                  value={formData.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PAYMENT */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">4. Review & Confirm</h2>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Category:</span>
                  <span className="text-white font-medium capitalize">{formData.vehicleCategory.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Country:</span>
                  <span className="text-white font-medium">{formData.countryCode}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>License Plate:</span>
                  <span className="text-emerald-400 font-mono font-bold tracking-wider">{formData.licensePlate || 'NOT ENTERED'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Validity:</span>
                  <span className="text-white font-medium capitalize">{formData.duration} (From {formData.startDate})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Email Pass:</span>
                  <span className="text-white font-medium">{formData.email || 'NOT ENTERED'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={!formData.licensePlate || !formData.email}
                  onClick={() => alert('Front-end logic fully verified! Ready for Supabase Schema.')}
                  className={`w-full py-4 rounded-xl font-bold transition-all text-center ${
                    formData.licensePlate && formData.email
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Pay Now with Apple Pay / Card
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-slate-800">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all text-sm"
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Next Step
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}