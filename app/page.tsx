// ./app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  BULGARIA_DESTINATIONS,
  BULGARIA_BORDER_CHECKPOINTS,
  POPULAR_VEHICLE_DATABASE,
  BASE_PRICES_EUR,
  BASE_PRICES_BGN,
  sanitizeLicensePlate,
  validateLicensePlateFormat,
  VehicleSearchResult,
} from '@/lib/data';

type VehicleCategory = 'car' | 'truck' | 'bus' | 'motorcycle' | 'tractor';
type VignetteDuration = '1d' | 'weekend' | '1w' | '1m' | '3m' | '1y';

const STORAGE_KEY = 'bg_vignette_draft_state_v3';

export default function VignetteExpressWizard() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Currency & Language
  const [currencyCode, setCurrencyCode] = useState<string>('EUR');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');

  // Category & Vehicle Specs (Points 2, 3, 11, 12)
  const [category, setCategory] = useState<VehicleCategory>('car');
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('');
  const [vehicleGvwrKg, setVehicleGvwrKg] = useState<number>(1980);
  const [vehicleSuggestions, setVehicleSuggestions] = useState<VehicleSearchResult[]>([]);
  const [isUnlistedVehicle, setIsUnlistedVehicle] = useState<boolean>(false);

  // Modals for Motorcycle & Tractor shields
  const [showMotorcycleShield, setShowMotorcycleShield] = useState<boolean>(false);
  const [showTractorShield, setShowTractorShield] = useState<boolean>(false);

  // Trailer Config (Points 3, 4, 5, 14)
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [trailerAxleClass, setTrailerAxleClass] = useState<'1axle' | '2axle' | '3axle'>('1axle');
  const [trailerGvwrKg, setTrailerGvwrKg] = useState<number>(750);
  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [trailerPlateError, setTrailerPlateError] = useState<string>('');
  const [trailerCountry, setTrailerCountry] = useState<string>('BG');

  // Truck / Bus Options & Route Pass (Points 11, 12, 13)
  const [euroClass, setEuroClass] = useState<string>('EURO6');
  const [axles, setAxles] = useState<2 | 3 | 4 | 5>(2);
  const [borderEntry, setBorderEntry] = useState<string>('');
  const [borderSuggestions, setBorderSuggestions] = useState<string[]>([]);
  const [destination, setDestination] = useState<string>('');
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Dates & Durations (Points 6, 15)
  const [duration, setDuration] = useState<VignetteDuration>('1w');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateError, setDateError] = useState<string>('');

  // Driver & Registration
  const [regCountry, setRegCountry] = useState<string>('BG');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [plateError, setPlateError] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // AI OCR Scanner State & Dynamic Prompt (Point 14)
  const [showAiModal, setShowAiModal] = useState<'vehicle' | 'trailer' | null>(null);
  const [aiDetectedPlate, setAiDetectedPlate] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft from localStorage
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
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.startDate) setStartDate(parsed.startDate);
        if (parsed.regCountry) setRegCountry(parsed.regCountry);
        if (parsed.licensePlate) setLicensePlate(parsed.licensePlate);
        if (parsed.email) setEmail(parsed.email);
      }
    } catch {
      // Ignore cache load error
    }
  }, []);

  // Save draft to localStorage
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
      phoneNumber,
      duration,
      startDate,
      regCountry,
      licensePlate,
      email,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore write error
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
    phoneNumber,
    duration,
    startDate,
    regCountry,
    licensePlate,
    email,
  ]);

  // Currency Converter (Point 15)
  const selectedCurrencyObj = useMemo(() => {
    return (
      WORLD_CURRENCIES.find((c) => c.code === currencyCode) || {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        rateFromBgn: 0.5113,
      }
    );
  }, [currencyCode]);

  const convertPriceEur = (eurAmount: number): string => {
    if (currencyCode === 'EUR') return `€${eurAmount.toFixed(2)}`;
    if (currencyCode === 'BGN') return `${(eurAmount * 1.9558).toFixed(2)} лв`;
    const rate = selectedCurrencyObj.rateFromBgn || 0.5113;
    const bgnVal = eurAmount * 1.9558;
    return `${selectedCurrencyObj.symbol} ${(bgnVal * rate).toFixed(2)}`;
  };

  // Live MTM Weight Check (Point 5)
  const totalCombinedWeightKg = useMemo(() => {
    return hasTrailer ? vehicleGvwrKg + trailerGvwrKg : vehicleGvwrKg;
  }, [vehicleGvwrKg, hasTrailer, trailerGvwrKg]);

  const requiresTrailerVignette = useMemo(() => {
    return category === 'car' && hasTrailer && totalCombinedWeightKg > 3500;
  }, [category, hasTrailer, totalCombinedWeightKg]);

  // Category switch
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
    if (cat === 'truck' || cat === 'bus') {
      setDuration('1d'); // Heavy vehicles limited to 1 day route passes
    }
  };

  // Vehicle Search
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

  // Trailer Axle Select (Point 4)
  const handleTrailerAxleSelect = (type: '1axle' | '2axle' | '3axle', kg: number) => {
    setTrailerAxleClass(type);
    setTrailerGvwrKg(kg);
  };

  // License plate input sanitization
  const handlePlateInputChange = (val: string) => {
    const clean = sanitizeLicensePlate(val);
    setLicensePlate(clean);
    if (clean.length > 0) {
      const res = validateLicensePlateFormat(clean);
      setPlateError(res.valid ? '' : res.reason || 'Invalid format');
    } else {
      setPlateError('');
    }
  };

  const handleTrailerPlateInputChange = (val: string) => {
    const clean = sanitizeLicensePlate(val);
    setTrailerPlate(clean);
    if (clean.length > 0) {
      const res = validateLicensePlateFormat(clean);
      setTrailerPlateError(res.valid ? '' : res.reason || 'Invalid format');
    } else {
      setTrailerPlateError('');
    }
  };

  // Start Date Validation
  const handleDateChange = (val: string) => {
    setStartDate(val);
    const selected = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const max30 = new Date();
    max30.setDate(today.getDate() + 30);

    if (selected < today) {
      setDateError('Vignettes cannot be backdated. Please select today or a future date.');
    } else if (selected > max30) {
      setDateError('Vignettes can only be purchased up to 30 days in advance.');
    } else {
      setDateError('');
    }
  };

  // Border & Destination Search (Point 11, 13)
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

  // AI OCR Scanner Confirmation Flow (Point 14)
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeExtracted = 'B8899CB';
    setTimeout(() => {
      setAiDetectedPlate(fakeExtracted);
    }, 500);
  };

  const applyAiDetectedPlate = () => {
    if (showAiModal === 'vehicle') {
      setLicensePlate(aiDetectedPlate);
      setPlateError('');
    } else if (showAiModal === 'trailer') {
      setTrailerPlate(aiDetectedPlate);
      setTrailerPlateError('');
    }
    setShowAiModal(null);
    setAiDetectedPlate('');
  };

  // Prices Calculation
  const mainEur = BASE_PRICES_EUR[duration] || 14.99;
  const trailerEur = requiresTrailerVignette ? BASE_PRICES_EUR[trailerDuration] || 14.99 : 0;
  const totalEur = category === 'truck' || category === 'bus' ? 25.00 : mainEur + trailerEur;

  // Next Step Validation
  const isStep1Valid = true;
  const isStep2Valid = !dateError && ((category !== 'truck' && category !== 'bus') || (borderEntry && destination));
  const isStep3Valid =
    licensePlate.length >= 3 &&
    !plateError &&
    (!requiresTrailerVignette || (trailerPlate.length >= 3 && !trailerPlateError)) &&
    ((category !== 'truck' && category !== 'bus') || phoneNumber.length >= 5);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans flex flex-col items-center">
      
      {/* MOTORCYCLE & TRACTOR SHIELD MODALS */}
      {showMotorcycleShield && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="text-5xl">🏍️</div>
            <h3 className="text-2xl font-bold text-emerald-400">Motorcycles Are Toll Free!</h3>
            <p className="text-xs text-slate-300 leading-relaxed text-left">
              Two-wheeled motorcycles and scooters are <strong>100% exempt</strong> from vignette fees on all national roads in Bulgaria.
            </p>
            <button
              onClick={() => setShowMotorcycleShield(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              Understood • Return
            </button>
          </div>
        </div>
      )}

      {showTractorShield && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="text-5xl">🚜</div>
            <h3 className="text-2xl font-bold text-amber-400">Special Agricultural Permit</h3>
            <p className="text-xs text-slate-300 leading-relaxed text-left">
              Agricultural machinery operates under municipal transit permits rather than standard e-vignettes.
            </p>
            <button
              onClick={() => setShowTractorShield(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              Understood • Return
            </button>
          </div>
        </div>
      )}

      {/* AI SCANNER MODAL WITH USER CHOICE (Point 14) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-slate-100">
              📸 AI License Plate Scanner ({showAiModal === 'vehicle' ? 'Vehicle' : 'Trailer'})
            </h3>
            <p className="text-xs text-slate-400">
              Upload or snap a photo of the plate or registration document.
            </p>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleOcrFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 p-3 rounded-xl text-xs font-semibold"
            >
              📷 Take Photo or Select File
            </button>

            {aiDetectedPlate && (
              <div className="bg-amber-950/50 border border-amber-500/40 p-4 rounded-xl text-xs text-left space-y-3">
                <p className="text-amber-300 font-bold text-sm">AI Scanned Output: {aiDetectedPlate}</p>
                <p className="text-slate-300">
                  Your Current Manual Input: <strong>{(showAiModal === 'vehicle' ? licensePlate : trailerPlate) || 'None'}</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Would you like to replace your manual input with the AI suggested reading?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={applyAiDetectedPlate}
                    className="flex-1 bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-xs"
                  >
                    Yes, Replace Input
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiModal(null);
                      setAiDetectedPlate('');
                    }}
                    className="flex-1 bg-slate-800 text-slate-300 font-semibold py-2 rounded-lg text-xs"
                  >
                    No, Keep My Input
                  </button>
                </div>
              </div>
            )}

            {!aiDetectedPlate && (
              <button
                type="button"
                onClick={() => setShowAiModal(null)}
                className="w-full bg-slate-800 text-slate-400 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* WIZARD CONTAINER */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* HEADER: LANGUAGE & CURRENCY DROPDOWNS (LANGUAGE RIGHT ABOVE CURRENCY) */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">🚘 BG Toll & Vignette Express</h1>
            <p className="text-xs text-slate-400">Official Toll Portal • Dynamic Conversion</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
            {/* Language Selection (Endonyms) */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
              <span className="text-[11px] text-slate-400">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-400 focus:outline-none cursor-pointer"
              >
                <option value="EN" className="bg-slate-900">🇬🇧 English</option>
                <option value="BG" className="bg-slate-900">🇧🇬 български</option>
                <option value="DE" className="bg-slate-900">🇩🇪 Deutsch</option>
                <option value="FR" className="bg-slate-900">🇫🇷 Français</option>
                <option value="ES" className="bg-slate-900">🇪🇸 Español</option>
                <option value="RU" className="bg-slate-900">🇷🇺 Русский</option>
                <option value="TR" className="bg-slate-900">🇹🇷 Türkçe</option>
                <option value="RO" className="bg-slate-900">🇷🇴 Română</option>
                <option value="EL" className="bg-slate-900">🇬🇷 Ελληνικά</option>
                <option value="SR" className="bg-slate-900">🇷🇸 Српски</option>
              </select>
            </div>

            {/* Currency Selection */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
              <span className="text-[11px] text-slate-400">Currency:</span>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
              >
                <optgroup label="Popular">
                  {WORLD_CURRENCIES.filter((c) => c.popular).map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Global Currencies">
                  {WORLD_CURRENCIES.filter((c) => !c.popular).map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* STEP HEADER NAVIGATION */}
        <div className="grid grid-cols-4 bg-slate-950 border-b border-slate-800 text-center text-xs text-slate-400">
          {[
            { step: 1, label: '1. Vehicle' },
            { step: 2, label: '2. Validity' },
            { step: 3, label: '3. Details' },
            { step: 4, label: '4. Order' },
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

        {/* HEAVY TRUCK / BUS DISTINCTION BANNER (Point 12) */}
        {(category === 'truck' || category === 'bus') && (
          <div className="bg-amber-950/60 border-b border-amber-500/40 p-3.5 px-5 text-amber-200 text-xs flex gap-3 items-start">
            <span className="text-lg">🚛</span>
            <div>
              <p className="font-bold">Heavy Vehicle Toll System Notice</p>
              <p className="text-[11px] opacity-90">
                Trucks and buses are regulated under the <strong>BG Toll Route Pass System</strong> rather than regular vignettes. Toll passes are strictly valid for <strong>1 Day (24 Hours)</strong> on chosen route points.
              </p>
            </div>
          </div>
        )}

        {/* STEP CONTENT */}
        <div className="p-5 space-y-6">

          {/* STEP 1: CATEGORY & VEHICLE */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Select Vehicle Category</h2>
              </div>

              {/* Vehicle Category Selector */}
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

              {/* Car Vehicle Search & Unlisted Fallback */}
              {category === 'car' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase">Vehicle Model Lookup</h3>
                  
                  {!isUnlistedVehicle ? (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type make/model (e.g. Audi A4, BMW X5...)"
                        value={vehicleMakeModel}
                        onChange={(e) => handleVehicleSearchInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />

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
                              <span className="text-[10px] text-slate-400 font-mono">~{item.estimatedGvwrKg} kg</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter vehicle make and model manually..."
                        value={vehicleMakeModel}
                        onChange={(e) => setVehicleMakeModel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100"
                      />
                      {hasTrailer && (
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Vehicle MTM Weight (kg):</label>
                          <input
                            type="number"
                            value={vehicleGvwrKg}
                            onChange={(e) => setVehicleGvwrKg(parseInt(e.target.value) || 2000)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-amber-400"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsUnlistedVehicle(!isUnlistedVehicle)}
                    className="text-[11px] text-blue-400 underline hover:text-blue-300"
                  >
                    {isUnlistedVehicle ? '← Return to database search' : "Can't find your vehicle? Enter manually"}
                  </button>

                  {/* SLIDING TRAILER TOGGLE SWITCH (Point 3) */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Towing a Trailer / Caravan?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTrailer}
                        onChange={(e) => setHasTrailer(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* TRAILER AXLE DIAGRAMS & LIVE MTM (Points 4 & 5) */}
                  {hasTrailer && (
                    <div className="mt-3 space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold">Select Trailer Axle & MTM Rating:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { type: '1axle', label: '1 Axle', kg: 750, icon: '🛞' },
                          { type: '2axle', label: '2 Axles', kg: 2000, icon: '🚐' },
                          { type: '3axle', label: '3 Axles', kg: 3500, icon: '🚛' },
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
                            <span className="text-2xl">{t.icon}</span>
                            <span className="text-[11px] font-bold">{t.label}</span>
                            <span className="text-[9px] font-mono text-slate-400">MTM {t.kg} kg</span>
                          </button>
                        ))}
                      </div>

                      {/* LIVE MTM SUM (Point 5) */}
                      <div className={`p-3 rounded-xl text-xs ${requiresTrailerVignette ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'}`}>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>Car ({vehicleGvwrKg} kg) + Trailer ({trailerGvwrKg} kg)</span>
                          <span className="font-mono text-sm">{totalCombinedWeightKg} kg Total</span>
                        </div>
                        {requiresTrailerVignette ? (
                          <p className="text-[11px]">⚠️ Combined MTM exceeds 3,500 kg: Additional trailer vignette required.</p>
                        ) : (
                          <p className="text-[11px]">✅ Under 3,500 kg limit: Covered by standard car vignette.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: VALIDITY & ROUTE */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Validity Period & Pricing</h2>
              </div>

              {category !== 'truck' && category !== 'bus' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: '1d', label: '1 Day', eur: BASE_PRICES_EUR['1d'] },
                    { id: 'weekend', label: 'Weekend (2 Days)', eur: BASE_PRICES_EUR['weekend'], tag: 'Popular' },
                    { id: '1w', label: '1 Week', eur: BASE_PRICES_EUR['1w'] },
                    { id: '1m', label: '1 Month', eur: BASE_PRICES_EUR['1m'] },
                    { id: '3m', label: '3 Months', eur: BASE_PRICES_EUR['3m'] },
                    { id: '1y', label: '1 Year', eur: BASE_PRICES_EUR['1y'] },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDuration(item.id as VignetteDuration)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        duration === item.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full mb-2">
                        <span className="text-xs font-semibold">{item.label}</span>
                        {item.tag && (
                          <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono font-bold text-amber-400">
                        {convertPriceEur(item.eur)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-xs text-amber-300">
                  <p className="font-bold">1 Day Toll Pass Lock</p>
                  <p className="mt-1 opacity-90">Heavy trucks and buses are strictly restricted to 24-hour route passes (€25.00 base rate).</p>
                </div>
              )}

              {/* Start Date */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">Vignette Activation Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none"
                />
                {dateError && <p className="text-xs text-red-400 font-medium">{dateError}</p>}
              </div>

              {/* Route Waypoints for Heavy Vehicles (Point 11, 13) */}
              {(category === 'truck' || category === 'bus') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase">Route Pass Selection</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="block text-[10px] text-slate-400 mb-1">Border Entry Checkpoint</label>
                      <input
                        type="text"
                        placeholder="Click/type border (e.g. Kulata)..."
                        value={borderEntry}
                        onChange={(e) => handleBorderInputChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
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
                      <label className="block text-[10px] text-slate-400 mb-1">Destination Village / Town</label>
                      <input
                        type="text"
                        placeholder="Type settlement (e.g. Aheloy, Burgas)..."
                        value={destination}
                        onChange={(e) => handleDestInputChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
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

          {/* STEP 3: DETAILS & REGISTRATION */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Vehicle & Contact Information</h2>
              </div>

              {/* Registration Country */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">Registration Country</label>
                <select
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100"
                >
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle License Plate */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300">Vehicle License Plate</label>
                <input
                  type="text"
                  placeholder="e.g. CB1234XX"
                  value={licensePlate}
                  onChange={(e) => handlePlateInputChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-base font-mono uppercase font-bold text-amber-400"
                />
                {plateError && <p className="text-xs text-red-400 font-medium">{plateError}</p>}

                <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                  <span className="text-[10px] text-slate-400">Optional Plate OCR Verification</span>
                  <button
                    type="button"
                    onClick={() => setShowAiModal('vehicle')}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs px-3 py-1.5 rounded-xl border border-amber-500/30"
                  >
                    📷 AI Photo Check
                  </button>
                </div>
              </div>

              {/* Trailer License Plate Check (Point 14) */}
              {requiresTrailerVignette && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase">Trailer Registration</h3>
                  <input
                    type="text"
                    placeholder="Trailer Plate..."
                    value={trailerPlate}
                    onChange={(e) => handleTrailerPlateInputChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-amber-400 uppercase"
                  />
                  {trailerPlateError && <p className="text-xs text-red-400">{trailerPlateError}</p>}

                  <div className="flex justify-end pt-1">
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

              {/* MANDATORY PHONE NUMBER FOR HEAVY TRUCK / BUS (Point 13) */}
              {(category === 'truck' || category === 'bus') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/50 space-y-2">
                  <label className="block text-xs font-bold text-amber-300">
                    Phone Number <span className="text-red-400">*Required for Manual Toll Clearance</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+359 88 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                  <p className="text-[11px] text-amber-200/90 italic">
                    📞 Notice: We will contact you by phone as soon as possible after placing your order to send your manual pass confirmation and invoice.
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <label className="block text-xs font-bold text-slate-300">Email Address</label>
                <input
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100"
                />
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & PLACE ORDER */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">4. Order Summary</h2>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                  <span>Category:</span>
                  <span className="text-white font-bold uppercase">{category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                  <span>Plate & Country:</span>
                  <span className="text-amber-400 font-mono font-bold">{regCountry} • {licensePlate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                  <span>Activation Start:</span>
                  <span className="text-white font-medium">{startDate}</span>
                </div>

                {(category === 'truck' || category === 'bus') && (
                  <>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                      <span>Route Waypoints:</span>
                      <span className="text-amber-300 font-medium">{borderEntry} → {destination}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                      <span>Contact Phone:</span>
                      <span className="text-white font-mono">{phoneNumber}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-3 text-base font-bold text-white">
                  <span>Total Amount:</span>
                  <span className="text-amber-400 font-mono">
                    {convertPriceEur(totalEur)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON: "BUY" VS "PLACE ORDER" (Point 13) */}
              <button
                type="button"
                onClick={() => alert('Order submitted successfully!')}
                className={`w-full font-bold py-4 rounded-2xl text-sm transition shadow-lg ${
                  category === 'truck' || category === 'bus'
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                {category === 'truck' || category === 'bus' ? 'Place Order' : `Buy Vignette Now (${convertPriceEur(totalEur)})`}
              </button>
            </div>
          )}

          {/* FOOTER NAVIGATION */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-3 rounded-xl transition"
              >
                Previous
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
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
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