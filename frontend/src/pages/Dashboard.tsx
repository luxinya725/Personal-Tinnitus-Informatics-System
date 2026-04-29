import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, LabelList, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import { Filter, Calendar, Info, TrendingUp, AlertCircle, Zap, Pill } from 'lucide-react';
import { TinnitusLog, MedicationLog } from '../types';
import { cn } from '../lib/utils';
import { format, subDays, isAfter, parseISO, startOfDay, eachDayOfInterval, getDay } from 'date-fns';

interface DashboardProps {
  tinnitusLogs: TinnitusLog[];
  medicationLogs: MedicationLog[];
}

// Helpers to normalise the mixed-legacy / new-schema fields coming out of storage.ts
const getStressLevel = (log: TinnitusLog): number => {
  // New schema: log.lifestyle?.stress is a number 0–3
  if ((log as any).lifestyle?.stress != null) return (log as any).lifestyle.stress;
  // Legacy schema: stressLevel string
  const s = log.stressLevel;
  if (s === 'High') return 3;
  if (s === 'Medium') return 2;
  if (s === 'Low') return 1;
  return 0;
};

const getSleepQualityLevel = (log: TinnitusLog): number => {
  // New schema: log.sleepQualityValue is 1–5
  if ((log as any).sleepQualityValue != null) return (log as any).sleepQualityValue as number;
  // Legacy schema: 'Good' | 'OK' | 'Poor'
  if (log.sleepQuality === 'Poor') return 1;
  if (log.sleepQuality === 'OK') return 3;
  if (log.sleepQuality === 'Good') return 5;
  return 3;
};

const getDoomscrolling = (log: TinnitusLog): number => {
  const d = (log as any).lifestyle?.doomscrolling;
  if (d == null) return 0;
  return d; // number 0–3 in new schema
};

const getCaffeine = (log: TinnitusLog): boolean => {
  if ((log as any).lifestyle?.caffeine != null) return (log as any).lifestyle.caffeine > 0;
  return log.caffeine ?? false;
};

const getAnxiety = (log: TinnitusLog): number => {
  const a = (log as any).symptoms?.anxiety;
  if (a != null) return a; // number 0–4
  return 0;
};

