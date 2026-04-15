import React, { useState } from 'react';
import { ChevronLeft, Save, Clock, Info, Pill, Activity, Moon, Zap, Smile, Coffee, Wine, Cigarette, Volume2 } from 'lucide-react';
import { TinnitusLog, StressLevel, Mood, SleepQuality, Duration } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface LogTinnitusProps {
  onSave: (log: TinnitusLog) => void;
  onBack: () => void;
}

export default function LogTinnitusPage({ onSave, onBack }: LogTinnitusProps) {
  const [severity, setSeverity] = useState(5);
  const [datetime, setDatetime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState<Duration>('5–30 min');
  const [customDuration, setCustomDuration] = useState('');
  const [stressLevel, setStressLevel] = useState<StressLevel>('Medium');
  const [mood, setMood] = useState<Mood>('Normal');
  const [customMood, setCustomMood] = useState('');
  
  const [caffeine, setCaffeine] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [noiseExposure, setNoiseExposure] = useState(false);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('OK');
  const [activity, setActivity] = useState('Resting');
  const [customActivity, setCustomActivity] = useState('');
  
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [customCoping, setCustomCoping] = useState('');
  
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [medicationTime, setMedicationTime] = useState(format(new Date(), "HH:mm"));
  const [medicationFrequency, setMedicationFrequency] = useState('Once daily');
  const [medicationEffect, setMedicationEffect] = useState<'Improved' | 'No change' | 'Worse' | 'Not sure'>('Not sure');
  
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const log: TinnitusLog = {
      id: Date.now().toString(),
      datetime,
      severity,
      duration: duration === 'Other' ? customDuration : duration,
      stressLevel,
      mood: mood === 'Other' ? (customMood as any) : mood,
      caffeine,
      alcohol,
      smoking,
      noiseExposure,
      sleepQuality,
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
        <h1 className="text-lg font-bold text-sage-dark">Log Tinnitus</h1>
        <button onClick={handleSave} className="text-white font-bold text-sm px-4 py-2 bg-sage-medium rounded-xl">
          Save
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-12 pb-24">
        {/* A. Symptom Details */}
        <section className="space-y-8">
          <div className="flex items-center gap-2 text-sage-medium">
            <Activity size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">A. Symptom Details</h2>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Symptom Severity</label>
              <span className="text-4xl font-black text-sage-dark">{severity}</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-sage-pale rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-4 text-[9px] font-bold text-sage-medium opacity-60 uppercase tracking-tighter">
                <span>Not noticeable</span>
                <span>Mild</span>
                <span>Distracting</span>
                <span>Disturbing</span>
                <span>Unbearable</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Entry Time</label>
              <input 
                type="datetime-local" 
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Duration</label>
              <select 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none appearance-none"
              >
                <option value="<5 min">{"<5 min"}</option>
                <option value="5–30 min">5–30 min</option>
                <option value="30+ min">30+ min</option>
                <option value="Other">Custom...</option>
              </select>
              {duration === 'Other' && (
                <input 
                  type="text"
                  placeholder="e.g. 2 hours"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full mt-2 bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Stress Level</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map((level) => (
                <button
                  key={level}
                  onClick={() => setStressLevel(level as StressLevel)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                    stressLevel === level 
                      ? "bg-sage-medium text-white border-sage-medium" 
                      : "bg-white text-sage-medium border-sage-pale hover:border-sage-medium"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Current Mood</label>
            <div className="grid grid-cols-3 gap-2">
              {['Calm', 'Normal', 'Anxious', 'Tired', 'Other'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m as Mood)}
                  className={cn(
                    "py-3 rounded-xl text-xs font-bold transition-all border",
                    mood === m 
                      ? "bg-sage-light text-ink border-sage-light" 
                      : "bg-white text-sage-medium border-sage-pale hover:border-sage-medium"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            {mood === 'Other' && (
              <input 
                type="text"
                placeholder="How are you feeling?"
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
              />
            )}
          </div>
        </section>

        {/* B. Recent Habits / Context */}
        <section className="space-y-8">
          <div className="flex items-center gap-2 text-sage-medium">
            <Zap size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">B. Recent Habits / Context</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ToggleCard active={caffeine} onClick={() => setCaffeine(!caffeine)} label="Caffeine" icon={<Coffee size={14} />} />
            <ToggleCard active={alcohol} onClick={() => setAlcohol(!alcohol)} label="Alcohol" icon={<Wine size={14} />} />
            <ToggleCard active={smoking} onClick={() => setSmoking(!smoking)} label="Smoking" icon={<Cigarette size={14} />} />
            <ToggleCard active={noiseExposure} onClick={() => setNoiseExposure(!noiseExposure)} label="Noise Exposure" icon={<Volume2 size={14} />} />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Sleep Quality (Last Night)</label>
            <div className="flex gap-2">
              {['Good', 'OK', 'Poor'].map((q) => (
                <button
                  key={q}
                  onClick={() => setSleepQuality(q as SleepQuality)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                    sleepQuality === q 
                      ? "bg-sage-medium text-white border-sage-medium" 
                      : "bg-white text-sage-medium border-sage-pale hover:border-sage-medium"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Current Activity</label>
            <div className="grid grid-cols-3 gap-2">
              {['Resting', 'Working', 'Studying', 'Exercising', 'Commuting', 'Other'].map((act) => (
                <button
                  key={act}
                  onClick={() => setActivity(act)}
                  className={cn(
                    "py-2 px-1 rounded-xl text-[10px] font-bold transition-all border uppercase tracking-wider",
                    activity === act 
                      ? "bg-sage-pale border-sage-medium text-sage-dark" 
                      : "bg-white text-sage-medium border-sage-pale hover:border-sage-medium"
                  )}
                >
                  {act}
                </button>
              ))}
            </div>
            {activity === 'Other' && (
              <input 
                type="text"
                placeholder="What are you doing?"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
              />
            )}
          </div>
        </section>

        {/* C. Coping Strategy */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sage-medium">
            <Smile size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">C. Coping Strategy</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Rest', 'Music', 'Silence', 'None', 'Other'].map((strategy) => (
              <button
                key={strategy}
                onClick={() => toggleCoping(strategy)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  copingStrategies.includes(strategy) 
                    ? "bg-sage-dark text-white border-sage-dark" 
                    : "bg-white text-sage-medium border-sage-pale hover:border-sage-medium"
                )}
              >
                {strategy}
              </button>
            ))}
          </div>
          {copingStrategies.includes('Other') && (
            <input 
              type="text"
              placeholder="What else helps?"
              value={customCoping}
              onChange={(e) => setCustomCoping(e.target.value)}
              className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
            />
          )}
        </section>

        {/* D. Medication Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-2 text-sage-medium">
            <Pill size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">D. Medication Section</h2>
          </div>

          <div className="bg-white rounded-[18px] border border-sage-pale p-6 card-shadow space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">Medication taken today?</span>
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
                    type="text"
                    placeholder="e.g. TinnitRelief"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    className="w-full bg-cream border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Dosage</label>
                    <input 
                      type="text"
                      placeholder="e.g. 10 mg"
                      value={medicationDosage}
                      onChange={(e) => setMedicationDosage(e.target.value)}
                      className="w-full bg-cream border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Time Taken</label>
                    <input 
                      type="time"
                      value={medicationTime}
                      onChange={(e) => setMedicationTime(e.target.value)}
                      className="w-full bg-cream border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Frequency</label>
                  <select 
                    value={medicationFrequency}
                    onChange={(e) => setMedicationFrequency(e.target.value)}
                    className="w-full bg-cream border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none appearance-none"
                  >
                    <option value="once daily">Once daily</option>
                    <option value="twice daily">Twice daily</option>
                    <option value="as needed">As needed</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Perceived Effect</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Improved', 'No change', 'Worse', 'Not sure'].map((effect) => (
                      <button
                        key={effect}
                        onClick={() => setMedicationEffect(effect as any)}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                          medicationEffect === effect 
                            ? "bg-sage-medium text-white border-sage-medium" 
                            : "bg-cream text-sage-medium border-sage-pale hover:border-sage-medium"
                        )}
                      >
                        {effect}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* E. Notes */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sage-medium">
            <Info size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">E. Notes</h2>
          </div>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Possible triggers, sound description, or other observations..."
            className="w-full bg-white border border-sage-pale rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-sage-medium outline-none min-h-[120px] resize-none"
          />
        </section>

        <button 
          onClick={handleSave}
          className="w-full bg-sage-medium text-white rounded-xl py-5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-sage-medium/20 active:scale-[0.98] transition-all"
        >
          <Save size={20} />
          Save Symptom Log
        </button>
      </div>
    </div>
  );
}

function ToggleCard({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl text-left transition-all border flex items-center justify-between",
        active 
          ? "bg-sage-pale border-sage-medium text-sage-dark" 
          : "bg-white border-sage-pale text-sage-medium hover:border-sage-medium"
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="opacity-60">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn(
        "w-4 h-4 rounded-full border flex items-center justify-center",
        active ? "bg-sage-medium border-sage-medium" : "border-sage-pale"
      )}>
        {active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
      </div>
    </button>
  );
}
