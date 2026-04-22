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
        className="w-24 h-24 bg-sage-medium/10 rounded-[32px] flex items-center justify-center mb-8 border-4 border-white shadow-xl shadow-sage-medium/5"
      >
        <CheckCircle2 className="text-sage-medium" size={48} />
      </motion.div>

      <h1 className="text-3xl font-black text-sage-dark mb-4 tracking-tight">Logged successfully</h1>
      <p className="text-sage-medium font-bold opacity-60 mb-12 max-w-[280px]">
        Every log helps us understand your patterns better. Keep it up!
      </p>

      <div className="w-full space-y-4">
        <button 
          onClick={() => onNavigate('home')}
          className="w-full bg-sage-medium text-white rounded-[24px] py-6 font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-sage-medium/20 active:scale-[0.98] transition-all"
        >
          <Home size={22} />
          Back to Home
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="bg-white border border-sage-pale/60 text-sage-dark rounded-[24px] py-6 font-bold flex flex-col items-center justify-center gap-2 hover:bg-sage-pale/30 transition-colors card-shadow"
          >
            <BarChart2 size={24} className="text-sage-medium opacity-70" />
            <span className="text-[11px] font-black opacity-40">STATS</span>
          </button>
          <button 
            onClick={() => onNavigate('history')}
            className="bg-white border border-sage-pale/60 text-sage-dark rounded-[24px] py-6 font-bold flex flex-col items-center justify-center gap-2 hover:bg-sage-pale/30 transition-colors card-shadow"
          >
            <Clock size={24} className="text-sage-medium opacity-70" />
            <span className="text-[11px] font-black opacity-40">HISTORY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
