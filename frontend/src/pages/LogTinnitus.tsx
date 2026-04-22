import React, { useState } from 'react';
import { ChevronLeft, Save, Info, Activity, Smile, Coffee, Wine, Cigarette, Volume2, Moon, Zap, User, Monitor, Sun, AlertTriangle, Gamepad2, Footprints, Pill } from 'lucide-react';
import { TinnitusLog, StressLevel, Mood, SleepQuality, Duration, SymptomSeverity, LifestyleScale, Symptoms, LifestyleFactors } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface LogTinnitusProps {
  onSave: (log: TinnitusLog) => void;
  onBack: () => void;
  initialData?: TinnitusLog | null;
}

export default function LogTinnitusPage({ onSave, onBack, initialData }: LogTinnitusProps) {
  // A. Core Tinnitus
  const [severity, setSeverity] = useState(initialData?.severity ?? 5);
  const [datetime, setDatetime] = useState(initialData?.datetime ?? format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState<Duration>(initialData?.duration ?? '5–30 min');
  const [customDuration, setCustomDuration] = useState(initialData?.duration && !['<5 min', '5–30 min', '30+ min'].includes(initialData.duration) ? initialData.duration : '');
  
  // B. Mood & Energy
  const [moodLevel, setMoodLevel] = useState(initialData?.moodLevel ?? 5); // 1-10
  const [energyLevel, setEnergyLevel] = useState(initialData?.energyLevel ?? 3); // 1-5
  const [mood, setMood] = useState<Mood>(initialData?.mood ?? 'Normal');
  const [stressLevel, setStressLevel] = useState<StressLevel>(initialData?.stressLevel ?? 'Medium');

  // C. Symptoms (Severity 0-4)
  const [pulsatingTinnitus, setPulsatingTinnitus] = useState<SymptomSeverity>(initialData?.symptoms?.pulsatingTinnitus ?? 0);
  const [headache, setHeadache] = useState<SymptomSeverity>(initialData?.symptoms?.headache ?? 0);

  // D. Lifestyle Factors (Scale 0-3)
  const [doomscrolling, setDoomscrolling] = useState<LifestyleScale>(initialData?.lifestyle?.doomscrolling ?? 0);
  const [lifestyleAlcohol, setLifestyleAlcohol] = useState<LifestyleScale>(initialData?.lifestyle?.alcohol ?? 0);
  const [lifestyleCaffeine, setLifestyleCaffeine] = useState<LifestyleScale>(initialData?.lifestyle?.caffeine ?? 0);
  const [lifestyleTobacco, setLifestyleTobacco] = useState<LifestyleScale>(initialData?.lifestyle?.tobacco ?? 0);
  const [timeOutside, setTimeOutside] = useState<LifestyleScale>(initialData?.lifestyle?.timeOutside ?? 0);
  const [lifestyleStress, setLifestyleStress] = useState<LifestyleScale>(initialData?.lifestyle?.stress ?? 0);
  const [videoGames, setVideoGames] = useState<LifestyleScale>(initialData?.lifestyle?.videoGames ?? 0);

  // E. Activity
  const [walking, setWalking] = useState<LifestyleScale>(initialData?.walking ?? 0);

  // F. Sleep
  const [sleepQualityValue, setSleepQualityValue] = useState(initialData?.sleepQualityValue ?? 3); // 1-5
  const [sleepDuration, setSleepDuration] = useState(initialData?.sleepDuration ?? 7); // hours

  // G. Health / Body Context
  const [menstrualCycle, setMenstrualCycle] = useState(initialData?.menstrualCycle ?? 'Not in period');

  // Other fields
  const [noiseExposure, setNoiseExposure] = useState(initialData?.noiseExposure ?? false);
  const [activity, setActivity] = useState(initialData?.activity ?? 'Resting');
  const [customActivity, setCustomActivity] = useState('');
  const [copingStrategies, setCopingStrategies] = useState<string[]>(initialData?.copingStrategies ?? []);
  const [customCoping, setCustomCoping] = useState('');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  // Medication
  const [medicationTaken, setMedicationTaken] = useState(initialData?.medicationTaken ?? false);
  const [medicationName, setMedicationName] = useState(initialData?.medicationName ?? '');
  const [medicationDosage, setMedicationDosage] = useState(initialData?.medicationDosage ?? '');
  const [medicationTime, setMedicationTime] = useState(initialData?.medicationTime ?? format(new Date(), "HH:mm"));
  const [medicationFrequency, setMedicationFrequency] = useState(initialData?.medicationFrequency ?? 'Once daily');
  const [medicationEffect, setMedicationEffect] = useState<'Improved' | 'No change' | 'Worse' | 'Not sure'>(initialData?.medicationEffect ?? 'Not sure');

  const handleSave = () => {
    const log: TinnitusLog = {
      id: initialData?.id ?? Date.now().toString(),
      datetime,
      severity,
      duration: duration === 'Other' ? customDuration : duration,
      stressLevel,
      mood,
      moodLevel,
      energyLevel,
      
      symptoms: {
        pulsatingTinnitus,
        headache
      },
      
      lifestyle: {
        doomscrolling,
        alcohol: lifestyleAlcohol,
        caffeine: lifestyleCaffeine,
        tobacco: lifestyleTobacco,
        timeOutside,
        stress: lifestyleStress,
        videoGames
      },
      
      walking,
      
      sleepQualityValue,
      sleepDuration,
      menstrualCycle,

      // Legacy/Compat
      caffeine: lifestyleCaffeine > 0,
      alcohol: lifestyleAlcohol > 0,
      smoking: lifestyleTobacco > 0,
      noiseExposure,
      sleepQuality: sleepQualityValue > 3 ? 'Good' : sleepQualityValue === 3 ? 'OK' : 'Poor',
      activity: activity === 'Other' ? customActivity : activity,
      copingStrategies: copingStrategies.map(s => s === 'Other' ? customCoping : s),
      notes,
      
      medicationTaken,
      ...(medicationTaken && {
        medicationName,
        medicationDosage,
        medicationTime,
        medicationFrequency,
        medicationEffect,
      })
    };
    onSave(log);
  };

  const toggleCoping = (strategy: string) => {
    setCopingStrategies(prev => 
      prev.includes(strategy) ? prev.filter(s => s !== strategy) : [...prev, strategy]
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-cream z-10 border-b border-sage-pale">
        <button onClick={onBack} className="p-2 -ml-2 text-sage-medium hover:text-sage-dark">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-sage-dark">Log Symptom & Context</h1>
        <div className="w-10" /> {/* Spacer to keep title centered */}
      </header>

      <div className="flex-1 px-6 py-8 space-y-10 pb-32">
        
        {/* SECTION 1: PRIMARY DATA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-sage-pale/50">
            <h2 className="text-[12px] font-bold text-sage-dark/60 tracking-tight">Essential Details</h2>
            <span className="text-[10px] bg-sage-medium/10 text-sage-medium px-2 py-0.5 rounded-full font-bold">Priority Log</span>
          </div>

          {/* 1. Primary Tinnitus Score */}
          <section className="space-y-8 bg-sage-medium text-white p-7 rounded-[32px] shadow-lg shadow-sage-medium/10 transition-all">
            <div className="flex items-center gap-2 opacity-90">
              <Activity size={18} />
              <h2 className="text-xs font-bold tracking-tight">Tinnitus Intensity</h2>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Overall Intensity</label>
                <span className="text-4xl font-black text-white">{severity}</span>
              </div>
              <div className="relative pt-2">
                <input 
                  type="range" min="0" max="10" step="1"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between mt-4 text-[9px] font-bold opacity-60 uppercase tracking-tighter">
                  <span>None</span>
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                  <span>Unbearable</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest opacity-50">Entry Time</label>
                <input 
                  type="datetime-local" 
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-[10px] font-bold focus:bg-white/20 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest opacity-50">Duration</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-[10px] font-bold outline-none appearance-none"
                >
                  <option value="<5 min">{"<5 min"}</option>
                  <option value="5–30 min">5–30 min</option>
                  <option value="30+ min">30+ min</option>
                  <option value="Other">Custom...</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. Secondary Symptoms */}
          <section className="space-y-6 bg-white p-7 rounded-[32px] border border-sage-pale/60 card-shadow">
            <div className="flex items-center gap-2 text-sage-medium">
              <AlertTriangle size={18} />
              <h2 className="text-xs font-bold tracking-tight">Symptom Type</h2>
            </div>
            
            <div className="space-y-6">
              <SeverityRow 
                label="Pulsating Tinnitus" 
                value={pulsatingTinnitus} 
                onChange={(v) => setPulsatingTinnitus(v as SymptomSeverity)} 
              />
              <SeverityRow 
                label="Headache" 
                value={headache} 
                onChange={(v) => setHeadache(v as SymptomSeverity)} 
              />
            </div>
          </section>

          <div className="flex gap-4 items-center">
            <div className="h-px flex-1 bg-sage-pale" />
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-sage-medium text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
            >
              Quick Save
            </button>
            <div className="h-px flex-1 bg-sage-pale" />
          </div>
        </div>

        {/* SECTION 2: CONTEXT DATA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-sage-pale/50">
            <h2 className="text-[12px] font-bold text-slate-400 tracking-tight">Context & Lifestyle</h2>
            <span className="text-[10px] text-slate-400 font-bold italic">Optional</span>
          </div>

          {/* 3. Mood & Energy */}
          <section className="space-y-8 bg-cream p-7 rounded-[32px] border border-sage-pale/30">
            <div className="flex items-center gap-2 text-sage-medium">
              <Smile size={18} />
              <h2 className="text-xs font-bold tracking-tight">Mood & Wellbeing</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Mood Level (1-10)</label>
                  <span className="text-xl font-bold text-sage-dark">{moodLevel}</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  value={moodLevel}
                  onChange={(e) => setMoodLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-sage-pale rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Energy Level (1-5)</label>
                  <span className="text-xl font-bold text-sage-dark">{energyLevel}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button 
                      key={v}
                      onClick={() => setEnergyLevel(v)}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold transition-all border",
                        energyLevel === v ? "bg-sage-medium text-white border-sage-medium" : "bg-white text-sage-medium border-sage-pale"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. Lifestyle Factors */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sage-medium">
              <Zap size={18} />
              <h2 className="text-xs font-bold tracking-tight">Lifestyle Factors</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <LifestyleRow icon={<Monitor size={14}/>} label="Doomscrolling" value={doomscrolling} onChange={(v) => setDoomscrolling(v as LifestyleScale)} />
              <LifestyleRow icon={<Wine size={14}/>} label="Alcohol" value={lifestyleAlcohol} onChange={(v) => setLifestyleAlcohol(v as LifestyleScale)} />
              <LifestyleRow icon={<Coffee size={14}/>} label="Caffeine" value={lifestyleCaffeine} onChange={(v) => setLifestyleCaffeine(v as LifestyleScale)} />
              <LifestyleRow icon={<Cigarette size={14}/>} label="Tobacco" value={lifestyleTobacco} onChange={(v) => setLifestyleTobacco(v as LifestyleScale)} />
              <LifestyleRow icon={<Sun size={14}/>} label="Time Outside" value={timeOutside} onChange={(v) => setTimeOutside(v as LifestyleScale)} />
              <LifestyleRow icon={<Zap size={14}/>} label="Stress" value={lifestyleStress} onChange={(v) => setLifestyleStress(v as LifestyleScale)} />
              <LifestyleRow icon={<Gamepad2 size={14}/>} label="Video Games" value={videoGames} onChange={(v) => setVideoGames(v as LifestyleScale)} />
            </div>
          </section>

          {/* 5. Activity */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sage-medium">
              <Footprints size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Activity</h2>
            </div>
            <LifestyleRow icon={null} label="Walking Intensity" value={walking} onChange={(v) => setWalking(v as LifestyleScale)} />
          </section>

          {/* 6. Sleep */}
          <section className="space-y-8">
            <div className="flex items-center gap-2 text-sage-medium">
              <Moon size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Sleep</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Sleep Quality (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button 
                      key={v}
                      onClick={() => setSleepQualityValue(v)}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold transition-all border",
                        sleepQualityValue === v ? "bg-sage-medium text-white border-sage-medium" : "bg-white text-sage-medium border-sage-pale"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Sleep Duration (Hours)</label>
                <input 
                  type="number" step="0.5" min="0" max="24"
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(parseFloat(e.target.value))}
                  className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-sage-medium outline-none"
                />
              </div>
            </div>
          </section>

          {/* 7. Health / Body Context */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sage-medium">
              <User size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Body Context</h2>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Menstrual Cycle</label>
              <div className="flex flex-col gap-2">
                {['Not in period', 'In period'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setMenstrualCycle(opt)}
                    className={cn(
                      "w-full py-4 px-6 rounded-xl text-left font-bold border transition-all flex justify-between items-center",
                      menstrualCycle === opt ? "bg-sage-pale border-sage-medium text-sage-dark" : "bg-white border-sage-pale text-sage-medium"
                    )}
                  >
                    <span>{opt}</span>
                    {menstrualCycle === opt && <div className="w-2 h-2 rounded-full bg-sage-medium" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 8. Medication */}
          <section className="space-y-8">
            <div className="flex items-center gap-2 text-sage-medium">
              <Pill size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Medication</h2>
            </div>

            <div className="bg-white rounded-[24px] border border-sage-pale p-6 card-shadow space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">Action taken?</span>
                <button 
                  onClick={() => setMedicationTaken(!medicationTaken)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    medicationTaken ? "bg-sage-medium" : "bg-sage-pale"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    medicationTaken ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              {medicationTaken && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-6 pt-4 border-t border-sage-pale overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Medication Name</label>
                    <input 
                      type="text" value={medicationName} onChange={(e) => setMedicationName(e.target.value)}
                      className="w-full bg-cream border border-sage-pale rounded-xl p-3 text-xs font-bold outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* 9. Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sage-medium">
              <Info size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Additional Notes</h2>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations..."
              className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none min-h-[120px] resize-none"
            />
          </section>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-sage-medium text-white rounded-2xl py-6 font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-sage-medium/20 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2">
            <Save size={20} />
            <span className="text-lg">Save Full Entry</span>
          </div>
          <span className="text-[10px] opacity-70 uppercase tracking-widest font-black">All sections complete</span>
        </button>
      </div>
    </div>
  );
}

function SeverityRow({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-80">{label}</label>
        <span className="text-sm font-black text-sage-dark">{value}</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-3 rounded-lg text-xs font-bold transition-all border",
              value === v ? "bg-sage-medium text-white border-sage-medium" : "bg-white text-sage-pale border-sage-pale"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function LifestyleRow({ icon, label, value, onChange }: { icon: React.ReactNode, label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-sage-pale">
      <div className="flex items-center gap-3">
        {icon && <span className="text-sage-medium">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest text-sage-dark">{label}</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all",
              value === v ? "bg-sage-medium text-white border-sage-medium shadow-sm" : "bg-cream border-sage-pale text-sage-medium"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
