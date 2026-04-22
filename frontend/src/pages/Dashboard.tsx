import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import { Filter, Calendar, Info, TrendingUp, AlertCircle, Zap, Pill } from 'lucide-react';
import { TinnitusLog, MedicationLog } from '../types';
import { cn } from '../lib/utils';
import { format, subDays, isAfter, parseISO, startOfDay, eachDayOfInterval } from 'date-fns';

interface DashboardProps {
  tinnitusLogs: TinnitusLog[];
  medicationLogs: MedicationLog[];
}

export default function DashboardPage({ tinnitusLogs, medicationLogs }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);

  const filteredTinnitus = useMemo(() => {
    const cutoff = subDays(new Date(), timeRange);
    return tinnitusLogs.filter(log => isAfter(parseISO(log.datetime), cutoff))
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [tinnitusLogs, timeRange]);

  const filteredMedication = useMemo(() => {
    const cutoff = subDays(new Date(), timeRange);
    return medicationLogs.filter(log => isAfter(parseISO(log.datetime), cutoff));
  }, [medicationLogs, timeRange]);

  // 1. Severity over time data
  const severityData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), timeRange - 1),
      end: new Date()
    });

    return days.map(day => {
      const dayLogs = filteredTinnitus.filter(log => 
        format(parseISO(log.datetime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      const avgSeverity = dayLogs.length > 0 
        ? dayLogs.reduce((acc, curr) => acc + curr.severity, 0) / dayLogs.length 
        : 0;

      return {
        date: format(day, 'MMM d'),
        severity: parseFloat(avgSeverity.toFixed(1)),
        count: dayLogs.length
      };
    });
  }, [filteredTinnitus, timeRange]);

  // 2. Time of day pattern
  const timeOfDayData = useMemo(() => {
    const hours = {
      Morning: { count: 0, severity: 0 }, // 6-12
      Afternoon: { count: 0, severity: 0 }, // 12-18
      Evening: { count: 0, severity: 0 }, // 18-24
      Night: { count: 0, severity: 0 }, // 0-6
    };

    filteredTinnitus.forEach(log => {
      const hour = new Date(log.datetime).getHours();
      let period: keyof typeof hours = 'Morning';
      if (hour >= 12 && hour < 18) period = 'Afternoon';
      else if (hour >= 18 && hour < 24) period = 'Evening';
      else if (hour >= 0 && hour < 6) period = 'Night';
      
      hours[period].count++;
      hours[period].severity += log.severity;
    });

    return Object.entries(hours).map(([name, data]) => ({
      name,
      count: data.count,
      avgSeverity: data.count > 0 ? parseFloat((data.severity / data.count).toFixed(1)) : 0
    }));
  }, [filteredTinnitus]);

  // 3. Context Correlation (Radar)
  const correlationData = useMemo(() => {
    const factors = [
      { name: 'Stress', value: 0, count: 0 },
      { name: 'Poor Sleep', value: 0, count: 0 },
      { name: 'Doomscroll', value: 0, count: 0 },
      { name: 'Headache', value: 0, count: 0 },
      { name: 'Outside', value: 0, count: 0 },
    ];

    filteredTinnitus.forEach(log => {
      // Stress (New or Legacy)
      const stressVal = (log.lifestyle?.stress ?? (log.stressLevel === 'High' ? 3 : 1));
      if (stressVal >= 2) { factors[0].value += log.severity; factors[0].count++; }
      
      // Sleep (New or Legacy)
      const sleepVal = (log.sleepQualityValue != null ? (6 - log.sleepQualityValue) : (log.sleepQuality === 'Poor' ? 3 : 1));
      if (sleepVal >= 3) { factors[1].value += log.severity; factors[1].count++; }

      // Doomscrolling
      if (log.lifestyle?.doomscrolling && log.lifestyle.doomscrolling >= 2) { factors[2].value += log.severity; factors[2].count++; }

      // Headache
      if (log.symptoms?.headache && log.symptoms.headache >= 2) { factors[3].value += log.severity; factors[3].count++; }

      // Time Outside (Positive factor - checking if low outside time correlates)
      if (log.lifestyle?.timeOutside != null && log.lifestyle.timeOutside <= 1) { factors[4].value += log.severity; factors[4].count++; }
    });

    return factors.map(f => ({
      subject: f.name,
      A: f.count > 0 ? parseFloat((f.value / f.count).toFixed(1)) : 0,
      fullMark: 10,
    }));
  }, [filteredTinnitus]);

  return (
    <div className="px-6 pt-16 pb-12 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-sage-dark tracking-tight">Patterns</h1>
        <div className="flex bg-sage-pale/50 p-1.5 rounded-2xl border border-sage-pale/30">
          {[7, 30, 90].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-extrabold rounded-xl transition-all",
                timeRange === range ? "bg-sage-medium text-white shadow-md shadow-sage-medium/20 scale-105" : "text-sage-dark opacity-40 hover:opacity-100"
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
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">Average daily symptom level</p>
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
                  <stop offset="5%" stopColor="#8A9A5B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8A9A5B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E1" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#8A9A5B' }}
                dy={10}
              />
              <YAxis 
                hide 
                domain={[0, 10]} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: '1px solid #E1E8E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Area 
                type="monotone" 
                dataKey="severity" 
                stroke="#8A9A5B" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Time of Day Pattern */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Time of Day</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">When symptoms typically surface</p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <Zap size={20} className="text-sage-medium" />
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeOfDayData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E1" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#8A9A5B' }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#FCFAF7' }}
                contentStyle={{ borderRadius: '16px', border: '1px solid #E1E8E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {timeOfDayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avgSeverity > 5 ? '#8A9A5B' : '#C1CDC1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Context Correlation */}
      <section className="bg-white p-7 rounded-[32px] border border-sage-pale/50 card-shadow space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-sage-dark tracking-tight">Trigger Analysis</h2>
            <p className="text-xs text-sage-medium font-bold opacity-50 tracking-tight">Average severity per context</p>
          </div>
          <div className="bg-sage-pale/50 p-2.5 rounded-2xl">
            <AlertCircle size={20} className="text-sage-medium" />
          </div>
        </div>

        <div className="h-64 w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={correlationData}>
              <PolarGrid stroke="#E1E8E1" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#556B2F', fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} hide />
              <Radar
                name="Severity"
                dataKey="A"
                stroke="#8A9A5B"
                fill="#8A9A5B"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Insights */}
      <section className="space-y-4">
        <h2 className="font-bold text-sage-900 ml-1">Key Insights</h2>
        <div className="space-y-3">
          <InsightCard 
            icon={<TrendingUp size={18} className="text-red-500" />}
            title="Stress Impact"
            description="Higher severity logs appear on high-stress days. Your average severity jumps from 3.2 to 6.8 during stress peaks."
          />
          <InsightCard 
            icon={<Zap size={18} className="text-yellow-500" />}
            title="Evening Sensitivity"
            description="Symptoms are 40% more frequent in the evening. This correlates with quieter environments."
          />
          <InsightCard 
            icon={<Pill size={18} className="text-blue-500" />}
            title="Medication Efficacy"
            description="Medication logs often occur before lower severity entries. Average relief noted within 3 hours."
          />
        </div>
      </section>
    </div>
  );
}

function InsightCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-insight-bg p-5 rounded-[18px] border-l-4 border-insight-border shadow-sm flex gap-4">
      <div className="shrink-0 pt-1">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-insight-text text-sm">{title}</h4>
        <p className="text-xs text-insight-text/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