export default function DashboardPage({ tinnitusLogs, medicationLogs }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  const filteredTinnitus = useMemo(() => {
    const cutoff = subDays(new Date(), timeRange);
    return tinnitusLogs
      .filter(log => isAfter(parseISO(log.datetime), cutoff))
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [tinnitusLogs, timeRange]);

  const filteredMedication = useMemo(() => {
    const cutoff = subDays(new Date(), timeRange);
    return medicationLogs.filter(log => isAfter(parseISO(log.datetime), cutoff));
  }, [medicationLogs, timeRange]);

  // 1. Severity over time
  const severityData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), timeRange - 1),
      end: new Date(),
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = filteredTinnitus.filter(
        log => format(parseISO(log.datetime), 'yyyy-MM-dd') === dayStr
      );
      const avgSeverity =
        dayLogs.length > 0
          ? dayLogs.reduce((acc, curr) => acc + curr.severity, 0) / dayLogs.length
          : null; // null = no data, gap in chart

      return {
        date: format(day, timeRange <= 7 ? 'EEE' : 'MMM d'),
        severity: avgSeverity !== null ? parseFloat(avgSeverity.toFixed(1)) : null,
        count: dayLogs.length,
      };
    });
  }, [filteredTinnitus, timeRange]);

  // 2. Weekly distribution - average severity per weekday (Mon–Sun)
  const weeklyData = useMemo(() => {
    // getDay returns 0=Sun … 6=Sat; remap to Mon=0 … Sun=6
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
      const dow = getDay(parseISO(log.datetime)); // 0=Sun … 6=Sat
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
        // relative intensity 0–1 for colour interpolation
        intensity: avg / maxAvg,
      };
    });
  }, [filteredTinnitus]);

  // 3. Trigger analysis - based on fields actually present in the real data
  const triggerData = useMemo(() => {
    // For each trigger we collect: avg tinnitus severity when present vs when absent
    type Bucket = { sum: number; count: number };

    const make = (): { present: Bucket; absent: Bucket } => ({
      present: { sum: 0, count: 0 },
      absent: { sum: 0, count: 0 },
    });

    const stress = make();
    const poorSleep = make();
    const caffeine = make();
    const doomscroll = make();
    const anxiety = make();

    filteredTinnitus.forEach(log => {
      const sev = log.severity;

      // Stress
      const stressLvl = getStressLevel(log);
      (stressLvl >= 2 ? stress.present : stress.absent).sum += sev;
      (stressLvl >= 2 ? stress.present : stress.absent).count++;

      // Poor sleep (≤ 2 on 1-5 scale)
      const sleepLvl = getSleepQualityLevel(log);
      (sleepLvl <= 2 ? poorSleep.present : poorSleep.absent).sum += sev;
      (sleepLvl <= 2 ? poorSleep.present : poorSleep.absent).count++;

      // Caffeine
      const caf = getCaffeine(log);
      (caf ? caffeine.present : caffeine.absent).sum += sev;
      (caf ? caffeine.present : caffeine.absent).count++;

      // Doomscrolling
      const doom = getDoomscrolling(log);
      (doom >= 2 ? doomscroll.present : doomscroll.absent).sum += sev;
      (doom >= 2 ? doomscroll.present : doomscroll.absent).count++;

      // Anxiety symptoms
      const anx = getAnxiety(log);
      (anx >= 2 ? anxiety.present : anxiety.absent).sum += sev;
      (anx >= 2 ? anxiety.present : anxiety.absent).count++;
    });

    const avg = (b: Bucket) => (b.count > 0 ? parseFloat((b.sum / b.count).toFixed(1)) : 0);
    const diff = (b: { present: Bucket; absent: Bucket }) =>
      parseFloat((avg(b.present) - avg(b.absent)).toFixed(1));

    return [
      {
        label: 'Stress',
        withSeverity: avg(stress.present),
        withoutSeverity: avg(stress.absent),
        delta: diff(stress),
        sampleSize: stress.present.count,
      },
      {
        label: 'Poor Sleep',
        withSeverity: avg(poorSleep.present),
        withoutSeverity: avg(poorSleep.absent),
        delta: diff(poorSleep),
        sampleSize: poorSleep.present.count,
      },
      {
        label: 'Caffeine',
        withSeverity: avg(caffeine.present),
        withoutSeverity: avg(caffeine.absent),
        delta: diff(caffeine),
        sampleSize: caffeine.present.count,
      },
      {
        label: 'Doomscrolling',
        withSeverity: avg(doomscroll.present),
        withoutSeverity: avg(doomscroll.absent),
        delta: diff(doomscroll),
        sampleSize: doomscroll.present.count,
      },
      {
        label: 'Anxiety',
        withSeverity: avg(anxiety.present),
        withoutSeverity: avg(anxiety.absent),
        delta: diff(anxiety),
        sampleSize: anxiety.present.count,
      },
    ].sort((a, b) => b.delta - a.delta); // highest impact first
  }, [filteredTinnitus]);

  // Derived stats for insight cards
  const insights = useMemo(() => {
    const stressTrigger = triggerData.find(t => t.label === 'Stress');
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

    const fullDayName: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
      Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };

    return { stressTrigger, worstDay, bestDay, medEffect, fullDayName };
  }, [triggerData, weeklyData, filteredMedication, filteredTinnitus]);

  return (
    <div className="px-6 pt-16 pb-12 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-sage-dark tracking-tight">Patterns</h1>
        <div className="flex bg-sage-pale/50 p-1.5 rounded-2xl border border-sage-pale/30">
          {[7, 30, 90].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={cn(
                'px-3 py-1.5 text-[10px] font-extrabold rounded-xl transition-all',
                timeRange === range
                  ? 'bg-sage-medium text-white shadow-md shadow-sage-medium/20 scale-105'
                  : 'text-sage-dark opacity-40 hover:opacity-100'
              )}
            >
              {range}d
            </button>
          ))}
        </div>
      </header>

      {/* Severity Over Time */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
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
            <AreaChart data={severityData}>
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
                interval={timeRange <= 7 ? 0 : timeRange <= 30 ? 4 : 9}
              />
              <YAxis hide domain={[0, 10]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #E1E8E1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
                formatter={(v: any) => [v ?? 'No data', 'Severity']}
              />
              <Area
                type="monotone"
                dataKey="severity"
                stroke="#8A9A5B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSev)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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

      {/* Trigger Analysis */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Trigger Analysis</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">
              Avg severity with vs. without each factor
            </p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <AlertCircle size={20} className="text-sage-medium" />
          </div>
        </div>

        <div className="space-y-3">
          {triggerData.map(trigger => {
            const maxSev = 10;
            const withPct = (trigger.withSeverity / maxSev) * 100;
            const withoutPct = (trigger.withoutSeverity / maxSev) * 100;
            const isPositiveDelta = trigger.delta > 0;

            return (
              <div key={trigger.label} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-sage-dark">{trigger.label}</span>
                  <div className="flex items-center gap-2">
                    {trigger.sampleSize > 0 && (
                      <span className="text-[9px] text-sage-medium opacity-50">
                        n={trigger.sampleSize}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                        trigger.delta > 0.5
                          ? 'bg-red-50 text-red-500'
                          : trigger.delta < -0.5
                          ? 'bg-green-50 text-green-600'
                          : 'bg-sage-pale/50 text-sage-medium'
                      )}
                    >
                      {trigger.delta > 0 ? '+' : ''}{trigger.delta}
                    </span>
                  </div>
                </div>

                {/* With / Without bars */}
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
                      {trigger.withSeverity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-sage-medium w-12 shrink-0 opacity-60">Without</span>
                    <div className="flex-1 bg-sage-pale/40 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sage-pale transition-all duration-500"
                        style={{ width: `${withoutPct}%`, backgroundColor: '#C1CDC1' }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-sage-dark w-6 text-right">
                      {trigger.withoutSeverity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Insights */}
      <section className="space-y-4">
        <h2 className="font-bold text-sage-900 ml-1">Key Insights</h2>
        <div className="space-y-3">
          {insights.stressTrigger && insights.stressTrigger.delta > 0 && (
            <InsightCard
              icon={<TrendingUp size={18} className="text-red-500" />}
              title="Stress Impact"
              description={`On high-stress days your average severity is ${insights.stressTrigger.withSeverity}/10 vs ${insights.stressTrigger.withoutSeverity}/10 on calmer days - a difference of ${insights.stressTrigger.delta} points.`}
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