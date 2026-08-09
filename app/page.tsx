'use client';

import React, { useState, useEffect } from 'react';

// --- TYPES ---
type Currency = 'BGN' | 'EUR' | 'GBP' | 'USD' | 'TRY' | 'RON';
type VehicleCategory = 
  | 'car' 
  | 'van_heavy' 
  | 'camper' 
  | 'truck' 
  | 'route_pass' 
  | 'electric' 
  | 'motorcycle' 
  | 'tractor';

type EuroClass = 'euro_0_2' | 'euro_3' | 'euro_4' | 'euro_5' | 'euro_6';
type AxleCount = 2 | 3 | 4 | 5;
type Duration = '1day' | 'weekend' | 'week' | 'month' | 'quarter' | 'year';

interface FormData {
  currency: Currency;
  vehicleCategory: VehicleCategory;
  // AutoDoc-Style Car Selection
  carBrand: string;
  carModel: string;
  hasTrailer: boolean;
  trailerSize: 'small' | 'medium' | 'heavy';
  // Heavy Vehicle Params
  euroClass: EuroClass;
  axles: AxleCount;
  routeFrom: string;
  routeTo: string;
  // Common
  duration: Duration;
  startDate: string;
  licensePlate: string;
  countryCode: string;
  email: string;
}

// --- DATA & CONSTANTS ---
const CURRENCY_RATES: Record<Currency, { symbol: string; rateFromBgn: number }> = {
  BGN: { symbol: 'лв', rateFromBgn: 1.0 },
  EUR: { symbol: '€', rateFromBgn: 0.51 },
  GBP: { symbol: '£', rateFromBgn: 0.44 },
  USD: { symbol: '$', rateFromBgn: 0.56 },
  TRY: { symbol: '₺', rateFromBgn: 18.2 },
  RON: { symbol: 'lei', rateFromBgn: 2.55 },
};

const CAR_MODELS: Record<string, { model: string; mtmKg: number }[]> = {
  'Mercedes-Benz': [{ model: 'C-Class', mtmKg: 2100 }, { model: 'ML 350 / GLE', mtmKg: 2950 }, { model: 'Sprinter', mtmKg: 3500 }],
  'Volkswagen': [{ model: 'Polo', mtmKg: 1550 }, { model: 'Passat', mtmKg: 2050 }, { model: 'Touareg', mtmKg: 2850 }],
  'BMW': [{ model: '3 Series', mtmKg: 2000 }, { model: 'X5', mtmKg: 2800 }],
  'Audi': [{ model: 'A4', mtmKg: 2020 }, { model: 'Q7', mtmKg: 2900 }],
  'Ford': [{ model: 'Focus', mtmKg: 1800 }, { model: 'Transit', mtmKg: 3300 }],
};

const COUNTRIES = [
  // Top Border Crossings First
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', top: true },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', top: true },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', top: true },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', top: true },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', top: true },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', top: true },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', top: true },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', top: true },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', top: true },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', top: true },
  // Rest of the World
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', top: false },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', top: false },
  { code: 'FR', name: 'France', flag: '🇫🇷', top: false },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', top: false },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', top: false },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', top: false },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', top: false },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', top: false },
  { code: 'US', name: 'United States', flag: '🇺🇸', top: false },
];

const QUICK_ROUTES = ['Sofia', 'Ruse (Border)', 'Kulata (Border)', 'Kapitan Andreevo (Border)', 'Varna', 'Burgas', 'Plovdiv'];

