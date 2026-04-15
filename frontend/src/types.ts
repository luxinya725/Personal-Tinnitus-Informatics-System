export type Severity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type StressLevel = 'Low' | 'Medium' | 'High';
export type Mood = 'Calm' | 'Normal' | 'Anxious' | 'Tired' | 'Other';
export type SleepQuality = 'Good' | 'OK' | 'Poor';
export type Duration = '<5 min' | '5–30 min' | '30+ min' | string;

export interface TinnitusLog {
  id: string;
  datetime: string;
  severity: number;
  duration: Duration;
  stressLevel: StressLevel;
  mood: Mood;
  caffeine: boolean;
  alcohol: boolean;
  smoking: boolean;
  noiseExposure: boolean;
  sleepQuality: SleepQuality;
  activity: string;
  copingStrategies: string[];
  notes: string;
  // Medication section
  medicationTaken?: boolean;
  medicationName?: string;
  medicationDosage?: string;
  medicationTime?: string;
  medicationFrequency?: string;
  medicationEffect?: 'Improved' | 'No change' | 'Worse' | 'Not sure';
}

export interface MedicationLog {
  id: string;
  datetime: string;
  medicationName: string;
  dosage: string;
  frequency?: string;
  reason?: string;
  perceivedEffect: 'Improved' | 'No change' | 'Worse' | 'Not sure';
  notes: string;
}

export interface User {
  email: string;
  name: string;
  age: number;
  gender: string;
  memberSince: string;
}

export type Page = 'home' | 'dashboard' | 'history' | 'profile' | 'log-tinnitus' | 'log-medication' | 'success' | 'login';
