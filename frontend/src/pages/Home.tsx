import React from 'react';
import { motion } from 'motion/react';
import { Plus, Pill, Activity, Heart, Moon, ChevronRight, Sparkles, Clock, BarChart2 } from 'lucide-react';
import { TinnitusLog, MedicationLog, User, Page } from '../types';
import { cn } from '../lib/utils';
import { format, isToday } from 'date-fns';

interface HomeProps {
  user: User | null;
  tinnitusLogs: TinnitusLog[];
  medicationLogs: MedicationLog[];
  onNavigate: (page: Page) => void;
}

export default function HomePage({ user, tinnitusLogs, medicationLogs, onNavigate }: HomeProps) {
  const todayTinnitus = tinnitusLogs.filter(log => isToday(new Date(log.datetime)));
  const todayMedication = medicationLogs.filter(log => isToday(new Date(log.datetime)));
  const lastLog = tinnitusLogs[0];

  return (
    <div className="px-6 pt-12 pb-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">Hi, {user?.name || 'Alex'}</h1>
          <p className="text-sage-500 text-sm">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="w-12 h-12 bg-sage-pale rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`} 
            alt="Avatar" 
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <ActionButton 
          onClick={() => onNavigate('log-tinnitus')}
          icon={<Activity className="text-sage-dark" size={28} />}
          label="Log Tinnitus"
          color="bg-sage-pale"
        />
        <ActionButton 
          onClick={() => onNavigate('log-medication')}
          icon={<Pill className="text-sage-dark" size={28} />}
          label="Log Medication"
          color="bg-sage-pale"
        />
      </section>

      <section className="bg-white rounded-[18px] p-6 card-shadow border border-sage-pale space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-sage-dark">Today's Snapshot</h2>
          <button onClick={() => onNavigate('history')} className="text-sage-medium text-xs font-medium flex items-center">
            Details <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-ink">{todayTinnitus.length}</p>
            <p className="text-[10px] text-sage-medium uppercase tracking-widest font-bold opacity-60">Logs</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-sage-medium">{todayMedication.length}</p>
            <p className="text-[10px] text-sage-medium uppercase tracking-widest font-bold opacity-60">Medication</p>
          </div>
        </div>
        {lastLog && (
          <div className="pt-4 border-t border-sage-pale flex items-center gap-2 text-xs text-sage-medium opacity-60">
            <Clock size={14} />
            <span>Last logged: {format(new Date(lastLog.datetime), 'h:mm a')}</span>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[18px] p-6 card-shadow border border-sage-pale relative overflow-hidden">
        <h2 className="font-bold text-ink mb-2">Daily Insight</h2>
        <p className="text-ink/80 text-sm leading-relaxed">
          You often log symptoms in the evening when your surroundings are quieter.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-bold text-sage-dark">Health Snapshot</h2>
        <div className="grid grid-cols-2 gap-4">
          <SnapshotCard 
            icon={<Moon className="text-blue-500" size={20} />}
            label="Sleep"
            value="7h 20m"
            status="Good"
            color="bg-white border-sage-pale"
          />
          <SnapshotCard 
            icon={<Heart className="text-red-500" size={20} />}
            label="Heart Rate"
            value="72 bpm"
            status="Normal"
            color="bg-white border-sage-pale"
          />
        </div>
      </section>
      
      <div className="pb-4">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="w-full bg-sage-medium text-white rounded-xl py-4 px-6 flex items-center justify-between font-semibold transition-colors shadow-sm"
        >
          <span className="flex items-center gap-3">
            <BarChart2 size={20} />
            View Detailed Insights
          </span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, color }: { onClick: () => void, icon: React.ReactNode, label: string, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 rounded-[18px] transition-transform active:scale-95 border border-sage-pale",
        color
      )}
    >
      <div className="bg-white p-3 rounded-xl shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-bold text-sage-dark uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SnapshotCard({ icon, label, value, status, color }: { icon: React.ReactNode, label: string, value: string, status: string, color: string }) {
  return (
    <div className={cn("p-5 rounded-[18px] space-y-3 border card-shadow", color)}>
      <div className="flex items-center justify-between">
        <div className="bg-sage-pale p-2 rounded-lg">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-sage-medium">{status}</span>
      </div>
      <div>
        <p className="text-lg font-bold text-ink">{value}</p>
        <p className="text-[10px] text-sage-medium uppercase tracking-widest font-bold opacity-60">{label}</p>
      </div>
    </div>
  );
}

