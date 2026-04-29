import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Pill, Trash2, Edit3, Filter, Calendar, ChevronRight } from 'lucide-react';
import { TinnitusLog, MedicationLog } from '../types';
import { cn } from '../lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';

const getIntensityLabel = (severity: number) => {
  if (severity === 0) return 'None';
  if (severity <= 2) return 'Mild';
  if (severity <= 5) return 'Moderate';
  if (severity <= 8) return 'Severe';
  return 'Unbearable';
};

// Normalise stress to a readable string regardless of schema
const formatStress = (log: TinnitusLog): string => {
  const s = (log as any).lifestyle?.stress;
  if (s != null) {
    if (s === 0) return 'None';
    if (s === 1) return 'Low';
    if (s === 2) return 'Medium';
    return 'High';
  }
  return log.stressLevel ?? 'N/A';
};

// Normalise sleep quality to a readable string
const formatSleep = (log: TinnitusLog): string => {
  const v = (log as any).sleepQualityValue;
  if (v != null) return `${v}/5`;
  return log.sleepQuality ?? 'N/A';
};

// Boolean lifestyle fields → readable
const formatBool = (val: boolean | undefined | null): string =>
  val == null ? 'N/A' : val ? 'Yes' : 'No';

// Pulsating tinnitus from either schema
const formatPulsating = (log: TinnitusLog): string | null => {
  const p = (log as any).symptoms?.pulsatingTinnitus;
  if (p != null) return String(p);
  return null;
};

interface HistoryProps {
  tinnitusLogs: TinnitusLog[];
  medicationLogs: MedicationLog[];
  onDeleteTinnitus: (id: string) => void;
  onDeleteMedication: (id: string) => void;
  onEditTinnitus?: (log: TinnitusLog) => void;
  onEditMedication?: (log: MedicationLog) => void;
  isActive?: boolean;
}

export default function HistoryPage({ 
  tinnitusLogs, 
  medicationLogs, 
  onDeleteTinnitus, 
  onDeleteMedication,
  onEditTinnitus,
  onEditMedication,
  isActive 
}: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'tinnitus' | 'medication'>('all');

  React.useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isActive]);

  const allLogs = [
    ...tinnitusLogs.map(log => ({ ...log, type: 'tinnitus' as const })),
    ...medicationLogs.map(log => ({ ...log, type: 'medication' as const }))
  ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const filteredLogs = allLogs.filter(log => {
    if (activeTab === 'all') return true;
    return log.type === activeTab;
  });

  const groupedLogs: { [key: string]: typeof allLogs } = {};
  filteredLogs.forEach(log => {
    const day = format(parseISO(log.datetime), 'yyyy-MM-dd');
    if (!groupedLogs[day]) groupedLogs[day] = [];
    groupedLogs[day].push(log);
  });

  return (
    <div className="history-screen px-6 pt-16">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-sage-dark tracking-tight">History</h1>
        <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-sage-pale/50 text-sage-medium">
          <Filter size={18} />
        </button>
      </header>

      <div className="flex p-1.5 bg-sage-pale/50 rounded-2xl border border-sage-pale/30 mb-6 shrink-0">
        {(['all', 'tinnitus', 'medication'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-[10px] font-extrabold rounded-xl transition-all",
              activeTab === tab
                ? "bg-sage-medium text-white shadow-md shadow-sage-medium/20 scale-105"
                : "text-sage-dark opacity-40 hover:opacity-100"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="history-content space-y-8">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="text-sage-200" size={32} />
            </div>
            <p className="text-sage-400 font-medium">No logs found for this period.</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([day, logs]) => (
            <div key={day} className="space-y-4">
              <h3 className="text-[10px] font-black text-sage-300 uppercase tracking-[0.2em] ml-1">
                {isSameDay(parseISO(day), new Date()) ? 'Today' : format(parseISO(day), 'EEEE, MMM d')}
              </h3>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <LogItem
                      key={log.id}
                      log={log}
                      onDelete={() => log.type === 'tinnitus' ? onDeleteTinnitus(log.id) : onDeleteMedication(log.id)}
                      onEdit={() => {
                        if (log.type === 'tinnitus') onEditTinnitus?.(log as any);
                        else onEditMedication?.(log as any);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LogItem({ log, onDelete, onEdit }: { log: any; onDelete: () => void; onEdit: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pulsating = log.type === 'tinnitus' ? formatPulsating(log as TinnitusLog) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[28px] border border-sage-pale/50 card-shadow overflow-hidden relative"
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex items-center gap-4 cursor-pointer active:bg-sage-pale/20 transition-colors z-10"
      >
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          log.type === 'tinnitus' ? "bg-sage-pale/70 text-sage-dark" : "bg-blue-50/70 text-blue-600"
        )}>
          {log.type === 'tinnitus' ? <Activity size={24} /> : <Pill size={24} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-ink truncate tracking-tight">
              {log.type === 'tinnitus' ? `Level ${log.severity}` : log.medicationName}
            </h4>
            <span className="text-[10px] font-extrabold text-sage-medium/50 whitespace-nowrap">
              {format(parseISO(log.datetime), 'h:mm a')}
            </span>
          </div>
          <p className="text-xs text-sage-medium font-bold opacity-60 truncate">
            {log.type === 'tinnitus'
              ? `${getIntensityLabel(log.severity)} intensity • ${log.mood}`
              : `${log.dosage} • ${log.reason}`}
          </p>
        </div>

        <ChevronRight
          size={18}
          className={cn("text-sage-pale/60 transition-transform", isExpanded && "rotate-90")}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-sage-pale pt-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {log.type === 'tinnitus' ? (
                <>
                  <Detail label="Mood" value={log.mood} />
                  <Detail label="Stress" value={formatStress(log as TinnitusLog)} />
                  <Detail label="Sleep Quality" value={formatSleep(log as TinnitusLog)} />
                  <Detail label="Activity" value={log.activity ?? 'N/A'} />
                  <Detail label="Caffeine" value={formatBool(log.caffeine)} />
                  <Detail label="Alcohol" value={formatBool(log.alcohol)} />
                  <Detail label="Smoking" value={formatBool(log.smoking)} />
                  <Detail label="Noise Exposure" value={formatBool(log.noiseExposure)} />
                  {pulsating && (
                    <Detail label="Pulsating Tinnitus" value={`${pulsating}/4`} />
                  )}
                </>
              ) : (
                <>
                  <Detail label="Dosage" value={log.dosage} />
                  <Detail label="Frequency" value={log.frequency} />
                  <Detail label="Reason" value={log.reason} />
                  <Detail label="Effect" value={log.perceivedEffect} />
                </>
              )}
            </div>

            {log.notes ? (
              <div className="bg-cream p-3 rounded-xl border border-sage-pale">
                <p className="text-[10px] font-bold text-sage-medium uppercase tracking-widest mb-1">Notes</p>
                <p className="text-xs text-ink/70 italic">"{log.notes}"</p>
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex-1 bg-sage-pale text-sage-dark py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sage-light/50"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-xs font-bold text-ink">{value || 'N/A'}</p>
    </div>
  );
}