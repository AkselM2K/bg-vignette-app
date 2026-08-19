// ./app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  SUPPORTED_LANGUAGES,
  POPULAR_VEHICLE_DATABASE,
  sanitizeLicensePlate,
  validateLicensePlateFormat,
  VehicleSearchResult,
} from '@/lib/data';

type VignetteDuration = '1d' | '1w' | '1m' | '3m' | '1y';
type TrailerRange = 'small' | 'regular' | 'big';

const BASE_PRICES_BGN: Record<VignetteDuration, number> = {
  '1d': 13,
  '1w': 15,
  '1m': 30,
  '3m': 54,
  '1y': 97,
};

const STORAGE_KEY = 'bg_vignette_draft_state_v3';

export default function VignetteExpressWizard() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');
  const [currencyCode, setCurrencyCode] = useState<string>('EUR');
  
  // Step 1: Vehicle setup
  const [selectedMake, setSelectedMake] = useState<string>('Volkswagen');
  const [selectedModel, setSelectedModel] = useState<string>('Golf');
  const [vehicleMtm, setVehicleMtm] = useState<string>('1840');
  const [makeSearch, setMakeSearch] = useState<string>('');
  
  // Trailer setup
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [trailerRange, setTrailerRange] = useState<TrailerRange>('small');
  const [trailerMtm, setTrailerMtm] = useState<string>('750');

  // Step 2: Duration
  const [duration, setDuration] = useState<VignetteDuration>('1w'); // Point 9: Default to 1 week
  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w'); // Point 12
  const [activationDate, setActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dateError, setDateError] = useState<string>('');

  // Step 3: Registration & Details
  const [regCountry, setRegCountry] = useState<string>('BG');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [plateError, setPlateError] = useState<string>('');
  const [trailerPlateError, setTrailerPlateError] = useState<string>('');
  
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [validityCheck, setValidityCheck] = useState<boolean>(false); // Point 18 & 19
  const [validityEmail, setValidityEmail] = useState<string>('');

  // Current wizard step (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Popups & confirmation dialogs
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [confirmVehiclePlate, setConfirmVehiclePlate] = useState<boolean>(false);
  const [confirmTrailerPlate, setConfirmTrailerPlate] = useState<boolean>(false);

  // Input Field References for automatic focus jumping (Point 17)
  const vehiclePlateInputRef = useRef<HTMLInputElement>(null);
  const trailerPlateInputRef = useRef<HTMLInputElement>(null);

  // Active currency details
  const currency = useMemo(() => {
    return WORLD_CURRENCIES.find((c) => c.code === currencyCode) || WORLD_CURRENCIES[0];
  }, [currencyCode]);

  // Sync validity email when email changes if not manually set
  useEffect(() => {
    if (!validityEmail) {
      setValidityEmail(email);
    }
  }, [email, validityEmail]);

  // Point 15: Sync trailer range automatically based on entered trailer weight
  const handleTrailerMtmChange = (val: string) => {
    setTrailerMtm(val);
    if (val === '') return;
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num > 2000) setTrailerRange('big');
      else if (num > 750) setTrailerRange('regular');
      else setTrailerRange('small');
    }
  };

  const selectTrailerRangeOption = (range: TrailerRange) => {
    setTrailerRange(range);
    if (range === 'small') setTrailerMtm('750');
    if (range === 'regular') setTrailerMtm('2000');
    if (range === 'big') setTrailerMtm('3500');
  };

  // MTM Weight Calculations & Trailer Requirement Logic (Point 12 & 16)
  const vehicleMtmKg = parseInt(vehicleMtm, 10) || 0;
  const trailerMtmKg = hasTrailer ? (parseInt(trailerMtm, 10) || 0) : 0;
  const totalCombinedWeightKg = vehicleMtmKg + trailerMtmKg;
  const requiresTrailerVignette = hasTrailer && totalCombinedWeightKg > 3500;

  // Total pricing calculation including validity check (€0.99 conversion)
  const mainVignetteBgn = BASE_PRICES_BGN[duration] || 15;
  const secondaryTrailerBgn = requiresTrailerVignette ? (BASE_PRICES_BGN[trailerDuration] || 15) : 0;
  const validityFeeBgn = validityCheck ? 1.94 : 0; // ~€0.99 in BGN
  const totalBgn = mainVignetteBgn + secondaryTrailerBgn + validityFeeBgn;
  const convertedTotal = (totalBgn * currency.rateFromBgn).toFixed(2);

  // Available vehicle models for selected brand
  const availableModels = useMemo(() => {
    return POPULAR_VEHICLE_DATABASE.filter((v) => v.make === selectedMake);
  }, [selectedMake]);

  // Filtered make options for dropdown
  const uniqueMakes = useMemo(() => {
    const list = Array.from(new Set(POPULAR_VEHICLE_DATABASE.map((v) => v.make))).sort();
    if (!makeSearch) return list;
    return list.filter((m) => m.toLowerCase().includes(makeSearch.toLowerCase()));
  }, [makeSearch]);

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    const first = POPULAR_VEHICLE_DATABASE.find((v) => v.make === make);
    if (first) {
      setSelectedModel(first.model);
      setVehicleMtm(first.estimatedGvwrKg.toString());
    }
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    const found = POPULAR_VEHICLE_DATABASE.find((v) => v.make === selectedMake && v.model === modelName);
    if (found) {
      setVehicleMtm(found.estimatedGvwrKg.toString());
    }
  };

  // Step 1 validation with warning popups (Point 13 & 15)
  const handleStep1Next = () => {
    const vKg = parseInt(vehicleMtm, 10) || 0;
    const tKg = hasTrailer ? (parseInt(trailerMtm, 10) || 0) : 0;

    if (vKg < 350 && hasTrailer && tKg < 350) {
      setPopupMessage("The amounts filled for both vehicle and trailer MTM are likely incorrect. Please double check before continuing.");
      return;
    }
    if (vKg < 350) {
      setPopupMessage("The vehicle MTM amount you filled in is likely incorrect. Please double check your input.");
      return;
    }
    if (hasTrailer && tKg < 350) {
      setPopupMessage("The trailer MTM amount you filled in is likely incorrect. Please double check your input.");
      return;
    }
    setCurrentStep(2);
  };

  // Point 17: Step 3 Plate Confirmation Dialog handling
  const handleStep3Next = () => {
    const cleanVeh = sanitizeLicensePlate(licensePlate);
    const vehVal = validateLicensePlateFormat(cleanVeh);
    if (!vehVal.valid) {
      setPlateError(vehVal.reason || 'Invalid plate');
      return;
    }
    setPlateError('');

    if (requiresTrailerVignette) {
      const cleanTr = sanitizeLicensePlate(trailerPlate);
      const trVal = validateLicensePlateFormat(cleanTr);
      if (!trVal.valid) {
        setTrailerPlateError(trVal.reason || 'Invalid trailer plate');
        return;
      }
      setTrailerPlateError('');
    }

    // Trigger sequential verification popups
    setConfirmVehiclePlate(true);
  };

  const confirmVehiclePlateYes = () => {
    setConfirmVehiclePlate(false);
    if (hasTrailer) {
      setConfirmTrailerPlate(true);
    } else {
      setCurrentStep(4);
    }
  };

  const confirmVehiclePlateNo = () => {
    setConfirmVehiclePlate(false);
    setTimeout(() => vehiclePlateInputRef.current?.focus(), 100);
  };

  const confirmTrailerPlateYes = () => {
    setConfirmTrailerPlate(false);
    setCurrentStep(4);
  };

  const confirmTrailerPlateNo = () => {
    setConfirmTrailerPlate(false);
    setTimeout(() => trailerPlateInputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Alert / Warning Popup (Point 13 & 15) */}
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">⚠️</div>
            <h3 className="text-lg font-bold text-white">Weight Verification Warning</h3>
            <p className="text-sm text-slate-300">{popupMessage}</p>
            <button
              onClick={() => setPopupMessage(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition"
            >
              I Will Check Again
            </button>
          </div>
        </div>
      )}

      {/* Point 17: Vehicle Plate Confirmation Modal */}
      {confirmVehiclePlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Are you 100% sure your vehicle license plate is correct?</h3>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                {sanitizeLicensePlate(licensePlate)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Note: The inputted text is auto-uppercased, and all dashes, dots, and spaces are automatically filtered.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmVehiclePlateNo}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition"
              >
                No, Let Me Fix It
              </button>
              <button
                onClick={confirmVehiclePlateYes}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point 17: Trailer Plate Confirmation Modal */}
      {confirmTrailerPlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Are you 100% sure your trailer license plate is correct?</h3>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                {sanitizeLicensePlate(trailerPlate)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Note: The inputted text is auto-uppercased, and all dashes, dots, and spaces are automatically filtered.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmTrailerPlateNo}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition"
              >
                No, Let Me Fix It
              </button>
              <button
                onClick={confirmTrailerPlateYes}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Section (Point 1 & Point 2) */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur-md z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              BG
            </div>
            <div>
              {/* Point 1 Header Title */}
              <h1 className="text-lg font-extrabold text-white tracking-tight">Bulgaria Vignette Online</h1>
              {/* Point 2 Subheading */}
              <p className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Official Instant Bulgarian Vignette</p>
            </div>
          </div>

          {/* Selectors for Language & Currency (Point 3, 4, 5) */}
          <div className="flex items-center gap-2">
            {/* Point 3 & 4: Working Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.code} - {lang.name}
                </option>
              ))}
            </select>

            {/* Point 5: Full 180 Currency Database */}
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {WORLD_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar Indicator */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold">
          {[
            { num: 1, label: 'Vehicle Setup' },
            { num: 2, label: 'Validity Duration' },
            { num: 3, label: 'Plate & Details' },
            { num: 4, label: 'Checkout' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                currentStep === s.num ? 'text-emerald-400' : currentStep > s.num ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === s.num
                    ? 'bg-emerald-500 text-slate-950'
                    : currentStep > s.num
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: VEHICLE SETUP */}
        {currentStep === 1 && (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            {/* Point 6: YOUR VEHICLE SETUP (Car Only) */}
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Vehicle Setup</h2>
              <p className="text-xs text-slate-400">Configure your car and optional trailer parameters for official calculation.</p>
            </div>

            {/* Point 7: Comprehensive Vehicle Database Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Make / Brand</label>
                <select
                  value={selectedMake}
                  onChange={(e) => handleMakeChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {uniqueMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Model Name</label>
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableModels.map((m) => (
                    <option key={m.model} value={m.model}>
                      {m.model} (Est. {m.estimatedGvwrKg} kg)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Point 13: Vehicle MTM Editable Field without forced 2000kg reset */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vehicle MTM Weight (kg)
              </label>
              <input
                type="number"
                value={vehicleMtm}
                onChange={(e) => setVehicleMtm(e.target.value)}
                placeholder="Enter weight in kg"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <hr className="border-slate-800" />

            {/* Trailer Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Attaching a Trailer?</h3>
                <p className="text-xs text-slate-400">Toggle on if you are towing a trailer, caravan, or boat carrier.</p>
              </div>
              <button
                type="button"
                onClick={() => setHasTrailer(!hasTrailer)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                  hasTrailer ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    hasTrailer ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Point 8, 14, 15: Trailer Setup Section */}
            {hasTrailer && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                {/* Point 14 Header Text */}
                <h3 className="text-sm font-bold text-white">Select Trailer MTM Range</h3>

                {/* Point 8: Clear Bold Text Options instead of trailer pictures */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: 'Small', weight: '<=750kg' },
                    { id: 'regular', label: 'Regular', weight: '<=2\'000kg' },
                    { id: 'big', label: 'Big', weight: '<=3\'500kg' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => selectTrailerRangeOption(opt.id as TrailerRange)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        trailerRange === opt.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-sm">{opt.label}</div>
                      <div className="text-xs font-semibold text-emerald-400 mt-0.5">{opt.weight}</div>
                    </button>
                  ))}
                </div>

                {/* Point 15: Editable Trailer MTM Input with Dynamic Auto-Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Manual Trailer MTM (kg)
                  </label>
                  <input
                    type="number"
                    value={trailerMtm}
                    onChange={(e) => handleTrailerMtmChange(e.target.value)}
                    placeholder="Enter trailer MTM weight in kg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Point 16: Clean & Spacious Combined Weight Calculation UI */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Vehicle MTM: <strong className="text-white">{vehicleMtmKg} kg</strong></span>
                {hasTrailer && <span>Trailer MTM: <strong className="text-white">{trailerMtmKg} kg</strong></span>}
                <span>Combined MTM: <strong className="text-emerald-400 text-sm">{totalCombinedWeightKg} kg</strong></span>
              </div>
              <div className="text-xs pt-1 border-t border-slate-700/50">
                {requiresTrailerVignette ? (
                  <p className="text-amber-400 font-semibold flex items-center gap-1.5">
                    ⚠️ Combined MTM exceeds 3,500 kg: A secondary trailer vignette is required by Bulgarian law.
                  </p>
                ) : (
                  <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    ✓ Total weight is under 3,500 kg limit. Standard single vignette covers your setup.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleStep1Next}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-emerald-500/20"
            >
              Next Step: Select Duration
            </button>
          </div>
        )}

        {/* STEP 2: VIGNETTE DURATION */}
        {currentStep === 2 && (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Vignette Validity & Duration</h2>
              <p className="text-xs text-slate-400">Choose your desired validity duration and activation start date.</p>
            </div>

            {/* Point 9: 1 Week default option selected */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Vehicle Vignette Duration</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: '1d', name: '1 Day', bgn: 13 },
                  { id: '1w', name: '1 Week', bgn: 15, popular: true },
                  { id: '1m', name: '1 Month', bgn: 30 },
                  { id: '3m', name: '3 Months', bgn: 54 },
                  { id: '1y', name: '1 Year', bgn: 97 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDuration(item.id as VignetteDuration)}
                    className={`p-3 rounded-2xl border text-center transition relative ${
                      duration === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                        Most Popular
                      </span>
                    )}
                    <div className="font-bold text-sm mt-1">{item.name}</div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      {(item.bgn * currency.rateFromBgn).toFixed(2)} {currency.symbol}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Point 12: Trailer Vignette Duration Selector restored if required */}
            {requiresTrailerVignette && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-amber-400">
                  ⚠️ Trailer Vignette Duration (Required for combined weight &gt; 3,500 kg)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: '1d', name: '1 Day', bgn: 13 },
                    { id: '1w', name: '1 Week', bgn: 15 },
                    { id: '1m', name: '1 Month', bgn: 30 },
                    { id: '3m', name: '3 Months', bgn: 54 },
                    { id: '1y', name: '1 Year', bgn: 97 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTrailerDuration(item.id as VignetteDuration)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        trailerDuration === item.id
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-amber-400 font-semibold mt-1">
                        {(item.bgn * currency.rateFromBgn).toFixed(2)} {currency.symbol}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activation Date Picker & Point 20: Weekend Helper Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Activation Start Date</label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              {/* Point 20 Note */}
              <p className="text-[11px] text-slate-400 mt-1.5">
                Weekend vignettes are strictly active from Friday 12:00 until Sunday 23:59. Vignettes can be activated up to 30 days in advance.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-emerald-500/20"
              >
                Next Step: Registration Details
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REGISTRATION DETAILS */}
        {currentStep === 3 && (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Registration & License Plate</h2>
              <p className="text-xs text-slate-400">Enter registration country and official vehicle license plate numbers.</p>
            </div>

            {/* Point 10: Complete Country List from Excel */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registration Country</label>
              <select
                value={regCountry}
                onChange={(e) => setRegCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {WORLD_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Point 11: License plate input without any AI options */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle License Plate</label>
              <input
                ref={vehiclePlateInputRef}
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(sanitizeLicensePlate(e.target.value))}
                placeholder="e.g. CB1234AB"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
              {plateError && <p className="text-xs text-rose-400 mt-1">{plateError}</p>}
            </div>

            {/* Point 11: Trailer plate input if trailer is attached */}
            {hasTrailer && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer License Plate</label>
                <input
                  ref={trailerPlateInputRef}
                  type="text"
                  value={trailerPlate}
                  onChange={(e) => setTrailerPlate(sanitizeLicensePlate(e.target.value))}
                  placeholder="e.g. CB5678EF"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                />
                {trailerPlateError && <p className="text-xs text-rose-400 mt-1">{trailerPlateError}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
              >
                Back
              </button>
              <button
                onClick={handleStep3Next}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-emerald-500/20"
              >
                Next Step: Review & Pay
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CHECKOUT & PAYMENT */}
        {currentStep === 4 && (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Review & Complete Purchase</h2>
              <p className="text-xs text-slate-400">Review your automated vignette details before final checkout.</p>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Vehicle:</span>
                <strong className="text-white">{selectedMake} {selectedModel} ({vehicleMtm} kg)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Registration Country:</span>
                <strong className="text-white">{regCountry}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Vehicle Plate:</span>
                <strong className="text-emerald-400 font-mono tracking-wider">{sanitizeLicensePlate(licensePlate)}</strong>
              </div>
              {hasTrailer && (
                <div className="flex justify-between text-slate-300">
                  <span>Trailer Plate:</span>
                  <strong className="text-emerald-400 font-mono tracking-wider">{sanitizeLicensePlate(trailerPlate)}</strong>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Activation Date:</span>
                <strong className="text-white">{activationDate}</strong>
              </div>
            </div>

            {/* Point 18 & 19: Personal Validity Verification Toggle and Phone/Email Inputs */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Personal Validity Check (+{(1.94 * currency.rateFromBgn).toFixed(2)} {currency.symbol} / €0.99)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Our team will personally verify your vignette validity directly with official system registries to ensure total peace of mind.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValidityCheck(!validityCheck)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                    validityCheck ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      validityCheck ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Point 19: Phone and Prefilled Email Input Fields */}
              {validityCheck && (
                <div className="space-y-3 pt-3 border-t border-slate-700/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Phone Number (Include Country Code, e.g. 00359... / 0032...) *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 00359 88 123 4567"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={validityEmail}
                      onChange={(e) => setValidityEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Our dedicated support team will personally contact you to confirm your vignette validity preferably by phone for instant assistance.
                  </p>
                </div>
              )}
            </div>

            {/* Total Price Display */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400">Total Payable Amount</span>
                <div className="text-2xl font-black text-emerald-400">
                  {convertedTotal} {currency.symbol}
                </div>
              </div>
              <span className="text-xs text-slate-400">{totalBgn.toFixed(2)} BGN</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(3)}
                className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
              >
                Back
              </button>
              <button
                onClick={() => alert('Vignette purchase initiated successfully!')}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl transition shadow-xl shadow-emerald-500/25"
              >
                Buy Vignette Now ({convertedTotal} {currency.symbol})
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}