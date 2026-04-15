import React from 'react';
import { User, LogOut, Settings, Shield, Bell, Moon, ChevronRight } from 'lucide-react';
import { User as UserType } from '../types';
import { cn } from '../lib/utils';

interface ProfileProps {
  user: UserType | null;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfileProps) {
  return (
    <div className="px-6 pt-16 pb-6 space-y-8">
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 bg-sage-pale rounded-full overflow-hidden border-4 border-white shadow-md">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`} 
            alt="Avatar" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-sage-dark">{user?.name || 'Alex'}</h1>
          <p className="text-sage-medium text-sm opacity-70">{user?.email || 'alex@example.com'}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-sage-pale">
            <p className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Age</p>
            <p className="text-sm font-bold text-ink">{user?.age || 32}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-sage-pale">
            <p className="text-[10px] font-bold text-sage-medium uppercase tracking-widest opacity-60">Gender</p>
            <p className="text-sm font-bold text-ink">{user?.gender || 'Non-binary'}</p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Settings</h2>
        <div className="bg-white rounded-[18px] overflow-hidden border border-sage-pale card-shadow">
          <ProfileLink icon={<Bell size={20} className="text-sage-medium" />} label="Notifications" />
          <ProfileLink icon={<Shield size={20} className="text-sage-medium" />} label="Data Privacy" />
          <ProfileLink icon={<Moon size={20} className="text-sage-medium" />} label="Appearance" />
          <ProfileLink icon={<Settings size={20} className="text-sage-medium" />} label="Account Settings" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-sage-medium uppercase tracking-widest ml-1">Account</h2>
        <button 
          onClick={onLogout}
          className="w-full bg-white rounded-[18px] p-5 flex items-center justify-between border border-sage-pale card-shadow text-red-500 font-bold hover:bg-red-50 transition-colors"
        >
          <span className="flex items-center gap-4">
            <div className="bg-red-50 p-2 rounded-xl">
              <LogOut size={20} />
            </div>
            Sign Out
          </span>
        </button>
      </section>

      <p className="text-center text-[10px] text-sage-medium font-bold uppercase tracking-widest opacity-40">
        Member since {user?.memberSince || 'January 2024'}
      </p>
    </div>
  );
}

function ProfileLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full p-5 flex items-center justify-between border-b border-sage-pale last:border-none hover:bg-sage-pale/30 transition-colors">
      <span className="flex items-center gap-4">
        <div className="bg-sage-pale p-2 rounded-xl">
          {icon}
        </div>
        <span className="text-sm font-bold text-ink">{label}</span>
      </span>
      <ChevronRight size={18} className="text-sage-pale" />
    </button>
  );
}
