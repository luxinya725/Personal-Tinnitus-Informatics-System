import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Activity } from 'lucide-react';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-cream flex flex-col px-8 pt-20 pb-10">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-sage-medium rounded-[32px] mx-auto flex items-center justify-center shadow-lg shadow-sage-medium/20 rotate-3 mb-6">
          <Activity className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-black text-sage-dark mb-2 tracking-tight">QuietSpace</h1>
        <p className="text-sage-medium font-bold opacity-60">Your journey to silence starts here</p>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-sage-medium opacity-70 ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-medium opacity-40" size={20} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-white border border-sage-pale/60 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-sage-medium/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-sage-medium opacity-70 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-medium opacity-40" size={20} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-sage-pale/60 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-sage-medium/10 outline-none transition-all"
            />
          </div>
        </div>

        <button 
          onClick={onLogin}
          className="w-full bg-sage-medium text-white rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-sage-medium/20 active:scale-[0.98] transition-all mt-6"
        >
          Sign In
          <ArrowRight size={20} />
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sage-pale"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="bg-cream px-2 text-sage-medium opacity-50">Or</span>
          </div>
        </div>

        <button 
          onClick={onLogin}
          className="w-full bg-sage-pale text-sage-dark rounded-xl py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-sage-light/50 transition-colors"
        >
          Continue as demo user
        </button>
      </div>

      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-sage-medium opacity-60 mt-8">
        Don't have an account? <span className="text-sage-dark cursor-pointer">Sign up</span>
      </p>
    </div>
  );
}
