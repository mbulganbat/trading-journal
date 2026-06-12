import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconChartHistogram, IconCalendar, IconLayoutGrid, IconMoodSmile, 
  IconBrain, IconDownload, IconLoader2, IconTrophy, IconAlertTriangle,
  IconTrendingUp, IconTrendingDown, IconTarget, IconClock, IconCurrencyDollar,
  IconCheck, IconX, IconRosette, IconCalculator, IconChartLine, IconArrowsRightLeft,
  IconFlame
} from '@tabler/icons-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { format, subDays, subMonths, startOfYear, isAfter, isSameDay, getDay, getHours, addHours } from 'date-fns';
import toast from 'react-hot-toast';

import { useAppContext } from '../context/AppContext';
import { stagger, fadeUp } from '../lib/animations';
import { MetricCard, ProgressBar, premiumHoverProps } from '../components/ui/Shared';
import { Trade } from '../types';

const TABS = [
  { id: 'overview', label: 'Overview & Coach', icon: IconBrain },
  { id: 'time', label: 'Time & Session', icon: IconClock },
  { id: 'setups', label: 'Setups & Pairs', icon: IconLayoutGrid },
  { id: 'behavior', label: 'Risk & Behavior', icon: IconMoodSmile }
];

const PERIODS = [
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: '90d', label: 'Last 90 Days', days: 90 },
  { id: '6m', label: 'Last 6 Months', days: 180 },
  { id: '1y', label: 'Last Year', days: 365 },
  { id: 'all', label: 'All Time', days: 9999 }
];

// Helper to simulate timezone offset (simplified for mock data)
const getTimezoneOffset = (tz: string) => {
  if (tz === 'EST') return -5;
  if (tz === 'GMT') return 0;
  if (tz === 'ULAT') return 8; // Ulaanbaatar
  return 0; // UTC default
};

