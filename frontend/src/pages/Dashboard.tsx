import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, LabelList, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  ScatterChart, Scatter
} from 'recharts';
import { Filter, Calendar, Info, TrendingUp, AlertCircle, Zap, Pill, Activity, Brain, Heart, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { TinnitusLog, MedicationLog } from '../types';
import { cn } from '../lib/utils';
import { format, subDays, addDays, isAfter, parseISO, startOfDay, eachDayOfInterval, getDay, differenceInDays } from 'date-fns';

interface DashboardProps {
  tinnitusLogs: TinnitusLog[];
  medicationLogs: MedicationLog[];
}

// ------------------------------------------------------------------
// Helpers - normalise legacy / new-schema / raw-data fields
// ------------------------------------------------------------------

const getStressLevel = (log: TinnitusLog): number => {
  if ((log as any).lifestyle?.stress != null) return (log as any).lifestyle.stress;
  const raw = (log as any).rawData?.lifestyle_stress;
  if (raw != null) {
    const s = String(raw).toLowerCase();
    if (s === 'a lot' || s === 'yes') return 3;
    if (s === 'moderate') return 2;
    if (s === 'little') return 1;
  }
  const s = log.stressLevel;
  if (s === 'High') return 3;
  if (s === 'Medium') return 2;
  if (s === 'Low') return 1;
  return 0;
};

const getSleepQualityLevel = (log: TinnitusLog): number => {
  if ((log as any).sleepQualityValue != null) return (log as any).sleepQualityValue as number;
  const raw = (log as any).rawData?.sleep_quality;
  if (raw != null) return Number(raw);
  if (log.sleepQuality === 'Poor') return 1;
  if (log.sleepQuality === 'OK') return 3;
  if (log.sleepQuality === 'Good') return 5;
  return 3;
};

const getDoomscrolling = (log: TinnitusLog): number => {
  const d = (log as any).lifestyle?.doomscrolling;
  if (d != null) return d;
  const raw = (log as any).rawData?.lifestyle_doomscrolling;
  if (raw != null) {
    const s = String(raw).toLowerCase();
    if (s === 'a lot') return 3;
    if (s === 'moderate') return 2;
    if (s === 'little') return 1;
  }
  return 0;
};

const getCaffeine = (log: TinnitusLog): boolean => {
  if ((log as any).lifestyle?.caffeine != null) return (log as any).lifestyle.caffeine > 0;
  const raw = (log as any).rawData?.lifestyle_caffeine;
  if (raw != null) {
    const s = String(raw).toLowerCase();
    return s !== 'no' && s !== 'none';
  }
  return log.caffeine ?? false;
};

const getAnxiety = (log: TinnitusLog): number => {
  const a = (log as any).symptoms?.anxiety;
  if (a != null) return a;
  const raw = (log as any).rawData?.symptom_anxiety;
  if (raw != null) return Number(raw);
  return 0;
};

const mapStressNumeric = (log: TinnitusLog): number => {
  const raw = (log as any).rawData?.lifestyle_stress;
  if (raw != null) {
    const s = String(raw).toLowerCase();
    if (s === 'a lot' || s === 'yes') return 3;
    if (s === 'moderate') return 2;
    if (s === 'little') return 1;
  }
  return 0;
};

// --- heatmap helpers ---

const HEATMAP_VARS = [
  { key: 'mood_avg', label: 'Mood' },
  { key: 'energy_avg', label: 'Energy' },
  { key: 'sleep_quality', label: 'Sleep' },
  { key: 'cycle_phase', label: 'Cycle Phase' },
  { key: 'symptom_anxiety', label: 'Anxiety' },
  { key: 'symptom_intrusive_thoughts', label: 'Intrusive Thoughts' },
  { key: 'symptom_muscle_tension', label: 'Muscle Tension' },
  { key: 'symptom_mood_swings', label: 'Mood Swings' },
  { key: 'symptom_neck', label: 'Neck Pain' },
  { key: 'symptom_irritability', label: 'Irritability' },
  { key: 'symptom_headache', label: 'Headache' },
  { key: 'symptom_fatigue', label: 'Fatigue' },
  { key: 'symptom_nausea', label: 'Nausea' },
  { key: 'symptom_menstrual_cramps', label: 'Cramps' },
  { key: 'symptom_back_lower_pain', label: 'Back Pain' },
  { key: 'lifestyle_stress', label: 'Stress' },
  { key: 'lifestyle_caffeine', label: 'Caffeine' },
  { key: 'lifestyle_doomscrolling', label: 'Doomscrolling' },
  { key: 'lifestyle_time_outside', label: 'Time Outside' },
  { key: 'lifestyle_video_games', label: 'Video Games' },
  { key: 'lifestyle_alcohol', label: 'Alcohol' },
  { key: 'lifestyle_physiotherapist_exercises', label: 'Physio' },
  { key: 'lifestyle_tobacco', label: 'Tobacco' },
  { key: 'active_activity_level', label: 'Activity' },
  { key: 'sex_drive', label: 'Sex Drive' },
] as const;

const VAR_ORDERS: Record<string, string[]> = {
  mood_avg: ['Low', 'Med', 'High'],
  energy_avg: ['Low', 'Med', 'High'],
  sleep_quality: ['Poor', 'OK', 'Good'],
  symptom_anxiety: ['None', 'Mild', 'Mod.'],
  symptom_intrusive_thoughts: ['None', 'Mild', 'Mod.'],
  symptom_muscle_tension: ['None', 'Mild', 'Mod.'],
  symptom_mood_swings: ['None', 'Mild', 'Mod.'],
  symptom_neck: ['None', 'Mild', 'Mod.'],
  symptom_irritability: ['None', 'Mild', 'Mod.'],
  symptom_headache: ['None', 'Mild', 'Mod.'],
  symptom_fatigue: ['None', 'Mild', 'Mod.'],
  symptom_nausea: ['None', 'Mild', 'Mod.'],
  symptom_menstrual_cramps: ['None', 'Mild', 'Mod.'],
  symptom_back_lower_pain: ['None', 'Mild', 'Mod.'],
  lifestyle_stress: ['Low', 'Med', 'High'],
  lifestyle_caffeine: ['Low', 'Med', 'High'],
  lifestyle_doomscrolling: ['Low', 'Med', 'High'],
  lifestyle_time_outside: ['Low', 'Med', 'High'],
  lifestyle_video_games: ['Low', 'Med', 'High'],
  lifestyle_alcohol: ['Low', 'Med', 'High'],
  lifestyle_physiotherapist_exercises: ['No', 'Yes'],
  lifestyle_tobacco: ['Low', 'Med', 'High'],
  active_activity_level: ['Sedentary', 'Light', 'Active', 'Very Active'],
  sex_drive: ['Low', 'Medium', 'High'],
  cycle_phase: ['Period', 'Follicular', 'Ovulation', 'Luteal'],
};

function getBinLabel(value: any, varKey: string): string | null {
  // Numeric symptoms 0-4
  if (varKey.startsWith('symptom_')) {
    if (value == null || value === 0) return 'None';
    if (value <= 2) return 'Mild';
    return 'Mod.';
  }
  // Mood
  if (varKey === 'mood_avg') {
    if (value == null) return null;
    if (value <= 4) return 'Low';
    if (value <= 7) return 'Med';
    return 'High';
  }
  // Energy
  if (varKey === 'energy_avg') {
    if (value == null) return null;
    if (value <= 2) return 'Low';
    if (value <= 3.5) return 'Med';
    return 'High';
  }
  // Sleep
  if (varKey === 'sleep_quality') {
    if (value == null) return null;
    if (value <= 2.5) return 'Poor';
    if (value <= 4) return 'OK';
    return 'Good';
  }
  // Lifestyle factors with string values
  if (varKey.startsWith('lifestyle_')) {
    if (value == null) return 'Low';
    const s = String(value).toLowerCase();
    if (s === 'a lot' || s === 'yes') return 'High';
    if (s === 'moderate') return 'Med';
    if (s === 'no' || s === 'none') return 'No';
    return 'Low'; // 'little'
  }
  // Activity level
  if (varKey === 'active_activity_level') {
    if (value == null) return null;
    const s = String(value).toLowerCase();
    if (s === 'sedentary') return 'Sedentary';
    if (s === 'lightly active') return 'Light';
    if (s === 'active') return 'Active';
    if (s === 'very active') return 'Very Active';
    return null;
  }
  // Sex drive
  if (varKey === 'sex_drive') {
    if (value == null) return null;
    const s = String(value).toLowerCase();
    if (s === 'low') return 'Low';
    if (s === 'medium') return 'Medium';
    if (s === 'high') return 'High';
    return null;
  }
  // Cycle phase
  if (varKey === 'cycle_phase') {
    return value ?? null;
  }
  return null;
}

// --- raw-data helpers for the new sections ---

const getRawValue = (log: TinnitusLog, key: string): any => (log as any).rawData?.[key];

const hasSymptom = (log: TinnitusLog, key: string): boolean => {
  const v = getRawValue(log, key);
  return v != null && typeof v === 'number' && v > 0;
};

const hasLifestyleFactor = (log: TinnitusLog, key: string): boolean => {
  const v = getRawValue(log, key);
  if (v == null) return false;
  if (typeof v === 'number') return v > 0;
  const s = String(v).toLowerCase();
  return s !== 'no' && s !== 'none';
};

// ------------------------------------------------------------------
// Tooltip for the multi-factor timeline
// ------------------------------------------------------------------

const rawMap: Record<string, string> = {
  Tinnitus: 'severity',
  '7-Day Avg': 'rolling7',
  Mood: 'moodRaw',
  Energy: 'energyRaw',
  Sleep: 'sleepRaw',
  Anxiety: 'anxietyRaw',
  'Intrusive Thoughts': 'intrusiveThoughtsRaw',
  'Muscle Tension': 'muscleTensionRaw',
  'Neck Pain': 'neckPainRaw',
};

const scales: Record<string, string> = {
  Tinnitus: '/10', '7-Day Avg': '/10', Mood: '/10', Energy: '/5', Sleep: '/5',
  Anxiety: '/4', 'Intrusive Thoughts': '/4', 'Muscle Tension': '/4', 'Neck Pain': '/4',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 rounded-2xl border border-sage-pale/50 shadow-lg min-w-[140px]">
      <p className="text-[10px] font-extrabold text-sage-dark mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => {
          const name = entry.name;
          if (name === 'Medication') {
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
                <span className="text-sage-medium">Medication:</span>
                <span className="font-bold text-blue-500">Taken</span>
              </div>
            );
          }
          const rawKey = rawMap[name];
          const rawValue = rawKey ? data[rawKey] : entry.value;
          const displayValue = rawValue != null 
            ? `${rawValue.toFixed(1)}${scales[name] || ''}` 
            : 'No data';
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-sage-medium">{name}:</span>
              <span className="font-bold text-sage-dark">{displayValue}</span>
            </div>
          );
        })}
        {data.count > 1 && (
          <p className="text-[9px] text-sage-medium opacity-50 pt-1">{data.count} logs</p>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Reusable factor-analysis bars
// ------------------------------------------------------------------

interface FactorItem {
  label: string;
  withSeverity: number;
  withoutSeverity: number;
  delta: number;
  sampleSize: number;
}

function FactorAnalysis({ items }: { items: FactorItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-sage-medium opacity-50 text-center py-4">Not enough data</p>;
  }
  return (
    <div className="space-y-3">
      {items.map(item => {
        const maxSev = 10;
        const withPct = (item.withSeverity / maxSev) * 100;
        const withoutPct = (item.withoutSeverity / maxSev) * 100;
        const isPositiveDelta = item.delta > 0;
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-sage-dark">{item.label}</span>
              <div className="flex items-center gap-2">
                {item.sampleSize > 0 && (
                  <span className="text-[9px] text-sage-medium opacity-50">n={item.sampleSize}</span>
                )}
                <span className={cn(
                  'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                  item.delta > 0.5 ? 'bg-red-50 text-red-500'
                    : item.delta < -0.5 ? 'bg-green-50 text-green-600'
                    : 'bg-sage-pale/50 text-sage-medium'
                )}>
                  {item.delta > 0 ? '+' : ''}{item.delta}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-sage-medium w-12 shrink-0 opacity-60">With</span>
                <div className="flex-1 bg-sage-pale/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${withPct}%`,
                      backgroundColor: isPositiveDelta ? '#ef4444' : '#8A9A5B',
                    }}
                  />
                </div>
                <span className="text-[9px] font-bold text-sage-dark w-6 text-right">
                  {item.withSeverity}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-sage-medium w-12 shrink-0 opacity-60">Without</span>
                <div className="flex-1 bg-sage-pale/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${withoutPct}%`, backgroundColor: '#C1CDC1' }}
                  />
                </div>
                <span className="text-[9px] font-bold text-sage-dark w-6 text-right">
                  {item.withoutSeverity}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// Calendar Heatmap sub-component
// ------------------------------------------------------------------

function CalendarHeatmap({ logs }: { logs: TinnitusLog[] }) {
  const data = useMemo(() => {
    if (logs.length === 0) return { weeks: [] };

    const dates = logs.map(l => parseISO(l.datetime));
    const minDate = startOfDay(dates.reduce((a, b) => (a < b ? a : b)));
    const maxDate = startOfDay(dates.reduce((a, b) => (a > b ? a : b)));

    const severityMap: Record<string, number> = {};
    logs.forEach(log => {
      const dayStr = format(parseISO(log.datetime), 'yyyy-MM-dd');
      severityMap[dayStr] = Math.max(severityMap[dayStr] || 0, log.severity);
    });

    // Start from Monday of first week
    let weekStart = startOfDay(minDate);
    while (getDay(weekStart) !== 1) {
      weekStart = subDays(weekStart, 1);
    }

    // End at Sunday of last week
    let weekEnd = startOfDay(maxDate);
    while (getDay(weekEnd) !== 0) {
      weekEnd = addDays(weekEnd, 1);
    }

    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weeks: { days: { date: Date; severity: number | null; dateStr: string }[]; label: string }[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7);
      weeks.push({
        days: weekDays.map(day => {
          const dStr = format(day, 'yyyy-MM-dd');
          return { date: day, severity: severityMap[dStr] ?? null, dateStr: dStr };
        }),
        label: format(weekDays[0], 'MMM d'),
      });
    }

    return { weeks };
  }, [logs]);

  const getCellColor = (severity: number | null) => {
    if (severity == null) return '#f3f4f6';
    if (severity <= 2) return '#E8EED8';
    if (severity <= 3.5) return '#C1CDC1';
    if (severity <= 5) return '#8A9A5B';
    if (severity <= 7) return '#D4A373';
    return '#ef4444';
  };

  const getTextColor = (severity: number | null) => {
    if (severity == null) return '#9CA3AF';
    if (severity <= 3.5) return '#556B2F';
    return '#ffffff';
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-2">
      {/* Day of week header */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-1">
        <div />
        {dayLabels.map((d, i) => (
          <div key={i} className="text-[9px] font-bold text-sage-medium text-center">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto">
        {data.weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 items-center">
            <div className="text-[9px] font-bold text-sage-medium text-right pr-1.5">{week.label}</div>
            {week.days.map((day, di) => (
              <div
                key={di}
                className="aspect-square rounded-md flex items-center justify-center text-[10px] font-black"
                style={{
                  backgroundColor: getCellColor(day.severity),
                  color: getTextColor(day.severity),
                }}
                title={day.severity != null ? `${format(day.date, 'MMM d')}: ${day.severity.toFixed(1)}/10` : `${format(day.date, 'MMM d')}: No data`}
              >
                {format(day.date, 'd')}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-[9px] font-bold text-sage-medium opacity-50">None</span>
        {['#E8EED8', '#C1CDC1', '#8A9A5B', '#D4A373', '#ef4444'].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[9px] font-bold text-sage-medium opacity-50">Severe</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Interaction Heatmap sub-component
// ------------------------------------------------------------------

function InteractionHeatmap({ tinnitusLogs, xVar, yVar }: { tinnitusLogs: TinnitusLog[]; xVar: string; yVar: string }) {
  const data = useMemo(() => {
    const logs = tinnitusLogs.filter(l => l.severity > 0);
    const xLabels = new Set<string>();
    const yLabels = new Set<string>();
    const cells: Record<string, { sum: number; count: number }> = {};

    logs.forEach(log => {
      const raw = (log as any).rawData;
      const xVal = getBinLabel(raw?.[xVar], xVar);
      const yVal = getBinLabel(raw?.[yVar], yVar);
      if (xVal == null || yVal == null) return;

      xLabels.add(xVal);
      yLabels.add(yVal);

      const key = `${xVal}|${yVal}`;
      if (!cells[key]) cells[key] = { sum: 0, count: 0 };
      cells[key].sum += log.severity;
      cells[key].count++;
    });

    const xOrder = (VAR_ORDERS[xVar] || []).filter(l => xLabels.has(l));
    const yOrder = (VAR_ORDERS[yVar] || []).filter(l => yLabels.has(l));

    const grid = yOrder.map(y =>
      xOrder.map(x => {
        const cell = cells[`${x}|${y}`];
        return {
          x,
          y,
          avgSeverity: cell ? parseFloat((cell.sum / cell.count).toFixed(1)) : null,
          count: cell?.count ?? 0,
        };
      })
    );

    return { grid, xOrder, yOrder };
  }, [tinnitusLogs, xVar, yVar]);

  if (data.grid.length === 0 || data.xOrder.length === 0) {
    return <p className="text-xs text-sage-medium opacity-50 text-center py-6">Not enough data for this combination</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${data.xOrder.length}, 1fr)` }}>
        {/* Corner */}
        <div />
        {/* X headers */}
        {data.xOrder.map(x => (
          <div key={x} className="text-[9px] font-extrabold text-sage-medium text-center pb-1">
            {x}
          </div>
        ))}

        {/* Rows */}
        {data.grid.map((row, ri) => (
          <React.Fragment key={data.yOrder[ri]}>
            {/* Y header */}
            <div className="text-[9px] font-extrabold text-sage-medium text-right pr-2 flex items-center justify-end">
              {data.yOrder[ri]}
            </div>
            {/* Cells */}
            {row.map((cell, ci) => {
              const intensity = cell.avgSeverity != null ? cell.avgSeverity / 10 : 0;
              const bg = cell.avgSeverity != null
                ? `rgba(220, 60, 60, ${0.08 + intensity * 0.82})`
                : '#f3f4f6';
              const textColor = cell.avgSeverity != null && cell.avgSeverity > 6 ? 'white' : '#556B2F';
              return (
                <div
                  key={ci}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center relative min-h-[44px]"
                  style={{ backgroundColor: bg }}
                  title={cell.avgSeverity != null ? `Avg: ${cell.avgSeverity}/10 (${cell.count} days)` : 'No data'}
                >
                  {cell.avgSeverity != null ? (
                    <>
                      <span className="text-[11px] font-black" style={{ color: textColor }}>
                        {cell.avgSeverity}
                      </span>
                      <span className="text-[8px] font-bold opacity-60" style={{ color: textColor }}>
                        n={cell.count}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-300">-</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-[9px] font-bold text-sage-medium opacity-50">0</span>
        <div className="w-16 h-2 rounded-full bg-gradient-to-r from-gray-100 to-red-500" />
        <span className="text-[9px] font-bold text-sage-medium opacity-50">10</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------

const OVERLAY_CONFIG = [
  { key: 'mood', label: 'Mood', color: '#D4A373' },
  { key: 'energy', label: 'Energy', color: '#6B8E9B' },
  { key: 'sleep', label: 'Sleep', color: '#9B8AA5' },
  { key: 'anxiety', label: 'Anxiety', color: '#E07A7A' },
  { key: 'intrusiveThoughts', label: 'Intrusive Thoughts', color: '#B8A88A' },
  { key: 'muscleTension', label: 'Muscle Tension', color: '#8A9B8A' },
  { key: 'neckPain', label: 'Neck Pain', color: '#9B8A8A' },
];

export default function DashboardPage({ tinnitusLogs, medicationLogs }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30 | 90 | 'all'>(30);
  const [offsetDays, setOffsetDays] = useState(0);
  const [activeOverlays, setActiveOverlays] = useState<Record<string, boolean>>({
    mood: false, energy: false, sleep: false, anxiety: false,
    intrusiveThoughts: false, muscleTension: false, neckPain: false,
  });
  const [factorTab, setFactorTab] = useState<'symptoms' | 'lifestyle'>('symptoms');
  const [xVar, setXVar] = useState<string>('mood_avg');
  const [yVar, setYVar] = useState<string>('sleep_quality');

  const referenceDate = useMemo(() => {
    if (tinnitusLogs.length === 0) return new Date();
    const latest = tinnitusLogs.reduce((max, log) => {
      const d = new Date(log.datetime).getTime();
      return d > max ? d : max;
    }, 0);
    return subDays(new Date(latest), offsetDays);
  }, [tinnitusLogs, offsetDays]);

  const filteredTinnitus = useMemo(() => {
    if (timeRange === 'all') {
      return [...tinnitusLogs].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }
    const cutoff = subDays(referenceDate, timeRange);
    return tinnitusLogs
      .filter(log => isAfter(parseISO(log.datetime), cutoff))
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [tinnitusLogs, timeRange, referenceDate]);

  const filteredMedication = useMemo(() => {
    if (timeRange === 'all') {
      return [...medicationLogs].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }
    const cutoff = subDays(referenceDate, timeRange);
    return medicationLogs.filter(log => isAfter(parseISO(log.datetime), cutoff));
  }, [medicationLogs, timeRange, referenceDate]);

  // 1. Severity over time - with overlay values, rolling avg & med markers
  const severityData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(referenceDate, timeRange - 1),
      end: referenceDate,
    });

    const medDates = new Set(
      filteredMedication.map(m => format(parseISO(m.datetime), 'yyyy-MM-dd'))
    );

    const baseData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = filteredTinnitus.filter(
        log => format(parseISO(log.datetime), 'yyyy-MM-dd') === dayStr
      );
      const avgSeverity =
        dayLogs.length > 0
          ? dayLogs.reduce((acc, curr) => acc + curr.severity, 0) / dayLogs.length
          : null;

      const rawEntries = dayLogs.map(l => (l as any).rawData).filter(Boolean);
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

      const mood = avg(rawEntries.map((e: any) => e.mood_avg).filter((v: any) => v != null));
      const energy = avg(rawEntries.map((e: any) => e.energy_avg).filter((v: any) => v != null));
      const sleep = avg(rawEntries.map((e: any) => e.sleep_quality).filter((v: any) => v != null));
      const anxiety = avg(rawEntries.map((e: any) => e.symptom_anxiety).filter((v: any) => v != null));
      const intrusiveThoughts = avg(rawEntries.map((e: any) => e.symptom_intrusive_thoughts).filter((v: any) => v != null));
      const muscleTension = avg(rawEntries.map((e: any) => e.symptom_muscle_tension).filter((v: any) => v != null));
      const neckPain = avg(rawEntries.map((e: any) => e.symptom_neck_pain ?? e.symptom_neck).filter((v: any) => v != null));

      return {
        date: format(day, timeRange === 'all' ? 'MMM d' : (timeRange as number) <= 7 ? 'EEE' : 'MMM d'),
        severity: avgSeverity !== null ? parseFloat(avgSeverity.toFixed(1)) : null,
        count: dayLogs.length,
        medicationMarker: avgSeverity !== null && medDates.has(dayStr) ? avgSeverity : null,
        moodRaw: mood,
        energyRaw: energy,
        sleepRaw: sleep,
        anxietyRaw: anxiety,
        intrusiveThoughtsRaw: intrusiveThoughts,
        muscleTensionRaw: muscleTension,
        neckPainRaw: neckPain,
        mood: mood,
        energy: energy != null ? energy * 2 : null,
        sleepQuality: sleep != null ? sleep * 2 : null,
        anxiety: anxiety != null ? anxiety * 2.5 : null,
        intrusiveThoughts: intrusiveThoughts != null ? intrusiveThoughts * 2.5 : null,
        muscleTension: muscleTension != null ? muscleTension * 2.5 : null,
        neckPain: neckPain != null ? neckPain * 2.5 : null,
      };
    });

    // Compute rolling 7-day average
    return baseData.map((day, index) => {
      const window = baseData.slice(Math.max(0, index - 6), index + 1);
      const validSevs = window.map(d => d.severity).filter((v): v is number => v != null);
      const rolling = validSevs.length > 0
        ? parseFloat((validSevs.reduce((a, b) => a + b, 0) / validSevs.length).toFixed(1))
        : null;
      return { ...day, rolling7: rolling };
    });
  }, [filteredTinnitus, timeRange, filteredMedication]);

  // 2. Weekly distribution
  const weeklyData = useMemo(() => {
    const days = [
      { name: 'Mon', iso: 1, totalSeverity: 0, count: 0 },
      { name: 'Tue', iso: 2, totalSeverity: 0, count: 0 },
      { name: 'Wed', iso: 3, totalSeverity: 0, count: 0 },
      { name: 'Thu', iso: 4, totalSeverity: 0, count: 0 },
      { name: 'Fri', iso: 5, totalSeverity: 0, count: 0 },
      { name: 'Sat', iso: 6, totalSeverity: 0, count: 0 },
      { name: 'Sun', iso: 0, totalSeverity: 0, count: 0 },
    ];

    filteredTinnitus.forEach(log => {
      const dow = getDay(parseISO(log.datetime));
      const bucket = days.find(d => d.iso === dow);
      if (bucket) {
        bucket.totalSeverity += log.severity;
        bucket.count++;
      }
    });

    const maxAvg = Math.max(
      ...days.map(d => (d.count > 0 ? d.totalSeverity / d.count : 0)),
      1
    );

    return days.map(d => {
      const avg = d.count > 0 ? parseFloat((d.totalSeverity / d.count).toFixed(1)) : 0;
      return {
        name: d.name,
        avgSeverity: avg,
        count: d.count,
        intensity: avg / maxAvg,
      };
    });
  }, [filteredTinnitus]);

  // 3. Cycle phase analysis
  const cyclePhaseData = useMemo(() => {
    const phases = ['Period', 'Follicular', 'Ovulation', 'Luteal'];
    return phases
      .map(phase => {
        const logs = filteredTinnitus.filter(log => {
          const raw = (log as any).rawData;
          return raw?.cycle_phase === phase;
        });
        const avg = logs.length > 0 ? logs.reduce((acc, l) => acc + l.severity, 0) / logs.length : 0;
        return {
          name: phase,
          avgSeverity: parseFloat(avg.toFixed(1)),
          count: logs.length,
        };
      })
      .filter(p => p.count > 0);
  }, [filteredTinnitus]);

  // 4. Symptom load - avg tinnitus by number of other symptoms logged
  const symptomLoadData = useMemo(() => {
    const symptomKeys = [
      'symptom_anxiety', 'symptom_intrusive_thoughts', 'symptom_muscle_tension',
      'symptom_mood_swings', 'symptom_neck', 'symptom_neck_pain', 'symptom_irritability',
      'symptom_headache', 'symptom_fatigue', 'symptom_nausea', 'symptom_chest_pain',
      'symptom_menstrual_cramps', 'symptom_period_pains', 'symptom_back_lower_pain',
      'symptom_constipation', 'symptom_diarrhea', 'symptom_pms', 'symptom_menstrual_bloating',
    ];

    const buckets: Record<string, { sum: number; count: number }> = {
      '0': { sum: 0, count: 0 },
      '1': { sum: 0, count: 0 },
      '2': { sum: 0, count: 0 },
      '3+': { sum: 0, count: 0 },
    };

    filteredTinnitus.forEach(log => {
      const sev = log.severity;
      const count = symptomKeys.reduce((acc, key) => {
        const v = getRawValue(log, key);
        return acc + (v != null && typeof v === 'number' && v > 0 ? 1 : 0);
      }, 0);

      const bucketKey = count >= 3 ? '3+' : String(count);
      buckets[bucketKey].sum += sev;
      buckets[bucketKey].count++;
    });

    const avg = (b: { sum: number; count: number }) => b.count > 0 ? parseFloat((b.sum / b.count).toFixed(1)) : 0;

    return ['0', '1', '2', '3+'].map(key => ({
      name: key === '0' ? 'No symptoms' : key === '1' ? '1 symptom' : key === '2' ? '2 symptoms' : '3+ symptoms',
      avgSeverity: avg(buckets[key]),
      count: buckets[key].count,
    })).filter(d => d.count > 0);
  }, [filteredTinnitus]);

  // 5. Day profile radar - high vs low tinnitus days
  const radarData = useMemo(() => {
    const tinnitusLogsWithData = filteredTinnitus.filter(l => l.severity > 0);
    if (tinnitusLogsWithData.length < 10) return [];

    // Sort by severity and split into bottom 33% vs top 33%
    const sorted = [...tinnitusLogsWithData].sort((a, b) => a.severity - b.severity);
    const third = Math.max(1, Math.floor(sorted.length / 3));
    const lowDays = sorted.slice(0, third);
    const highDays = sorted.slice(-third);

    const factors = [
      { key: 'symptom_anxiety', label: 'Anxiety', max: 4 },
      { key: 'stress', label: 'Stress', max: 3, useMapper: true },
      { key: 'sleep_quality', label: 'Sleep', max: 5 },
      { key: 'energy_avg', label: 'Energy', max: 5 },
      { key: 'mood_avg', label: 'Mood', max: 10 },
      { key: 'symptom_muscle_tension', label: 'Muscle', max: 4 },
    ];

    return factors.map(f => {
      const getAvg = (logs: TinnitusLog[]) => {
        const values = logs.map(l => {
          if (f.useMapper) return mapStressNumeric(l);
          return getRawValue(l, f.key);
        }).filter(v => v != null && typeof v === 'number') as number[];
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      };
      const highAvg = getAvg(highDays);
      const lowAvg = getAvg(lowDays);
      // Normalize to 0-10 for the radar shape; keep raw for tooltip
      const scale = 10 / f.max;
      return {
        factor: f.label,
        highDays: parseFloat((highAvg * scale).toFixed(1)),
        lowDays: parseFloat((lowAvg * scale).toFixed(1)),
        highDaysRaw: parseFloat(highAvg.toFixed(1)),
        lowDaysRaw: parseFloat(lowAvg.toFixed(1)),
        maxRaw: f.max,
        fullMark: 10,
      };
    });
  }, [filteredTinnitus]);

  // 7. Spike predictor - what factors precede tinnitus spikes
  const spikePredictorData = useMemo(() => {
    // Aggregate to daily max severity (only days with actual tinnitus data)
    const dailyMap: Record<string, { severity: number; log: TinnitusLog }> = {};
    filteredTinnitus
      .filter(log => log.severity > 0)
      .forEach(log => {
        const d = format(parseISO(log.datetime), 'yyyy-MM-dd');
        if (!dailyMap[d] || log.severity > dailyMap[d].severity) {
          dailyMap[d] = { severity: log.severity, log };
        }
      });

    const days = Object.entries(dailyMap)
      .map(([date, { severity, log }]) => ({ date, severity, log }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (days.length < 3) return [];

    // Find spike days: consecutive day with severity jump >= 2.5
    const spikeIndices: number[] = [];
    for (let i = 1; i < days.length; i++) {
      const dayDiff = differenceInDays(parseISO(days[i].date), parseISO(days[i - 1].date));
      if (dayDiff === 1 && days[i].severity - days[i - 1].severity >= 2.5) {
        spikeIndices.push(i);
      }
    }

    if (spikeIndices.length === 0) return [];

    const preSpikeDays = spikeIndices.map(i => days[i - 1].log);
    const normalDays = days.filter((_, i) => !spikeIndices.includes(i) && !spikeIndices.includes(i + 1)).map(d => d.log);

    if (normalDays.length === 0) return [];

    const factors = [
      { key: 'symptom_muscle_tension', label: 'Muscle Tension' },
      { key: 'symptom_anxiety', label: 'Anxiety' },
      { key: 'symptom_intrusive_thoughts', label: 'Intrusive Thoughts' },
      { key: 'lifestyle_doomscrolling', label: 'Doomscrolling' },
      { key: 'lifestyle_caffeine', label: 'Caffeine' },
      { key: 'lifestyle_stress', label: 'Stress' },
      { key: 'sleep_quality', label: 'Poor Sleep', check: (v: any) => v != null && v <= 2.5 },
      { key: 'symptom_mood_swings', label: 'Mood Swings' },
      { key: 'symptom_neck', label: 'Neck Pain' },
      { key: 'symptom_irritability', label: 'Irritability' },
    ];

    const isPresent = (log: TinnitusLog, key: string, customCheck?: (v: any) => boolean) => {
      if (customCheck) {
        const v = getRawValue(log, key);
        return customCheck(v);
      }
      if (key.startsWith('symptom_')) return hasSymptom(log, key);
      if (key.startsWith('lifestyle_')) return hasLifestyleFactor(log, key);
      return false;
    };

    return factors
      .map(f => {
        const prePresent = preSpikeDays.filter(l => isPresent(l, f.key, f.check)).length;
        const normalPresent = normalDays.filter(l => isPresent(l, f.key, f.check)).length;
        const preRate = prePresent / preSpikeDays.length;
        const normalRate = normalPresent / normalDays.length;
        const multiplier = normalRate > 0 ? preRate / normalRate : 0;
        return {
          label: f.label,
          preRate: Math.round(preRate * 100),
          normalRate: Math.round(normalRate * 100),
          multiplier: parseFloat(multiplier.toFixed(1)),
          prePresent,
          totalSpikes: preSpikeDays.length,
        };
      })
      .filter(f => f.prePresent >= 2 && f.multiplier >= 0.5)
      .sort((a, b) => b.multiplier - a.multiplier);
  }, [filteredTinnitus]);

  // 8. Symptom impact
  const symptomImpactData = useMemo(() => {
    const symptoms = [
      { key: 'symptom_anxiety', label: 'Anxiety' },
      { key: 'symptom_intrusive_thoughts', label: 'Intrusive Thoughts' },
      { key: 'symptom_muscle_tension', label: 'Muscle Tension' },
      { key: 'symptom_mood_swings', label: 'Mood Swings' },
      { key: 'symptom_neck', label: 'Neck Pain' },
      { key: 'symptom_irritability', label: 'Irritability' },
    ];

    type Bucket = { sum: number; count: number };
    const make = (): { present: Bucket; absent: Bucket } => ({
      present: { sum: 0, count: 0 },
      absent: { sum: 0, count: 0 },
    });

    const results: FactorItem[] = [];

    symptoms.forEach(({ key, label }) => {
      const bucket = make();
      filteredTinnitus.forEach(log => {
        const sev = log.severity;
        const present = hasSymptom(log, key);
        (present ? bucket.present : bucket.absent).sum += sev;
        (present ? bucket.present : bucket.absent).count++;
      });

      const avg = (b: Bucket) => (b.count > 0 ? parseFloat((b.sum / b.count).toFixed(1)) : 0);
      const withSev = avg(bucket.present);
      const withoutSev = avg(bucket.absent);
      const delta = parseFloat((withSev - withoutSev).toFixed(1));

      if (bucket.present.count >= 3) {
        results.push({ label, withSeverity: withSev, withoutSeverity: withoutSev, delta, sampleSize: bucket.present.count });
      }
    });

    return results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [filteredTinnitus]);

  // 5. Lifestyle impact
  const lifestyleImpactData = useMemo(() => {
    const factors = [
      { key: 'lifestyle_stress', label: 'Stress' },
      { key: 'lifestyle_caffeine', label: 'Caffeine' },
      { key: 'lifestyle_doomscrolling', label: 'Doomscrolling' },
      { key: 'lifestyle_time_outside', label: 'Time Outside' },
      { key: 'lifestyle_video_games', label: 'Video Games' },
      { key: 'lifestyle_alcohol', label: 'Alcohol' },
      { key: 'lifestyle_physiotherapist_exercises', label: 'Physio Exercises' },
      { key: 'lifestyle_tobacco', label: 'Tobacco' },
    ];

    type Bucket = { sum: number; count: number };
    const make = (): { present: Bucket; absent: Bucket } => ({
      present: { sum: 0, count: 0 },
      absent: { sum: 0, count: 0 },
    });

    const results: FactorItem[] = [];

    factors.forEach(({ key, label }) => {
      const bucket = make();
      filteredTinnitus.forEach(log => {
        const sev = log.severity;
        const present = hasLifestyleFactor(log, key);
        (present ? bucket.present : bucket.absent).sum += sev;
        (present ? bucket.present : bucket.absent).count++;
      });

      const avg = (b: Bucket) => (b.count > 0 ? parseFloat((b.sum / b.count).toFixed(1)) : 0);
      const withSev = avg(bucket.present);
      const withoutSev = avg(bucket.absent);
      const delta = parseFloat((withSev - withoutSev).toFixed(1));

      if (bucket.present.count >= 3) {
        results.push({ label, withSeverity: withSev, withoutSeverity: withoutSev, delta, sampleSize: bucket.present.count });
      }
    });

    return results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [filteredTinnitus]);

  // 7. Insights
  const insights = useMemo(() => {
    const worstDay = weeklyData.reduce((a, b) => (a.avgSeverity > b.avgSeverity ? a : b));
    const bestDay = weeklyData.reduce((a, b) =>
      (a.avgSeverity > 0 && a.avgSeverity < b.avgSeverity) || b.avgSeverity === 0 ? a : b
    );
    const medDays = new Set(
      filteredMedication.map(m => format(parseISO(m.datetime), 'yyyy-MM-dd'))
    );
    const medEffect = (() => {
      let medSum = 0, medCount = 0, noMedSum = 0, noMedCount = 0;
      filteredTinnitus.forEach(log => {
        const d = format(parseISO(log.datetime), 'yyyy-MM-dd');
        if (medDays.has(d)) { medSum += log.severity; medCount++; }
        else { noMedSum += log.severity; noMedCount++; }
      });
      return {
        withMed: medCount > 0 ? (medSum / medCount).toFixed(1) : '-',
        withoutMed: noMedCount > 0 ? (noMedSum / noMedCount).toFixed(1) : '-',
      };
    })();

    const strongestSymptom = [...symptomImpactData].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
    const strongestLifestyle = [...lifestyleImpactData].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
    const worstPhase = cyclePhaseData.length > 0 ? cyclePhaseData.reduce((a, b) => (a.avgSeverity > b.avgSeverity ? a : b)) : null;
    const bestPhase = cyclePhaseData.length > 0 ? cyclePhaseData.reduce((a, b) => (a.avgSeverity > 0 && a.avgSeverity < b.avgSeverity) || b.avgSeverity === 0 ? a : b) : null;

    const fullDayName: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
      Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };

    return { worstDay, bestDay, medEffect, fullDayName, strongestSymptom, strongestLifestyle, worstPhase, bestPhase };
  }, [weeklyData, cyclePhaseData, symptomImpactData, lifestyleImpactData, filteredMedication, filteredTinnitus]);

  const rangeLabel = useMemo(() => {
    if (filteredTinnitus.length === 0) return '';
    if (timeRange === 'all') {
      const first = filteredTinnitus[0];
      const last = filteredTinnitus[filteredTinnitus.length - 1];
      return `${format(parseISO(first.datetime), 'MMM d, yyyy')} - ${format(parseISO(last.datetime), 'MMM d, yyyy')}`;
    }
    const start = subDays(referenceDate, timeRange);
    return `${format(start, 'MMM d')} - ${format(referenceDate, 'MMM d')}`;
  }, [timeRange, referenceDate, filteredTinnitus]);

  return (
    <div className="px-6 pt-16 pb-12 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-2xl font-black text-sage-dark tracking-tight">Patterns</h1>

        <div className="flex items-center gap-2">
          {timeRange !== 'all' && (
            <button
              onClick={() => setOffsetDays(prev => prev + (timeRange as number))}
              className="p-2 rounded-xl bg-sage-pale/50 text-sage-medium active:scale-95 transition-transform"
              aria-label="Earlier"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div className="flex bg-sage-pale/50 p-1.5 rounded-2xl border border-sage-pale/30 flex-1 justify-center">
            {[7, 14, 30, 90, 'all'].map(range => (
              <button
                key={range}
                onClick={() => { setTimeRange(range as any); setOffsetDays(0); }}
                className={cn(
                  'px-2.5 py-1.5 text-[10px] font-extrabold rounded-xl transition-all',
                  timeRange === range
                    ? 'bg-sage-medium text-white shadow-md shadow-sage-medium/20 scale-105'
                    : 'text-sage-dark opacity-40 hover:opacity-100'
                )}
              >
                {range === 'all' ? 'All' : `${range}d`}
              </button>
            ))}
          </div>

          {timeRange !== 'all' && (
            <button
              onClick={() => setOffsetDays(prev => Math.max(0, prev - (timeRange as number)))}
              disabled={offsetDays === 0}
              className={cn(
                'p-2 rounded-xl active:scale-95 transition-transform',
                offsetDays === 0
                  ? 'bg-sage-pale/30 text-sage-medium opacity-30'
                  : 'bg-sage-pale/50 text-sage-medium'
              )}
              aria-label="Later"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <p className="text-[10px] font-bold text-sage-medium opacity-50 text-center tracking-tight">
          {rangeLabel}
        </p>
      </header>

      {/* Severity Over Time - now with interactive overlays */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Severity Over Time</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
              Average daily symptom level
            </p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <TrendingUp size={20} className="text-sage-medium" />
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={severityData}>
              <defs>
                <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8A9A5B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8A9A5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E1" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#8A9A5B' }}
                dy={10}
                interval={severityData.length <= 7 ? 0 : severityData.length <= 14 ? 2 : severityData.length <= 30 ? 4 : severityData.length <= 90 ? 9 : Math.floor(severityData.length / 6)}
              />
              <YAxis hide domain={[0, 10]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="severity"
                name="Tinnitus"
                stroke="#8A9A5B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSev)"
                connectNulls={false}
              />
              {activeOverlays.mood && (
                <Line type="monotone" dataKey="mood" name="Mood" stroke="#D4A373" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              {activeOverlays.energy && (
                <Line type="monotone" dataKey="energy" name="Energy" stroke="#6B8E9B" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              {activeOverlays.sleep && (
                <Line type="monotone" dataKey="sleepQuality" name="Sleep" stroke="#9B8AA5" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              {activeOverlays.anxiety && (
                <Line type="monotone" dataKey="anxiety" name="Anxiety" stroke="#E07A7A" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              {activeOverlays.intrusiveThoughts && (
                <Line type="monotone" dataKey="intrusiveThoughts" name="Intrusive Thoughts" stroke="#B8A88A" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              {activeOverlays.muscleTension && (
                <Line type="monotone" dataKey="muscleTension" name="Muscle Tension" stroke="#8A9B8A" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              {activeOverlays.neckPain && (
                <Line type="monotone" dataKey="neckPain" name="Neck Pain" stroke="#9B8A8A" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              )}
              <Line type="monotone" dataKey="rolling7" name="7-Day Avg" stroke="#556B2F" strokeWidth={2} dot={false} strokeDasharray="6 3" />
              <Line type="monotone" dataKey="medicationMarker" name="Medication" stroke="transparent" dot={{ r: 3, fill: '#3B82F6', strokeWidth: 1.5, stroke: '#fff' }} activeDot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[9px] text-sage-medium opacity-60">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full bg-[#556B2F]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #556B2F 0, #556B2F 4px, transparent 4px, transparent 7px)' }} />
            <span>7-Day Avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 border border-white shadow-sm" />
            <span>Medication</span>
          </div>
        </div>

        {/* Overlay toggles */}
        <div className="flex flex-wrap gap-1.5">
          {OVERLAY_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setActiveOverlays(prev => ({ ...prev, [key]: !prev[key] }))}
              className={cn(
                'px-2.5 py-1 text-[9px] font-extrabold rounded-full border transition-all select-none',
                activeOverlays[key]
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-sage-pale/60 text-sage-medium opacity-60 hover:opacity-100 bg-white'
              )}
              style={activeOverlays[key] ? { backgroundColor: color, borderColor: color } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Calendar Heatmap */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Calendar View</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
              Daily tinnitus severity at a glance
            </p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <Calendar size={20} className="text-sage-medium" />
          </div>
        </div>

        <CalendarHeatmap logs={filteredTinnitus} />
      </section>

      {/* Weekly Distribution */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Weekly Distribution</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
              Average tinnitus severity by day of week
            </p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <Zap size={20} className="text-sage-medium" />
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E1" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#8A9A5B' }}
                dy={10}
              />
              <YAxis hide domain={[0, 10]} />
              <Tooltip
                cursor={{ fill: '#FCFAF7' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #E1E8E1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
                formatter={(v: any, _: any, props: any) => [
                  `${v} / 10 (${props.payload.count} logs)`,
                  'Avg Severity',
                ]}
              />
              <Bar dataKey="avgSeverity" radius={[8, 8, 0, 0]}>
                {weeklyData.map((entry, index) => {
                  const opacity = 0.25 + entry.intensity * 0.75;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(138, 154, 91, ${opacity})`}
                    />
                  );
                })}
                <LabelList
                  dataKey="avgSeverity"
                  position="insideTop"
                  style={{ fontSize: 10, fontWeight: 800, fill: 'white' }}
                  formatter={(v: number) => (v > 0 ? v : '')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Cycle Phase Patterns */}
      {cyclePhaseData.length > 0 && (
        <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-sage-dark tracking-tight">Cycle Phase Patterns</h2>
              <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
                Average tinnitus severity by cycle phase
              </p>
            </div>
            <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
              <Droplets size={20} className="text-sage-medium" />
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cyclePhaseData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E1" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8A9A5B' }}
                  dy={10}
                />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  cursor={{ fill: '#FCFAF7' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E1E8E1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  formatter={(v: any, _: any, props: any) => [
                    `${v} / 10 (${props.payload.count} days)`,
                    'Avg Severity',
                  ]}
                />
                <Bar dataKey="avgSeverity" radius={[8, 8, 0, 0]} fill="rgba(138, 154, 91, 0.7)">
                  <LabelList
                    dataKey="avgSeverity"
                    position="insideTop"
                    style={{ fontSize: 10, fontWeight: 800, fill: 'white' }}
                    formatter={(v: number) => (v > 0 ? v : '')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Symptom Load */}
      {symptomLoadData.length > 0 && (
        <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-sage-dark tracking-tight">Symptom Load</h2>
              <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
                Tinnitus severity by number of other symptoms
              </p>
            </div>
            <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
              <Activity size={20} className="text-sage-medium" />
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomLoadData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E1" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8A9A5B' }}
                  dy={10}
                />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  cursor={{ fill: '#FCFAF7' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E1E8E1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  formatter={(v: any, _: any, props: any) => [
                    `${v} / 10 (${props.payload.count} days)`,
                    'Avg Severity',
                  ]}
                />
                <Bar dataKey="avgSeverity" radius={[8, 8, 0, 0]} fill="rgba(138, 154, 91, 0.7)">
                  <LabelList
                    dataKey="avgSeverity"
                    position="insideTop"
                    style={{ fontSize: 10, fontWeight: 800, fill: 'white' }}
                    formatter={(v: number) => (v > 0 ? v : '')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Day Profile Radar */}
      {radarData.length > 0 && (
        <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-sage-dark tracking-tight">Day Profile</h2>
              <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
                How high vs low tinnitus days differ
              </p>
            </div>
            <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
              <Brain size={20} className="text-sage-medium" />
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="65%">
                <PolarGrid stroke="#E1E8E1" />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: '#8A9A5B', fontWeight: 700 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name="High Tinnitus" dataKey="highDays" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Low Tinnitus" dataKey="lowDays" stroke="#8A9A5B" fill="#8A9A5B" fillOpacity={0.15} strokeWidth={2} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E1E8E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  formatter={(value: number, name: string, props: any) => {
                    const rawKey = name === 'High Tinnitus' ? 'highDaysRaw' : 'lowDaysRaw';
                    const raw = props?.payload?.[rawKey] ?? value;
                    const max = props?.payload?.maxRaw ?? 10;
                    return [`${raw} / ${max}`, name];
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Interaction Heatmap */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Interaction Heatmap</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
              How two factors combine to affect tinnitus
            </p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <Activity size={20} className="text-sage-medium" />
          </div>
        </div>

        {/* Variable selectors */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-bold text-sage-medium uppercase tracking-wider">Horizontal</label>
            <select
              value={xVar}
              onChange={e => setXVar(e.target.value)}
              className="w-full appearance-none bg-sage-pale/30 text-sage-dark text-xs font-extrabold py-2 px-3 rounded-xl border border-sage-pale/50 focus:outline-none focus:ring-2 focus:ring-sage-medium/30"
            >
              {HEATMAP_VARS.map(v => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-bold text-sage-medium uppercase tracking-wider">Vertical</label>
            <select
              value={yVar}
              onChange={e => setYVar(e.target.value)}
              className="w-full appearance-none bg-sage-pale/30 text-sage-dark text-xs font-extrabold py-2 px-3 rounded-xl border border-sage-pale/50 focus:outline-none focus:ring-2 focus:ring-sage-medium/30"
            >
              {HEATMAP_VARS.map(v => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Heatmap grid */}
        <InteractionHeatmap tinnitusLogs={filteredTinnitus} xVar={xVar} yVar={yVar} />
      </section>

      {/* Factor Connections - Symptoms & Lifestyle */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Factor Connections</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
              How symptoms & lifestyle link to tinnitus
            </p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <Activity size={20} className="text-sage-medium" />
          </div>
        </div>

        <div className="flex bg-sage-pale/30 p-1 rounded-xl">
          {(['symptoms', 'lifestyle'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFactorTab(tab)}
              className={cn(
                'flex-1 px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all capitalize',
                factorTab === tab
                  ? 'bg-white text-sage-dark shadow-sm'
                  : 'text-sage-medium opacity-50 hover:opacity-100'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {factorTab === 'symptoms' ? (
          <FactorAnalysis items={symptomImpactData} />
        ) : (
          <FactorAnalysis items={lifestyleImpactData} />
        )}
      </section>

      {/* Spike Predictor */}
      {spikePredictorData.length > 0 && (
        <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-sage-dark tracking-tight">Spike Predictor</h2>
              <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
                What factors show up the day before a spike
              </p>
            </div>
            <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
              <TrendingUp size={20} className="text-sage-medium" />
            </div>
          </div>

          <p className="text-[10px] font-bold text-sage-medium opacity-60">
            Based on {spikePredictorData[0]?.totalSpikes} day-over-day spikes in this window
          </p>

          <div className="space-y-3">
            {spikePredictorData.map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-sage-dark">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-sage-medium opacity-50">
                      {item.prePresent}/{item.totalSpikes} spikes
                    </span>
                    <span className={cn(
                      'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                      item.multiplier >= 1.5 ? 'bg-red-50 text-red-500'
                        : item.multiplier >= 1.2 ? 'bg-orange-50 text-orange-500'
                        : 'bg-sage-pale/50 text-sage-medium'
                    )}>
                      {item.multiplier}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-sage-medium w-14 shrink-0 opacity-60">Pre-spike</span>
                  <div className="flex-1 bg-sage-pale/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all duration-500"
                      style={{ width: `${item.preRate}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-sage-dark w-6 text-right">{item.preRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-sage-medium w-14 shrink-0 opacity-60">Normal</span>
                  <div className="flex-1 bg-sage-pale/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sage-light transition-all duration-500"
                      style={{ width: `${item.normalRate}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-sage-dark w-6 text-right">{item.normalRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Smart Insights */}
      <section className="space-y-4">
        <h2 className="font-bold text-sage-900 ml-1">Key Insights</h2>
        <div className="space-y-3">
          {insights.strongestSymptom && Math.abs(insights.strongestSymptom.delta) >= 0.15 && (
            <InsightCard
              icon={<Brain size={18} className="text-sage-medium" />}
              title={`${insights.strongestSymptom.label} & Tinnitus`}
              description={`When ${insights.strongestSymptom.label.toLowerCase()} is present, your tinnitus averages ${insights.strongestSymptom.withSeverity}/10 vs ${insights.strongestSymptom.withoutSeverity}/10 when absent.`}
            />
          )}
          {insights.strongestLifestyle && Math.abs(insights.strongestLifestyle.delta) >= 0.15 && (
            <InsightCard
              icon={<Heart size={18} className="text-red-400" />}
              title={`${insights.strongestLifestyle.label} Impact`}
              description={`Days with ${insights.strongestLifestyle.label.toLowerCase()} average ${insights.strongestLifestyle.withSeverity}/10 vs ${insights.strongestLifestyle.withoutSeverity}/10 without - a ${insights.strongestLifestyle.delta > 0 ? 'rise' : 'drop'} of ${Math.abs(insights.strongestLifestyle.delta)} points.`}
            />
          )}
          {insights.worstPhase && insights.bestPhase && insights.worstPhase.name !== insights.bestPhase.name && (
            <InsightCard
              icon={<Droplets size={18} className="text-blue-400" />}
              title="Cycle Connection"
              description={`${insights.worstPhase.name} phase averages the highest tinnitus severity (${insights.worstPhase.avgSeverity}/10), while ${insights.bestPhase.name} is your calmest phase (${insights.bestPhase.avgSeverity}/10).`}
            />
          )}
          {insights.worstDay.avgSeverity > 0 && (
            <InsightCard
              icon={<Zap size={18} className="text-yellow-500" />}
              title={`${insights.fullDayName[insights.worstDay.name]}s Are Toughest`}
              description={`${insights.fullDayName[insights.worstDay.name]}s average the highest severity (${insights.worstDay.avgSeverity}/10). ${insights.bestDay.avgSeverity > 0 ? `${insights.fullDayName[insights.bestDay.name]}s tend to be your best days at ${insights.bestDay.avgSeverity}/10.` : ''}`}
            />
          )}
          <InsightCard
            icon={<Pill size={18} className="text-blue-500" />}
            title="Medication Days"
            description={`On days you took medication, average severity was ${insights.medEffect.withMed}/10 vs ${insights.medEffect.withoutMed}/10 on days without.`}
          />
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-insight-bg p-5 rounded-[18px] border-l-4 border-insight-border shadow-sm flex gap-4">
      <div className="shrink-0 pt-1">{icon}</div>
      <div className="space-y-1">
        <h4 className="font-bold text-insight-text text-sm">{title}</h4>
        <p className="text-xs text-insight-text/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