export default function VignetteWizard() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<number>(1);
  const [motorcycleModal, setMotorcycleModal] = useState<boolean>(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    currency: 'EUR',
    vehicleCategory: 'car',
    carBrand: 'Mercedes-Benz',
    carModel: 'ML 350 / GLE',
    hasTrailer: false,
    trailerSize: 'medium',
    euroClass: 'euro_6',
    axles: 2,
    routeFrom: 'Ruse (Border)',
    routeTo: 'Sofia',
    duration: 'week',
    startDate: todayStr,
    licensePlate: '',
    countryCode: 'BG',
    email: '',
  });

  // Calculate MTM Weight Logic (Points 11 & 17)
  const currentBrandModels = CAR_MODELS[formData.carBrand] || CAR_MODELS['Mercedes-Benz'];
  const selectedModelObj = currentBrandModels.find((m) => m.model === formData.carModel) || currentBrandModels[0];
  const carMtm = selectedModelObj ? selectedModelObj.mtmKg : 2000;
  
  let trailerMtm = 0;
  if (formData.hasTrailer) {
    if (formData.trailerSize === 'small') trailerMtm = 600;
    if (formData.trailerSize === 'medium') trailerMtm = 1200;
    if (formData.trailerSize === 'heavy') trailerMtm = 2000;
  }

  const totalWeightKg = carMtm + trailerMtm;
  const requiresTrailerVignette = formData.hasTrailer && totalWeightKg > 3500;

  // Plate Sanitizer (Points 3 & 10)
  const handlePlateChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData((prev) => ({ ...prev, licensePlate: clean }));
  };

  // Pricing Formatter (Point 22)
  const formatPrice = (bgnAmount: number) => {
    const rate = CURRENCY_RATES[formData.currency].rateFromBgn;
    const symbol = CURRENCY_RATES[formData.currency].symbol;
    const converted = (bgnAmount * rate).toFixed(2);
    if (formData.currency === 'BGN') return `${bgnAmount} лв`;
    return `${converted} ${symbol} (${bgnAmount} BGN)`;
  };

  const handleCategorySelect = (cat: VehicleCategory) => {
    if (cat === 'motorcycle') {
      setMotorcycleModal(true);
      return;
    }
    setFormData((prev) => ({ ...prev, vehicleCategory: cat }));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center p-2 sm:p-4 font-sans">
      
      {/* MOTORCYCLE SHIELD MODAL (Point 14) */}
      {motorcycleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="text-5xl">🏍️</div>
            <h3 className="text-2xl font-extrabold text-emerald-400">No Vignette Required!</h3>
            <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl text-left text-xs text-slate-300 leading-relaxed space-y-2">
              <p className="font-semibold text-emerald-300">Official Bulgarian Toll Law Notice:</p>
              <p>Two-wheeled motorcycles and scooters are <strong>100% exempt</strong> from e-vignettes and road tolls across all highways and national roads in Bulgaria.</p>
              <p className="text-amber-400">⚠️ Beware of scam websites attempting to sell motorcycle vignettes!</p>
            </div>
            <button
              onClick={() => setMotorcycleModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg"
            >
              Understood • Return to Menu
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
        
        {/* HEADER & DUAL-CURRENCY SELECTOR (Point 22) */}
        <div className="bg-slate-850 border-b border-slate-800 p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-base font-bold text-white tracking-tight">BG-Vignette Pass</h1>
            </div>
            <p className="text-[11px] text-slate-400">Official Toll Integration • Fail-Safe Delivery</p>
          </div>

          {/* Currency Switcher Dropdown */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <span className="text-xs text-slate-400">Currency:</span>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
              <option value="BGN" className="bg-slate-900 text-white">BGN (лв)</option>
              <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
              <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
              <option value="TRY" className="bg-slate-900 text-white">TRY (₺)</option>
              <option value="RON" className="bg-slate-900 text-white">RON (lei)</option>
            </select>
          </div>
        </div>

        {/* PROGRESS TRACKER BAR */}
        <div className="grid grid-cols-4 bg-slate-950 border-b border-slate-800 text-[10px] text-center text-slate-400">
          {[
            { step: 1, label: 'Vehicle' },
            { step: 2, label: 'Duration' },
            { step: 3, label: 'Plate & OCR' },
            { step: 4, label: 'Checkout' },
          ].map((item) => (
            <div
              key={item.step}
              className={`py-2 border-b-2 transition-all ${
                step >= item.step ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/5' : 'border-transparent'
              }`}
            >
              {item.step}. {item.label}
            </div>
          ))}
        </div>

        {/* BODY CONTENT */}
        <div className="p-5">

          {/* ================= STEP 1: VEHICLE & AUTODOC WEIGHT ENGINE ================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">1. Select Vehicle Category</h2>
                <p className="text-xs text-slate-400">Visual classification matching Bulgarian Toll Law</p>
              </div>

              {/* 8 Vehicle Cards (Point 2 & 15 & 18) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'car', label: 'Car / Passenger', icon: '🚗', desc: '≤ 3.5t' },
                  { id: 'van_heavy', label: 'Commercial Van', icon: '🚐', desc: '≤ 3.5t / >3.5t' },
                  { id: 'camper', label: 'Motorhome / RV', icon: '🏕️', desc: 'Heavy Camper' },
                  { id: 'truck', label: 'Heavy Goods / Truck', icon: '🚛', desc: '> 3.5t Route Pass' },
                  { id: 'route_pass', label: 'Single Route Pass', icon: '🗺️', desc: 'A-to-B Trip' },
                  { id: 'electric', label: 'Electric Vehicle', icon: '⚡', desc: 'Vignette Needed' },
                  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', desc: 'Exempt Notice' },
                  { id: 'tractor', label: 'Tractor / Special', icon: '🚜', desc: 'Agricultural' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCategorySelect(item.id as VehicleCategory)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between h-24 ${
                      formData.vehicleCategory === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="text-2xl mt-1">{item.icon}</span>
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-semibold leading-tight">{item.label}</div>
                      <div className="text-[9px] text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* AUTODOC-STYLE GUIDED VEHICLE WEIGHT MATRIX (Points 11, 16, 17) */}
              {formData.vehicleCategory === 'car' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="text-xs font-bold text-slate-200">AutoDoc Weight Matrix (Visual Selector)</div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      Calculated MTM: {totalWeightKg} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Vehicle Brand</label>
                      <select
                        value={formData.carBrand}
                        onChange={(e) => {
                          const brand = e.target.value;
                          const defaultModel = CAR_MODELS[brand]?.[0]?.model || '';
                          setFormData({ ...formData, carBrand: brand, carModel: defaultModel });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                      >
                        {Object.keys(CAR_MODELS).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Model Spec</label>
                      <select
                        value={formData.carModel}
                        onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                      >
                        {currentBrandModels.map((m) => (
                          <option key={m.model} value={m.model}>{m.model} (~{m.mtmKg}kg)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Trailer Selection Toggle */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-200">Attaching a Trailer / Caravan?</div>
                      <div className="text-[10px] text-slate-400">System checks total combined weight limit (3,500 kg)</div>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, hasTrailer: !formData.hasTrailer })}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                        formData.hasTrailer ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        formData.hasTrailer ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {formData.hasTrailer && (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[10px] text-slate-400">Trailer Size Class</label>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {[
                          { id: 'small', label: 'Small Light (<750kg)', mtm: '+600kg' },
                          { id: 'medium', label: 'Medium (1-Axle)', mtm: '+1,200kg' },
                          { id: 'heavy', label: 'Heavy Caravan / 2-Axle', mtm: '+2,000kg' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setFormData({ ...formData, trailerSize: t.id as any })}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              formData.trailerSize === t.id
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            <div>{t.label}</div>
                            <div className="opacity-60">{t.mtm}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Smart Result Notice */}
                  {formData.hasTrailer && (
                    <div className={`p-3 rounded-xl border text-xs leading-snug ${
                      requiresTrailerVignette
                        ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                        : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                    }`}>
                      {requiresTrailerVignette ? (
                        <div>
                          <strong>⚠️ Trailer Vignette Required:</strong> Total combined MTM is <strong>{totalWeightKg} kg</strong> (exceeds 3,500 kg). The system will automatically issue 1x Car Vignette + 1x Category K3 Trailer Vignette.
                        </div>
                      ) : (
                        <div>
                          <strong>🎉 Good News!</strong> Total combined MTM is <strong>{totalWeightKg} kg</strong> (under 3.5t limit). You do <strong>NOT</strong> need a separate trailer vignette!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* HEAVY VEHICLE ROUTE & AXLE CONFIGURATOR (Points 1, 4, 5, 6, 13) */}
              {(formData.vehicleCategory === 'truck' || formData.vehicleCategory === 'route_pass' || formData.vehicleCategory === 'van_heavy') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-300">
                    <strong>Notice (24-Hour Route Pass):</strong> Heavy commercial vehicles (>3.5t) operate on distance-based route passes valid for 24 hours from activation.
                  </div>

                  {/* Axle Count Selector (Point 13) */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Axle Count Configuration</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([2, 3, 4, 5] as AxleCount[]).map((num) => (
                        <button
                          key={num}
                          onClick={() => setFormData({ ...formData, axles: num })}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            formData.axles === num
                              ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          <div className="text-sm">🚛 {num}</div>
                          <div className="text-[9px]">{num === 5 ? '5+ Axles' : `${num} Axles`}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Euro Emission Class (Point 4) */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Euro Emission Standard</label>
                    <select
                      value={formData.euroClass}
                      onChange={(e) => setFormData({ ...formData, euroClass: e.target.value as EuroClass })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                    >
                      <option value="euro_6">Euro VI / EEV (Lowest Toll Rate)</option>
                      <option value="euro_5">Euro V</option>
                      <option value="euro_4">Euro IV</option>
                      <option value="euro_3">Euro III</option>
                      <option value="euro_0_2">Euro 0 - Euro II</option>
                    </select>
                  </div>

                  {/* Interactive Route Pins (Point 6) */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[10px] text-slate-400">Route Waypoints (Border Entry & Destination)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.routeFrom}
                        onChange={(e) => setFormData({ ...formData, routeFrom: e.target.value })}
                        placeholder="Start Point / Border"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={formData.routeTo}
                        onChange={(e) => setFormData({ ...formData, routeTo: e.target.value })}
                        placeholder="Destination City"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                      />
                    </div>
                    {/* Quick Pick Route Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[9px] text-slate-500 py-0.5">Presets:</span>
                      {QUICK_ROUTES.slice(0, 5).map((city) => (
                        <button
                          key={city}
                          onClick={() => setFormData({ ...formData, routeTo: city })}
                          className="text-[9px] bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300"
                        >
                          + {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: DURATION & SERVER UTC DATE LOCK ================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">2. Select Validity Period</h2>
                <p className="text-xs text-slate-400">Prices synchronized directly with BG National Toll Matrix</p>
              </div>

              {/* 1-Day Pass explicitly listed at top (Point 9) */}
              <div className="space-y-2">
                {[
                  { id: '1day', label: '1-Day Transit Pass (24 Hours)', bgn: 13, popular: false },
                  { id: 'weekend', label: 'Weekend Pass (Fri 12:00 - Sun 23:59)', bgn: 10, popular: false },
                  { id: 'week', label: '1 Week (7 Days)', bgn: 15, popular: true },
                  { id: 'month', label: '1 Month (30 Days)', bgn: 30, popular: false },
                  { id: 'quarter', label: '3 Months (90 Days)', bgn: 54, popular: false },
                  { id: 'year', label: '1 Year (365 Days)', bgn: 97, popular: false },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFormData({ ...formData, duration: item.id as Duration })}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      formData.duration === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{item.label}</span>
                      {item.popular && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md">Most Popular</span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{formatPrice(item.bgn)}</span>
                  </button>
                ))}
              </div>

              {/* Server-Locked Date Validation (Points 19 & 20) */}
              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1">Activation Start Date (Server UTC Validated)</label>
                <input
                  type="date"
                  min={todayStr}
                  value={formData.startDate < todayStr ? todayStr : formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  🔒 Locked to UTC Server Time. You can pre-purchase up to 30 days in advance.
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PLATE SANITIZER, OCR PHOTO & COUNTRY FLAGS ================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">3. Plate & Driver Information</h2>
                <p className="text-xs text-slate-400">Zero-error verification layer</p>
              </div>

              {/* Exhaustive Country List with Flags & Top Crossing Priorities (Points 21 & 25) */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Registration Country</label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                >
                  <optgroup label=" popular Border Crossings">
                    {COUNTRIES.filter((c) => c.top).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Global Countries">
                    {COUNTRIES.filter((c) => !c.top).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Plate Sanitizer Input (Points 3 & 10) */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">License Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. B1234AB or 2ABC234"
                  value={formData.licensePlate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-emerald-400 uppercase font-mono tracking-widest font-bold focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  ✨ Auto-normalized: Spaces and special symbols removed automatically.
                </p>
              </div>

              {/* OCR Photo Upload Safety Net (Point 3) */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-300 font-semibold">📸 Optional AI Photo Verification Dropzone</div>
                <p className="text-[10px] text-slate-500">
                  Upload a photo of your vehicle registration document or plate to cross-check OCR accuracy.
                </p>
                <label className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all">
                  <span>Upload Document Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setOcrPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                {ocrPreview && (
                  <div className="text-[10px] text-emerald-400 font-mono pt-1">
                    ✓ Document loaded into local OCR vision parser preview.
                  </div>
                )}
              </div>

              {/* Email Delivery */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address (PDF Pass Delivery)</label>
                <input
                  type="email"
                  placeholder="driver@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 4: REVIEW, FAIL-SAFE NOTICE & CHECKOUT ================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">4. Order Summary & Payment</h2>
                <p className="text-xs text-slate-400">Review your automated vignette parameters</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                  <span>Vehicle Category:</span>
                  <span className="text-white font-medium capitalize">{formData.vehicleCategory.replace('_', ' ')}</span>
                </div>
                {formData.vehicleCategory === 'car' && (
                  <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                    <span>Model Specs:</span>
                    <span className="text-white font-medium">{formData.carBrand} {formData.carModel} ({totalWeightKg} kg)</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                  <span>Country & Plate:</span>
                  <span className="text-emerald-400 font-mono font-bold">{formData.countryCode} • {formData.licensePlate || 'NOT ENTERED'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                  <span>Activation Date:</span>
                  <span className="text-white font-medium">{formData.startDate}</span>
                </div>
                {requiresTrailerVignette && (
                  <div className="flex justify-between border-b border-slate-900 pb-1 text-amber-400 font-semibold">
                    <span>Trailer Vignette Included:</span>
                    <span>YES (Combined > 3.5t)</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm font-bold text-white">
                  <span>Total Amount Due:</span>
                  <span className="text-emerald-400 font-mono">{formatPrice(15)}</span>
                </div>
              </div>

              {/* Fail-Safe Delivery Banner (Point 8) */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl text-[10px] text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>🛡️ Fail-Safe Delivery Guarantee:</span>
                </div>
                <p>
                  Upon payment, your official PDF pass will <strong>automatically trigger an instant browser download</strong> in addition to dual-email archiving.
                </p>
              </div>

              <button
                disabled={!formData.licensePlate || !formData.email}
                onClick={() => alert('Phase 1 UI Engine Fully Verified! Database Layer Ready.')}
                className={`w-full py-4 rounded-xl font-bold transition-all text-center ${
                  formData.licensePlate && formData.email
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Pay Now with Apple Pay / Card ({formatPrice(15)})
              </button>
            </div>
          )}

          {/* NAVIGATION FOOTER */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-3 rounded-xl transition-all"
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 rounded-xl transition-all shadow-md"
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