import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ShieldAlert, 
  HeartHandshake, 
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ETHIOPIAN_MONTHS_AM, PlanDayData } from './types';
import { getEthiopianDaysInMonth, formatCurrency, toEthiopianDate, getStartWeekday } from './utils/ethiopianCalendar';
import { PWAInstallMenuItem } from './components/PWAInstallModal';
import { OfflineBanner } from './components/OfflineBanner';

// --- Stat Block Component with OLED Black & Neon Glow ---
const StatBlock = ({ 
  label, 
  value, 
  subValue,
  highlight = 'neutral',
  icon: Icon
}: { 
  label: string, 
  value: string | number, 
  subValue?: string,
  highlight?: 'win' | 'loss' | 'neutral',
  icon?: React.ElementType
}) => (
  <div className={cn(
    "relative flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl border transition-all duration-200 overflow-hidden",
    "bg-[#070709] hover:bg-[#0a0a0e]",
    highlight === 'win' && "border-emerald-500/30 shadow-[0_0_15px_rgba(0,230,118,0.06)]",
    highlight === 'loss' && "border-red-500/30 shadow-[0_0_15px_rgba(255,56,56,0.06)]",
    highlight === 'neutral' && "border-white/10"
  )}>
    {/* Subtle top indicator bar */}
    <div className={cn(
      "absolute top-0 left-0 right-0 h-[2px]",
      highlight === 'win' ? "bg-emerald-500" : highlight === 'loss' ? "bg-red-500" : "bg-white/10"
    )} />

    <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
      <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-[#8a8a93] truncate">
        {label}
      </span>
      {Icon && (
        <Icon className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0",
          highlight === 'win' ? "text-emerald-400" : highlight === 'loss' ? "text-red-400" : "text-[#70707a]"
        )} />
      )}
    </div>

    <div>
      <div className={cn(
        "text-lg sm:text-2xl md:text-3xl font-mono font-bold tracking-tight truncate",
        highlight === 'win' ? "text-emerald-400" : highlight === 'loss' ? "text-red-400" : "text-white"
      )}>
        {value}
      </div>
      {subValue && (
        <span className="text-[9px] sm:text-[11px] font-mono text-[#666] tracking-tight block mt-0.5">
          {subValue}
        </span>
      )}
    </div>
  </div>
);

