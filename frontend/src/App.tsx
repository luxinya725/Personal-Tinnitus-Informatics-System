import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, BarChart2, Clock, User as UserIcon, Plus, Pill, ChevronLeft, CheckCircle2, LogOut } from 'lucide-react';
import { Page, TinnitusLog, MedicationLog, User } from './types';
import { storage } from './lib/storage';
import { cn } from './lib/utils';

// Pages
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import DashboardPage from './pages/Dashboard';
import HistoryPage from './pages/History';
import ProfilePage from './pages/Profile';
import LogTinnitusPage from './pages/LogTinnitus';
import LogMedicationPage from './pages/LogMedication';
import SuccessPage from './pages/Success';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tinnitusLogs, setTinnitusLogs] = useState<TinnitusLog[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

  useEffect(() => {
    const loggedIn = storage.isLoggedIn();
    if (loggedIn) {
      setIsLoggedIn(true);
      setCurrentPage('home');
      setUser(storage.getUser());
      setTinnitusLogs(storage.getTinnitusLogs());
      setMedicationLogs(storage.getMedicationLogs());
    }
  }, []);

  const handleLogin = () => {
    storage.setLoggedIn(true);
    setIsLoggedIn(true);
    setCurrentPage('home');
    setUser(storage.getUser());
    setTinnitusLogs(storage.getTinnitusLogs());
    setMedicationLogs(storage.getMedicationLogs());
  };

  const handleLogout = () => {
    storage.setLoggedIn(false);
    setIsLoggedIn(false);
    setCurrentPage('login');
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const addTinnitusLog = (log: TinnitusLog) => {
    storage.addTinnitusLog(log);
    setTinnitusLogs(storage.getTinnitusLogs());
    navigate('success');
  };

  const addMedicationLog = (log: MedicationLog) => {
    storage.addMedicationLog(log);
    setMedicationLogs(storage.getMedicationLogs());
    navigate('success');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'home':
        return (
          <HomePage 
            user={user} 
            tinnitusLogs={tinnitusLogs} 
            medicationLogs={medicationLogs} 
            onNavigate={navigate} 
          />
        );
      case 'dashboard':
        return (
          <DashboardPage 
            tinnitusLogs={tinnitusLogs} 
            medicationLogs={medicationLogs} 
          />
        );
      case 'history':
        return (
          <HistoryPage 
            tinnitusLogs={tinnitusLogs} 
            medicationLogs={medicationLogs} 
            onDeleteTinnitus={(id) => {
              const newLogs = tinnitusLogs.filter(l => l.id !== id);
              storage.saveTinnitusLogs(newLogs);
              setTinnitusLogs(newLogs);
            }}
            onDeleteMedication={(id) => {
              const newLogs = medicationLogs.filter(l => l.id !== id);
              storage.saveMedicationLogs(newLogs);
              setMedicationLogs(newLogs);
            }}
          />
        );
      case 'profile':
        return <ProfilePage user={user} onLogout={handleLogout} />;
      case 'log-tinnitus':
        return <LogTinnitusPage onSave={addTinnitusLog} onBack={() => navigate('home')} />;
      case 'log-medication':
        return <LogMedicationPage onSave={addMedicationLog} onBack={() => navigate('home')} />;
      case 'success':
        return <SuccessPage onNavigate={navigate} />;
      default:
        return <HomePage user={user} tinnitusLogs={tinnitusLogs} medicationLogs={medicationLogs} onNavigate={navigate} />;
    }
  };

  const showTabs = isLoggedIn && !['login', 'log-tinnitus', 'log-medication', 'success'].includes(currentPage);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-cream shadow-xl relative flex flex-col overflow-x-hidden">
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showTabs && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center safe-area-bottom z-50">
          <TabButton 
            active={currentPage === 'home'} 
            onClick={() => navigate('home')} 
            icon={<Home size={24} />} 
            label="Home" 
          />
          <TabButton 
            active={currentPage === 'dashboard'} 
            onClick={() => navigate('dashboard')} 
            icon={<BarChart2 size={24} />} 
            label="Stats" 
          />
          <TabButton 
            active={currentPage === 'history'} 
            onClick={() => navigate('history')} 
            icon={<Clock size={24} />} 
            label="History" 
          />
          <TabButton 
            active={currentPage === 'profile'} 
            onClick={() => navigate('profile')} 
            icon={<UserIcon size={24} />} 
            label="Profile" 
          />
        </nav>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-sage-medium" : "text-gray-400 hover:text-sage-medium"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-indicator"
          className="w-1 h-1 rounded-full bg-sage-medium mt-0.5"
        />
      )}
    </button>
  );
}
