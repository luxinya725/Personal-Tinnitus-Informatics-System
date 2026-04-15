import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Home, BarChart2, Clock } from 'lucide-react';
import { Page } from '../types';

export default function SuccessPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center bg-cream">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-24 h-24 bg-sage-pale rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-sm"
      >
        <CheckCircle2 className="text-sage-medium" size={48} />
      </motion.div>

      <h1 className="text-3xl font-bold text-sage-dark mb-4 tracking-tight">Logged successfully</h1>
      <p className="text-sage-medium font-medium opacity-70 mb-12 max-w-[280px]">
        Every log helps us understand your patterns better. Keep it up!
      </p>

      <div className="w-full space-y-4">
        <button 
          onClick={() => onNavigate('home')}
          className="w-full bg-sage-medium text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 shadow-lg shadow-sage-medium/20 active:scale-[0.98] transition-all"
        >
          <Home size={20} />
          Back to Home
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="bg-white border border-sage-pale text-sage-dark rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-2 hover:bg-sage-pale/30 transition-colors card-shadow"
          >
            <BarChart2 size={20} className="text-sage-medium" />
            <span className="text-[10px] uppercase tracking-widest">Dashboard</span>
          </button>
          <button 
            onClick={() => onNavigate('history')}
            className="bg-white border border-sage-pale text-sage-dark rounded-xl py-4 font-bold flex flex-col items-center justify-center gap-2 hover:bg-sage-pale/30 transition-colors card-shadow"
          >
            <Clock size={20} className="text-sage-medium" />
            <span className="text-[10px] uppercase tracking-widest">History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
