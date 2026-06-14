import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ETHIOPIAN_MONTHS_AM } from './types';
import { getEthiopianDaysInMonth, formatCurrency, toEthiopianDate, getStartWeekday } from './utils/ethiopianCalendar';

// --- Stat Block Component ---
const StatBlock = ({ label, value, highlight = 'neutral' }: { label: string, value: string | number, highlight?: 'win' | 'loss' | 'neutral' }) => (
  <div className="flex flex-col justify-end p-4 md:p-6 border border-border bg-card/30 backdrop-blur-md rounded-2xl">
    <span className="text-[9px] md:text-xs uppercase font-bold tracking-[0.1em] text-[#888] mb-1 md:mb-2 line-clamp-1 break-all">{label}</span>
    <span className={cn(
      "text-xl sm:text-3xl md:text-5xl font-mono font-medium tracking-tighter truncate",
      highlight === 'win' ? "text-win" : highlight === 'loss' ? "text-loss" : "text-white"
    )}>
      {value}
    </span>
  </div>
);

// --- Main Application ---
export default function App() {
  // Date state for navigation
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

  useEffect(() => {
    localStorage.setItem('calendar_data_v2', JSON.stringify(calendarData));
  }, [calendarData]);

  useEffect(() => {
    localStorage.setItem('ticked_days', JSON.stringify(tickedDays));
  }, [tickedDays]);

  // Handlers
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

  // Global Auto-Calculated Stats
  const globalStats = useMemo(() => {
    // Map to Number to prevent string concatenation bugs during reduce
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
    const netPL = values.reduce((a, b) => a + b, 0); // Correctly calculate Net P/L

    return { winDays, lossDays, winRate, totalProfit, totalLoss, netPL };
  }, [calendarData]);

  // Monthly Aggregate Stats
  const monthlyStats = useMemo(() => {
    const groups: Record<string, { year: number, month: number, values: number[] }> = {};
    
    Object.entries(calendarData).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      const valNum = Number(value);
      if (isNaN(valNum) || valNum === 0) return;

      const [y, m, d] = key.split('-');
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

  return (
    <div className="min-h-screen bg-background text-white selection:bg-win/30 flex flex-col pt-safe px-safe pb-safe">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-win animate-pulse rounded-full shadow-[0_0_8px_rgba(0,230,118,0.8)]"></div>
            <span className="font-mono font-bold tracking-[0.1em] text-xs">MIREJOURNEY</span>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -mr-2 text-[#888] hover:text-white transition-colors touch-manipulation"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 md:w-72 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                >
                  <div className="px-4 py-3 border-b border-border bg-background/50 sticky top-0 backdrop-blur-md">
                    <h3 className="text-xs font-bold tracking-widest text-[#888] uppercase">Monthly History</h3>
                  </div>
                  
                  <div className="divide-y divide-border">
                    {monthlyStats.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#666] font-mono">
                        No financial data logged yet.
                      </div>
                    ) : (
                      monthlyStats.map((stat, idx) => (
                        <div key={`${stat.year}-${stat.month}`} className="px-4 py-3 flex items-center justify-between hover:bg-background/50 transition-colors">
                          <div>
                            <span className="text-sm font-bold block">{ETHIOPIAN_MONTHS_AM[stat.month]} <span className="font-mono text-[#888] text-xs">{stat.year}</span></span>
                            <span className="text-[10px] font-mono text-[#666]">WR: <span className={stat.winRate >= 50 ? "text-win" : "text-loss"}>{stat.winRate}%</span></span>
                          </div>
                          <div className={cn(
                            "font-mono font-bold text-sm text-right",
                            stat.netPL > 0 ? "text-win" : stat.netPL < 0 ? "text-loss" : "text-white"
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
      </nav>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 w-full px-3 md:px-8 py-4 md:py-8 space-y-6 max-w-[1600px] mx-auto pb-10">
        
        {/* Global Auto-Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatBlock 
            label="Net P/L" 
            value={formatCurrency(globalStats.netPL)} 
            highlight={globalStats.netPL > 0 ? 'win' : globalStats.netPL < 0 ? 'loss' : 'neutral'} 
          />
          <StatBlock 
            label="Win Rate" 
            value={`${globalStats.winRate}%`} 
            highlight="neutral" 
          />
          <StatBlock 
            label="Winning Days" 
            value={globalStats.winDays} 
            highlight="win" 
          />
          <StatBlock 
            label="Losing Days" 
            value={globalStats.lossDays} 
            highlight="loss" 
          />
        </div>

        {/* Tactical Calendar Module */}
        <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-3 py-3 md:px-8 md:py-6 border-b border-border flex items-center justify-between">
            <button 
              onClick={() => navigateDate(-30)}
              className="p-3 bg-background border border-border rounded-lg active:bg-border/50 hover:bg-border transition-colors touch-manipulation"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5 text-[#888]" />
            </button>
            
            <div className="text-center flex-1">
              <h2 className="text-2xl md:text-4xl font-serif tracking-widest text-win">
                {ETHIOPIAN_MONTHS_AM[etDate.month]} <span className="font-mono text-white ml-1">{etDate.year}</span>
              </h2>
            </div>

            <button 
              onClick={() => navigateDate(30)}
              className="p-3 bg-background border border-border rounded-lg active:bg-border/50 hover:bg-border transition-colors touch-manipulation"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5 text-[#888]" />
            </button>
          </div>

          {/* Grid Layout */}
          <div className="bg-border gap-[1px] grid grid-cols-7 border-b border-border">
            {/* Weekdays */}
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="bg-card text-center text-[9px] md:text-[10px] font-mono font-bold text-[#888] tracking-widest py-2 md:py-3 uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="bg-border gap-[1px] grid grid-cols-7">
            {/* Padding for start of month */}
            {Array.from({ length: getStartWeekday(etDate.month, etDate.year) }).map((_, i) => (
              <div key={`pad-${i}`} className="bg-background min-h-[75px] md:min-h-[140px] opacity-10"></div>
            ))}

            {/* Days Calendar Cells */}
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
                    "bg-background relative group flex flex-col p-1.5 md:p-4 min-h-[75px] md:min-h-[140px] transition-colors select-none",
                    isPositive ? "bg-win/10" : isNegative ? "bg-loss/10" : isZero ? "bg-white/5" : "",
                    isToday && "ring-1 inset-0 ring-inset ring-win z-10"
                  )}
                >
                  <div className="flex items-start justify-between mb-1 md:mb-2 h-4 md:h-6">
                    <span className={cn(
                      "text-[10px] md:text-sm font-mono font-bold leading-none",
                      isToday ? "text-win" : "text-[#888]"
                    )}>
                      {String(day).padStart(2, '0')}
                    </span>
                    {isTicked && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-3 h-3 md:w-5 md:h-5 text-win" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center overflow-hidden w-full">
                    <div className="flex flex-row items-center justify-center w-full gap-0.5">
                      {(value !== undefined && value !== null && String(value) !== '') && (
                        <span className={cn(
                          "text-[9px] md:text-sm font-mono opacity-80 shrink-0",
                          isPositive ? "text-win" : isNegative ? "text-loss" : "text-white"
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
                          "w-full min-w-0 bg-transparent focus:outline-none text-left font-mono font-bold text-[10px] sm:text-[14px] md:text-2xl transition-colors tracking-tighter sm:tracking-normal",
                          isPositive ? "text-win" : isNegative ? "text-loss" : "text-white"
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

      </main>
    </div>
  );
}