// ./app/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  AUTOMOTIVE_DATABASE,
  BULGARIA_BORDER_CHECKPOINTS,
  BULGARIA_DESTINATIONS,
  validateLicensePlateFormat,
} from '@/lib/data';

type VehicleCategory = 'car' | 'truck' | 'bus' | 'motorcycle' | 'tractor';
type VignetteDuration = '1d' | '1w' | '1m' | '3m' | '1y';

interface VignettePrices {
  [key: string]: number; // base price in BGN
}

const BASE_PRICES_BGN: Record<VignetteDuration, number> = {
  '1d': 13,
  '1w': 15,
  '1m': 30,
  '3m': 54,
  '1y': 97,
};

export default function VignetteBookingPage() {
  // State
  const [currency, setCurrency] = useState('EUR');
  const [category, setCategory] = useState<VehicleCategory>('car');
  
  // AutoDock style selections
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [vehicleGvwr, setVehicleGvwr] = useState(2000); // default kg

  // Trailer Config
  const [hasTrailer, setHasTrailer] = useState(false);
  const [trailerWeight, setTrailerWeight] = useState(1000); // kg
  const [customTrailerVignette, setCustomTrailerVignette] = useState(false);
  const [trailerDuration, setTrailerDuration] = useState<VignetteDuration>('1w');
  const [trailerPlate, setTrailerPlate] = useState('');
  const [trailerCountry, setTrailerCountry] = useState('BG');

  // Dates & Durations
  const [duration, setDuration] = useState<VignetteDuration>('1w');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateError, setDateError] = useState('');

  // Plate & Registration
  const [licensePlate, setLicensePlate] = useState('');
  const [plateError, setPlateError] = useState('');
  const [regCountry, setRegCountry] = useState('BG');
  const [email, setEmail] = useState('');

  // AI OCR state
  const [aiOcrActive, setAiOcrActive] = useState(false);
  const [aiDetectedPlate, setAiDetectedPlate] = useState('');
  const [aiWarningAccepted, setAiWarningAccepted] = useState(false);

  // Commercial Route Pass (Truck/Bus)
  const [axles, setAxles] = useState<2 | 3 | 4 | 5>(2);
  const [euroClass, setEuroClass] = useState('EURO6');
  const [borderEntry, setBorderEntry] = useState('');
  const [destination, setDestination] = useState('');
  const [borderSuggestions, setBorderSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);

  // Calculation Logic
  const currencyRate = useMemo(() => {
    switch (currency) {
      case 'EUR': return 0.51;
      case 'USD': return 0.55;
      case 'GBP': return 0.43;
      case 'TRY': return 18.5;
      case 'RON': return 2.55;
      default: return 1.0; // BGN
    }
  }, [currency]);

  const currencySymbol = useMemo(() => {
    return WORLD_CURRENCIES.find((c) => c.code === currency)?.symbol || currency;
  }, [currency]);

  // Combined Weight Calculation (Point 3)
  const totalWeight = useMemo(() => {
    return hasTrailer ? vehicleGvwr + trailerWeight : vehicleGvwr;
  }, [vehicleGvwr, hasTrailer, trailerWeight]);

  const needsTrailerVignette = useMemo(() => {
    return category === 'car' && hasTrailer && totalWeight > 3500;
  }, [category, hasTrailer, totalWeight]);

  // Handle Date Input Validation (Point 6)
  const handleDateChange = (val: string) => {
    setStartDate(val);
    const selected = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);

    if (selected < today) {
      setDateError("Vignettes cannot be backdated. Please select today's date or a future start date.");
    } else if (selected > maxDate) {
      setDateError("Vignettes can only be purchased up to 30 days in advance. Please select a date within the next 30 days.");
    } else {
      setDateError('');
    }
  };

  // Plate Validation on Change (Point 13)
  const handlePlateChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setLicensePlate(uppercaseVal);
    
    if (uppercaseVal.length > 0) {
      const res = validateLicensePlateFormat(uppercaseVal);
      if (!res.valid) {
        setPlateError(res.reason || 'Invalid license plate format');
      } else {
        setPlateError('');
      }
    } else {
      setPlateError('');
    }
  };

  // Border and Destination Auto-Complete (Point 10 & 11)
  const handleBorderInputChange = (val: string) => {
    setBorderEntry(val);
    if (val.length >= 1) {
      const filtered = BULGARIA_BORDER_CHECKPOINTS.filter((item) =>
        item.toLowerCase().includes(val.toLowerCase())
      );
      setBorderSuggestions(filtered);
    } else {
      setBorderSuggestions([]);
    }
  };

  const handleDestInputChange = (val: string) => {
    setDestination(val);
    if (val.length >= 1) {
      const filtered = BULGARIA_DESTINATIONS.filter((item) =>
        item.toLowerCase().includes(val.toLowerCase())
      );
      setDestSuggestions(filtered);
    } else {
      setDestSuggestions([]);
    }
  };

  // Simulate AI Photo OCR Verification (Point 8)
  const simulateAiOcrUpload = () => {
    setAiOcrActive(true);
    // Simulating scanning result returning a slightly different plate
    setTimeout(() => {
      setAiDetectedPlate('CB1234AB');
    }, 1000);
  };

  // Pricing calculations
  const primaryPriceBgn = BASE_PRICES_BGN[duration] || 15;
  const trailerPriceBgn = needsTrailerVignette ? BASE_PRICES_BGN[trailerDuration] || 15 : 0;
  const totalPriceBgn = (category === 'truck' || category === 'bus') ? 85 : (primaryPriceBgn + trailerPriceBgn);
  const finalPriceConverted = (totalPriceBgn * currencyRate).toFixed(2);

  const isFormValid =
    licensePlate.length >= 3 &&
    !plateError &&
    !dateError &&
    (category !== 'truck' && category !== 'bus' || (borderEntry && destination));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Currency Selector (Point 1) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-amber-400">BG Toll & Vignette Express</h1>
            <p className="text-sm text-slate-400">Official Toll Route & e-Vignette Registration Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-semibold text-sm rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
            >
              <optgroup label="Popular Currencies">
                {WORLD_CURRENCIES.filter((c) => c.popular).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All World Currencies">
                {WORLD_CURRENCIES.filter((c) => !c.popular).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* 2. Simplified Vehicle Categories (Point 2) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Select Vehicle Category:</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'car', label: 'Car / Van', icon: '🚗' },
              { id: 'truck', label: 'Truck (>3.5t)', icon: '🚛' },
              { id: 'bus', label: 'Bus', icon: '🚌' },
              { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
              { id: 'tractor', label: 'Tractor', icon: '🚜' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as VehicleCategory)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  category === cat.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. AutoDock Style Car Model Selector & Trailer Config (Point 3 & 4) */}
        {category === 'car' && (
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Vehicle Specification (AutoDock Selector)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Make / Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedModel('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                >
                  <option value="">Select Brand...</option>
                  {AUTOMOTIVE_DATABASE.map((item) => (
                    <option key={item.brand} value={item.brand}>{item.brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Model & Weight Specification</label>
                <select
                  value={selectedModel}
                  disabled={!selectedBrand}
                  onChange={(e) => {
                    const modelName = e.target.value;
                    setSelectedModel(modelName);
                    const brandObj = AUTOMOTIVE_DATABASE.find((b) => b.brand === selectedBrand);
                    const modelObj = brandObj?.models.find((m) => m.name === modelName);
                    if (modelObj) setVehicleGvwr(modelObj.gvwrKg);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 disabled:opacity-50"
                >
                  <option value="">Select Model...</option>
                  {AUTOMOTIVE_DATABASE.find((b) => b.brand === selectedBrand)?.models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} (GVWR: {m.gvwrKg} kg)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trailer Checkbox & Configuration */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTrailer}
                  onChange={(e) => setHasTrailer(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                />
                Towing a Trailer / Caravan?
              </label>

              {hasTrailer && (
                <div className="mt-3 bg-slate-950/60 p-3 rounded-lg space-y-3 border border-slate-800">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Trailer Maximum Mass (Category O1/O2):</span>
                    <input
                      type="number"
                      value={trailerWeight}
                      onChange={(e) => setTrailerWeight(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-24 text-right text-slate-200"
                    />
                  </div>

                  <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    Total Combination Weight: <strong>{totalWeight} kg</strong> ({totalWeight > 3500 ? 'Exceeds 3.5t limit - Secondary Trailer Vignette Required' : 'Under 3.5t limit - Standard Vignette Covers Both'})
                  </div>

                  {/* Secondary Trailer Vignette Parameters (Point 4) */}
                  {needsTrailerVignette && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <p className="text-xs font-semibold text-slate-300">Customize Secondary Trailer Vignette:</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400">Trailer Vignette Duration</label>
                          <select
                            value={trailerDuration}
                            onChange={(e) => setTrailerDuration(e.target.value as VignetteDuration)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-2 text-slate-200"
                          >
                            <option value="1d">1 Day ({BASE_PRICES_BGN['1d'] * currencyRate} {currencySymbol})</option>
                            <option value="1w">1 Week ({BASE_PRICES_BGN['1w'] * currencyRate} {currencySymbol})</option>
                            <option value="1m">1 Month ({BASE_PRICES_BGN['1m'] * currencyRate} {currencySymbol})</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400">Trailer Registration Number</label>
                          <input
                            type="text"
                            placeholder={licensePlate || "Trailer Plate"}
                            value={trailerPlate}
                            onChange={(e) => setTrailerPlate(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-2 text-slate-200 uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400">Trailer Country</label>
                          <select
                            value={trailerCountry}
                            onChange={(e) => setTrailerCountry(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-2 text-slate-200"
                          >
                            {WORLD_COUNTRIES.map((c) => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. Axle Visualizer for Truck / Bus (Point 9) */}
        {(category === 'truck' || category === 'bus') && (
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wide">
              Select Axle Configuration:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAxles(num as 2 | 3 | 4 | 5)}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-between gap-2 transition ${
                    axles === num
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {/* Custom SVG Axle Diagrams */}
                  <svg className="w-16 h-8 text-current stroke-current fill-none" viewBox="0 0 100 40">
                    <rect x="10" y="10" width="80" height="12" rx="2" strokeWidth="2" />
                    {/* Front Axle */}
                    <circle cx="25" cy="26" r="6" strokeWidth="3" />
                    {/* Rear Axles based on number */}
                    {num === 2 && <circle cx="75" cy="26" r="6" strokeWidth="3" />}
                    {num === 3 && (
                      <>
                        <circle cx="65" cy="26" r="6" strokeWidth="3" />
                        <circle cx="80" cy="26" r="6" strokeWidth="3" />
                      </>
                    )}
                    {num === 4 && (
                      <>
                        <circle cx="38" cy="26" r="6" strokeWidth="3" />
                        <circle cx="65" cy="26" r="6" strokeWidth="3" />
                        <circle cx="80" cy="26" r="6" strokeWidth="3" />
                      </>
                    )}
                    {num >= 5 && (
                      <>
                        <circle cx="38" cy="26" r="6" strokeWidth="3" />
                        <circle cx="58" cy="26" r="6" strokeWidth="3" />
                        <circle cx="72" cy="26" r="6" strokeWidth="3" />
                        <circle cx="85" cy="26" r="6" strokeWidth="3" />
                      </>
                    )}
                  </svg>
                  <span className="text-xs font-bold">{num === 5 ? '5+ Axles' : `${num} Axles`}</span>
                </button>
              ))}
            </div>

            {/* Border Entry & Destination Input with Suggestions (Point 10 & 11) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="relative">
                <label className="block text-xs text-slate-400 mb-1">Border Entry Point</label>
                <input
                  type="text"
                  placeholder="Type border name (e.g. Kalotina, Kapitan Andreevo)"
                  value={borderEntry}
                  onChange={(e) => handleBorderInputChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                />
                {borderSuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-slate-900 border border-slate-700 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-xl">
                    {borderSuggestions.map((item) => (
                      <li
                        key={item}
                        onClick={() => {
                          setBorderEntry(item);
                          setBorderSuggestions([]);
                        }}
                        className="p-2 text-xs text-slate-200 hover:bg-amber-500/20 cursor-pointer border-b border-slate-800 last:border-none"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs text-slate-400 mb-1">Destination City / Location</label>
                <input
                  type="text"
                  placeholder="Type destination (e.g. Sofia, Varna, Targovishte)"
                  value={destination}
                  onChange={(e) => handleDestInputChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                />
                {destSuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-slate-900 border border-slate-700 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-xl">
                    {destSuggestions.map((item) => (
                      <li
                        key={item}
                        onClick={() => {
                          setDestination(item);
                          setDestSuggestions([]);
                        }}
                        className="p-2 text-xs text-slate-200 hover:bg-amber-500/20 cursor-pointer border-b border-slate-800 last:border-none"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. Vignette Duration Picker with Pricing Fix (Point 5) */}
        {category !== 'truck' && category !== 'bus' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Select Vignette Validity Period:</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: '1d', label: '1 Day', bgn: 13 },
                { id: '1w', label: '1 Week', bgn: 15, popular: true },
                { id: '1m', label: '1 Month', bgn: 30 },
                { id: '3m', label: '3 Months', bgn: 54 },
                { id: '1y', label: '1 Year', bgn: 97 },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDuration(item.id as VignetteDuration)}
                  className={`relative p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    duration === item.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.popular && (
                    <span className="absolute -top-2.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-xs text-slate-400">
                    {(item.bgn * currencyRate).toFixed(2)} {currencySymbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Start Date with Boundary Check (Point 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Validity Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-amber-500"
            />
            {dateError && <p className="text-xs text-red-400 mt-1 font-medium">{dateError}</p>}
          </div>

          {/* 7. World Registration Countries (Point 7) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Registration Country</label>
            <select
              value={regCountry}
              onChange={(e) => setRegCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            >
              <optgroup label="Popular Transit Origins">
                {WORLD_COUNTRIES.filter((c) => c.popular).map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="All World Countries">
                {WORLD_COUNTRIES.filter((c) => !c.popular).map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* 8 & 13. License Plate & AI Verification (Point 8 & 13) */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vehicle License Plate (Registration Number)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. B1234AB or B-123-AB"
                value={licensePlate}
                onChange={(e) => handlePlateChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-lg font-mono tracking-wider text-amber-300 uppercase focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={simulateAiOcrUpload}
                className="absolute right-2 top-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-md border border-amber-500/30 transition"
              >
                📷 AI Photo Check
              </button>
            </div>
            {plateError && <p className="text-xs text-red-400 mt-1 font-medium">{plateError}</p>}
          </div>

          {/* AI Verification Mismatch Handling */}
          {aiOcrActive && aiDetectedPlate && aiDetectedPlate !== licensePlate && (
            <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 text-base">⚠️</span>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-300">AI Plate Scan Mismatch Detected</p>
                  <p className="text-slate-300">
                    Your entered plate: <strong className="text-white">{licensePlate}</strong> | AI detected from photo: <strong className="text-amber-300">{aiDetectedPlate}</strong>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <em>Note: AI OCR software can occasionally misread characters due to glare or angles. If you are 100% sure your entered plate matches your official vehicle documents, you may proceed at your own risk.</em>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLicensePlate(aiDetectedPlate);
                    setPlateError('');
                  }}
                  className="bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1 rounded hover:bg-amber-400"
                >
                  Accept AI Suggestion ({aiDetectedPlate})
                </button>
                <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={aiWarningAccepted}
                    onChange={(e) => setAiWarningAccepted(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  I confirm my entered plate is 100% correct
                </label>
              </div>
            </div>
          )}

          {/* Optional Email Input (Point 13) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Receipt Email Address <span className="text-slate-500">(Optional - Web receipt download provided)</span>
            </label>
            <input
              type="email"
              placeholder="name@example.com (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>
        </div>

        {/* Order Summary & Final Checkout (Point 12 - Suppress Trailer Notice on Truck/Bus) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Selected Product:</span>
            <span className="font-semibold text-slate-200">
              {category === 'truck' || category === 'bus'
                ? `Commercial Route Pass (${axles} Axles)`
                : `e-Vignette (${duration.toUpperCase()})`}
            </span>
          </div>

          {/* Point 12: ONLY show trailer vignette message for Cars */}
          {category === 'car' && needsTrailerVignette && (
            <div className="flex justify-between border-t border-slate-800 pt-2 text-xs text-amber-300">
              <span>Trailer Vignette Included:</span>
              <span>YES (Combined weight {totalWeight}kg &gt; 3.5t)</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-800 pt-3 text-lg font-bold text-white">
            <span>Total Amount Due:</span>
            <span className="text-amber-400">
              {finalPriceConverted} {currencySymbol} <span className="text-xs text-slate-500">({totalPriceBgn} BGN)</span>
            </span>
          </div>

          <button
            type="button"
            disabled={!isFormValid}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition ${
              isFormValid
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isFormValid ? 'Proceed to Instant Online Payment' : 'Complete Required Fields to Pay'}
          </button>
        </div>

      </div>
    </div>
  );
}