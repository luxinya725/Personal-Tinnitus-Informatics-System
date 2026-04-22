import React, { useState } from 'react';
import { ChevronLeft, Save, Pill, Clock } from 'lucide-react';
import { MedicationLog } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface LogMedicationProps {
  onSave: (log: MedicationLog) => void;
  onBack: () => void;
  initialData?: MedicationLog | null;
}

export default function LogMedicationPage({ onSave, onBack, initialData }: LogMedicationProps) {
  const [datetime, setDatetime] = useState(initialData?.datetime ?? format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [medicationName, setMedicationName] = useState(initialData?.medicationName ?? '');
  const [dosage, setDosage] = useState(initialData?.dosage ?? '');
  const [frequency, setFrequency] = useState(initialData?.frequency ?? 'Once daily');
  const [reason, setReason] = useState(initialData?.reason ?? 'Tinnitus relief');
  const [perceivedEffect, setPerceivedEffect] = useState<MedicationLog['perceivedEffect']>(initialData?.perceivedEffect ?? 'Not sure');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const handleSave = () => {
    if (!medicationName) return;
    
    const log: MedicationLog = {
      id: initialData?.id ?? Date.now().toString(),
      datetime,
      medicationName,
      dosage,
      frequency,
      reason,
      perceivedEffect,
      notes,
    };
    onSave(log);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-cream z-10 border-b border-sage-pale">
        <button onClick={onBack} className="p-2 -ml-2 text-sage-medium hover:text-sage-dark">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-sage-dark">Log Medication</h1>
        <div className="w-10" /> {/* Spacer to keep title centered */}
      </header>

      <div className="flex-1 px-6 py-8 space-y-8 pb-24">
        <div className="bg-sage-pale p-6 rounded-[18px] flex items-center gap-4 border border-sage-pale">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <Pill className="text-sage-medium" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-sage-dark">New Entry</h2>
            <p className="text-[10px] text-sage-medium font-bold uppercase tracking-widest opacity-60">Record your intake details</p>
          </div>
        </div>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Medication Name</label>
            <input 
              type="text" 
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="e.g. TinnitRelief, Magnesium"
              className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Dosage</label>
              <input 
                type="text" 
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 10mg, 1 tablet"
                className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Time Taken</label>
              <input 
                type="datetime-local" 
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Frequency</label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none appearance-none"
            >
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="As needed">As needed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Reason</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Tinnitus relief"
              className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Perceived Effect</label>
            <div className="grid grid-cols-2 gap-2">
              {['Improved', 'No change', 'Worse', 'Not sure'].map((effect) => (
                <button
                  key={effect}
                  onClick={() => setPerceivedEffect(effect as any)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-bold transition-all border",
                    perceivedEffect === effect 
                      ? "bg-sage-medium text-white border-sage-medium" 
                      : "bg-white text-sage-medium border-sage-pale hover:border-sage-medium"
                  )}
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any side effects or observations?"
              className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none min-h-[100px] resize-none"
            />
          </div>
        </section>

        <button 
          onClick={handleSave}
          disabled={!medicationName}
          className={cn(
            "w-full rounded-xl py-5 font-bold flex items-center justify-center gap-2 shadow-lg transition-all",
            medicationName 
              ? "bg-sage-medium text-white shadow-sage-medium/20 active:scale-[0.98]" 
              : "bg-sage-pale text-sage-medium opacity-50 shadow-none cursor-not-allowed"
          )}
        >
          <Save size={20} />
          Save Medication Log
        </button>
      </div>
    </div>
  );
}
