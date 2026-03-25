import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Lock,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ETHIOPIAN_MONTHS, ETHIOPIAN_MONTHS_AM, Trade, DailyJournal, CalendarEntry, UserSession, EthiopianDate } from './types';
import { getEthiopianDaysInMonth, formatCurrency, toEthiopianDate, getEthiopianDateString, getStartWeekday } from './utils/ethiopianCalendar';

// --- Components ---

const Login = ({ onLogin }: { onLogin: (email: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-win/10 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="text-win w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mihiretu Journal</h1>
          <p className="text-muted-foreground text-sm">Professional Trading Log</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-win/50 transition-all"
                placeholder="trader@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-win/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-win hover:bg-win/90 text-background font-bold py-3 rounded-lg transition-colors mt-6"
          >
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) => (
  <div className="bg-card border border-border p-6 rounded-xl flex items-center justify-between">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
      <h3 className={cn("text-3xl font-bold", colorClass)}>{value}</h3>
    </div>
    <div className={cn("p-3 rounded-lg bg-opacity-10", colorClass.replace('text-', 'bg-'))}>
      <Icon className={cn("w-6 h-6", colorClass)} />
    </div>
  </div>
);

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [view, setView] = useState<'dashboard' | 'calendar'>('dashboard');
  
  // Date state for navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const etDate = useMemo(() => toEthiopianDate(currentDate), [currentDate]);
  const dateKey = `${etDate.year}-${etDate.month}-${etDate.day}`;

  // Trades state keyed by date
  const [allTrades, setAllTrades] = useState<Record<string, Trade[]>>(() => {
    const saved = localStorage.getItem('all_trades');
    return saved ? JSON.parse(saved) : {};
  });

  const trades = useMemo(() => {
    return allTrades[dateKey] || Array.from({ length: 6 }, (_, i) => ({ id: `T${i + 1}`, result: null, reason: '' }));
  }, [allTrades, dateKey]);

  const [calendarData, setCalendarData] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('calendar_data_v2');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('all_trades', JSON.stringify(allTrades));
  }, [allTrades]);

  useEffect(() => {
    localStorage.setItem('calendar_data_v2', JSON.stringify(calendarData));
  }, [calendarData]);

  const handleLogin = (email: string) => {
    const newSession = { email, isAuthenticated: true };
    setSession(newSession);
    localStorage.setItem('session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('session');
  };

  const updateTrade = (id: string, field: keyof Trade, value: any) => {
    setAllTrades(prev => {
      const currentDayTrades = [...trades];
      const updatedTrades = currentDayTrades.map(t => t.id === id ? { ...t, [field]: value } : t);
      return { ...prev, [dateKey]: updatedTrades };
    });
  };

  const toggleTradeTick = (id: string) => {
    setAllTrades(prev => {
      const currentDayTrades = [...trades];
      const updatedTrades = currentDayTrades.map(t => t.id === id ? { ...t, ticked: !t.ticked } : t);
      return { ...prev, [dateKey]: updatedTrades };
    });
  };

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { wins, losses, winRate };
  }, [trades]);

  const plStats = useMemo(() => {
    const values = Object.values(calendarData) as number[];
    const totalProfit = values.filter(v => v > 0).reduce((a, b) => a + b, 0);
    const totalLoss = Math.abs(values.filter(v => v < 0).reduce((a, b) => a + b, 0));
    
    // Monthly income for current Ethiopian month
    const monthPrefix = `${etDate.year}-${etDate.month}-`;
    const monthlyIncome = Object.entries(calendarData)
      .filter(([key]) => key.startsWith(monthPrefix))
      .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);

    return { totalProfit, totalLoss, monthlyIncome };
  }, [calendarData, etDate]);

  const navigateDate = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <TrendingUp className="text-win w-6 h-6" />
          <span className="font-bold text-lg">Mihiretu</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              view === 'dashboard' ? "bg-win/10 text-win" : "hover:bg-border text-muted-foreground"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              view === 'calendar' ? "bg-win/10 text-win" : "hover:bg-border text-muted-foreground"
            )}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Profit and Loss</span>
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-loss hover:bg-loss/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Daily Trading Log</h2>
                  <p className="text-muted-foreground">Review and record your daily performance</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg">
                    <button 
                      onClick={() => navigateDate(-1)}
                      className="p-1.5 hover:bg-border rounded-md transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 flex flex-col items-center min-w-[140px]">
                      <span className="text-xs font-bold text-win">{getEthiopianDateString(currentDate)}</span>
                      <span className="text-[10px] text-muted-foreground">{currentDate.toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => navigateDate(1)}
                      className="p-1.5 hover:bg-border rounded-md transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="text-xs bg-border px-3 py-2 rounded-lg hover:bg-border/80 transition-colors"
                  >
                    Today
                  </button>
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Wins" value={stats.wins} icon={CheckCircle2} colorClass="text-win" />
                <StatCard title="Total Losses" value={stats.losses} icon={XCircle} colorClass="text-loss" />
                <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={TrendingUp} colorClass="text-blue-400" />
              </div>

              {/* Stop Trading Warning */}
              {stats.losses >= 3 && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-loss/20 border-2 border-loss rounded-2xl p-6 md:p-8 flex flex-col items-center text-center space-y-4 relative overflow-hidden"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-loss p-4 rounded-full"
                  >
                    <AlertTriangle className="w-10 h-10 md:w-14 md:h-14 text-white" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-4xl font-black text-loss uppercase tracking-tighter">
                      STOP TRADING NOW!
                    </h3>
                    <p className="text-lg md:text-xl font-bold text-white">
                      You have reached 3 losses today.
                    </p>
                  </div>

                  <div className="max-w-md bg-loss/10 p-4 rounded-xl border border-loss/30">
                    <p className="text-sm md:text-base italic text-muted-foreground leading-relaxed">
                      "A professional trader is not defined by their wins, but by their discipline to walk away. 
                      Protect your capital, protect your mind. The market will be here tomorrow, but your edge 
                      disappears when you trade with emotions. Rest, recover, and come back stronger."
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-loss font-bold text-sm uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-loss animate-pulse" />
                    Trading Locked for Today
                  </div>
                </motion.div>
              )}

              {/* Trade Entry Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-lg">Trades for {ETHIOPIAN_MONTHS[etDate.month]} {etDate.day}</h3>
                  <button 
                    onClick={() => {
                      setAllTrades(prev => {
                        const newData = { ...prev };
                        delete newData[dateKey];
                        return newData;
                      });
                    }}
                    className="text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-white transition-colors"
                  >
                    Clear Day
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-background/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4">Trade ID</th>
                        <th className="px-6 py-4">Result</th>
                        <th className="px-6 py-4">Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {trades.map((trade) => (
                        <tr 
                          key={trade.id} 
                          onDoubleClick={() => toggleTradeTick(trade.id)}
                          className={cn(
                            "hover:bg-white/[0.02] transition-colors cursor-pointer select-none",
                            trade.ticked && "opacity-60 grayscale-[0.5]"
                          )}
                        >
                          <td className="px-6 py-4 font-mono font-bold text-muted-foreground flex items-center gap-2">
                            {trade.id}
                            {trade.ticked && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <CheckCircle2 className="w-4 h-4 text-win" />
                              </motion.div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateTrade(trade.id, 'result', trade.result === 'win' ? null : 'win')}
                                className={cn(
                                  "p-2 rounded-lg transition-all border",
                                  trade.result === 'win' 
                                    ? "bg-win text-background border-win" 
                                    : "bg-background border-border text-muted-foreground hover:border-win/50"
                                )}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => updateTrade(trade.id, 'result', trade.result === 'loss' ? null : 'loss')}
                                className={cn(
                                  "p-2 rounded-lg transition-all border",
                                  trade.result === 'loss' 
                                    ? "bg-loss text-white border-loss" 
                                    : "bg-background border-border text-muted-foreground hover:border-loss/50"
                                )}
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="text" 
                              value={trade.reason}
                              onChange={(e) => updateTrade(trade.id, 'reason', e.target.value)}
                              placeholder="Why did you take this trade?"
                              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-win/50 transition-all text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
                
                <div className="flex items-center gap-8">
                  <button 
                    onClick={() => navigateDate(-30)}
                    className="p-2 hover:bg-border rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-4xl font-bold flex items-center gap-4">
                      <span className="font-serif">{ETHIOPIAN_MONTHS_AM[etDate.month]}</span>
                      <span className="text-muted-foreground">{etDate.year}</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => navigateDate(30)}
                    className="p-2 hover:bg-border rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="hidden md:block w-24"></div>
              </header>

              {/* P/L Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-win/10">
                    <TrendingUp className="w-6 h-6 text-win" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Profit</p>
                    <h3 className="text-2xl font-bold text-win">{formatCurrency(plStats.totalProfit)}</h3>
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-loss/10">
                    <TrendingDown className="w-6 h-6 text-loss" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Loss</p>
                    <h3 className="text-2xl font-bold text-loss">-{formatCurrency(plStats.totalLoss)}</h3>
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly Income</p>
                    <h3 className={cn("text-2xl font-bold", plStats.monthlyIncome >= 0 ? "text-win" : "text-loss")}>
                      {formatCurrency(plStats.monthlyIncome)}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-center text-[8px] md:text-[10px] font-bold text-muted-foreground tracking-widest py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {/* Padding for start of month */}
                  {Array.from({ length: getStartWeekday(etDate.month, etDate.year) }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-16 md:h-32 bg-card/20 rounded-lg md:rounded-xl border border-border/30"></div>
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: getEthiopianDaysInMonth(etDate.month, etDate.year) }, (_, dIdx) => {
                    const day = dIdx + 1;
                    const key = `${etDate.year}-${etDate.month}-${day}`;
                    const value = calendarData[key];
                    const isPositive = value !== undefined && value >= 0;
                    const isNegative = value !== undefined && value < 0;
                    const etToday = toEthiopianDate(new Date());
                    const isToday = etToday.year === etDate.year && etToday.month === etDate.month && etToday.day === day;
                    
                    return (
                      <div 
                        key={key}
                        className={cn(
                          "relative group flex flex-col p-1 md:p-3 rounded-lg md:rounded-xl border transition-all h-16 md:h-32",
                          isPositive ? "bg-win/5 border-win/20" : 
                          isNegative ? "bg-loss/5 border-loss/20" : 
                          "bg-card border-border",
                          isToday && "ring-2 ring-win ring-offset-1 md:ring-offset-2 ring-offset-background z-10"
                        )}
                      >
                        <span className="text-[10px] md:text-xs font-bold text-muted-foreground mb-1 md:mb-2">{day}</span>
                        
                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                          <div className="flex items-center justify-center text-[10px] md:text-base font-bold">
                            {value !== undefined && <span className="mr-0.5 text-muted-foreground text-[8px] md:text-xs">$</span>}
                            <input 
                              type="text"
                              value={calendarData[key] === undefined ? '' : calendarData[key]}
                              onChange={(e) => {
                                const val = e.target.value;
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
                                "w-full bg-transparent focus:outline-none text-center",
                                isPositive ? "text-win" : isNegative ? "text-loss" : "text-white"
                              )}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
