import { TinnitusLog, MedicationLog, User } from '../types';
import { subDays, setHours, setMinutes, formatISO } from 'date-fns';

const STORAGE_KEYS = {
  TINNITUS_LOGS: 'tinnitus_logs',
  MEDICATION_LOGS: 'medication_logs',
  USER: 'tinnitus_user',
  IS_LOGGED_IN: 'is_logged_in',
};

const DEFAULT_USER: User = {
  email: 'alex@example.com',
  name: 'Alex',
  age: 32,
  gender: 'Non-binary',
  memberSince: '2024-01-15',
};

const generateSeedData = () => {
  const tinnitusLogs: TinnitusLog[] = [];
  const medicationLogs: MedicationLog[] = [];
  const now = new Date();

  for (let i = 14; i >= 0; i--) {
    const date = subDays(now, i);
    
    // Tinnitus logs: 1-2 per day
    const numLogs = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < numLogs; j++) {
      const hour = 8 + Math.floor(Math.random() * 14);
      const logDate = setMinutes(setHours(date, hour), Math.floor(Math.random() * 60));
      
      // Higher severity in evening/high stress
      const isEvening = hour > 18;
      const stress: any = ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)];
      const baseSeverity = isEvening ? 5 : 2;
      const stressBonus = stress === 'High' ? 3 : stress === 'Medium' ? 1 : 0;
      
      tinnitusLogs.push({
        id: `t-${i}-${j}`,
        datetime: formatISO(logDate),
        severity: Math.min(10, baseSeverity + stressBonus + Math.floor(Math.random() * 3)),
        duration: ['<5 min', '5–30 min', '30+ min'][Math.floor(Math.random() * 3)],
        stressLevel: stress,
        mood: ['Calm', 'Normal', 'Anxious', 'Tired'][Math.floor(Math.random() * 4)] as any,
        caffeine: Math.random() > 0.5,
        alcohol: Math.random() > 0.8,
        smoking: false,
        noiseExposure: Math.random() > 0.7,
        sleepQuality: ['Good', 'OK', 'Poor'][Math.floor(Math.random() * 3)] as any,
        activity: ['Working', 'Resting', 'Exercising', 'Commuting'][Math.floor(Math.random() * 4)],
        copingStrategies: Math.random() > 0.5 ? ['Music'] : [],
        notes: '',
      });
    }

    // Medication logs: 1 per day
    const medDate = setMinutes(setHours(date, 9), 0);
    medicationLogs.push({
      id: `m-${i}`,
      datetime: formatISO(medDate),
      medicationName: 'TinnitRelief',
      dosage: '10mg',
      frequency: 'Once daily',
      reason: 'Tinnitus relief',
      perceivedEffect: 'Improved',
      notes: 'Taken with breakfast',
    });
  }

  return { tinnitusLogs, medicationLogs };
};

export const storage = {
  getTinnitusLogs: (): TinnitusLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TINNITUS_LOGS);
    if (!data) {
      const { tinnitusLogs } = generateSeedData();
      storage.saveTinnitusLogs(tinnitusLogs);
      return tinnitusLogs;
    }
    return JSON.parse(data);
  },

  saveTinnitusLogs: (logs: TinnitusLog[]) => {
    localStorage.setItem(STORAGE_KEYS.TINNITUS_LOGS, JSON.stringify(logs));
  },

  addTinnitusLog: (log: TinnitusLog) => {
    const logs = storage.getTinnitusLogs();
    storage.saveTinnitusLogs([log, ...logs]);
  },

  getMedicationLogs: (): MedicationLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEDICATION_LOGS);
    if (!data) {
      const { medicationLogs } = generateSeedData();
      storage.saveMedicationLogs(medicationLogs);
      return medicationLogs;
    }
    return JSON.parse(data);
  },

  saveMedicationLogs: (logs: MedicationLog[]) => {
    localStorage.setItem(STORAGE_KEYS.MEDICATION_LOGS, JSON.stringify(logs));
  },

  addMedicationLog: (log: MedicationLog) => {
    const logs = storage.getMedicationLogs();
    storage.saveMedicationLogs([log, ...logs]);
  },

  getUser: (): User => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : DEFAULT_USER;
  },

  saveUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  isLoggedIn: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  },

  setLoggedIn: (val: boolean) => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(val));
  },
  
  clearAll: () => {
    localStorage.clear();
  }
};