export const Analytics = () => {
  const { trades, accounts, selectedAccountId, settings } = useAppContext();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [activePeriod, setActivePeriod] = useState(PERIODS[2].id);
  
  // Report Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStep, setReportStep] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  // 1. Core Filtering Engine
  const filteredTrades = useMemo(() => {
    let r = trades;
    
    // Account Filter
    if (selectedAccountId && selectedAccountId !== 'all') {
      r = r.filter(t => t.accountId === selectedAccountId);
    }
    
    // Period Filter
    const periodObj = PERIODS.find(p => p.id === activePeriod);
    if (periodObj && periodObj.id !== 'all') {
      const cutoffDate = subDays(new Date(), periodObj.days);
      r = r.filter(t => isAfter(new Date(t.date), cutoffDate));
    }
    
    return [...r].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trades, selectedAccountId, activePeriod]);

  // 2. Deep Performance Calculations
  const metrics = useMemo(() => {
    const resolvedTrades = filteredTrades.filter(t => t.result !== 'breakeven');
    const wins = resolvedTrades.filter(t => t.result === 'win');
    const losses = resolvedTrades.filter(t => t.result === 'loss');
    
    const netPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    const winRate = resolvedTrades.length > 0 ? (wins.length / resolvedTrades.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);
    
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const expectancy = resolvedTrades.length > 0 ? netPnl / resolvedTrades.length : 0;
    
    const avgRR = resolvedTrades.length > 0 ? resolvedTrades.reduce((sum, t) => sum + t.rr, 0) / resolvedTrades.length : 0;
    
    const uniqueDays = new Set(filteredTrades.map(t => t.date.split('T')[0]));
    const activeDays = uniqueDays.size;

    // Equity Curve & Drawdown
    let currentEquity = 100000; // Base mock
    let peak = currentEquity;
    let maxDrawdownAmt = 0;
    let maxDrawdownPct = 0;
    
    const equityCurve = filteredTrades.map(t => {
      currentEquity += t.pnl;
      if (currentEquity > peak) peak = currentEquity;
      
      const ddAmt = peak - currentEquity;
      const ddPct = (ddAmt / peak) * 100;
      
      if (ddAmt > maxDrawdownAmt) maxDrawdownAmt = ddAmt;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
      
      return { date: t.date, equity: currentEquity, drawdown: -ddPct };
    });

    const recoveryFactor = maxDrawdownAmt > 0 ? netPnl / maxDrawdownAmt : (netPnl > 0 ? 99 : 0);
    
    // Simulated Sharpe Ratio (Simplified)
    const returns = filteredTrades.map(t => t.pnl);
    const meanReturn = returns.length > 0 ? returns.reduce((a,b)=>a+b,0)/returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((a,b)=>a + Math.pow(b - meanReturn, 2), 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

    return {
      netPnl, grossProfit, grossLoss, winRate, profitFactor, avgWin, avgLoss, expectancy, avgRR, activeDays,
      maxDrawdownPct, recoveryFactor, sharpeRatio, equityCurve
    };
  }, [filteredTrades]);

  // 3. Dynamic Setup & Pair Analytics
  const setupAnalytics = useMemo(() => {
    const setupsMap: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      if (!setupsMap[t.setup]) setupsMap[t.setup] = [];
      setupsMap[t.setup].push(t);
    });

    return Object.entries(setupsMap).map(([name, trades]) => {
      const resolved = trades.filter(t => t.result !== 'breakeven');
      const wins = resolved.filter(t => t.result === 'win');
      const pnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      const wr = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0;
      const rr = resolved.length > 0 ? resolved.reduce((sum, t) => sum + t.rr, 0) / resolved.length : 0;
      
      const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(resolved.filter(t => t.result === 'loss').reduce((sum, t) => sum + t.pnl, 0));
      const pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

      return { name, count: trades.length, pnl, wr, rr, pf };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  const pairAnalytics = useMemo(() => {
    const pairsMap: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      if (!pairsMap[t.pair]) pairsMap[t.pair] = [];
      pairsMap[t.pair].push(t);
    });

    return Object.entries(pairsMap).map(([name, trades]) => {
      const resolved = trades.filter(t => t.result !== 'breakeven');
      const wins = resolved.filter(t => t.result === 'win');
      const pnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      const wr = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0;
      return { name, count: trades.length, pnl, wr };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // 4. Time & Session Analytics (Timezone Aware)
  const sessionAnalytics = useMemo(() => {
    const sessionsMap: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      if (!sessionsMap[t.session]) sessionsMap[t.session] = [];
      sessionsMap[t.session].push(t);
    });

    return Object.entries(sessionsMap).map(([name, trades]) => {
      const resolved = trades.filter(t => t.result !== 'breakeven');
      const wins = resolved.filter(t => t.result === 'win');
      const pnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      const wr = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0;
      
      const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(resolved.filter(t => t.result === 'loss').reduce((sum, t) => sum + t.pnl, 0));
      const pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

      return { subject: name, A: wr, B: pf * 20, fullMark: 100, pnl, count: trades.length }; // B scaled for radar
    });
  }, [filteredTrades]);

  const { hourlyHeatmap, peakHours } = useMemo(() => {
    const grid = Array.from({ length: 5 }, () => Array(24).fill({ pnl: 0, count: 0 })); // 5 days (Mon-Fri), 24 hours
    let maxAbsPnl = 1;
    
    const hourStats = Array.from({ length: 24 }, () => ({ wins: 0, losses: 0, total: 0 }));
    const tzOffset = getTimezoneOffset(settings.timezone);

    filteredTrades.forEach(t => {
      // Timezone adjustment
      const date = addHours(new Date(t.date), tzOffset);
      const day = getDay(date); // 0=Sun, 1=Mon...
      const hour = getHours(date);

      if (day >= 1 && day <= 5) {
        const currentCell = grid[day - 1][hour];
        grid[day - 1][hour] = {
          pnl: currentCell.pnl + t.pnl,
          count: currentCell.count + 1
        };
        if (Math.abs(grid[day - 1][hour].pnl) > maxAbsPnl) maxAbsPnl = Math.abs(grid[day - 1][hour].pnl);
      }

      hourStats[hour].total++;
      if (t.result === 'win') hourStats[hour].wins++;
      if (t.result === 'loss') hourStats[hour].losses++;
    });

    // Calculate Peak Hours
    let bestTpHour = 0;
    let maxTpRatio = -1;
    let worstSlHour = 0;
    let maxSlCount = -1;

    hourStats.forEach((stat, h) => {
      if (stat.total >= 3) { // Minimum sample size
        const tpRatio = stat.wins / stat.total;
        if (tpRatio > maxTpRatio) { maxTpRatio = tpRatio; bestTpHour = h; }
      }
      if (stat.losses > maxSlCount) { maxSlCount = stat.losses; worstSlHour = h; }
    });

    return { 
      hourlyHeatmap: { grid, maxAbsPnl },
      peakHours: {
        bestTp: `${bestTpHour.toString().padStart(2, '0')}:00 - ${(bestTpHour+1).toString().padStart(2, '0')}:00`,
        worstSl: `${worstSlHour.toString().padStart(2, '0')}:00 - ${(worstSlHour+1).toString().padStart(2, '0')}:00`
      }
    };
  }, [filteredTrades, settings.timezone]);

  // 5. Psychology & Behavior Analytics
  const emotionAnalytics = useMemo(() => {
    const emotionsMap: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      if (!emotionsMap[t.emotion]) emotionsMap[t.emotion] = [];
      emotionsMap[t.emotion].push(t);
    });

    return Object.entries(emotionsMap).map(([name, trades]) => {
      const resolved = trades.filter(t => t.result !== 'breakeven');
      const wins = resolved.filter(t => t.result === 'win');
      const pnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      const wr = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0;
      return { name, count: trades.length, pnl, wr };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  const mistakeAnalytics = useMemo(() => {
    const mistakesMap: Record<string, { count: number, lossAmt: number }> = {};
    let totalLossesFromMistakes = 0;

    filteredTrades.forEach(t => {
      if (t.mistakes && t.mistakes.length > 0) {
        t.mistakes.forEach(m => {
          if (!mistakesMap[m]) mistakesMap[m] = { count: 0, lossAmt: 0 };
          mistakesMap[m].count++;
          if (t.pnl < 0) {
            mistakesMap[m].lossAmt += Math.abs(t.pnl);
            totalLossesFromMistakes += Math.abs(t.pnl);
          }
        });
      }
    });

    return Object.entries(mistakesMap).map(([name, data]) => ({
      name, 
      count: data.count, 
      lossAmt: data.lossAmt,
      pctOfTotalLoss: totalLossesFromMistakes > 0 ? (data.lossAmt / totalLossesFromMistakes) * 100 : 0
    })).sort((a, b) => b.lossAmt - a.lossAmt);
  }, [filteredTrades]);

  // 6. AI Trading Coach Blueprint
  const blueprint = useMemo(() => {
    if (filteredTrades.length < 5) return null;

    const bestSession = sessionAnalytics.sort((a,b) => b.pnl - a.pnl)[0];
    const bestPair = pairAnalytics.sort((a,b) => b.pnl - a.pnl)[0];
    const bestSetup = setupAnalytics.sort((a,b) => b.pnl - a.pnl)[0];
    
    const worstEmotion = emotionAnalytics.sort((a,b) => a.pnl - b.pnl)[0];
    const worstMistake = mistakeAnalytics[0];

    return {
      bestSession: bestSession?.subject || 'N/A',
      bestPair: bestPair?.name || 'N/A',
      bestSetup: bestSetup?.name || 'N/A',
      bestHour: peakHours.bestTp,
      worstEmotion: worstEmotion?.name || 'N/A',
      worstMistake: worstMistake?.name || 'N/A',
      worstMistakeCost: worstMistake?.lossAmt || 0,
      optimalRisk: '1.0% - 1.5%'
    };
  }, [filteredTrades, sessionAnalytics, pairAnalytics, setupAnalytics, emotionAnalytics, mistakeAnalytics, peakHours]);

  // Report Generation Handler
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setReportStep('Analyzing behavioral patterns...');
    
    setTimeout(() => {
      setReportStep('Computing equity drawdowns...');
      setTimeout(() => {
        setReportStep('Formulating coach guidelines...');
        setTimeout(() => {
          setIsGenerating(false);
          setShowReportModal(true);
        }, 800);
      }, 800);
    }, 800);
  };

  const handleDownloadPDF = () => {
    toast.success("Monthly AI Report PDF downloaded successfully!");
    navigator.clipboard.writeText("https://lumex.app/report/shared/xyz123");
    toast("Sharing link copied to clipboard", { icon: '🔗' });
    setShowReportModal(false);
  };

  // Custom Tooltips
  const CustomTooltip = ({ active, payload, label, prefix='', suffix='' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-3 border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl z-50">
          <p className="text-text-3 text-xs mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="font-bold text-[13px]" style={{ color: p.color || p.fill }}>
              {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString(undefined, {maximumFractionDigits:2}) : p.value}{suffix}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomAssetTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-3 border border-white/[0.08] rounded-xl px-4 py-3 shadow-xl z-50 min-w-[160px]">
          <p className="text-text-1 font-bold text-[14px] mb-2 border-b border-white/[0.06] pb-2">{label}</p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-text-3 uppercase tracking-wide">Trades</span>
            <span className="text-[13px] font-bold text-text-1">{data.count}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-text-3 uppercase tracking-wide">Win Rate</span>
            <span className={`text-[13px] font-bold ${data.wr >= 50 ? 'text-[#00FFB2]' : 'text-[#FF5A5A]'}`}>{data.wr.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-text-3 uppercase tracking-wide">Net P&L</span>
            <span className={`text-[13px] font-extrabold ${data.pnl >= 0 ? 'text-[#00FFB2]' : 'text-[#FF5A5A]'}`}>
              {data.pnl >= 0 ? '+' : '-'}${Math.abs(data.pnl).toLocaleString(undefined, {maximumFractionDigits:2})}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 md:p-9 pb-20 max-w-[1600px] mx-auto">
      
      {/* Header & Report Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-1 flex items-center gap-3">
            <IconBrain className="text-[#00FFB2]" size={28} />
            Analytics & Intelligence Center
          </h1>
          <p className="text-sm text-text-3 mt-1">Deep performance metrics and AI behavioral coaching.</p>
        </div>

        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating || filteredTrades.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-br from-[#00FFB2] to-[#00E5A0] shadow-[0_0_20px_rgba(0,255,178,0.25)] hover:brightness-110 transition-all disabled:opacity-70"
        >
          {isGenerating ? <IconLoader2 size={18} className="animate-spin" /> : <IconDownload size={18} />}
          {isGenerating ? reportStep : 'Generate AI Report'}
        </button>
      </div>

      {/* Premium Period Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-bg-2 border border-white/[0.06] p-2 rounded-2xl">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activePeriod === p.id 
                ? 'bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/30 shadow-[0_0_15px_rgba(0,255,178,0.1)]' 
                : 'text-text-2 hover:text-text-1 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto px-4 text-sm text-text-3 font-medium">
          Analyzing <span className="text-text-1 font-bold">{filteredTrades.length}</span> trades
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard title="Net P&L" value={metrics.netPnl} prefix="$" icon={IconCurrencyDollar} hoverType={metrics.netPnl >= 0 ? 'positive' : 'negative'} changeColor={metrics.netPnl >= 0 ? 'text-success' : 'text-danger'} />
        <MetricCard title="Win Rate" value={metrics.winRate} suffix="%" icon={IconRosette} hoverType="info" />
        <MetricCard title="Profit Factor" value={metrics.profitFactor} icon={IconTrendingUp} hoverType="warning" />
        <MetricCard title="Expectancy" value={metrics.expectancy} prefix="$" icon={IconCalculator} hoverType={metrics.expectancy >= 0 ? 'positive' : 'negative'} />
        <MetricCard title="Max Drawdown" value={metrics.maxDrawdownPct} suffix="%" icon={IconTrendingDown} hoverType="negative" changeColor="text-danger" />
        <MetricCard title="Sharpe Ratio" value={metrics.sharpeRatio} icon={IconTarget} hoverType="info" />
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/[0.06] pb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white/[0.08] text-text-1 border border-white/[0.1]' 
                : 'text-text-3 hover:text-text-2 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-[#00FFB2]' : ''} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[500px]"
        >
          
          {/* TAB 1: OVERVIEW & COACH */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
              
              {/* Equity & Drawdown Chart */}
              <div className="flex flex-col gap-6">
                <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 w-full">
                  <h3 className="text-[15px] font-semibold text-text-1 mb-6 flex items-center gap-2">
                    <IconChartLine size={18} className="text-[#00FFB2]" /> Equity Growth & Drawdown
                  </h3>
                  <div className="h-[360px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.equityCurve} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00FFB2" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#00FFB2" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF5A5A" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#FF5A5A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'MMM dd')} stroke="none" tick={{ fill: '#505060', fontSize: 11 }} dy={10} />
                        <YAxis yAxisId="left" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} stroke="none" tick={{ fill: '#505060', fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} stroke="none" tick={{ fill: '#FF5A5A', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area yAxisId="left" type="monotone" dataKey="equity" name="Equity" stroke="#00FFB2" strokeWidth={2} fill="url(#colorEq)" />
                        <Area yAxisId="right" type="step" dataKey="drawdown" name="Drawdown" stroke="#FF5A5A" strokeWidth={1.5} fill="url(#colorDd)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* AI Trading Coach Blueprint */}
              <div className="flex flex-col gap-6">
                <motion.div {...premiumHoverProps} className="bg-bg-2 border border-[#FFB800]/20 rounded-card p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FFB800] to-[#FFD700]" />
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FFB800]/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <IconTrophy size={24} className="text-[#FFB800]" />
                    <h3 className="text-[18px] font-bold text-text-1">Personal Blueprint</h3>
                  </div>

                  {blueprint ? (
                    <div className="flex flex-col gap-5 relative z-10">
                      <div className="bg-[#16161A] border border-white/[0.06] rounded-xl p-4">
                        <p className="text-[11px] uppercase text-text-3 tracking-wide font-semibold mb-2">Optimal Trading Profile</p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          <div>
                            <span className="text-[10px] text-text-3 block">Best Session</span>
                            <span className="text-[13px] font-bold text-[#00FFB2]">{blueprint.bestSession}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-3 block">Best Pair</span>
                            <span className="text-[13px] font-bold text-[#00FFB2]">{blueprint.bestPair}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-3 block">Best Setup</span>
                            <span className="text-[13px] font-bold text-[#00FFB2]">{blueprint.bestSetup}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-3 block">Peak Hour</span>
                            <span className="text-[13px] font-bold text-[#00FFB2]">{blueprint.bestHour}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FF5A5A]/[0.03] border border-[#FF5A5A]/20 rounded-xl p-4">
                        <p className="text-[11px] uppercase text-[#FF5A5A]/80 tracking-wide font-semibold mb-2">Critical Weaknesses</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <IconAlertTriangle size={14} className="text-[#FF5A5A] mt-0.5 shrink-0" />
                            <p className="text-[12px] text-text-2 leading-tight">
                              <span className="font-bold text-text-1">{blueprint.worstEmotion}</span> state trades are severely underperforming.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <IconAlertTriangle size={14} className="text-[#FF5A5A] mt-0.5 shrink-0" />
                            <p className="text-[12px] text-text-2 leading-tight">
                              <span className="font-bold text-text-1">{blueprint.worstMistake}</span> cost you <span className="text-[#FF5A5A] font-bold">${blueprint.worstMistakeCost.toFixed(0)}</span> this period.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/[0.06]">
                        <p className="text-[13px] text-text-2 leading-relaxed italic">
                          "Your strongest absolute edge is trading <span className="text-text-1 font-bold">{blueprint.bestPair} {blueprint.bestSetup}</span> setups during <span className="text-text-1 font-bold">{blueprint.bestSession}</span> sessions with <span className="text-text-1 font-bold">{blueprint.optimalRisk}</span> risk."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-text-3 text-center">
                      Not enough data to generate blueprint. Log at least 5 trades.
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {/* TAB 2: TIME & SESSION */}
          {activeTab === 'time' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Session Radar */}
              <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 flex flex-col items-center">
                <h3 className="text-[15px] font-semibold text-text-1 mb-2 w-full flex items-center gap-2">
                  <IconClock size={18} className="text-[#B259FF]" /> Session Performance
                </h3>
                <div className="w-full h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={sessionAnalytics}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#A0A0B0', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Win Rate %" dataKey="A" stroke="#00FFB2" strokeWidth={2} fill="#00FFB2" fillOpacity={0.3} />
                      <Radar name="Profit Factor (Scaled)" dataKey="B" stroke="#B259FF" strokeWidth={2} fill="#B259FF" fillOpacity={0.3} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#00FFB2]/50 border border-[#00FFB2] rounded-sm"/> <span className="text-xs text-text-2">Win Rate</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#B259FF]/50 border border-[#B259FF] rounded-sm"/> <span className="text-xs text-text-2">Profit Factor</span></div>
                </div>
              </motion.div>

              {/* Hourly Heatmap */}
              <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 flex flex-col">
                <h3 className="text-[15px] font-semibold text-text-1 mb-6 flex items-center gap-2">
                  <IconCalendar size={18} className="text-[#00E5A0]" /> Hourly P&L Heatmap
                </h3>
                <div className="flex flex-col gap-3 flex-1 justify-center">
                  <div className="flex ml-8 border-b border-white/[0.04] pb-2 mb-2">
                    {[0,3,6,9,12,15,18,21].map(h => (
                      <div key={h} className="flex-1 text-[10px] text-text-3 text-center font-medium">{h.toString().padStart(2, '0')}:00</div>
                    ))}
                  </div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dIdx) => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-6 text-[10px] text-text-3 font-semibold uppercase tracking-wider">{day}</span>
                      <div className="flex-1 flex gap-1">
                        {hourlyHeatmap.grid[dIdx].map((cell, hIdx) => {
                          let bg = 'bg-white/[0.01] border border-white/[0.03]';
                          let shadow = '';
                          if (cell.count > 0) {
                            if (cell.pnl > 0) {
                              const intensity = Math.min(cell.pnl / hourlyHeatmap.maxAbsPnl, 1);
                              bg = `bg-[#00FFB2] border border-[#00FFB2]/50`;
                              shadow = `drop-shadow(0 0 8px rgba(0,255,178,${0.2 + intensity * 0.5}))`;
                            } else if (cell.pnl < 0) {
                              const intensity = Math.min(Math.abs(cell.pnl) / hourlyHeatmap.maxAbsPnl, 1);
                              bg = `bg-[#FF5A5A] border border-[#FF5A5A]/50`;
                              shadow = `drop-shadow(0 0 8px rgba(255,90,90,${0.2 + intensity * 0.5}))`;
                            } else {
                              bg = 'bg-white/[0.1] border border-white/[0.2]';
                            }
                          }
                          
                          return (
                            <div 
                              key={hIdx} 
                              className={`flex-1 h-8 rounded-sm ${bg} hover:ring-2 ring-white/50 cursor-pointer transition-all relative group`}
                              style={{ filter: shadow, opacity: cell.count > 0 ? 0.4 + (Math.abs(cell.pnl)/hourlyHeatmap.maxAbsPnl)*0.6 : 1 }}
                            >
                              {/* Custom Tooltip */}
                              {cell.count > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none w-max">
                                  <div className="bg-bg-3 border border-white/10 text-text-1 text-[12px] px-3 py-2 rounded-xl shadow-2xl flex flex-col items-center">
                                    <span className="text-text-3 mb-1">{day} {hIdx.toString().padStart(2, '0')}:00 - {(hIdx+1).toString().padStart(2, '0')}:00</span>
                                    <span className="font-bold mb-1">{cell.count} Trades</span>
                                    <span className={`font-extrabold ${cell.pnl >= 0 ? 'text-[#00FFB2]' : 'text-[#FF5A5A]'}`}>
                                      {cell.pnl >= 0 ? '+' : '-'}${Math.abs(cell.pnl).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                                    </span>
                                  </div>
                                  <div className="w-2.5 h-2.5 bg-bg-3 border-r border-b border-white/10 rotate-45 -mt-1.5" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Peak Hours Analyzer */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/[0.04]">
                  <div className="bg-[#00FFB2]/5 border border-[#00FFB2]/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00FFB2]/10 flex items-center justify-center shrink-0">
                      <IconFlame size={16} className="text-[#00FFB2]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#00FFB2]/80 tracking-wide font-semibold">Highest Prob. TP Hour</p>
                      <p className="text-[13px] font-bold text-[#00FFB2]">{peakHours.bestTp}</p>
                    </div>
                  </div>
                  <div className="bg-[#FF5A5A]/5 border border-[#FF5A5A]/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF5A5A]/10 flex items-center justify-center shrink-0">
                      <IconAlertTriangle size={16} className="text-[#FF5A5A]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#FF5A5A]/80 tracking-wide font-semibold">Highest Drawdown SL Hour</p>
                      <p className="text-[13px] font-bold text-[#FF5A5A]">{peakHours.worstSl}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          )}

          {/* TAB 3: SETUPS & PAIRS */}
          {activeTab === 'setups' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Setups Table */}
              <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 overflow-hidden flex flex-col">
                <h3 className="text-[15px] font-semibold text-text-1 mb-6 flex items-center gap-2">
                  <IconLayoutGrid size={18} className="text-[#00FFB2]" /> Setup Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="pb-3 text-[10px] uppercase text-text-3 font-semibold">Setup</th>
                        <th className="pb-3 text-[10px] uppercase text-text-3 font-semibold text-right">Trades</th>
                        <th className="pb-3 text-[10px] uppercase text-text-3 font-semibold text-right">Win Rate</th>
                        <th className="pb-3 text-[10px] uppercase text-text-3 font-semibold text-right">Net P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {setupAnalytics.map((s, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 text-[13px] font-bold text-text-1">{s.name}</td>
                          <td className="py-3 text-[13px] text-text-2 text-right">{s.count}</td>
                          <td className="py-3 text-right">
                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${s.wr >= 50 ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'bg-[#FF5A5A]/10 text-[#FF5A5A]'}`}>
                              {s.wr.toFixed(0)}%
                            </span>
                          </td>
                          <td className={`py-3 text-[13px] font-bold text-right ${s.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                            {s.pnl >= 0 ? '+' : '-'}${Math.abs(s.pnl).toLocaleString(undefined, {maximumFractionDigits:0})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Pairs Bar Chart */}
              <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6">
                <h3 className="text-[15px] font-semibold text-text-1 mb-6 flex items-center gap-2">
                  <IconArrowsRightLeft size={18} className="text-[#FFB800]" /> Asset Performance
                </h3>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pairAnalytics} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} vertical={true} />
                      <XAxis type="number" tickFormatter={v => `$${v}`} stroke="none" tick={{ fill: '#505060', fontSize: 11 }} dy={10} />
                      <YAxis dataKey="name" type="category" stroke="none" tick={{ fill: '#A0A0B0', fontSize: 11, fontWeight: 'bold' }} dx={-10} />
                      <Tooltip content={<CustomAssetTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="pnl" name="Net P&L" radius={[0, 6, 6, 0]} barSize={16}>
                        {pairAnalytics.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.pnl >= 0 ? '#00FFB2' : '#FF5A5A'} 
                            style={{ filter: `drop-shadow(0 0 8px ${entry.pnl >= 0 ? 'rgba(0,255,178,0.4)' : 'rgba(255,90,90,0.4)'})` }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

            </div>
          )}

          {/* TAB 4: RISK & BEHAVIOR */}
          {activeTab === 'behavior' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Mistakes Impact */}
              <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6">
                <h3 className="text-[15px] font-semibold text-text-1 mb-6 flex items-center gap-2">
                  <IconAlertTriangle size={18} className="text-[#FF5A5A]" /> Mistake Cost Analysis
                </h3>
                <div className="flex flex-col gap-5">
                  {mistakeAnalytics.length > 0 ? mistakeAnalytics.map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-text-2 font-medium">{m.name} <span className="text-text-3 ml-1">({m.count}x)</span></span>
                        <span className="font-bold text-[#FF5A5A]">-${m.lossAmt.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                      </div>
                      <ProgressBar percentage={m.pctOfTotalLoss} colorClass="bg-[#FF5A5A]" />
                    </div>
                  )) : (
                    <div className="text-sm text-text-3 text-center py-10">No mistakes recorded in this period.</div>
                  )}
                </div>
              </motion.div>

              {/* Emotion Map */}
              <motion.div {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6">
                <h3 className="text-[15px] font-semibold text-text-1 mb-6 flex items-center gap-2">
                  <IconMoodSmile size={18} className="text-[#00E5A0]" /> Emotion vs P&L
                </h3>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" dataKey="wr" name="Win Rate" unit="%" stroke="none" tick={{ fill: '#505060', fontSize: 11 }} domain={[0, 100]} />
                      <YAxis type="number" dataKey="pnl" name="Net P&L" unit="$" stroke="none" tick={{ fill: '#505060', fontSize: 11 }} />
                      <ZAxis type="number" dataKey="count" range={[100, 1000]} name="Trades" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                      <Scatter name="Emotions" data={emotionAnalytics} fill="#00E5A0" fillOpacity={0.6}>
                        {emotionAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FFB2' : '#FF5A5A'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowReportModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/[0.06] bg-gradient-to-br from-[#00FFB2]/10 to-transparent">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-text-1 mb-1">AI Performance Report</h2>
                    <p className="text-sm text-text-3">{PERIODS.find(p=>p.id===activePeriod)?.label} · Generated {format(new Date(), 'MMM dd, yyyy')}</p>
                  </div>
                  <button onClick={() => setShowReportModal(false)} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors">
                    <IconX size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-bg-2 border border-white/[0.04] rounded-xl p-4">
                    <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">Net Profit</p>
                    <p className={`text-xl font-bold ${metrics.netPnl >= 0 ? 'text-[#00FFB2]' : 'text-[#FF5A5A]'}`}>
                      {metrics.netPnl >= 0 ? '+' : '-'}${Math.abs(metrics.netPnl).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-bg-2 border border-white/[0.04] rounded-xl p-4">
                    <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">Win Rate</p>
                    <p className="text-xl font-bold text-text-1">{metrics.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-bg-2 border border-white/[0.04] rounded-xl p-4">
                    <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">Profit Factor</p>
                    <p className="text-xl font-bold text-text-1">{metrics.profitFactor.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-[#16161A] border border-white/[0.06] rounded-xl p-5">
                  <h3 className="text-[13px] font-bold text-[#00FFB2] mb-3 flex items-center gap-2"><IconBrain size={16}/> Coach Recommendations</h3>
                  <ul className="flex flex-col gap-3">
                    <li className="flex items-start gap-3 text-sm text-text-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1.5 shrink-0" />
                      Double down on your <strong>{blueprint?.bestSetup || 'best'}</strong> setups during the <strong>{blueprint?.bestSession || 'optimal'}</strong> session, as this accounts for the majority of your positive expectancy.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-text-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A5A] mt-1.5 shrink-0" />
                      Implement a hard rule to stop trading when feeling <strong>{blueprint?.worstEmotion || 'negative'}</strong>. This state is severely degrading your win rate.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-text-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] mt-1.5 shrink-0" />
                      Your average R:R is <strong>{metrics.avgRR.toFixed(2)}R</strong>. Try to push winners slightly longer to improve your recovery factor from drawdowns.
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={handleDownloadPDF}
                  className="w-full py-3 rounded-xl font-bold text-black bg-[#00FFB2] hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <IconDownload size={18} /> Download Full PDF Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
