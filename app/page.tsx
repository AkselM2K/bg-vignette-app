'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  POPULAR_LANGUAGES,
  SECONDARY_LANGUAGES,
  POPULAR_VEHICLE_DATABASE,
  VIGNETTE_PRICES_EUR,
  DICTIONARY,
  sanitizeLicensePlate,
  validateLicensePlateFormat,
} from '@/lib/data';

type VignetteDuration = '1d' | 'weekend' | '1w' | '1m' | '3m' | '1y';

const STORAGE_KEY = 'bg_vignette_draft_state_v4';

export default function VignetteExpressWizard() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');
  const [currencyCode, setCurrencyCode] = useState<string>('EUR');
  
  // Point 5: Leave vehicle make and model empty as presets
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [vehicleMtm, setVehicleMtm] = useState<string>('');
  
  // Trailer setup & Point 10: Trailer Country
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [trailerMtm, setTrailerMtm] = useState<string>('');
  const [trailerCountry, setTrailerCountry] = useState<string>('BG');

  // Step 2 & 7: Weekend option & Dates (Point 8)
  const [duration, setDuration] = useState<VignetteDuration>('1w');
  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w');
  const [activationDate, setActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [trailerActivationDate, setTrailerActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Step 3: Registration & Details
  const [regCountry, setRegCountry] = useState<string>('BG');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [plateError, setPlateError] = useState<string>('');
  const [trailerPlateError, setTrailerPlateError] = useState<string>('');
  
  const [email, setEmail] = useState<string>('');
  
  // Step 4 & Point 12, 13, 14, 15: Validity Check & Phone Verification
  const [validityCheck, setValidityCheck] = useState<boolean>(false);
  const [validityEmail, setValidityEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Current wizard step
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Popups & confirmation dialogs (Point 11)
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [confirmVehiclePlate, setConfirmVehiclePlate] = useState<boolean>(false);
  const [confirmTrailerPlate, setConfirmTrailerPlate] = useState<boolean>(false);

  // Focus references
  const vehiclePlateInputRef = useRef<HTMLInputElement>(null);
  const trailerPlateInputRef = useRef<HTMLInputElement>(null);

  // Point 4: Load and Save website state in LocalStorage (Memory fix)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedLanguage) setSelectedLanguage(data.selectedLanguage);
        if (data.currencyCode) setCurrencyCode(data.currencyCode);
        if (data.selectedMake) setSelectedMake(data.selectedMake);
        if (data.selectedModel) setSelectedModel(data.selectedModel);
        if (data.vehicleMtm) setVehicleMtm(data.vehicleMtm);
        if (data.hasTrailer !== undefined) setHasTrailer(data.hasTrailer);
        if (data.trailerMtm) setTrailerMtm(data.trailerMtm);
        if (data.trailerCountry) setTrailerCountry(data.trailerCountry);
        if (data.duration) setDuration(data.duration);
        if (data.trailerDuration) setTrailerDuration(data.trailerDuration);
        if (data.activationDate) setActivationDate(data.activationDate);
        if (data.trailerActivationDate) setTrailerActivationDate(data.trailerActivationDate);
        if (data.regCountry) setRegCountry(data.regCountry);
        if (data.licensePlate) setLicensePlate(data.licensePlate);
        if (data.trailerPlate) setTrailerPlate(data.trailerPlate);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.validityCheck !== undefined) setValidityCheck(data.validityCheck);
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
  }, []);

  useEffect(() => {
    const state = {
      selectedLanguage, currencyCode, selectedMake, selectedModel, vehicleMtm,
      hasTrailer, trailerMtm, trailerCountry, duration, trailerDuration,
      activationDate, trailerActivationDate, regCountry, licensePlate, trailerPlate,
      email, phone, validityCheck
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    selectedLanguage, currencyCode, selectedMake, selectedModel, vehicleMtm,
    hasTrailer, trailerMtm, trailerCountry, duration, trailerDuration,
    activationDate, trailerActivationDate, regCountry, licensePlate, trailerPlate,
    email, phone, validityCheck
  ]);

  // Point 9: Auto Scroll to top whenever step changes
  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Point 14: Auto Fill entire email string without truncation
  useEffect(() => {
    setValidityEmail(email);
  }, [email]);

  // Dates max 30 days logic (Point 8 & Point 7)
  const { minDateStr, maxDateStr, fridayOptions } = useMemo(() => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);

    const fridays: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      if (d.getDay() === 5) { // Friday
        fridays.push(d.toISOString().split('T')[0]);
      }
    }

    return {
      minDateStr: today.toISOString().split('T')[0],
      maxDateStr: maxDate.toISOString().split('T')[0],
      fridayOptions: fridays,
    };
  }, []);

  const currency = useMemo(() => {
    return WORLD_CURRENCIES.find((c) => c.code === currencyCode) || WORLD_CURRENCIES[0];
  }, [currencyCode]);

  // Weight Calculation Logic
  const vehicleMtmKg = parseInt(vehicleMtm, 10) || 0;
  const trailerMtmKg = hasTrailer ? (parseInt(trailerMtm, 10) || 0) : 0;
  const totalCombinedWeightKg = vehicleMtmKg + trailerMtmKg;
  const requiresTrailerVignette = hasTrailer && totalCombinedWeightKg > 3500;

  // Pricing calculation (Point 6 & Point 13)
  const mainVignetteEur = VIGNETTE_PRICES_EUR[duration] || 14.99;
  const secondaryTrailerEur = requiresTrailerVignette ? (VIGNETTE_PRICES_EUR[trailerDuration] || 14.99) : 0;
  const validityFeeEur = validityCheck ? 0.99 : 0; // Point 13: Clean 0.99
  const totalEur = mainVignetteEur + secondaryTrailerEur + validityFeeEur;

  // Dictionary strings
  const t = DICTIONARY[selectedLanguage] || DICTIONARY['EN'];

  const uniqueMakes = useMemo(() => {
    return Array.from(new Set(POPULAR_VEHICLE_DATABASE.map((v) => v.make))).sort();
  }, []);

  const availableModels = useMemo(() => {
    return POPULAR_VEHICLE_DATABASE.filter((v) => v.make === selectedMake);
  }, [selectedMake]);

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
  };

  // Point 15: Phone Validation
  const handlePhoneChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, ''); // Digits only
    setPhone(onlyNums);
    if (onlyNums && onlyNums.length < 5) {
      setPhoneError('Please check your phone number again as it might be incorrect.');
    } else {
      setPhoneError('');
    }
  };

  const handleStep1Next = () => {
    changeStep(2);
  };

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

    setConfirmVehiclePlate(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Alert Warning Popup */}
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">⚠️</div>
            <p className="text-sm text-slate-300">{popupMessage}</p>
            <button
              onClick={() => setPopupMessage(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Point 11: Vehicle Plate Confirmation Modal with Bolding */}
      {confirmVehiclePlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-white">
              Are you 100% sure your <span className="text-emerald-400 font-extrabold underline tracking-wide">VEHICLE</span> license plate is correct?
            </h3>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                {sanitizeLicensePlate(licensePlate)}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmVehiclePlate(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 hover:bg-slate-700 transition"
              >
                No, Fix It
              </button>
              <button
                onClick={() => {
                  setConfirmVehiclePlate(false);
                  if (hasTrailer && requiresTrailerVignette) setConfirmTrailerPlate(true);
                  else changeStep(4);
                }}
                className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point 11: Trailer Plate Confirmation Modal with Bolding */}
      {confirmTrailerPlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-white">
              Are you 100% sure your <span className="text-amber-400 font-extrabold underline tracking-wide">TRAILER</span> license plate is correct?
            </h3>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-2xl font-mono font-bold text-amber-400 tracking-wider">
                {sanitizeLicensePlate(trailerPlate)}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmTrailerPlate(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 hover:bg-slate-700 transition"
              >
                No, Fix It
              </button>
              <button
                onClick={() => {
                  setConfirmTrailerPlate(false);
                  changeStep(4);
                }}
                className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point 1: Compact Header for Mobile */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur-md z-30 py-2 sm:py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base sm:text-xl shadow-lg">
              BG
            </div>
            <div>
              <h1 className="text-xs sm:text-base font-extrabold text-white tracking-tight leading-tight">
                {t.headerTitle}
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-400 tracking-wide uppercase hidden sm:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Language & Currency Selectors */}
          <div className="flex items-center gap-2">
            {/* Point 3: Priority Languages on Top */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <optgroup label="Popular Languages">
                {POPULAR_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Languages">
                {SECONDARY_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </optgroup>
            </select>

            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500"
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
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Wizard Steps */}
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex justify-between items-center text-xs font-semibold">
          {[
            { num: 1, label: t.step1 },
            { num: 2, label: t.step2 },
            { num: 3, label: t.step3 },
            { num: 4, label: t.step4 },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                currentStep === s.num ? 'text-emerald-400' : currentStep > s.num ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold ${
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
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Vehicle Setup</h2>
              <p className="text-xs text-slate-400">Configure your vehicle parameters.</p>
            </div>

            {/* Point 5: Blank Presets Make & Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.vehicleMake}</label>
                <select
                  value={selectedMake}
                  onChange={(e) => handleMakeChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Make --</option>
                  {uniqueMakes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.vehicleModel}</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedMake}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="">-- Select Model --</option>
                  {availableModels.map((m) => (
                    <option key={m.model} value={m.model}>{m.model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.vehicleMtm}</label>
              <input
                type="number"
                value={vehicleMtm}
                onChange={(e) => setVehicleMtm(e.target.value)}
                placeholder="e.g. 1840"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <hr className="border-slate-800" />

            {/* Trailer Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{t.hasTrailer}</h3>
                <p className="text-xs text-slate-400">Toggle if you are towing a trailer.</p>
              </div>
              <button
                type="button"
                onClick={() => setHasTrailer(!hasTrailer)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 relative z-10 pointer-events-auto ${
                  hasTrailer ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${hasTrailer ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {hasTrailer && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer MTM (kg)</label>
                  <input
                    type="number"
                    value={trailerMtm}
                    onChange={(e) => setTrailerMtm(e.target.value)}
                    placeholder="e.g. 750"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Point 10: Trailer Registration Country Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t.trailerCountry}</label>
                  <select
                    value={trailerCountry}
                    onChange={(e) => setTrailerCountry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {WORLD_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Point 16: Click coordination button fix */}
            <button
              onClick={handleStep1Next}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition shadow-lg relative z-10 pointer-events-auto"
            >
              Next Step: Select Duration
            </button>
          </div>
        )}

        {/* STEP 2: DURATION & DATES */}
        {currentStep === 2 && (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Vignette Duration & Dates</h2>
              <p className="text-xs text-slate-400">Select duration and activation start date.</p>
            </div>

            {/* Point 6 & 7: Updated Prices & Weekend Option */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Vehicle Vignette Duration</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: '1d', name: '1 Day', eur: 9.99 },
                  { id: 'weekend', name: 'Weekend', eur: 11.99 },
                  { id: '1w', name: '1 Week', eur: 14.99 },
                  { id: '1m', name: '1 Month', eur: 24.99 },
                  { id: '3m', name: '3 Months', eur: 41.99 },
                  { id: '1y', name: '1 Year', eur: 69.99 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDuration(item.id as VignetteDuration)}
                    className={`p-3 rounded-2xl border text-center transition relative z-10 pointer-events-auto ${
                      duration === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">€{item.eur.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Point 7: Weekend explanation note */}
            {duration === 'weekend' && (
              <div className="p-3 bg-slate-800/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                ℹ️ <strong>Weekend Vignette Info:</strong> Valid strictly from Friday 12:00 PM until Sunday 23:59 PM.
              </div>
            )}

            {/* Point 8: Activation Date placed directly underneath duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Activation Start Date</label>
              {duration === 'weekend' ? (
                <select
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {fridayOptions.map((f) => (
                    <option key={f} value={f}>Friday, {f}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            {/* Trailer Duration & Activation Start Date (Point 8) */}
            {requiresTrailerVignette && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-amber-400">
                  ⚠️ Trailer Vignette Duration (Required for combined weight &gt; 3,500 kg)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: '1d', name: '1 Day', eur: 9.99 },
                    { id: 'weekend', name: 'Weekend', eur: 11.99 },
                    { id: '1w', name: '1 Week', eur: 14.99 },
                    { id: '1m', name: '1 Month', eur: 24.99 },
                    { id: '3m', name: '3 Months', eur: 41.99 },
                    { id: '1y', name: '1 Year', eur: 69.99 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTrailerDuration(item.id as VignetteDuration)}
                      className={`p-3 rounded-2xl border text-center transition relative z-10 pointer-events-auto ${
                        trailerDuration === item.id
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-amber-400 font-semibold mt-1">€{item.eur.toFixed(2)}</div>
                    </button>
                  ))}
                </div>

                {/* Point 8: Trailer Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer Activation Start Date</label>
                  <input
                    type="date"
                    min={minDateStr}
                    max={maxDateStr}
                    value={trailerActivationDate}
                    onChange={(e) => setTrailerActivationDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => changeStep(1)}
                className="py-3.5 px-6 bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:bg-slate-700 transition relative z-10 pointer-events-auto"
              >
                Back
              </button>
              <button
                onClick={() => changeStep(3)}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition shadow-lg relative z-10 pointer-events-auto"
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
              <p className="text-xs text-slate-400">Enter registration country and license plate details.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Registration Country</label>
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
                onClick={() => changeStep(2)}
                className="py-3.5 px-6 bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:bg-slate-700 transition relative z-10 pointer-events-auto"
              >
                Back
              </button>
              <button
                onClick={handleStep3Next}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition shadow-lg relative z-10 pointer-events-auto"
              >
                Next Step: Review & Pay
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CHECKOUT */}
        {currentStep === 4 && (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Review & Checkout</h2>
              <p className="text-xs text-slate-400">Finalize your order.</p>
            </div>

            {/* Point 12 & 13: Standard Trailer Toggle Style & Clean €0.99 Price Display */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Validity Check €0.99</h3>
                  <p className="text-xs text-slate-400">
                    Personal verification of your vignette validity directly in system registers.
                  </p>
                </div>
                {/* Standardized Toggle Match */}
                <button
                  type="button"
                  onClick={() => setValidityCheck(!validityCheck)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative z-10 pointer-events-auto ${
                    validityCheck ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${validityCheck ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Point 14 & 15: Mandatory Phone Number & Numbers-Only Restriction with Length Check */}
              {validityCheck && (
                <div className="space-y-3 pt-3 border-t border-slate-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number (Mandatory for Validity Check) *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="e.g. 00359881234567"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    {phoneError && <p className="text-xs text-rose-400 mt-1">{phoneError}</p>}
                  </div>

                  {/* Point 14: Prefilled full email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirmation Email *
                    </label>
                    <input
                      type="email"
                      value={validityEmail}
                      onChange={(e) => setValidityEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400">Total Payable Amount</span>
                <div className="text-2xl font-black text-emerald-400">
                  €{totalEur.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => changeStep(3)}
                className="py-3.5 px-6 bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:bg-slate-700 transition relative z-10 pointer-events-auto"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (validityCheck && (!phone || phone.length < 5)) {
                    alert("Please check your phone number again as it might be incorrect.");
                    return;
                  }
                  alert('Vignette order placed successfully!');
                }}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl transition shadow-xl relative z-10 pointer-events-auto"
              >
                Buy Vignette Now (€{totalEur.toFixed(2)})
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}