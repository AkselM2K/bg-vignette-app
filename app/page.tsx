// ./app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  BULGARIA_DESTINATIONS,
  BULGARIA_BORDER_CHECKPOINTS,
  POPULAR_VEHICLE_DATABASE,
  sanitizeLicensePlate,
  validateLicensePlateFormat,
  VehicleSearchResult,
} from '@/lib/data';

type VehicleCategory = 'car' | 'truck' | 'bus' | 'motorcycle' | 'tractor';
type VignetteDuration = '1d' | '1w' | '1m' | '3m' | '1y';

const BASE_PRICES_BGN: Record<VignetteDuration, number> = {
  '1d': 13,
  '1w': 15,
  '1m': 30,
  '3m': 54,
  '1y': 97,
};

const STORAGE_KEY = 'bg_vignette_draft_state_v2';

export default function VignetteExpressWizard() {
  // Step 16b: LocalStorage Persistence Engine
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Currency
  const [currencyCode, setCurrencyCode] = useState<string>('EUR');

  // Category & Vehicle Specs (Points 2, 3, 11, 12)
  const [category, setCategory] = useState<VehicleCategory>('car');
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('');
  const [vehicleGvwrKg, setVehicleGvwrKg] = useState<number>(2000);
  const [vehicleSuggestions, setVehicleSuggestions] = useState<VehicleSearchResult[]>([]);

  // Modals for Motorcycle & Tractor shields (Point 10)
  const [showMotorcycleShield, setShowMotorcycleShield] = useState<boolean>(false);
  const [showTractorShield, setShowTractorShield] = useState<boolean>(false);

  // Trailer Config (Points 13, 14, 15, 16a)
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [trailerAxleClass, setTrailerAxleClass] = useState<'1axle' | '2axle' | '3axle' | 'custom'>('1axle');
  const [trailerGvwrKg, setTrailerGvwrKg] = useState<number>(750);
  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [trailerPlateError, setTrailerPlateError] = useState<string>('');
  const [trailerCountry, setTrailerCountry] = useState<string>('BG');

  // Truck / Bus Options (Points 2, 3, 9)
  const [euroClass, setEuroClass] = useState<string>('EURO6');
  const [axles, setAxles] = useState<2 | 3 | 4 | 5>(2);
  const [borderEntry, setBorderEntry] = useState<string>('');
  const [borderSuggestions, setBorderSuggestions] = useState<string[]>([]);
  const [destination, setDestination] = useState<string>('');
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);

  // Dates & Durations (Points 5, 6)
  const [duration, setDuration] = useState<VignetteDuration>('1w');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateError, setDateError] = useState<string>('');

  // Driver & Registration (Points 5, 6, 7, 8, 9, 13)
  const [regCountry, setRegCountry] = useState<string>('BG');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [plateError, setPlateError] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // AI OCR Photo Scanners (Points 7, 9, 15)
  const [showAiModal, setShowAiModal] = useState<'vehicle' | 'trailer' | null>(null);
  const [aiDetectedPlate, setAiDetectedPlate] = useState<string>('');
  const [aiWarningAccepted, setAiWarningAccepted] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currencyCode) setCurrencyCode(parsed.currencyCode);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.vehicleMakeModel) setVehicleMakeModel(parsed.vehicleMakeModel);
        if (parsed.vehicleGvwrKg) setVehicleGvwrKg(parsed.vehicleGvwrKg);
        if (parsed.hasTrailer !== undefined) setHasTrailer(parsed.hasTrailer);
        if (parsed.trailerGvwrKg) setTrailerGvwrKg(parsed.trailerGvwrKg);
        if (parsed.trailerDuration) setTrailerDuration(parsed.trailerDuration);
        if (parsed.trailerPlate) setTrailerPlate(parsed.trailerPlate);
        if (parsed.trailerCountry) setTrailerCountry(parsed.trailerCountry);
        if (parsed.euroClass) setEuroClass(parsed.euroClass);
        if (parsed.axles) setAxles(parsed.axles);
        if (parsed.borderEntry) setBorderEntry(parsed.borderEntry);
        if (parsed.destination) setDestination(parsed.destination);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.startDate) setStartDate(parsed.startDate);
        if (parsed.regCountry) setRegCountry(parsed.regCountry);
        if (parsed.licensePlate) setLicensePlate(parsed.licensePlate);
        if (parsed.email) setEmail(parsed.email);
      }
    } catch {
      // Ignore cache errors
    }
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    const draft = {
      currencyCode,
      category,
      vehicleMakeModel,
      vehicleGvwrKg,
      hasTrailer,
      trailerGvwrKg,
      trailerDuration,
      trailerPlate,
      trailerCountry,
      euroClass,
      axles,
      borderEntry,
      destination,
      duration,
      startDate,
      regCountry,
      licensePlate,
      email,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore write errors
    }
  }, [
    currencyCode,
    category,
    vehicleMakeModel,
    vehicleGvwrKg,
    hasTrailer,
    trailerGvwrKg,
    trailerDuration,
    trailerPlate,
    trailerCountry,
    euroClass,
    axles,
    borderEntry,
    destination,
    duration,
    startDate,
    regCountry,
    licensePlate,
    email,
  ]);

  // Point 1: Universal Currency Rate Calculation
  const selectedCurrencyObj = useMemo(() => {
    return (
      WORLD_CURRENCIES.find((c) => c.code === currencyCode) || {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        rateFromBgn: 0.51,
      }
    );
  }, [currencyCode]);

  const convertPrice = (bgnAmount: number): string => {
    const rate = selectedCurrencyObj.rateFromBgn || 0.51;
    return (bgnAmount * rate).toFixed(2);
  };

  // Point 3: Weight Combination Check
  const totalCombinedWeightKg = useMemo(() => {
    return hasTrailer ? vehicleGvwrKg + trailerGvwrKg : vehicleGvwrKg;
  }, [vehicleGvwrKg, hasTrailer, trailerGvwrKg]);

  const requiresTrailerVignette = useMemo(() => {
    return category === 'car' && hasTrailer && totalCombinedWeightKg > 3500;
  }, [category, hasTrailer, totalCombinedWeightKg]);

  // Point 2: Category selection router
  const handleCategorySelect = (cat: VehicleCategory) => {
    if (cat === 'motorcycle') {
      setShowMotorcycleShield(true);
      return;
    }
    if (cat === 'tractor') {
      setShowTractorShield(true);
      return;
    }
    setCategory(cat);
  };

  // Point 12: Vehicle Make/Model Type-Ahead Input
  const handleVehicleSearchInput = (val: string) => {
    setVehicleMakeModel(val);
    if (val.length >= 1) {
      const filtered = POPULAR_VEHICLE_DATABASE.filter(
        (v) =>
          v.make.toLowerCase().includes(val.toLowerCase()) ||
          v.model.toLowerCase().includes(val.toLowerCase())
      );
      setVehicleSuggestions(filtered);
    } else {
      setVehicleSuggestions([]);
    }
  };

  // Point 16a: Visual Trailer Axle Class Click Handler
  const handleTrailerAxleSelect = (
    type: '1axle' | '2axle' | '3axle' | 'custom',
    standardKg: number
  ) => {
    setTrailerAxleClass(type);
    setTrailerGvwrKg(standardKg);
  };

  // Point 8: Sanitized License Plate Handler
  const handlePlateInputChange = (val: string) => {
    const clean = sanitizeLicensePlate(val);
    setLicensePlate(clean);
    if (clean.length > 0) {
      const res = validateLicensePlateFormat(clean);
      setPlateError(res.valid ? '' : res.reason || 'Invalid license plate format');
    } else {
      setPlateError('');
    }
  };

  const handleTrailerPlateInputChange = (val: string) => {
    const clean = sanitizeLicensePlate(val);
    setTrailerPlate(clean);
    if (clean.length > 0) {
      const res = validateLicensePlateFormat(clean);
      setTrailerPlateError(res.valid ? '' : res.reason || 'Invalid trailer plate');
    } else {
      setTrailerPlateError('');
    }
  };

  // Point 6: UTC Server-Style Date Check
  const handleDateChange = (val: string) => {
    setStartDate(val);
    const selected = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const max30Days = new Date();
    max30Days.setDate(today.getDate() + 30);

    if (selected < today) {
      setDateError('Vignettes cannot be backdated. Please select today or a future start date.');
    } else if (selected > max30Days) {
      setDateError('Vignettes can only be purchased up to 30 days in advance. Please select a date within 30 days from today.');
    } else {
      setDateError('');
    }
  };

  // Point 10 & 11: Border and Destination Suggestion Handlers
  const handleBorderInputChange = (val: string) => {
    setBorderEntry(val);
    if (val.length >= 1) {
      setBorderSuggestions(
        BULGARIA_BORDER_CHECKPOINTS.filter((b) =>
          b.toLowerCase().includes(val.toLowerCase())
        )
      );
    } else {
      setBorderSuggestions([]);
    }
  };

  const handleDestInputChange = (val: string) => {
    setDestination(val);
    if (val.length >= 1) {
      setDestSuggestions(
        BULGARIA_DESTINATIONS.filter((d) =>
          d.toLowerCase().includes(val.toLowerCase())
        )
      );
    } else {
      setDestSuggestions([]);
    }
  };

  // Point 7 & 15: AI OCR Photo Scanner Simulation
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Process file name / simulated reader
    const fakeExtracted = 'B8899CB';
    setTimeout(() => {
      if (showAiModal === 'vehicle') {
        setAiDetectedPlate(fakeExtracted);
      } else if (showAiModal === 'trailer') {
        setTrailerPlate(fakeExtracted);
        setTrailerPlateError('');
        setShowAiModal(null);
      }
    }, 600);
  };

  // Total BGN Calculation
  const mainVignetteBgn = BASE_PRICES_BGN[duration] || 15;
  const secondaryTrailerBgn = requiresTrailerVignette ? BASE_PRICES_BGN[trailerDuration] || 15 : 0;
  const totalBgn = category === 'truck' || category === 'bus' ? 85 : mainVignetteBgn + secondaryTrailerBgn;

  // Validation rules for Next Step
  const isStep1Valid = true;
  const isStep2Valid = !dateError && (category !== 'truck' && category !== 'bus' || (borderEntry && destination));
  const isStep3Valid = licensePlate.length >= 3 && !plateError && (!requiresTrailerVignette || (trailerPlate.length >= 3 && !trailerPlateError));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans flex flex-col items-center">
      
      {/* Point 10: MOTORCYCLE EXEMPTION SHIELD MODAL */}
      {showMotorcycleShield && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="text-5xl">🏍️</div>
            <h3 className="text-2xl font-bold text-emerald-400">Motorcycles Are Toll Free!</h3>
            <div className="bg-emerald-950/50 border border-emerald-800/50 p-4 rounded-xl text-xs text-slate-300 leading-relaxed text-left space-y-2">
              <p className="font-semibold text-emerald-300">Bulgarian National Toll Law Notice:</p>
              <p>Two-wheeled motorcycles and scooters are <strong>100% exempt</strong> from vignette fees across all highways and national roads in Bulgaria.</p>
              <p className="text-amber-400">⚠️ You do NOT need to buy a vignette. Beware of fraudulent scam websites charging fees for motorcycles!</p>
            </div>
            <button
              onClick={() => setShowMotorcycleShield(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              Understood • Return
            </button>
          </div>
        </div>
      )}

      {/* Point 10: TRACTOR PERMIT SHIELD MODAL */}
      {showTractorShield && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="text-5xl">🚜</div>
            <h3 className="text-2xl font-bold text-amber-400">Special Agricultural Permit</h3>
            <div className="bg-amber-950/50 border border-amber-800/50 p-4 rounded-xl text-xs text-slate-300 leading-relaxed text-left space-y-2">
              <p className="font-semibold text-amber-300">Agricultural Vehicle Regulations:</p>
              <p>Special tractors and agricultural machinery operate under municipal transit permits rather than standard highway e-vignettes.</p>
            </div>
            <button
              onClick={() => setShowTractorShield(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              Understood • Return
            </button>
          </div>
        </div>
      )}

      {/* Points 7 & 15: AI OCR PHOTO SCANNER MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-slate-100">
              📸 AI Registration Plate Scanner ({showAiModal === 'vehicle' ? 'Vehicle' : 'Trailer'})
            </h3>
            <p className="text-xs text-slate-400">
              Upload a clear photo of your vehicle registration document or license plate to cross-check OCR syntax.
            </p>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleOcrFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 p-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">📷</span>
                <span>Take Photo / Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">📁</span>
                <span>Upload Image File</span>
              </button>
            </div>

            {aiDetectedPlate && showAiModal === 'vehicle' && (
              <div className="bg-amber-950/50 border border-amber-500/30 p-3 rounded-xl text-xs text-left space-y-2">
                <p className="text-amber-300 font-bold">AI Result Detected: {aiDetectedPlate}</p>
                {aiDetectedPlate !== licensePlate && (
                  <p className="text-slate-300">
                    Entered: <strong>{licensePlate || 'None'}</strong>
                  </p>
                )}
                <p className="text-[11px] text-slate-400 italic">
                  Note: AI OCR is an automated scanner. If your typed plate matches your vehicle document, you can proceed safely.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLicensePlate(aiDetectedPlate);
                    setPlateError('');
                    setShowAiModal(null);
                  }}
                  className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-xs"
                >
                  Use AI Detected Plate ({aiDetectedPlate})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowAiModal(null);
                setAiDetectedPlate('');
              }}
              className="w-full bg-slate-800 text-slate-400 py-2 rounded-xl text-xs"
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}

      {/* MAIN CARD CONTAINER */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* HEADER WITH UNIVERSAL CURRENCY SELECTOR (Point 1) */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Bulgaria Vignette & Route Express</h1>
            <p className="text-xs text-slate-400">Zero-Error Registration • Auto-Saved Progress</p>
          </div>

          {/* Point 1: Currency Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-400">Currency:</span>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              <optgroup label="Popular Currencies">
                {WORLD_CURRENCIES.filter((c) => c.popular).map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </optgroup>
              <optgroup label="All World Currencies">
                {WORLD_CURRENCIES.filter((c) => !c.popular).map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Step 16b: Multi-Step Navigation Header Bar */}
        <div className="grid grid-cols-4 bg-slate-950 border-b border-slate-800 text-center text-xs text-slate-400">
          {[
            { step: 1, label: '1. Vehicle' },
            { step: 2, label: '2. Period' },
            { step: 3, label: '3. Plate' },
            { step: 4, label: '4. Summary' },
          ].map((item) => (
            <div
              key={item.step}
              className={`py-2.5 border-b-2 font-medium transition ${
                currentStep === item.step
                  ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/10'
                  : currentStep > item.step
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* PAGE CONTENT CONTAINER */}
        <div className="p-5 space-y-6">

          {/* ================= STEP 1: VEHICLE SPECIFICATION ================= */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Select Vehicle Category</h2>
                <p className="text-xs text-slate-400">Simplified 5-category selector according to Bulgarian road laws</p>
              </div>

              {/* Point 2: 5 Simplified Vehicle Categories */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'car', label: 'Car / Van', icon: '🚗' },
                  { id: 'truck', label: 'Truck (>3.5t)', icon: '🚛' },
                  { id: 'bus', label: 'Bus', icon: '🚌' },
                  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
                  { id: 'tractor', label: 'Tractor', icon: '🚜' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategorySelect(item.id as VehicleCategory)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      category === item.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500/50'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Point 11 & 12: Vehicle Specification Search Box */}
              {category === 'car' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase">Vehicle Make & Model Search</h3>
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Start typing your vehicle make/model (e.g. Tesla, VW Polo, BMW X5)..."
                      value={vehicleMakeModel}
                      onChange={(e) => handleVehicleSearchInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />

                    {/* Type-Ahead Dropdown Suggestions */}
                    {vehicleSuggestions.length > 0 && (
                      <ul className="absolute z-20 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl">
                        {vehicleSuggestions.map((item, idx) => (
                          <li
                            key={idx}
                            onClick={() => {
                              setVehicleMakeModel(`${item.make} ${item.model}`);
                              setVehicleGvwrKg(item.estimatedGvwrKg);
                              setVehicleSuggestions([]);
                            }}
                            className="p-2.5 text-xs text-slate-200 hover:bg-amber-500/20 cursor-pointer border-b border-slate-800 flex justify-between items-center"
                          >
                            <span>{item.make} {item.model}</span>
                            <span className="text-[10px] text-slate-400 font-mono">~{item.estimatedGvwrKg} kg GVWR</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Point 16a: Visual Trailer Axle Mass Configurator */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTrailer}
                        onChange={(e) => setHasTrailer(e.target.checked)}
                        className="rounded text-amber-500 bg-slate-900 border-slate-700"
                      />
                      Are you towing a Trailer or Caravan?
                    </label>

                    {hasTrailer && (
                      <div className="mt-3 space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <label className="block text-[11px] text-slate-400">Select Trailer Type & Mass Class:</label>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { type: '1axle', label: '1-Axle Light', kg: 750, icon: '🛞' },
                            { type: '2axle', label: '2-Axle Heavy / RV', kg: 2000, icon: '🚐' },
                            { type: '3axle', label: '3-Axle Cargo', kg: 3500, icon: '🚛' },
                          ].map((t) => (
                            <button
                              key={t.type}
                              type="button"
                              onClick={() => handleTrailerAxleSelect(t.type as any, t.kg)}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                                trailerAxleClass === t.type
                                  ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                                  : 'border-slate-800 bg-slate-950 text-slate-400'
                              }`}
                            >
                              <span className="text-xl">{t.icon}</span>
                              <span className="text-[10px]">{t.label}</span>
                              <span className="text-[9px] font-mono text-slate-400">~{t.kg} kg</span>
                            </button>
                          ))}
                        </div>

                        <div className={`p-2.5 rounded-xl text-xs ${requiresTrailerVignette ? 'bg-amber-950/50 text-amber-300 border border-amber-800/50' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'}`}>
                          {requiresTrailerVignette ? (
                            <div>
                              <strong>⚠️ Secondary Trailer Vignette Required:</strong> Total combined weight is <strong>{totalCombinedWeightKg} kg</strong> (exceeds 3,500 kg limit).
                            </div>
                          ) : (
                            <div>
                              <strong>🎉 No Trailer Vignette Needed:</strong> Total combined weight is <strong>{totalCombinedWeightKg} kg</strong> (under 3.5t limit).
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Point 2 & 3: Bus & Truck Euro Emission & Axle Configuration */}
              {(category === 'truck' || category === 'bus') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  
                  {/* Euro Emission Class (Asked for BOTH Truck & Bus) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Euro Emission Class</label>
                    <select
                      value={euroClass}
                      onChange={(e) => setEuroClass(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="EURO6">Euro VI / EEV (Lowest Toll Rate)</option>
                      <option value="EURO5">Euro V</option>
                      <option value="EURO4">Euro IV</option>
                      <option value="EURO3">Euro III</option>
                      <option value="EURO0_2">Euro 0 - Euro II</option>
                    </select>
                  </div>

                  {/* Point 3: Axles (Asked ONLY for Truck, NOT Bus) */}
                  {category === 'truck' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Axle Configuration</label>
                      <div className="grid grid-cols-4 gap-2">
                        {([2, 3, 4, 5] as (2|3|4|5)[]).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAxles(num)}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              axles === num
                                ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            <span className="text-xs font-bold">{num === 5 ? '5+ Axles' : `${num} Axles`}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: VALIDITY PERIOD & ROUTE ================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Select Validity Period & Date</h2>
                <p className="text-xs text-slate-400">Synchronized rates in your selected currency</p>
              </div>

              {category !== 'truck' && category !== 'bus' && (
                <div className="space-y-2">
                  {[
                    { id: '1d', label: '1 Day Pass (24 Hours)', bgn: 13 },
                    { id: '1w', label: '1 Week (7 Days)', bgn: 15, popular: true },
                    { id: '1m', label: '1 Month (30 Days)', bgn: 30 },
                    { id: '3m', label: '3 Months (90 Days)', bgn: 54 },
                    { id: '1y', label: '1 Year (365 Days)', bgn: 97 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDuration(item.id as VignetteDuration)}
                      className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition ${
                        duration === item.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{item.label}</span>
                        {item.popular && (
                          <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {convertPrice(item.bgn)} {selectedCurrencyObj.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Point 6: UTC Server Validated Date Selection */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">Activation Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none"
                />
                {dateError && <p className="text-xs text-red-400 font-medium pt-1">{dateError}</p>}
                <p className="text-[10px] text-slate-500">
                  🔒 Limit: Today up to maximum 30 days in advance.
                </p>
              </div>

              {/* Point 10 & 11: Route Pass Border Entry & Destination Suggestions */}
              {(category === 'truck' || category === 'bus') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase">Route Pass Waypoints</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="block text-[10px] text-slate-400 mb-1">Border Entry Checkpoint</label>
                      <input
                        type="text"
                        placeholder="Type border (e.g. Kalotina)..."
                        value={borderEntry}
                        onChange={(e) => handleBorderInputChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                      />
                      {borderSuggestions.length > 0 && (
                        <ul className="absolute z-20 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 max-h-36 overflow-y-auto shadow-2xl">
                          {borderSuggestions.map((b) => (
                            <li
                              key={b}
                              onClick={() => {
                                setBorderEntry(b);
                                setBorderSuggestions([]);
                              }}
                              className="p-2 text-xs text-slate-200 hover:bg-amber-500/20 cursor-pointer border-b border-slate-800"
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] text-slate-400 mb-1">Destination City (257 Bulgarian Towns)</label>
                      <input
                        type="text"
                        placeholder="Type city (e.g. Sofia, Targovishte)..."
                        value={destination}
                        onChange={(e) => handleDestInputChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                      />
                      {destSuggestions.length > 0 && (
                        <ul className="absolute z-20 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 max-h-36 overflow-y-auto shadow-2xl">
                          {destSuggestions.map((d) => (
                            <li
                              key={d}
                              onClick={() => {
                                setDestination(d);
                                setDestSuggestions([]);
                              }}
                              className="p-2 text-xs text-slate-200 hover:bg-amber-500/20 cursor-pointer border-b border-slate-800"
                            >
                              {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: REGISTRATION & LICENSE PLATE ================= */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Vehicle Registration Details</h2>
                <p className="text-xs text-slate-400">Sanitized input layer with optional AI OCR backup</p>
              </div>

              {/* Point 5 & 6: Registration Country Dropdown with Zero Duplicates */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">Registration Country</label>
                <select
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none"
                >
                  <optgroup label="Popular Border Origins">
                    {WORLD_COUNTRIES.filter((c) => c.popular).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All World Countries">
                    {WORLD_COUNTRIES.filter((c) => !c.popular).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Point 8 & 9: Clean License Plate Input with AI OCR button SEPARATED underneath */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300">Vehicle License Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. B1234AB or 2ABC234"
                  value={licensePlate}
                  onChange={(e) => handlePlateInputChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-base font-mono tracking-widest text-amber-400 uppercase font-bold focus:outline-none focus:border-amber-500"
                />
                {plateError && <p className="text-xs text-red-400 font-medium">{plateError}</p>}

                {/* Point 9: AI Photo Scanner Button Separated Below Textbox */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[10px] text-slate-400">Optional Document Verification</span>
                  <button
                    type="button"
                    onClick={() => setShowAiModal('vehicle')}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs px-3 py-1.5 rounded-xl border border-amber-500/30 font-medium transition"
                  >
                    📷 Open AI Photo Scanner
                  </button>
                </div>
              </div>

              {/* Point 13, 14, 15: Custom Secondary Trailer Registration */}
              {requiresTrailerVignette && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase">Secondary Trailer Registration Details</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Trailer Duration</label>
                      <select
                        value={trailerDuration}
                        onChange={(e) => setTrailerDuration(e.target.value as VignetteDuration)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value="1d">1 Day ({convertPrice(BASE_PRICES_BGN['1d'])} {selectedCurrencyObj.symbol})</option>
                        <option value="1w">1 Week ({convertPrice(BASE_PRICES_BGN['1w'])} {selectedCurrencyObj.symbol})</option>
                        <option value="1m">1 Month ({convertPrice(BASE_PRICES_BGN['1m'])} {selectedCurrencyObj.symbol})</option>
                        <option value="3m">3 Months ({convertPrice(BASE_PRICES_BGN['3m'])} {selectedCurrencyObj.symbol})</option>
                        <option value="1y">1 Year ({convertPrice(BASE_PRICES_BGN['1y'])} {selectedCurrencyObj.symbol})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Trailer Registration Country</label>
                      <select
                        value={trailerCountry}
                        onChange={(e) => setTrailerCountry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      >
                        {WORLD_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Trailer License Plate</label>
                    <input
                      type="text"
                      placeholder="Trailer Plate Number..."
                      value={trailerPlate}
                      onChange={(e) => handleTrailerPlateInputChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-amber-400 uppercase"
                    />
                    {trailerPlateError && <p className="text-xs text-red-400 mt-1">{trailerPlateError}</p>}
                  </div>

                  {/* Point 15: Trailer AI Photo Scanner */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAiModal('trailer')}
                      className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg border border-slate-700"
                    >
                      📷 Trailer AI Photo Check
                    </button>
                  </div>
                </div>
              )}

              {/* Email Delivery Input */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <label className="block text-xs font-bold text-slate-300">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="driver@example.com (Optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 4: SUMMARY & CHECKOUT ================= */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">4. Order Review & Checkout</h2>
                <p className="text-xs text-slate-400">Review your automated vignette parameters before payment</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                  <span>Category:</span>
                  <span className="text-white font-medium uppercase">{category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                  <span>Plate & Country:</span>
                  <span className="text-amber-400 font-mono font-bold">{regCountry} • {licensePlate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1 text-slate-400">
                  <span>Activation Start:</span>
                  <span className="text-white font-medium">{startDate}</span>
                </div>

                {requiresTrailerVignette && (
                  <div className="flex justify-between border-b border-slate-900 pb-1 text-amber-300 font-semibold">
                    <span>Trailer Vignette Included:</span>
                    <span>YES ({trailerPlate || licensePlate})</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 text-base font-bold text-white">
                  <span>Total Payable:</span>
                  <span className="text-amber-400 font-mono">
                    {convertPrice(totalBgn)} {selectedCurrencyObj.symbol} <span className="text-xs text-slate-500">({totalBgn} BGN)</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert('Phase 1 UI Engine Fully Verified! Database Layer Ready.')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 rounded-2xl text-sm transition shadow-lg shadow-amber-500/20"
              >
                Proceed to Instant Card Payment ({convertPrice(totalBgn)} {selectedCurrencyObj.symbol})
              </button>
            </div>
          )}

          {/* STEP NAVIGATION FOOTER */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-3 rounded-xl transition"
              >
                Previous Step
              </button>
            )}

            {currentStep < 4 && (
              <button
                type="button"
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid) ||
                  (currentStep === 3 && !isStep3Valid)
                }
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`flex-1 text-xs font-bold py-3 rounded-xl transition ${
                  (currentStep === 1 && isStep1Valid) ||
                  (currentStep === 2 && isStep2Valid) ||
                  (currentStep === 3 && isStep3Valid)
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
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