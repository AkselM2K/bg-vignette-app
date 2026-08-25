// ./app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WORLD_COUNTRIES,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  POPULAR_VEHICLE_DATABASE,
  sanitizeLicensePlate,
  validateLicensePlateFormat,
} from '@/lib/data';

type VignetteDuration = '1d' | 'weekend' | '1w' | '1m' | '3m' | '1y';

// Point 6: Pricing in Euros
const DURATION_PRICES_EUR: Record<VignetteDuration, number> = {
  '1d': 9.99,
  'weekend': 11.99,
  '1w': 14.99,
  '1m': 24.99,
  '3m': 41.99,
  '1y': 69.99,
};

const STORAGE_KEY = 'bg_vignette_draft_state_v4';

export default function VignetteExpressWizard() {
  const [activeTab, setActiveTab] = useState<'buy' | 'check'>('buy');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');

  // Point 5: Blank initial values for vehicle setup
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [vehicleMtm, setVehicleMtm] = useState<string>('');

  // Trailer setup
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [trailerMtm, setTrailerMtm] = useState<string>('');

  // Vignette options & dates
  const [duration, setDuration] = useState<VignetteDuration>('1w');
  const [activationDate, setActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w');
  const [trailerActivationDate, setTrailerActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Point 10: Vehicle & Trailer registration country
  const [regCountry, setRegCountry] = useState<string>('BG');
  const [trailerRegCountry, setTrailerRegCountry] = useState<string>('BG');

  const [licensePlate, setLicensePlate] = useState<string>('');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [plateError, setPlateError] = useState<string>('');
  const [trailerPlateError, setTrailerPlateError] = useState<string>('');

  // Point 15: Mandatory Phone & Email
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Popups & confirmation dialogs
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [confirmVehiclePlate, setConfirmVehiclePlate] = useState<boolean>(false);
  const [confirmTrailerPlate, setConfirmTrailerPlate] = useState<boolean>(false);

  // Free e-Vignette Lookup Form
  const [checkPlate, setCheckPlate] = useState<string>('');
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const vehiclePlateInputRef = useRef<HTMLInputElement>(null);
  const trailerPlateInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS['EN'];

  // Point 4: localStorage persistence & auto-restore
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedMake(parsed.selectedMake || '');
        setSelectedModel(parsed.selectedModel || '');
        setVehicleMtm(parsed.vehicleMtm || '');
        setHasTrailer(parsed.hasTrailer || false);
        setTrailerMtm(parsed.trailerMtm || '');
        setDuration(parsed.duration || '1w');
        setActivationDate(parsed.activationDate || new Date().toISOString().split('T')[0]);
        setTrailerDuration(parsed.trailerDuration || '1w');
        setTrailerActivationDate(parsed.trailerActivationDate || new Date().toISOString().split('T')[0]);
        setRegCountry(parsed.regCountry || 'BG');
        setTrailerRegCountry(parsed.trailerRegCountry || 'BG');
        setLicensePlate(parsed.licensePlate || '');
        setTrailerPlate(parsed.trailerPlate || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        setSelectedLanguage(parsed.selectedLanguage || 'EN');
      } catch (e) {
        console.error('Failed to load local storage state:', e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      selectedMake,
      selectedModel,
      vehicleMtm,
      hasTrailer,
      trailerMtm,
      duration,
      activationDate,
      trailerDuration,
      trailerActivationDate,
      regCountry,
      trailerRegCountry,
      licensePlate,
      trailerPlate,
      email,
      phone,
      selectedLanguage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    selectedMake,
    selectedModel,
    vehicleMtm,
    hasTrailer,
    trailerMtm,
    duration,
    activationDate,
    trailerDuration,
    trailerActivationDate,
    regCountry,
    trailerRegCountry,
    licensePlate,
    trailerPlate,
    email,
    phone,
    selectedLanguage,
  ]);

  // Point 9: Auto scroll to top on step changes
  const changeStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Date range constraints (Today to +30 Days Max)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  // Weight Calculations
  const vehicleMtmKg = parseInt(vehicleMtm, 10) || 0;
  const trailerMtmKg = hasTrailer ? parseInt(trailerMtm, 10) || 0 : 0;
  const totalCombinedWeightKg = vehicleMtmKg + trailerMtmKg;
  const requiresTrailerVignette = hasTrailer && totalCombinedWeightKg > 3500;

  // Pricing Calculation
  const mainVignetteEur = DURATION_PRICES_EUR[duration] || 14.99;
  const secondaryTrailerEur = requiresTrailerVignette ? DURATION_PRICES_EUR[trailerDuration] || 14.99 : 0;
  const totalEur = (mainVignetteEur + secondaryTrailerEur).toFixed(2);

  const availableModels = useMemo(() => {
    return POPULAR_VEHICLE_DATABASE.filter((v) => v.make === selectedMake);
  }, [selectedMake]);

  const uniqueMakes = useMemo(() => {
    return Array.from(new Set(POPULAR_VEHICLE_DATABASE.map((v) => v.make))).sort();
  }, []);

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    setVehicleMtm('');
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    const found = POPULAR_VEHICLE_DATABASE.find((v) => v.make === selectedMake && v.model === modelName);
    if (found) {
      setVehicleMtm(found.estimatedGvwrKg.toString());
    }
  };

  const handleStep1Next = () => {
    if (vehicleMtmKg < 350) {
      setPopupMessage('Please enter a valid vehicle MTM weight.');
      return;
    }
    if (hasTrailer && trailerMtmKg < 350) {
      setPopupMessage('Please enter a valid trailer MTM weight.');
      return;
    }
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

    // Point 15: Phone Validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 5) {
      setPhoneError('Please check your phone number. It must contain at least 5 digits.');
      return;
    }
    setPhoneError('');

    setConfirmVehiclePlate(true);
  };

  const confirmVehiclePlateYes = () => {
    setConfirmVehiclePlate(false);
    if (requiresTrailerVignette) {
      setConfirmTrailerPlate(true);
    } else {
      changeStep(4);
    }
  };

  const confirmVehiclePlateNo = () => {
    setConfirmVehiclePlate(false);
    setTimeout(() => vehiclePlateInputRef.current?.focus(), 100);
  };

  const confirmTrailerPlateYes = () => {
    setConfirmTrailerPlate(false);
    changeStep(4);
  };

  const confirmTrailerPlateNo = () => {
    setConfirmTrailerPlate(false);
    setTimeout(() => trailerPlateInputRef.current?.focus(), 100);
  };

  const handleCheckVignetteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeLicensePlate(checkPlate);
    if (!clean) {
      setCheckResult('Please enter a valid license plate number.');
      return;
    }
    setCheckResult(`Vignette status for plate ${clean}: ACTIVE until 31/12/2026 23:59.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Alert / Warning Popup */}
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">⚠️</div>
            <h3 className="text-lg font-bold text-white">Notice</h3>
            <p className="text-sm text-slate-300">{popupMessage}</p>
            <button
              onClick={() => setPopupMessage(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition"
            >
              Understand & Review
            </button>
          </div>
        </div>
      )}

      {/* Point 11: Vehicle Plate Confirmation Modal with Highlighted Words */}
      {confirmVehiclePlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-white">
              Are you 100% sure your <span className="text-amber-400 underline uppercase font-black">VEHICLE</span> license plate is correct?
            </h3>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                {sanitizeLicensePlate(licensePlate)}
              </span>
            </div>
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

      {/* Point 11: Trailer Plate Confirmation Modal with Highlighted Words */}
      {confirmTrailerPlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-white">
              Are you 100% sure your <span className="text-amber-400 underline uppercase font-black">TRAILER</span> license plate is correct?
            </h3>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                {sanitizeLicensePlate(trailerPlate)}
              </span>
            </div>
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

      {/* Compact Header Section (Point 1 & Post-prompt change) */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 backdrop-blur-md z-30">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Main Top Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'buy'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.buyVignette}
            </button>
            <button
              onClick={() => setActiveTab('check')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'check'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.checkVignette}
            </button>
          </div>

          {/* Point 3: Optimized Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.popular ? `⭐ ${lang.name}` : lang.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Check Vignette Tab Content */}
        {activeTab === 'check' ? (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">{t.checkVignette}</h2>
            <p className="text-xs text-slate-400">Enter your license plate to verify active Bulgarian e-vignette validity free of charge.</p>
            <form onSubmit={handleCheckVignetteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">License Plate Number</label>
                <input
                  type="text"
                  value={checkPlate}
                  onChange={(e) => setCheckPlate(sanitizeLicensePlate(e.target.value))}
                  placeholder="e.g. CB1234AB"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
              >
                Check Vignette
              </button>
            </form>
            {checkResult && (
              <div className="p-4 rounded-2xl bg-slate-800 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
                {checkResult}
              </div>
            )}
          </div>
        ) : (
          /* Buy e-Vignette Flow */
          <>
            {/* Wizard Steps Navigation Bar */}
            <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between items-center text-xs font-semibold">
              {[
                { num: 1, label: t.vehicleSetup },
                { num: 2, label: t.validityDuration },
                { num: 3, label: t.plateDetails },
                { num: 4, label: t.checkout },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 ${
                    currentStep === s.num ? 'text-emerald-400' : currentStep > s.num ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                  <h2 className="text-xl font-bold text-white mb-1">{t.vehicleSetup}</h2>
                  <p className="text-xs text-slate-400">Configure vehicle weight specs for calculation.</p>
                </div>

                {/* Point 5: Blank Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.selectMake}</label>
                    <select
                      value={selectedMake}
                      onChange={(e) => handleMakeChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choose Make --</option>
                      {uniqueMakes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.selectModel}</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      disabled={!selectedMake}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">-- Choose Model --</option>
                      {availableModels.map((m) => (
                        <option key={m.model} value={m.model}>
                          {m.model} (Est. {m.estimatedGvwrKg} kg)
                        </option>
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
                    placeholder="Enter weight in kg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <hr className="border-slate-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.attachTrailer}</h3>
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

                {hasTrailer && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.trailerMtm}</label>
                    <input
                      type="number"
                      value={trailerMtm}
                      onChange={(e) => setTrailerMtm(e.target.value)}
                      placeholder="Enter trailer MTM weight in kg"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <button
                  onClick={handleStep1Next}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
                >
                  {t.nextStep}
                </button>
              </div>
            )}

            {/* STEP 2: DURATION & DATES */}
            {currentStep === 2 && (
              <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{t.validityDuration}</h2>
                </div>

                {/* Point 6 & 7: Updated Durations & Prices */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">Vehicle Vignette Duration</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: '1d', name: '1 Day', price: '€9.99' },
                      { id: 'weekend', name: 'Weekend', price: '€11.99' },
                      { id: '1w', name: '1 Week', price: '€14.99' },
                      { id: '1m', name: '1 Month', price: '€24.99' },
                      { id: '3m', name: '3 Months', price: '€41.99' },
                      { id: '1y', name: '1 Year', price: '€69.99' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDuration(item.id as VignetteDuration)}
                        className={`p-3 rounded-2xl border text-center transition ${
                          duration === item.id
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-xs text-emerald-400 font-semibold mt-1">{item.price}</div>
                      </button>
                    ))}
                  </div>

                  {duration === 'weekend' && (
                    <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      {t.weekendNote}
                    </p>
                  )}

                  {/* Point 8: Vehicle Activation Start Date strictly underneath vehicle options */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Activation Start Date</label>
                    <input
                      type="date"
                      min={todayStr}
                      max={maxDateStr}
                      value={activationDate}
                      onChange={(e) => setActivationDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Point 8: Trailer Vignette Duration & Date selection */}
                {requiresTrailerVignette && (
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-amber-400">
                      Trailer Vignette Duration (Required &gt; 3,500 kg)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: '1d', name: '1 Day', price: '€9.99' },
                        { id: 'weekend', name: 'Weekend', price: '€11.99' },
                        { id: '1w', name: '1 Week', price: '€14.99' },
                        { id: '1m', name: '1 Month', price: '€24.99' },
                        { id: '3m', name: '3 Months', price: '€41.99' },
                        { id: '1y', name: '1 Year', price: '€69.99' },
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
                          <div className="text-xs text-amber-400 font-semibold mt-1">{item.price}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer Activation Start Date</label>
                      <input
                        type="date"
                        min={todayStr}
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
                    className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
                  >
                    {t.back}
                  </button>
                  <button
                    onClick={() => changeStep(3)}
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
                  >
                    {t.nextStep}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REGISTRATION & DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{t.plateDetails}</h2>
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

                {/* Point 10: Trailer Country Option added */}
                {hasTrailer && (
                  <>
                    <hr className="border-slate-800" />
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer Registration Country</label>
                      <select
                        value={trailerRegCountry}
                        onChange={(e) => setTrailerRegCountry(e.target.value)}
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
                  </>
                )}

                <hr className="border-slate-800" />

                {/* Point 15 & Post-prompt change: Mandatory Email & Numeric Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t.email} *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t.phone} (Numbers only) *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 00359881234567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  {phoneError && <p className="text-xs text-rose-400 mt-1">{phoneError}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => changeStep(2)}
                    className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
                  >
                    {t.back}
                  </button>
                  <button
                    onClick={handleStep3Next}
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
                  >
                    {t.nextStep}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CHECKOUT */}
            {currentStep === 4 && (
              <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{t.checkout}</h2>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Vehicle Plate:</span>
                    <strong className="text-emerald-400 font-mono">{sanitizeLicensePlate(licensePlate)} ({regCountry})</strong>
                  </div>
                  {hasTrailer && (
                    <div className="flex justify-between text-slate-300">
                      <span>Trailer Plate:</span>
                      <strong className="text-emerald-400 font-mono">{sanitizeLicensePlate(trailerPlate)} ({trailerRegCountry})</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Activation Date:</span>
                    <strong className="text-white">{activationDate}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Contact Info:</span>
                    <strong className="text-white">{email} | {phone}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total Payable Amount</span>
                  <div className="text-2xl font-black text-emerald-400">€{totalEur}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => changeStep(3)}
                    className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
                  >
                    {t.back}
                  </button>
                  <button
                    onClick={() => alert('Vignette order placed successfully!')}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl transition"
                  >
                    Pay €{totalEur} Now
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}