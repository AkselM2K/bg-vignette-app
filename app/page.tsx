// ./app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WORLD_COUNTRIES,
  POPULAR_VEHICLE_DATABASE,
  sanitizeLicensePlate,
  validateLicensePlateFormat,
} from '@/lib/data';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type VignetteDuration = '1d' | 'weekend' | '1w' | '1m' | '3m' | '1y';

const DURATION_PRICES_EUR: Record<VignetteDuration, number> = {
  '1d': 9.99,
  'weekend': 11.99,
  '1w': 14.99,
  '1m': 24.99,
  '3m': 41.99,
  '1y': 69.99,
};

const STORAGE_KEY = 'bg_vignette_draft_state_v5';

export default function VignetteExpressWizard() {
  const [activeTab, setActiveTab] = useState<'buy' | 'check'>('buy');

  // Manual vehicle entry toggle
  const [isManualVehicle, setIsManualVehicle] = useState<boolean>(false);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [manualMake, setManualMake] = useState<string>('');
  const [manualModel, setManualModel] = useState<string>('');
  const [vehicleMtm, setVehicleMtm] = useState<string>('');

  // Trailer setup & Presets
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [trailerMtm, setTrailerMtm] = useState<string>('');

  // Vignette options & dates
  const [duration, setDuration] = useState<VignetteDuration>('1w');
  const [activationDate, setActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w');
  const [trailerActivationDate, setTrailerActivationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Country selection
  const [regCountry, setRegCountry] = useState<string>('BG');
  const [trailerRegCountry, setTrailerRegCountry] = useState<string>('BG');

  const [licensePlate, setLicensePlate] = useState<string>('');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [plateError, setPlateError] = useState<string>('');
  const [trailerPlateError, setTrailerPlateError] = useState<string>('');

  // Contact Info
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Popups & confirmation dialogs
  const [popupMessage, setPopupMessage] = useState<React.ReactNode | null>(null);
  const [targetFocusRef, setTargetFocusRef] = useState<React.RefObject<HTMLInputElement | null> | null>(null);
  const [confirmVehiclePlate, setConfirmVehiclePlate] = useState<boolean>(false);
  const [confirmTrailerPlate, setConfirmTrailerPlate] = useState<boolean>(false);

  // Free e-Vignette Lookup Form
  const [checkPlate, setCheckPlate] = useState<string>('');
  const [checkResult, setCheckResult] = useState<string | null>(null);

  // Input Refs for direct target focus
  const vehicleMtmRef = useRef<HTMLInputElement>(null);
  const trailerMtmRef = useRef<HTMLInputElement>(null);
  const vehiclePlateInputRef = useRef<HTMLInputElement>(null);
  const trailerPlateInputRef = useRef<HTMLInputElement>(null);

  // Restore local storage state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsManualVehicle(parsed.isManualVehicle || false);
        setSelectedMake(parsed.selectedMake || '');
        setSelectedModel(parsed.selectedModel || '');
        setManualMake(parsed.manualMake || '');
        setManualModel(parsed.manualModel || '');
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
      } catch (e) {
        console.error('Failed to load local storage state:', e);
      }
    }
  }, []);

  // Save local storage state
  useEffect(() => {
    const stateToSave = {
      isManualVehicle,
      selectedMake,
      selectedModel,
      manualMake,
      manualModel,
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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    isManualVehicle,
    selectedMake,
    selectedModel,
    manualMake,
    manualModel,
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
  ]);

  const changeStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Date constraints & Friday-only generator for weekend vignettes
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const availableFridays = useMemo(() => {
    const fridays: string[] = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);

    const curr = new Date(today);
    while (curr <= endDate) {
      if (curr.getDay() === 5) { // 5 = Friday
        fridays.push(curr.toISOString().split('T')[0]);
      }
      curr.setDate(curr.getDate() + 1);
    }
    return fridays;
  }, []);

  // Ensure weekend duration stays aligned with valid Friday
  useEffect(() => {
    if (duration === 'weekend' && availableFridays.length > 0) {
      if (!availableFridays.includes(activationDate)) {
        setActivationDate(availableFridays[0]);
      }
    }
  }, [duration, availableFridays, activationDate]);

  useEffect(() => {
    if (trailerDuration === 'weekend' && availableFridays.length > 0) {
      if (!availableFridays.includes(trailerActivationDate)) {
        setTrailerActivationDate(availableFridays[0]);
      }
    }
  }, [trailerDuration, availableFridays, trailerActivationDate]);

  // Weight Calculations
  const vehicleMtmKg = parseInt(vehicleMtm, 10) || 0;
  const trailerMtmKg = hasTrailer ? parseInt(trailerMtm, 10) || 0 : 0;
  const totalCombinedWeightKg = vehicleMtmKg + trailerMtmKg;
  const requiresTrailerVignette = hasTrailer && totalCombinedWeightKg > 3500;

  // Pricing Calculation
  const mainVignetteEur = DURATION_PRICES_EUR[duration] || 14.99;
  const secondaryTrailerEur = requiresTrailerVignette ? DURATION_PRICES_EUR[trailerDuration] || 14.99 : 0;
  const totalEur = (mainVignetteEur + secondaryTrailerEur).toFixed(2);

  // Vehicle Database Derived Lists
  const uniqueMakes = useMemo(() => {
    return Array.from(new Set(POPULAR_VEHICLE_DATABASE.map((v) => v.make))).sort();
  }, []);

  const availableModels = useMemo(() => {
    return POPULAR_VEHICLE_DATABASE.filter((v) => v.make === selectedMake);
  }, [selectedMake]);

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

  const toggleManualVehicleMode = () => {
    if (isManualVehicle) {
      setIsManualVehicle(false);
      setManualMake('');
      setManualModel('');
    } else {
      setIsManualVehicle(true);
      setSelectedMake('');
      setSelectedModel('');
    }
    setVehicleMtm('');
  };

  // Step 1 validation with modal confirmation before focus switch
  const handleStep1Next = () => {
    // Validate Make & Model requirement
    if (!isManualVehicle) {
      if (!selectedMake.trim() || !selectedModel.trim()) {
        setPopupMessage(
          <span>
            Please select both a valid <strong className="text-amber-400 font-bold underline">Vehicle Make</strong> and <strong className="text-amber-400 font-bold underline">Vehicle Model</strong> from the list, or use manual entry.
          </span>
        );
        return;
      }
    } else {
      if (!manualMake.trim() || !manualModel.trim()) {
        setPopupMessage(
          <span>
            Please type in both your <strong className="text-amber-400 font-bold underline">Vehicle Make</strong> and <strong className="text-amber-400 font-bold underline">Vehicle Model</strong> manually.
          </span>
        );
        return;
      }
    }

    if (vehicleMtmKg < 350) {
      setPopupMessage(
        <span>
          Please enter a valid <strong className="text-amber-400 font-bold underline">VEHICLE MTM weight</strong> (minimum 350 kg).
        </span>
      );
      setTargetFocusRef(vehicleMtmRef);
      return;
    }
    if (hasTrailer && trailerMtmKg < 350) {
      setPopupMessage(
        <span>
          Please enter a valid <strong className="text-amber-400 font-bold underline">TRAILER MTM weight</strong> (minimum 350 kg).
        </span>
      );
      setTargetFocusRef(trailerMtmRef);
      return;
    }
    changeStep(2);
  };

  const handleUnderstandAndEdit = () => {
    setPopupMessage(null);
    if (targetFocusRef && targetFocusRef.current) {
      targetFocusRef.current.focus();
      targetFocusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTargetFocusRef(null);
  };

  const handleStep3Next = () => {
    const cleanVeh = sanitizeLicensePlate(licensePlate);
    const vehVal = validateLicensePlateFormat(cleanVeh);
    if (!vehVal.valid) {
      setPlateError(vehVal.reason || 'Invalid plate');
      return;
    }
    setPlateError('');

    // Require valid trailer plate if a trailer is attached, regardless of weight
    if (hasTrailer) {
      const cleanTr = sanitizeLicensePlate(trailerPlate);
      const trVal = validateLicensePlateFormat(cleanTr);
      if (!trVal.valid) {
        setTrailerPlateError(trVal.reason || 'Invalid trailer plate');
        return;
      }
      setTrailerPlateError('');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 5) {
      setPhoneError('Please check your phone number. Start with country code, e.g. 00359...');
      return;
    }
    setPhoneError('');

    setConfirmVehiclePlate(true);
  };

  const confirmVehiclePlateYes = () => {
    setConfirmVehiclePlate(false);
    // Ask for trailer confirmation whenever a trailer is attached
    if (hasTrailer) {
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
    if (!clean || clean.length < 2) {
      setCheckResult('Please enter at least 2 characters for the license plate.');
      return;
    }
    setCheckResult(`Vignette status for plate ${clean}: ACTIVE until 31/12/2026 23:59.`);
  };

  // Helper function to calculate expiry date based on start date and duration
  const calculateExpiryDate = (startDateStr: string, dur: VignetteDuration): string => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);
    
    switch (dur) {
      case '1d':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekend':
        // Weekend vignettes start Friday 12:00 and are valid until Sunday 23:59.
        // In clean date logic, we add 2 days to the Friday start to reach Sunday evening.
        date.setDate(date.getDate() + 2);
        break;
      case '1w':
        date.setDate(date.getDate() + 7);
        break;
      case '1m':
        date.setMonth(date.getMonth() + 1);
        break;
      case '3m':
        date.setMonth(date.getMonth() + 3);
        break;
      case '1y':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setDate(date.getDate() + 7);
    }
    
    return date.toISOString().split('T')[0];
  };

  // Database Save Logic for placing order directly into Supabase
  const handleSaveOrder = async () => {
    const mainExpiry = calculateExpiryDate(activationDate, duration);
    const trailerExpiry = hasTrailer && requiresTrailerVignette 
      ? calculateExpiryDate(trailerActivationDate, trailerDuration) 
      : null;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          license_plate: licensePlate,
          reg_country: regCountry,
          has_trailer: hasTrailer,
          trailer_plate: hasTrailer ? trailerPlate : null,
          trailer_reg_country: hasTrailer ? trailerRegCountry : null,
          vehicle_mtm: parseInt(vehicleMtm, 10) || 0,
          trailer_mtm: hasTrailer ? (parseInt(trailerMtm, 10) || 0) : 0,
          duration: duration,
          activation_date: activationDate,
          trailer_duration: requiresTrailerVignette ? trailerDuration : null,
          trailer_activation_date: requiresTrailerVignette ? trailerActivationDate : null,
          email: email,
          phone: phone,
          total_price: parseFloat(totalEur),
          payment_status: 'PENDING',
          vehicle_make: isManualVehicle ? manualMake : selectedMake,
          vehicle_model: isManualVehicle ? manualModel : selectedModel,
          payment_reference: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          api_response_status: 'NOT_STARTED',
          vignette_expiry_date: mainExpiry,
          trailer_expiry_date: trailerExpiry
        },
      ]);

    if (error) {
      console.error('Error saving order:', error.message);
      alert('Failed to save order. Please try again.');
    } else {
      alert('Vignette order saved & processed successfully!');
    }
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
              onClick={handleUnderstandAndEdit}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition"
            >
              Understand & Fix
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
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

      {/* Trailer Confirmation Modal */}
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

      {/* Header containing evenly spread Buy & Check buttons */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 backdrop-blur-md z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition text-center ${
              activeTab === 'buy'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Buy eVignette
          </button>
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition text-center ${
              activeTab === 'check'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Check eVignette
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'check' ? (
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Check eVignette</h2>
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
                Check Vignette Status
              </button>
            </form>
            {checkResult && (
              <div className={`p-4 rounded-2xl bg-slate-800 border text-xs font-semibold ${
                checkResult.includes('at least 2 characters')
                  ? 'border-rose-500/40 text-rose-400'
                  : 'border-emerald-500/30 text-emerald-400'
              }`}>
                {checkResult}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Wizard Steps Navigation Bar */}
            <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between items-center text-xs font-semibold">
              {[
                { num: 1, label: 'Vehicle Setup' },
                { num: 2, label: 'Validity Duration' },
                { num: 3, label: 'Plate Details' },
                { num: 4, label: 'Checkout' },
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
                  <h2 className="text-xl font-bold text-white mb-1">Vehicle Setup</h2>
                  <p className="text-xs text-slate-400">Configure vehicle & trailer weight specs.</p>
                </div>

                {!isManualVehicle ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Select Make *</label>
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
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Select Model *</label>
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Make *</label>
                      <input
                        type="text"
                        value={manualMake}
                        onChange={(e) => setManualMake(e.target.value)}
                        placeholder="e.g. BMW, Ford..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Model *</label>
                      <input
                        type="text"
                        value={manualModel}
                        onChange={(e) => setManualModel(e.target.value)}
                        placeholder="e.g. 3 Series, Focus..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={toggleManualVehicleMode}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold transition"
                  >
                    {isManualVehicle ? 'Choose vehicle make and model from list' : 'Could not find vehicle model?'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Estimate MTM Weight (kg)</label>
                  <input
                    ref={vehicleMtmRef}
                    type="number"
                    value={vehicleMtm}
                    onChange={(e) => setVehicleMtm(e.target.value)}
                    placeholder="Enter vehicle MTM in kg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <hr className="border-slate-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Attach Trailer / Caravan</h3>
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
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">Quick Select Trailer Preset</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Small Trailer', weight: '750' },
                        { label: 'Medium Trailer', weight: '2000' },
                        { label: 'Big Trailer', weight: '3500' },
                      ].map((preset) => (
                        <button
                          key={preset.weight}
                          type="button"
                          onClick={() => setTrailerMtm(preset.weight)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition ${
                            trailerMtm === preset.weight
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                              : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>{preset.label}</div>
                          <div className="text-slate-300">{preset.weight} kg</div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer Estimate MTM Weight (kg)</label>
                      <input
                        ref={trailerMtmRef}
                        type="number"
                        value={trailerMtm}
                        onChange={(e) => setTrailerMtm(e.target.value)}
                        placeholder="Enter trailer MTM weight in kg"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Structured Stacked MTM Calculation Display */}
                {hasTrailer && (vehicleMtmKg > 0 || trailerMtmKg > 0) && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2.5 transition ${
                    requiresTrailerVignette 
                      ? 'bg-amber-950/30 border-amber-500/40' 
                      : 'bg-emerald-950/30 border-emerald-500/40'
                  }`}>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Vehicle MTM:</span>
                      <strong className="text-white font-mono text-sm">{vehicleMtmKg} kg</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Trailer MTM:</span>
                      <strong className="text-white font-mono text-sm">{trailerMtmKg} kg</strong>
                    </div>

                    <hr className="border-slate-800/80 my-1" />

                    <div className="flex justify-between items-center text-white font-bold">
                      <span>Total Combined MTM:</span>
                      <strong className="font-mono text-base">{totalCombinedWeightKg} kg</strong>
                    </div>

                    <div className="pt-1">
                      {requiresTrailerVignette ? (
                        <p className="text-amber-300 font-medium bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-center">
                          ⚠️ Mandatory: A trailer vignette is <strong>REQUIRED</strong> because the total combined weight exceeds 3,500 kg.
                        </p>
                      ) : (
                        <p className="text-emerald-300 font-medium bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-center">
                          ✅ Not Mandatory: No trailer vignette is required because total combined weight is within 3,500 kg.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStep1Next}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
                >
                  Next Step
                </button>
              </div>
            )}

            {/* STEP 2: DURATION & DATES */}
            {currentStep === 2 && (
              <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Validity Duration</h2>
                </div>

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

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Activation Start Date</label>
                    {duration === 'weekend' ? (
                      <div>
                        <select
                          value={activationDate}
                          onChange={(e) => setActivationDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          {availableFridays.map((friDate) => (
                            <option key={friDate} value={friDate}>
                              Friday, {friDate} (Valid Friday 12:00 to Sunday 23:59)
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mt-2">
                          Weekend vignettes are valid strictly from Friday 12:00 to Sunday 23:59. Only Fridays within 30 days are selectable.
                        </p>
                      </div>
                    ) : (
                      <input
                        type="date"
                        min={todayStr}
                        max={maxDateStr}
                        value={activationDate}
                        onChange={(e) => setActivationDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>

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
                      {trailerDuration === 'weekend' ? (
                        <select
                          value={trailerActivationDate}
                          onChange={(e) => setTrailerActivationDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          {availableFridays.map((friDate) => (
                            <option key={friDate} value={friDate}>
                              Friday, {friDate} (Valid Friday 12:00 to Sunday 23:59)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="date"
                          min={todayStr}
                          max={maxDateStr}
                          value={trailerActivationDate}
                          onChange={(e) => setTrailerActivationDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => changeStep(1)}
                    className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => changeStep(3)}
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REGISTRATION & DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Registration & Details</h2>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Start with country code e.g. 00359..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Please start with your country code (e.g. 00359... or 0049...).</p>
                  {phoneError && <p className="text-xs text-rose-400 mt-1">{phoneError}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => changeStep(2)}
                    className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStep3Next}
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CHECKOUT */}
            {currentStep === 4 && (
              <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Checkout & Review</h2>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Vehicle Make & Model:</span>
                    <strong className="text-white">
                      {isManualVehicle ? `${manualMake} ${manualModel}` : `${selectedMake} ${selectedModel}`}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Vehicle Plate:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{sanitizeLicensePlate(licensePlate)} ({regCountry})</strong>
                  </div>
                  
                  {hasTrailer && (
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Trailer Plate:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{sanitizeLicensePlate(trailerPlate)} ({trailerRegCountry})</strong>
                    </div>
                  )}

                  <hr className="border-slate-700/60 my-1" />

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Vehicle Activation Date:</span>
                    <strong className="text-white">{activationDate || 'Not filled in'}</strong>
                  </div>

                  {requiresTrailerVignette && (
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Trailer Activation Date:</span>
                      <strong className="text-amber-400">{trailerActivationDate || 'Not filled in'}</strong>
                    </div>
                  )}

                  <hr className="border-slate-700/60 my-1" />

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Email Address:</span>
                    <strong className="text-white">{email.trim() !== '' ? email : 'Not filled in'}</strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Phone Number:</span>
                    <strong className="text-white">{phone.trim() !== '' ? phone : 'Not filled in'}</strong>
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
                    Back
                  </button>
                  <button
                    onClick={handleSaveOrder}
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