export default function App() {
  // Navigation date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const etDate = useMemo(() => toEthiopianDate(currentDate), [currentDate]);

  // Calendar Data State (P/L)
  const [calendarData, setCalendarData] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('calendar_data_v2');
    return saved ? JSON.parse(saved) : {};
  });

  // Ticked Days State
  const [tickedDays, setTickedDays] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ticked_days');
    return saved ? JSON.parse(saved) : {};
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // View mode switcher: 'calendar' (Journal) | 'plan' (Daily Engine)
  const [currentView, setCurrentView] = useState<'calendar' | 'plan'>('calendar');

  // Plan data for daily engine
  const [planData, setPlanData] = useState<Record<string, PlanDayData>>(() => {
    const saved = localStorage.getItem('mirejourney_plan');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('mirejourney_plan', JSON.stringify(planData));
  }, [planData]);

  useEffect(() => {
    localStorage.setItem('calendar_data_v2', JSON.stringify(calendarData));
  }, [calendarData]);

  useEffect(() => {
    localStorage.setItem('ticked_days', JSON.stringify(tickedDays));
  }, [tickedDays]);

  const updatePlanData = (key: string, field: keyof PlanDayData, value: any) => {
    setPlanData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const getStartBalanceForDay = (dateKey: string) => {
    const parseKey = (k: string) => {
      const [y, m, d] = k.split('-').map(Number);
      return y * 10000 + m * 100 + d;
    };
    
    const targetVal = parseKey(dateKey);
    const sortedKeys = Object.keys(planData)
      .filter(k => parseKey(k) <= targetVal)
      .sort((a, b) => parseKey(a) - parseKey(b));

    let currentBalance: number | null = null;
    
    for (const key of sortedKeys) {
      const dayData = planData[key];
      if (dayData.startBalance !== undefined && dayData.startBalance !== '') {
         currentBalance = Number(dayData.startBalance);
      }
      
      if (key !== dateKey && currentBalance !== null) {
         if (dayData.dailyResult !== undefined && dayData.dailyResult !== '') {
            currentBalance += Number(dayData.dailyResult);
         }
      }
    }
    return currentBalance;
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTick = (key: string) => {
    setTickedDays(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const navigateDate = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Global Auto-Calculated Stats
  const globalStats = useMemo(() => {
    const values = Object.values(calendarData)
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => Number(v))
      .filter(v => !isNaN(v) && v !== 0);
    
    const winDays = values.filter(v => v > 0).length;
    const lossDays = values.filter(v => v < 0).length;
    const totalDays = winDays + lossDays;
    const winRate = totalDays > 0 ? Math.round((winDays / totalDays) * 100) : 0;
    
    const totalProfit = values.filter(v => v > 0).reduce((a, b) => a + b, 0);
    const totalLoss = Math.abs(values.filter(v => v < 0).reduce((a, b) => a + b, 0));
    const netPL = values.reduce((a, b) => a + b, 0);

    return { winDays, lossDays, totalDays, winRate, totalProfit, totalLoss, netPL };
  }, [calendarData]);

  // Monthly Aggregate Stats
  const monthlyStats = useMemo(() => {
    const groups: Record<string, { year: number, month: number, values: number[] }> = {};
    
    Object.entries(calendarData).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      const valNum = Number(value);
      if (isNaN(valNum) || valNum === 0) return;

      const [y, m] = key.split('-');
      const groupKey = `${y}-${m}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          year: parseInt(y),
          month: parseInt(m),
          values: []
        };
      }
      groups[groupKey].values.push(valNum);
    });

    return Object.values(groups).map(g => {
      const winDays = g.values.filter(v => v > 0).length;
      const totalDays = g.values.length;
      const winRate = totalDays > 0 ? Math.round((winDays / totalDays) * 100) : 0;
      const netPL = g.values.reduce((a, b) => a + b, 0);
      
      return {
        ...g,
        winRate,
        netPL
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [calendarData]);

  // Quick emotional state tags
  const emotionalTags = ['Calm 🧘', 'Disciplined 🎯', 'Patient ⏳', 'Focused 🧠', 'Anxious ⚡', 'Greedy ⚠️'];

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col justify-between selection:bg-emerald-500/30 overflow-x-hidden antialiased">
      <OfflineBanner />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-[#18181f] pt-safe px-safe">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand & Symbol Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setCurrentView(prev => prev === 'calendar' ? 'plan' : 'calendar')}
              className={cn(
                "p-2 rounded-xl border transition-all active:scale-95 touch-manipulation flex items-center justify-center",
                currentView === 'plan' 
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.2)]" 
                  : "bg-[#0f0f13] border-white/10 text-white/70 hover:text-white"
              )}
              title={currentView === 'calendar' ? "Switch to Daily Engine" : "Switch to Calendar"}
            >
              <Compass className="w-5 h-5 animate-pulse" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black tracking-[0.18em] text-sm sm:text-base text-white">
                  MRE TRD
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#666] tracking-wider hidden sm:block">
                Trading Journey & Journal
              </span>
            </div>
          </div>

          {/* Right Header Actions: Monthly History */}
          <div className="flex items-center gap-2">
            {/* Monthly History Menu */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-[#0f0f13] border border-white/10 text-[#888] hover:text-white transition-colors active:scale-95 touch-manipulation"
                title="Monthly Performance Breakdown"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#09090c] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden z-50 max-h-[75vh] overflow-y-auto"
                  >
                    <div className="px-4 py-3 border-b border-white/10 bg-[#0c0c10] sticky top-0 backdrop-blur-md flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold tracking-widest text-[#999] uppercase">Monthly Ledger</h3>
                        <span className="text-[10px] text-[#555]">የወራት ውጤት ማጠቃለያ</span>
                      </div>
                      <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="text-[#666] hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <PWAInstallMenuItem />
                    
                    <div className="divide-y divide-white/5">
                      {monthlyStats.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#555] font-mono">
                          No monthly records logged yet.
                        </div>
                      ) : (
                        monthlyStats.map((stat) => (
                          <div 
                            key={`${stat.year}-${stat.month}`} 
                            className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                          >
                            <div>
                              <span className="text-sm font-bold block text-white">
                                {ETHIOPIAN_MONTHS_AM[stat.month]} <span className="font-mono text-[#888] text-xs ml-1">{stat.year}</span>
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-[#666]">
                                  WR: <span className={stat.winRate >= 50 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{stat.winRate}%</span>
                                </span>
                                <span className="text-[9px] text-[#444]">•</span>
                                <span className="text-[10px] font-mono text-[#666]">
                                  {stat.values.length} Days
                                </span>
                              </div>
                            </div>
                            <div className={cn(
                              "font-mono font-bold text-sm sm:text-base text-right",
                              stat.netPL > 0 ? "text-emerald-400" : stat.netPL < 0 ? "text-red-400" : "text-white"
                            )}>
                              {formatCurrency(stat.netPL)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {currentView === 'calendar' ? (
          <>
            {/* Global Stats Grid (OLED Black Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <StatBlock 
                label="Net P/L" 
                value={formatCurrency(globalStats.netPL)} 
                subValue={globalStats.netPL >= 0 ? "+ All time profit" : "- All time loss"}
                highlight={globalStats.netPL > 0 ? 'win' : globalStats.netPL < 0 ? 'loss' : 'neutral'} 
                icon={globalStats.netPL >= 0 ? TrendingUp : TrendingDown}
              />
              <StatBlock 
                label="Win Rate" 
                value={`${globalStats.winRate}%`} 
                subValue={`${globalStats.winDays}W / ${globalStats.lossDays}L (${globalStats.totalDays} Days)`}
                highlight={globalStats.winRate >= 50 ? 'win' : globalStats.winRate > 0 ? 'loss' : 'neutral'} 
                icon={Sparkles}
              />
              <StatBlock 
                label="Winning Days" 
                value={globalStats.winDays} 
                subValue={`+${formatCurrency(globalStats.totalProfit)}`}
                highlight="win" 
                icon={ShieldCheck}
              />
              <StatBlock 
                label="Losing Days" 
                value={globalStats.lossDays} 
                subValue={`-${formatCurrency(globalStats.totalLoss)}`}
                highlight="loss" 
                icon={ShieldAlert}
              />
            </div>

            {/* Tactical Calendar Module (Optimized for full width & mobile touch) */}
            <div className="bg-[#070709] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              
              {/* Calendar Month Header */}
              <div className="px-3 sm:px-6 py-3 sm:py-5 border-b border-white/10 flex items-center justify-between bg-[#0a0a0d]">
                <button 
                  onClick={() => navigateDate(-30)}
                  className="p-2 sm:p-3 bg-black border border-white/10 rounded-xl active:bg-white/10 hover:border-white/20 transition-colors touch-manipulation text-[#888] hover:text-white"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <div className="text-center flex items-center gap-2">
                  <h2 className="text-xl sm:text-3xl font-serif tracking-wider text-emerald-400">
                    {ETHIOPIAN_MONTHS_AM[etDate.month]} 
                    <span className="font-mono text-white text-base sm:text-2xl ml-2 font-normal">
                      {etDate.year}
                    </span>
                  </h2>
                  <button 
                    onClick={resetToToday}
                    className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/10 hover:bg-white/20 text-[#aaa]"
                    title="Jump to Current Ethiopian Month"
                  >
                    Today
                  </button>
                </div>

                <button 
                  onClick={() => navigateDate(30)}
                  className="p-2 sm:p-3 bg-black border border-white/10 rounded-xl active:bg-white/10 hover:border-white/20 transition-colors touch-manipulation text-[#888] hover:text-white"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Weekdays Row */}
              <div className="bg-[#121217] gap-[1px] grid grid-cols-7 border-b border-white/10">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="bg-[#09090c] text-center text-[8px] sm:text-[10px] font-mono font-bold text-[#71717a] tracking-wider py-1.5 sm:py-2.5 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Calendar Cells */}
              <div className="bg-[#121217] gap-[1px] grid grid-cols-7">
                {/* Padding for start of month */}
                {Array.from({ length: getStartWeekday(etDate.month, etDate.year) }).map((_, i) => (
                  <div key={`pad-${i}`} className="bg-black min-h-[64px] sm:min-h-[105px] opacity-20"></div>
                ))}

                {/* Actual Days */}
                {Array.from({ length: getEthiopianDaysInMonth(etDate.month, etDate.year) }, (_, dIdx) => {
                  const day = dIdx + 1;
                  const key = `${etDate.year}-${etDate.month}-${day}`;
                  const value = calendarData[key];
                  const isPositive = value !== undefined && value > 0;
                  const isNegative = value !== undefined && value < 0;
                  const isZero = value === 0;
                  const etToday = toEthiopianDate(new Date());
                  const isToday = etToday.year === etDate.year && etToday.month === etDate.month && etToday.day === day;
                  const isTicked = tickedDays[key];
                  
                  return (
                    <div 
                      key={key}
                      onDoubleClick={() => toggleTick(key)}
                      className={cn(
                        "relative flex flex-col p-1 sm:p-3 min-h-[64px] sm:min-h-[105px] transition-colors select-none",
                        isPositive ? "bg-emerald-950/25 hover:bg-emerald-950/35" : 
                        isNegative ? "bg-red-950/25 hover:bg-red-950/35" : 
                        isZero ? "bg-white/[0.02]" : "bg-black hover:bg-[#07070a]",
                        isToday && "ring-1 inset-0 ring-inset ring-emerald-400/80 z-10"
                      )}
                    >
                      {/* Cell Header: Date Number + Double Tap Checkmark */}
                      <div className="flex items-start justify-between h-3.5 sm:h-5">
                        <span className={cn(
                          "text-[9px] sm:text-xs font-mono font-bold leading-none",
                          isToday ? "text-emerald-400 font-black" : "text-[#70707a]"
                        )}>
                          {String(day).padStart(2, '0')}
                        </span>
                        {isTicked && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-emerald-400" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      
                      {/* P/L Input Area */}
                      <div className="flex-1 flex flex-col justify-center overflow-hidden w-full my-auto">
                        <div className="flex items-center justify-center w-full gap-0.5">
                          {(value !== undefined && value !== null && String(value) !== '') && (
                            <span className={cn(
                              "text-[8px] sm:text-xs font-mono font-bold opacity-80 shrink-0",
                              isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-white"
                            )}>$</span>
                          )}
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={calendarData[key] === undefined ? '' : calendarData[key]}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.-]/g, '');
                              if (val === '' || val === '-' || !isNaN(Number(val))) {
                                setCalendarData(prev => ({ ...prev, [key]: val as any }));
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val)) {
                                const newData = { ...calendarData };
                                delete newData[key];
                                setCalendarData(newData);
                              } else {
                                setCalendarData(prev => ({ ...prev, [key]: val }));
                              }
                            }}
                            className={cn(
                              "w-full min-w-0 bg-transparent focus:outline-none text-center font-mono font-bold text-[9px] sm:text-sm md:text-lg transition-colors tracking-tight",
                              isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-white"
                            )}
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Daily Plan Engine (Single Date View with 22% TP and 11% SL) */
          <div className="space-y-4 w-full max-w-md mx-auto py-2">
            
            {/* Date Navigator */}
            <div className="flex items-center justify-between px-1">
              <button 
                onClick={() => navigateDate(-1)} 
                className="p-2.5 sm:p-3 bg-[#0a0a0d] border border-white/10 rounded-xl hover:border-white/20 active:bg-white/10 text-[#888] hover:text-white transition-all touch-manipulation"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="text-center">
                <button 
                  onClick={resetToToday}
                  className="text-xs sm:text-sm font-mono font-bold text-white hover:text-emerald-400 transition-colors"
                >
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][currentDate.getDay()]} • {currentDate.toLocaleDateString()}
                </button>
              </div>

              <button 
                onClick={() => navigateDate(1)} 
                className="p-2.5 sm:p-3 bg-[#0a0a0d] border border-white/10 rounded-xl hover:border-white/20 active:bg-white/10 text-[#888] hover:text-white transition-all touch-manipulation"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Daily Engine Glass Card */}
            {(() => {
              const d = currentDate;
              const etDt = toEthiopianDate(d);
              const key = `${etDt.year}-${etDt.month}-${etDt.day}`;
              const data = planData[key] || {};
              const effectiveStartBal = getStartBalanceForDay(key);
              
              const displayBalance = data.startBalance !== undefined ? data.startBalance : (effectiveStartBal !== null ? effectiveStartBal : '');
              const numBalance = Number(displayBalance);
              const tpNum = !isNaN(numBalance) && numBalance > 0 ? numBalance * 0.22 : 0;
              const slNum = !isNaN(numBalance) && numBalance > 0 ? numBalance * 0.11 : 0;
              
              const tp = tpNum > 0 ? tpNum.toFixed(2) : '--';
              const sl = slNum > 0 ? slNum.toFixed(2) : '--';

              const targetBalance = numBalance > 0 ? (numBalance + tpNum).toFixed(2) : '--';
              const lossBalance = numBalance > 0 ? (numBalance - slNum).toFixed(2) : '--';

              const isToday = new Date().toDateString() === d.toDateString();

              return (
                <div key={key} className={cn(
                  "bg-[#070709] border rounded-3xl p-4 sm:p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden transition-all",
                  isToday ? "border-emerald-500/40 shadow-[0_0_30px_rgba(0,230,118,0.08)]" : "border-white/10"
                )}>
                  {/* Top glowing neon accent line */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    isToday ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" : "bg-white/10"
                  )} />

                  {/* Header: Ethiopian Date & Badge */}
                  <div className="flex justify-between items-center border-b border-white/10 pb-3 sm:pb-4 pt-1">
                    <div>
                      <span className="font-serif text-lg sm:text-2xl text-emerald-400 font-bold block">
                        {ETHIOPIAN_MONTHS_AM[etDt.month]} {etDt.day}, {etDt.year}
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono text-[#777] mt-0.5 block">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]} • fixed payout 95%
                      </span>
                    </div>
                    {isToday && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Start Balance Section */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] uppercase font-bold tracking-widest text-[#888]">
                        Start Balance
                      </span>
                      <span className="text-[10px] font-mono text-[#555]">
                        Auto-carried from result
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777] text-base font-mono font-bold">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={displayBalance}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.-]/g, '');
                          updatePlanData(key, 'startBalance', val);
                        }}
                        placeholder="0.00"
                        className="w-full bg-black border border-white/10 rounded-2xl pl-8 pr-4 py-3 sm:py-3.5 text-right font-mono text-base sm:text-xl font-bold focus:border-emerald-500 outline-none transition-colors text-white placeholder:text-[#333]"
                      />
                    </div>
                  </div>

                  {/* TP & SL Targets Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* TP Card (+22%) */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-[0_0_20px_rgba(0,230,118,0.05)]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                          TP (+22%)
                        </span>
                        {targetBalance !== '--' && (
                          <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-300/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Stop: ${targetBalance}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400 mt-2">
                        +${tp}
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400/60 mt-1">
                        Target Stop Balance
                      </span>
                    </div>

                    {/* SL Card (-11%) */}
                    <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-[0_0_20px_rgba(255,56,56,0.05)]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-red-400">
                          SL (-11%)
                        </span>
                        {lossBalance !== '--' && (
                          <span className="text-[10px] sm:text-xs font-mono font-bold text-red-300/80 bg-red-500/10 px-1.5 py-0.5 rounded">
                            Stop: ${lossBalance}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-red-400 mt-2">
                        -${sl}
                      </div>
                      <span className="text-[9px] font-mono text-red-400/60 mt-1">
                        Cut Loss Balance
                      </span>
                    </div>
                  </div>

                  {/* Daily Result Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] uppercase font-bold tracking-widest text-[#888]">
                        Daily Result (+ / -)
                      </span>
                      {data.dailyResult && Number(data.dailyResult) !== 0 && (
                        <span className={cn(
                          "text-[10px] font-mono font-bold",
                          Number(data.dailyResult) > 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {Number(data.dailyResult) > 0 ? "WIN DAY" : "LOSS DAY"}
                        </span>
                      )}
                    </div>

                    <div className="relative h-13 sm:h-14 flex items-center">
                      <span className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-bold",
                        (data.dailyResult && Number(data.dailyResult) > 0) ? "text-emerald-400" : 
                        (data.dailyResult && Number(data.dailyResult) < 0) ? "text-red-400" : "text-[#777]"
                      )}>$</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={data.dailyResult || ''}
                        onChange={e => updatePlanData(key, 'dailyResult', e.target.value.replace(/[^0-9.-]/g, ''))}
                        className={cn(
                          "h-full w-full bg-black border rounded-2xl pl-9 pr-4 py-3 text-left font-mono text-lg sm:text-xl font-bold focus:outline-none transition-colors",
                          (data.dailyResult && Number(data.dailyResult) > 0) 
                            ? "text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(0,230,118,0.1)]" 
                            : (data.dailyResult && Number(data.dailyResult) < 0) 
                            ? "text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(255,56,56,0.1)]" 
                            : "text-white border-white/10 focus:border-emerald-500"
                        )}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Rules Followed Question */}
                  <div className="flex justify-between items-center gap-3 bg-black/60 p-3.5 sm:p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-[#888]" />
                      <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#aaa]">
                        Followed Rules? (ሕግን አክብርያለሁ?)
                      </span>
                    </div>
                    
                    <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <button 
                        onClick={() => updatePlanData(key, 'rulesFollowed', data.rulesFollowed === 'yes' ? null : 'yes')}
                        className={cn(
                          "px-4 sm:px-6 py-2 text-xs font-bold uppercase transition-all touch-manipulation", 
                          data.rulesFollowed === 'yes' ? "bg-emerald-500 text-black shadow-sm font-black" : "bg-[#0f0f13] text-[#777] hover:bg-white/5"
                        )}
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => updatePlanData(key, 'rulesFollowed', data.rulesFollowed === 'no' ? null : 'no')}
                        className={cn(
                          "px-4 sm:px-6 py-2 text-xs font-bold uppercase transition-all border-l border-white/10 touch-manipulation", 
                          data.rulesFollowed === 'no' ? "bg-red-500 text-white shadow-sm font-black" : "bg-[#0f0f13] text-[#777] hover:bg-white/5"
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Emotional State Input & Quick Presets */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#888] ml-1">
                      Emotional State (ስሜታዊ ሁኔታ)
                    </span>
                    <input 
                      type="text"
                      value={data.emotionalState || ''}
                      onChange={e => updatePlanData(key, 'emotionalState', e.target.value)}
                      placeholder="Calm, disciplined, greedy..."
                      className="w-full h-11 sm:h-12 bg-black border border-white/10 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-white focus:border-emerald-500 outline-none placeholder:text-[#444] transition-colors"
                    />

                    {/* Quick clickable chips for fast mobile input */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {emotionalTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => updatePlanData(key, 'emotionalState', tag)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all touch-manipulation border",
                            data.emotionalState === tag 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                              : "bg-[#0c0c10] text-[#777] border-white/5 hover:text-white"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        )}

      </main>

      {/* Mobile Bottom Floating Bar (App experience on phones) */}
      <footer className="w-full border-t border-white/10 bg-black/95 backdrop-blur-xl pb-safe px-safe">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-[#666]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-bold tracking-wider">MRE TRD</span>
            <span className="text-[#444]">•</span>
            <span>Ethiopian Calendar</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#888]">
              {ETHIOPIAN_MONTHS_AM[etDate.month]} {etDate.day}, {etDate.year}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
