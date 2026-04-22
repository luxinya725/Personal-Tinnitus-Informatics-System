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
  const [editingTinnitusLog, setEditingTinnitusLog] = useState<TinnitusLog | null>(null);
  const [editingMedicationLog, setEditingMedicationLog] = useState<MedicationLog | null>(null);

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
    const isEdit = tinnitusLogs.some(l => l.id === log.id);
    if (isEdit) {
      storage.updateTinnitusLog(log);
    } else {
      storage.addTinnitusLog(log);
    }
    setTinnitusLogs(storage.getTinnitusLogs());
    setEditingTinnitusLog(null);
    navigate('success');
  };

  const addMedicationLog = (log: MedicationLog) => {
    const isEdit = medicationLogs.some(l => l.id === log.id);
    if (isEdit) {
      storage.updateMedicationLog(log);
    } else {
      storage.addMedicationLog(log);
    }
    setMedicationLogs(storage.getMedicationLogs());
    setEditingMedicationLog(null);
    navigate('success');
  };

  const showTabs = isLoggedIn && !['login', 'log-tinnitus', 'log-medication', 'success'].includes(currentPage);

  return (
    <div className="app-container">
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          {!isLoggedIn && currentPage === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoginPage onLogin={handleLogin} />
            </motion.div>
          )}

          {currentPage === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full h-full"
            >
              <SuccessPage onNavigate={navigate} />
            </motion.div>
          )}

          {currentPage === 'log-tinnitus' && (
            <motion.div
              key="log-tinnitus"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full h-full"
            >
              <LogTinnitusPage 
                onSave={addTinnitusLog} 
                onBack={() => {
                  setEditingTinnitusLog(null);
                  navigate('home');
                }} 
                initialData={editingTinnitusLog}
              />
            </motion.div>
          )}

          {currentPage === 'log-medication' && (
            <motion.div
              key="log-medication"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full h-full"
            >
              <LogMedicationPage 
                onSave={addMedicationLog} 
                onBack={() => {
                  setEditingMedicationLog(null);
                  navigate('home');
                }} 
                initialData={editingMedicationLog}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoggedIn && (
          <div className="w-full h-full">
            <div style={{ display: currentPage === 'home' ? 'block' : 'none' }}>
              <HomePage user={user} tinnitusLogs={tinnitusLogs} medicationLogs={medicationLogs} onNavigate={navigate} />
            </div>
            <div style={{ display: currentPage === 'dashboard' ? 'block' : 'none' }}>
              <DashboardPage tinnitusLogs={tinnitusLogs} medicationLogs={medicationLogs} />
            </div>
            <div style={{ display: currentPage === 'history' ? 'block' : 'none' }}>
              <HistoryPage 
                tinnitusLogs={tinnitusLogs} 
                medicationLogs={medicationLogs} 
                isActive={currentPage === 'history'}
                onEditTinnitus={(log) => {
                  setEditingTinnitusLog(log);
                  navigate('log-tinnitus');
                }}
                onEditMedication={(log) => {
                  setEditingMedicationLog(log);
                  navigate('log-medication');
                }}
                onDeleteTinnitus={(id) => {
                  if (window.confirm('Are you sure you want to delete this entry?')) {
                    const newLogs = tinnitusLogs.filter(l => l.id !== id);
                    setTinnitusLogs(newLogs);
                    storage.saveTinnitusLogs(newLogs);
                  }
                }}
                onDeleteMedication={(id) => {
                  if (window.confirm('Are you sure you want to delete this medication entry?')) {
                    const newLogs = medicationLogs.filter(l => l.id !== id);
                    setMedicationLogs(newLogs);
                    storage.saveMedicationLogs(newLogs);
                  }
                }}
              />
            </div>
            <div style={{ display: currentPage === 'profile' ? 'block' : 'none' }}>
              <ProfilePage user={user} onLogout={handleLogout} />
            </div>
          </div>
        )}
      </main>

      {showTabs && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center safe-area-bottom z-50">
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
