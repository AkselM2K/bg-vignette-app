'use client';

import React, { useState, useEffect } from 'react';

// Types
type VehicleType = 'car' | 'van' | 'motorcycle' | 'truck';
type Duration = 'weekend' | 'week' | 'month' | 'quarter' | 'year';

interface FormData {
  vehicleType: VehicleType;
  hasTrailer: boolean;
  duration: Duration;
  startDate: string;
  licensePlate: string;
  countryCode: string;
  email: string;
}

export default function VignetteWizard() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'car',
    hasTrailer: false,
    duration: 'week',
    startDate: new Date().toISOString().split('T')[0],
    licensePlate: '',
    countryCode: 'BG',
    email: '',
  });

  // LocalStorage Auto-Save (Prevents data loss on connection drop)
  useEffect(() => {
    const saved = localStorage.getItem('vignette_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved draft', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vignette_draft', JSON.stringify(formData));
  }, [formData]);

  const updateForm = (fields: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-emerald-600 p-4 text-center">
          <h1 className="text-xl font-bold tracking-tight">Bulgaria e-Vignette</h1>
          <p className="text-xs text-emerald-100 mt-1">Official Instant Pass • 24/7 Automated</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex border-b border-slate-700 bg-slate-800/50">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`flex-1 h-1 transition-all duration-300 ${
                step >= i ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content Area */}
        <div className="p-6">
          {/* STEP 1: VEHICLE TYPE */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">1. Select Vehicle Category</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'car', label: 'Car / Passenger', icon: '🚗' },
                  { id: 'van', label: 'Camper / Van', icon: '🚐' },
                  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
                  { id: 'truck', label: 'Heavy Truck (>3.5t)', icon: '🚛' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => updateForm({ vehicleType: v.id as VehicleType })}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.vehicleType === v.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <span className="text-3xl">{v.icon}</span>
                    <span className="text-sm">{v.label}</span>
                  </button>
                ))}
              </div>

              {/* Trailer Toggle */}
              <div className="mt-6 p-4 rounded-xl border border-slate-700 bg-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Attaching a Trailer?</div>
                  <div className="text-xs text-slate-400">Total weight &gt; 3.5t requires trailer vignette</div>
                </div>
                <button
                  onClick={() => updateForm({ hasTrailer: !formData.hasTrailer })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formData.hasTrailer ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    formData.hasTrailer ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DURATION & START DATE */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">2. Select Validity Period</h2>
              <div className="space-y-2">
                {[
                  { id: 'weekend', label: 'Weekend Pass (Fri-Sun)', price: '10 BGN (~€5)' },
                  { id: 'week', label: '1 Week (7 Days)', price: '15 BGN (~€8)' },
                  { id: 'month', label: '1 Month', price: '30 BGN (~€15)' },
                  { id: 'quarter', label: '3 Months (90 Days)', price: '54 BGN (~€28)' },
                  { id: 'year', label: '1 Year', price: '97 BGN (~€50)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => updateForm({ duration: d.id as Duration })}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                      formData.duration === d.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{d.label}</span>
                    <span className="text-sm opacity-80">{d.price}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-xs text-slate-400 mb-1">Start Activation Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateForm({ startDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: VEHICLE & CONTACT DETAILS */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">3. Vehicle & Contact Info</h2>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Registration Country</label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => updateForm({ countryCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BG">Bulgaria (BG)</option>
                  <option value="RO">Romania (RO)</option>
                  <option value="GR">Greece (GR)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="TR">Turkey (TR)</option>
                  <option value="PL">Poland (PL)</option>
                  <option value="UA">Ukraine (UA)</option>
                  <option value="NL">Netherlands (NL)</option>
                  <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">License Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. B1234AB or B-123-AB"
                  value={formData.licensePlate}
                  onChange={(e) => updateForm({ licensePlate: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email (PDF Pass Delivery)</label>
                <input
                  type="email"
                  placeholder="driver@gmail.com"
                  value={formData.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION & PAYMENT */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">4. Review & Pay</h2>
              
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Vehicle:</span>
                  <span className="text-white font-medium capitalize">{formData.vehicleType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Plate:</span>
                  <span className="text-emerald-400 font-mono font-bold">{formData.licensePlate || 'NOT ENTERED'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Validity:</span>
                  <span className="text-white font-medium capitalize">{formData.duration} (From {formData.startDate})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Email:</span>
                  <span className="text-white font-medium">{formData.email || 'NOT ENTERED'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert('Order submitted! Database and Payment system coming next.')}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl shadow-lg transition-all text-center"
                >
                  Pay Now with Apple Pay / Card
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-slate-700">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all"
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
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