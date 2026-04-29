import { TinnitusLog, MedicationLog, User } from '../types';
import rawData from './tinnitus_data.json';

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

// Maps the 0–4 tinnitus scale from the JSON to the app's 0–10 scale
const mapSeverity = (value: number | null): number => {
  if (value === null || value === undefined) return 0;
  return Math.round((value / 4) * 10);
};

// Maps lifestyle stress strings to the app's Low/Medium/High enum
const mapStress = (value: string | null): 'Low' | 'Medium' | 'High' => {
  if (!value) return 'Low';
  const v = value.toLowerCase();
  if (v === 'yes' || v === 'a lot') return 'High';
  if (v === 'moderate') return 'Medium';
  return 'Low'; // 'little', null, etc.
};

// Maps sleep_quality (1–5 float) to the app's Good/OK/Poor enum
const mapSleepQuality = (value: number | null): 'Good' | 'OK' | 'Poor' => {
  if (value === null || value === undefined) return 'OK';
  if (value >= 4) return 'Good';
  if (value >= 2.5) return 'OK';
  return 'Poor';
};

// Maps mood_avg (1–10 float) to the app's mood enum
const mapMood = (value: number | null): 'Calm' | 'Normal' | 'Anxious' | 'Tired' => {
  if (value === null || value === undefined) return 'Normal';
  if (value >= 7) return 'Calm';
  if (value >= 4) return 'Normal';
  if (value >= 2) return 'Anxious';
  return 'Tired';
};

// Maps caffeine string to boolean
const mapCaffeine = (value: string | null): boolean => {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === 'moderate' || v === 'a lot' || v === 'yes';
};

// Maps alcohol string to boolean
const mapAlcohol = (value: string | null): boolean => {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === 'little' || v === 'moderate' || v === 'a lot' || v === 'yes';
};

// Maps tobacco string to boolean (used as smoking proxy)
const mapSmoking = (value: string | null): boolean => {
  if (!value) return false;
  return value.toLowerCase() !== 'no';
};

// Maps activity level string to a display label
const mapActivity = (value: string | null): string => {
  if (!value) return 'Resting';
  const v = value.toLowerCase();
  if (v === 'active' || v === 'very active') return 'Exercising';
  if (v === 'sedentary') return 'Resting';
  if (v === 'lightly active') return 'Working';
  return 'Resting';
};

type RawEntry = {
  date: string;
  symptom_tinnitus: number | null;
  symptom_pulsating_tinnitus: number | null;
  lifestyle_stress: string | null;
  mood_avg: number | null;
  lifestyle_caffeine: string | null;
  lifestyle_alcohol: string | null;
  lifestyle_tobacco: string | null;
  active_activity_level: string | null;
  sleep_quality: number | null;
  [key: string]: unknown;
};

const MEDICATION_FIELDS: Record<string, { name: string; dosage: string; reason: string }> = {
  'lifestyle_atarax_(anxiety_med)': {
    name: 'Atarax',
    dosage: 'As prescribed',
    reason: 'Anxiety / tinnitus relief',
  },
  'active_nässpray_2x_(recept)': {
    name: 'Nässpray',
    dosage: '2x (recept)',
    reason: 'Nasal / pressure relief',
  },
  'active_tryckutjämning_10x': {
    name: 'Tryckutjämning',
    dosage: '10x',
    reason: 'Pressure equalisation',
  },
};

// Keys as they appear in the actual JSON (with unicode escapes resolved at runtime)
const MEDICATION_JSON_KEYS = [
  'lifestyle_atarax_(anxiety_med)',
  'active_n\u00e4sspray_2x_(recept)',      // nässpray
  'active_tryckutj\u00e4mning_10x',         // tryckutjämning
];

const MEDICATION_DISPLAY: Record<string, { name: string; dosage: string; reason: string }> = {
  'lifestyle_atarax_(anxiety_med)': {
    name: 'Atarax',
    dosage: 'As prescribed',
    reason: 'Anxiety / tinnitus relief',
  },
  'active_n\u00e4sspray_2x_(recept)': {
    name: 'Nässpray',
    dosage: '2x (recept)',
    reason: 'Nasal / pressure relief',
  },
  'active_tryckutj\u00e4mning_10x': {
    name: 'Tryckutjämning',
    dosage: '10x',
    reason: 'Pressure equalisation',
  },
};

const importRealData = (): { tinnitusLogs: TinnitusLog[]; medicationLogs: MedicationLog[] } => {
  const tinnitusLogs: TinnitusLog[] = [];
  const medicationLogs: MedicationLog[] = [];

  (rawData as RawEntry[]).forEach((entry, index) => {
    const dateStr = entry.date; // e.g. "2025-09-22"
    const datetime = `${dateStr}T09:00:00`;

    // --- Tinnitus log (one per day, always created) ---
    const tinnitusLog: TinnitusLog = {
      id: `real-t-${index}`,
      datetime,
      severity: mapSeverity(entry.symptom_tinnitus),
      duration: entry.symptom_tinnitus ? '30+ min' : '<5 min',
      stressLevel: mapStress(entry.lifestyle_stress),
      mood: mapMood(entry.mood_avg),
      caffeine: mapCaffeine(entry.lifestyle_caffeine),
      alcohol: mapAlcohol(entry.lifestyle_alcohol),
      smoking: mapSmoking(entry.lifestyle_tobacco),
      noiseExposure: false, // not tracked in source data
      sleepQuality: mapSleepQuality(entry.sleep_quality),
      activity: mapActivity(entry.active_activity_level),
      copingStrategies: [],
      notes: entry.symptom_pulsating_tinnitus
        ? `Pulsating tinnitus severity: ${entry.symptom_pulsating_tinnitus}`
        : '',
    };

    tinnitusLogs.push(tinnitusLog);

    // --- Medication logs (one per medication field that is non-null on this day) ---
    MEDICATION_JSON_KEYS.forEach((key, medIndex) => {
      const value = entry[key];
      if (value !== null && value !== undefined) {
        const meta = MEDICATION_DISPLAY[key];
        medicationLogs.push({
          id: `real-m-${index}-${medIndex}`,
          datetime,
          medicationName: meta.name,
          dosage: meta.dosage,
          frequency: 'As needed',
          reason: meta.reason,
          perceivedEffect: 'Unknown',
          notes: typeof value === 'string' ? value : '',
        });
      }
    });
  });

  // Most-recent first
  tinnitusLogs.reverse();
  medicationLogs.reverse();

  return { tinnitusLogs, medicationLogs };
};

export const storage = {
  getTinnitusLogs: (): TinnitusLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TINNITUS_LOGS);
    if (!data) {
      const { tinnitusLogs } = importRealData();
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
      const { medicationLogs } = importRealData();
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

  // Call this once to wipe localStorage and reload from the real JSON
  clearAll: () => {
    localStorage.clear();
  },
};