import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Pill, Trash2, Edit3, Filter, Calendar, ChevronRight } from 'lucide-react';
import { TinnitusLog, MedicationLog } from '../types';
import { cn } from '../lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';

interface HistoryProps {
  tinnitusLogs: TinnitusLog[];
  medicationLogs: MedicationLog[];
  onDeleteTinnitus: (id: string) => void;
  onDeleteMedication: (id: string) => void;
}

export default function HistoryPage({ tinnitusLogs, medicationLogs, onDeleteTinnitus, onDeleteMedication }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'tinnitus' | 'medication'>('all');

  const allLogs = [
    ...tinnitusLogs.map(log => ({ ...log, type: 'tinnitus' as const })),
    ...medicationLogs.map(log => ({ ...log, type: 'medication' as const }))
  ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const filteredLogs = allLogs.filter(log => {
    if (activeTab === 'all') return true;
    return log.type === activeTab;
  });

  // Group by day
  const groupedLogs: { [key: string]: typeof allLogs } = {};
  filteredLogs.forEach(log => {
    const day = format(parseISO(log.datetime), 'yyyy-MM-dd');
    if (!groupedLogs[day]) groupedLogs[day] = [];
    groupedLogs[day].push(log);
  });

  return (
    <div className="px-6 pt-16 pb-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-sage-dark">History</h1>
        <button className="p-2 bg-white rounded-xl shadow-sm border border-sage-pale text-sage-medium">
          <Filter size={20} />
        </button>
      </header>

      <div className="flex p-1 bg-sage-pale rounded-xl">
        {(['all', 'tinnitus', 'medication'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              activeTab === tab ? "bg-sage-medium text-white shadow-sm" : "text-sage-dark opacity-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-8">
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

function LogItem({ log, onDelete }: { log: any, onDelete: () => void, key?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[18px] border border-sage-pale card-shadow overflow-hidden"
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-center gap-4 cursor-pointer active:bg-sage-pale/30 transition-colors"
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          log.type === 'tinnitus' ? "bg-sage-pale text-sage-dark" : "bg-blue-50 text-blue-600"
        )}>
          {log.type === 'tinnitus' ? <Activity size={24} /> : <Pill size={24} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-ink truncate">
              {log.type === 'tinnitus' ? `Severity: ${log.severity}` : log.medicationName}
            </h4>
            <span className="text-[10px] font-bold text-sage-medium opacity-60 whitespace-nowrap">
              {format(parseISO(log.datetime), 'h:mm a')}
            </span>
          </div>
          <p className="text-xs text-sage-medium opacity-80 truncate">
            {log.type === 'tinnitus' ? `${log.duration} • ${log.stressLevel} stress` : `${log.dosage} • ${log.perceivedEffect}`}
          </p>
        </div>
        
        <ChevronRight 
          size={18} 
          className={cn("text-sage-pale transition-transform", isExpanded && "rotate-90")} 
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
                  <Detail label="Activity" value={log.activity} />
                  <Detail label="Sleep" value={log.sleepQuality} />
                  <Detail label="Caffeine" value={log.caffeine ? 'Yes' : 'No'} />
                </>
              ) : (
                <>
                  <Detail label="Frequency" value={log.frequency} />
                  <Detail label="Reason" value={log.reason} />
                </>
              )}
            </div>
            
            {log.notes && (
              <div className="bg-cream p-3 rounded-xl border border-sage-pale">
                <p className="text-[10px] font-bold text-sage-medium uppercase tracking-widest mb-1">Notes</p>
                <p className="text-xs text-ink/70 italic">"{log.notes}"</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-sage-pale text-sage-dark py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sage-light/50">
                <Edit3 size={14} /> Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
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

function Detail({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-xs font-bold text-ink">{value || 'N/A'}</p>
    </div>
  );
}
