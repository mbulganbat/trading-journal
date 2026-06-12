import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconCurrencyDollar, IconRosette, IconTrendingUp, IconCalculator, 
  IconArrowsRightLeft, IconChartCandle, IconChartLine, IconCirclePercentage,
  IconMoodSmile, IconClock, IconLayoutGrid, IconCalendarEvent, 
  IconArrowUpRight, IconArrowDownRight, IconWallet, IconActivity
} from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';
import { stagger, fadeUp } from '../lib/animations';
import { MetricCard, ProgressBar, TagPill, premiumHoverProps } from '../components/ui/Shared';
import { TradingActivityHeatmap } from '../components/ui/TradingActivityHeatmap';
import { 
  getNetPnL, getWinRate, getProfitFactor, getExpectancy, getAvgRR, 
  getEquityCurve, filterByPeriod, groupBySession, groupBySetup,
  getAvgWin, getAvgLoss, getActiveDays
} from '../data/mockTrades';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const Dashboard = () => {
  const { trades, accounts, selectedAccountId } = useAppContext();
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<'1W'|'1M'|'3M'|'YTD'>('1M');

  // Filter trades by active account
  const activeTrades = useMemo(() => {
    return selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId) : trades;
  }, [trades, selectedAccountId]);

  // Calculate Initial Balance for Equity Curve
  const initialBalance = useMemo(() => {
    if (!selectedAccountId) {
      return accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
    }
    return accounts.find(a => a.id === selectedAccountId)?.initialBalance || 0;
  }, [accounts, selectedAccountId]);

  // Metrics
  const netPnl = getNetPnL(activeTrades);
  const totalBalance = initialBalance + netPnl;
  const winRate = getWinRate(activeTrades);
  const profitFactor = getProfitFactor(activeTrades);
  const expectancy = getExpectancy(activeTrades);
  const avgRR = getAvgRR(activeTrades);
  const avgWin = getAvgWin(activeTrades);
  const avgLoss = getAvgLoss(activeTrades);
  const activeDays = getActiveDays(activeTrades);

  const chartData = getEquityCurve(filterByPeriod(activeTrades, activePeriod), initialBalance);
  const sessionData = groupBySession(activeTrades);
  const setupData = groupBySetup(activeTrades);

  // Exactly 7 recent trades for perfect height alignment
  const recentTrades = [...activeTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

  // Sparkline calculation for Net P&L card
  const sparklineData = chartData.slice(-10).map(d => d.equity);
  const sparkMin = Math.min(...sparklineData);
  const sparkMax = Math.max(...sparklineData);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkPoints = sparklineData.map((val, i) => `${(i / 9) * 100},${100 - ((val - sparkMin) / sparkRange) * 100}`).join(' ');

  // 5-Day Calendar Strip Data (Mon-Fri of current week)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // 1 = Monday
    return Array.from({ length: 5 }).map((_, i) => {
      const date = addDays(start, i);
      const dayTrades = activeTrades.filter(t => isSameDay(new Date(t.date), date));
      const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      return { date, pnl, count: dayTrades.length };
    });
  }, [activeTrades]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-3 border border-em/20 rounded-xl px-3 py-2 shadow-xl">
          <p className="text-text-3 text-xs mb-1">{label ? format(new Date(label), 'MMM dd, yyyy') : ''}</p>
          <p className="text-em font-bold">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      key={selectedAccountId ?? 'all'}
      variants={stagger} 
      initial="hidden" 
      animate="show" 
      className="p-6 md:p-9 pb-20 w-full flex-1 max-w-full min-w-0 overflow-x-hidden flex flex-col"
    >
      
      {/* 1. 8 Metrics Grid (4x2 Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
        <MetricCard 
          title="Total Balance" 
          value={totalBalance} 
          prefix="$" 
          icon={IconWallet} 
          iconColor="text-[#00FFB2]" 
          iconBg="bg-[#00FFB2]/10" 
          hoverType="positive"
        />
        <MetricCard 
          title="Net P&L" 
          value={netPnl} 
          prefix="$" 
          icon={IconCurrencyDollar} 
          changeColor={netPnl >= 0 ? "text-success" : "text-danger"}
          iconColor="text-[#00FFB2]" 
          iconBg="bg-[#00FFB2]/10"
          hoverType={netPnl >= 0 ? "positive" : "negative"}
          sparkline={
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <polyline points={sparkPoints} fill="none" stroke={netPnl >= 0 ? "#00FFB2" : "#FF5A5A"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <MetricCard 
          title="Win Rate" 
          value={winRate} 
          suffix="%" 
          icon={IconRosette} 
          iconColor="text-[#00E5A0]" 
          iconBg="bg-[#00E5A0]/10" 
          hoverType="info"
        />
        <MetricCard 
          title="Profit Factor" 
          value={profitFactor} 
          icon={IconTrendingUp} 
          iconColor="text-[#FFB800]" 
          iconBg="bg-[#FFB800]/10" 
          hoverType="warning"
        />
        <MetricCard 
          title="Total Trades" 
          value={activeTrades.length} 
          icon={IconChartCandle} 
          iconColor="text-[#00E5A0]" 
          iconBg="bg-[#00E5A0]/10" 
          hoverType="info"
        />
        <MetricCard 
          title="Avg Win" 
          value={avgWin} 
          prefix="$" 
          icon={IconArrowUpRight} 
          changeColor="text-success" 
          iconColor="text-[#00FFB2]" 
          iconBg="bg-[#00FFB2]/10" 
          hoverType="positive"
        />
        <MetricCard 
          title="Avg Loss" 
          value={avgLoss} 
          prefix="$" 
          icon={IconArrowDownRight} 
          changeColor="text-danger" 
          iconColor="text-[#FF5A5A]" 
          iconBg="bg-[#FF5A5A]/10" 
          hoverType="negative"
        />
        <MetricCard 
          title="Active Days" 
          value={activeDays} 
          icon={IconCalendarEvent} 
          iconColor="text-[#B259FF]" 
          iconBg="bg-[#B259FF]/10" 
          hoverType="neutral"
        />
      </div>

      {/* 2. 5-Day Calendar Strip */}
      <motion.div variants={fadeUp} className="mb-8 w-full">
        <div className="flex items-center gap-2 mb-4">
          <IconCalendarEvent size={20} stroke={2.5} className="text-[#B259FF]" />
          <h3 className="text-[15px] font-semibold text-text-1">This Week</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full">
          {currentWeekDays.map((day, i) => {
            const isWin = day.pnl > 0;
            const isLoss = day.pnl < 0;
            const hasTrades = day.count > 0;
            
            return (
              <motion.div 
                key={i}
                whileHover={{ y: -3, scale: 1.05, boxShadow: isWin ? "0 10px 25px rgba(0,255,178,0.15)" : isLoss ? "0 10px 25px rgba(255,90,90,0.15)" : "0 10px 25px rgba(255,255,255,0.05)" }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate('/journal')}
                className="bg-bg-2 border border-white/[0.06] rounded-card p-5 flex flex-col items-center justify-center relative group cursor-pointer transition-colors w-full"
              >
                <span className="text-[11px] text-text-3 uppercase tracking-widest font-semibold mb-1">{format(day.date, 'EEE')}</span>
                <span className="text-[16px] font-bold text-text-1 mb-4">{format(day.date, 'MMM dd')}</span>
                
                {hasTrades ? (
                  <div className={`px-3 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-2 ${isWin ? 'bg-em/10 text-em shadow-[0_0_12px_rgba(0,255,178,0.15)]' : 'bg-danger/10 text-danger shadow-[0_0_12px_rgba(255,90,90,0.15)]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isWin ? 'bg-em' : 'bg-danger'} animate-pulse`} />
                    {isWin ? '+' : '-'}${Math.abs(day.pnl).toFixed(0)}
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/[0.04] text-text-3 border border-white/[0.05]">
                    No Trades
                  </div>
                )}

                {/* Tooltip */}
                {hasTrades && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-bg-3 border border-white/10 text-text-1 text-[12px] px-4 py-2.5 rounded-xl shadow-2xl flex flex-col items-center">
                      <span className="font-bold mb-1">{day.count} Trades</span>
                      <span className="text-text-3">Avg: ${(day.pnl / day.count).toFixed(0)}</span>
                    </div>
                    <div className="w-2.5 h-2.5 bg-bg-3 border-r border-b border-white/10 rotate-45 -mt-1.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 3. Equity Curve (Full Width) */}
      <motion.div variants={fadeUp} {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 w-full mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <IconChartLine size={20} stroke={2.5} className="text-[#00FFB2]" />
            <h3 className="text-[15px] font-semibold text-text-1">Equity Curve</h3>
          </div>
          <div className="flex gap-1">
            {(['1W', '1M', '3M', 'YTD'] as const).map(p => (
              <TagPill key={p} active={activePeriod === p} onClick={() => setActivePeriod(p)}>{p}</TagPill>
            ))}
          </div>
        </div>
        
        <div className="h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(0,255,178,0.18)" />
                  <stop offset="95%" stopColor="rgba(0,255,178,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={v => format(new Date(v), 'MMM dd')} stroke="none" tick={{ fill: '#505060', fontSize: 11 }} dy={10} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} stroke="none" tick={{ fill: '#505060', fontSize: 11 }} dx={-10} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="equity" stroke="#00FFB2" strokeWidth={2} fill="url(#equityGrad)" animationDuration={1800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 4. Perfectly Aligned 3-Column Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0 mb-8">
        
        {/* Column 1: Win Rate & Emotions */}
        <div className="flex flex-col gap-6 w-full">
          {/* Win Rate Donut */}
          <motion.div variants={fadeUp} {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 flex flex-col items-center w-full">
            <div className="w-full flex items-center gap-2 mb-6">
              <IconCirclePercentage size={20} stroke={2.5} className="text-[#00E5A0]" />
              <h3 className="text-[15px] font-semibold text-text-1">Win Rate</h3>
            </div>
            
            <div className="relative w-[180px] h-[180px]">
              <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                <circle cx="90" cy="90" r="75" stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
                <motion.circle 
                  cx="90" cy="90" r="75" 
                  stroke="#00FFB2" strokeWidth="14" fill="none" strokeLinecap="round"
                  strokeDasharray="471.24"
                  initial={{ strokeDashoffset: 471.24 }}
                  animate={{ strokeDashoffset: 471.24 * (1 - winRate/100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,178,0.4))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[32px] font-extrabold text-text-1">{Math.round(winRate)}%</span>
                <span className="text-[11px] text-text-3 uppercase tracking-wide mt-1">Win Rate</span>
              </div>
            </div>

            <div className="grid grid-cols-2 w-full gap-3 mt-8">
              <div className="bg-bg-3 rounded-xl p-4 text-center border border-white/[0.04]">
                <p className="text-success font-bold text-xl">{activeTrades.filter(t=>t.result==='win').length}</p>
                <p className="text-[11px] text-text-3 uppercase mt-1">Wins</p>
              </div>
              <div className="bg-bg-3 rounded-xl p-4 text-center border border-white/[0.04]">
                <p className="text-danger font-bold text-xl">{activeTrades.filter(t=>t.result==='loss').length}</p>
                <p className="text-[11px] text-text-3 uppercase mt-1">Losses</p>
              </div>
            </div>
          </motion.div>

          {/* Emotions */}
          <motion.div variants={fadeUp} {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 w-full">
            <div className="flex items-center gap-2 mb-5">
              <IconMoodSmile size={20} stroke={2.5} className="text-[#FFB800]" />
              <h3 className="text-[15px] font-semibold text-text-1">Emotions</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {['Focused', 'Patient', 'Neutral', 'Rushed', 'FOMO', 'Unsure'].map(emo => {
                const count = activeTrades.filter(t => t.emotion === emo).length;
                if (count === 0) return null;
                const isGood = ['Focused', 'Patient'].includes(emo);
                const isBad = ['Rushed', 'FOMO'].includes(emo);
                const colorClass = isGood ? 'text-success bg-success/10 border-success/20' : isBad ? 'text-danger bg-danger/10 border-danger/20' : emo === 'Unsure' ? 'text-warning bg-warning/10 border-warning/20' : 'text-text-2 bg-white/[0.04] border-white/[0.08]';
                return (
                  <motion.div 
                    key={emo} 
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/journal')} 
                    className={`px-3.5 py-2 rounded-full text-xs font-medium border flex items-center gap-2 cursor-pointer transition-all ${colorClass}`}
                  >
                    <span>{emo}</span>
                    <span className="opacity-60 text-[11px]">{count}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Column 2: By Session & Top Setups */}
        <div className="flex flex-col gap-6 w-full">
          {/* Session P&L */}
          <motion.div variants={fadeUp} {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 w-full">
            <div className="flex items-center gap-2 mb-6">
              <IconClock size={20} stroke={2.5} className="text-[#00E5A0]" />
              <h3 className="text-[15px] font-semibold text-text-1">By Session</h3>
            </div>
            <div className="flex flex-col gap-5">
              {['London', 'NY AM', 'NY PM', 'Asian', 'Overlap'].map((session) => {
                const sessionTrades = sessionData[session] || [];
                const pnl = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);
                const maxPnl = Math.max(...Object.values(sessionData).map(arr => Math.abs(arr.reduce((s,t)=>s+t.pnl,0))));
                const pct = maxPnl === 0 ? 0 : (Math.abs(pnl) / maxPnl) * 100;
                
                let color = 'bg-em';
                if (pnl < 0) color = 'bg-danger';
                else if (session === 'NY PM') color = 'bg-warning';
                
                return (
                  <div key={session}>
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-text-2">{session}</span>
                      <span className={`font-semibold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(0)}
                      </span>
                    </div>
                    <ProgressBar percentage={pct} colorClass={color} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Setups */}
          <motion.div variants={fadeUp} {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 w-full">
            <div className="flex items-center gap-2 mb-6">
              <IconLayoutGrid size={20} stroke={2.5} className="text-[#B259FF]" />
              <h3 className="text-[15px] font-semibold text-text-1">Top Setups</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(setupData).sort((a,b) => b[1].length - a[1].length).slice(0,4).map(([setup, arr]) => {
                const wr = getWinRate(arr);
                const rr = getAvgRR(arr);
                return (
                  <motion.div 
                    key={setup} 
                    whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,255,178,0.05)", borderColor: "rgba(0,255,178,0.3)" }}
                    onClick={() => navigate('/setups')} 
                    className="bg-bg-3 rounded-xl p-4 border border-white/[0.04] cursor-pointer transition-colors"
                  >
                    <p className="text-[13px] font-semibold text-text-1 truncate">{setup}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[11px] font-bold text-em bg-em/10 px-2 py-0.5 rounded">{wr}% WR</span>
                      <span className="text-[11px] text-text-3">{rr}R</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Column 3: Recent Live Trades (Full Height) */}
        <div className="flex flex-col w-full h-full">
          <motion.div variants={fadeUp} {...premiumHoverProps} className="bg-bg-2 border border-white/[0.06] rounded-card p-6 w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <IconActivity size={20} stroke={2.5} className="text-[#00FFB2]" />
                <h3 className="text-[15px] font-semibold text-text-1">Recent Live Trades</h3>
              </div>
              <button onClick={() => navigate('/trades')} className="text-[12px] text-em hover:text-em-2 transition-colors">View all</button>
            </div>
            <div className="flex-1 flex flex-col justify-between py-2">
              {recentTrades.map((trade, index) => (
                <motion.div 
                  key={trade.id} 
                  whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
                  onClick={() => navigate(`/trade/${trade.id}`)}
                  className={`flex items-center gap-4 py-3.5 cursor-pointer rounded-xl px-2 transition-colors ${index !== recentTrades.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <div className="w-10 h-10 bg-bg-4 rounded-xl border border-white/[0.08] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-text-2">{trade.pair.substring(0,3)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-1">{trade.pair}</p>
                    <p className="text-[12px] text-text-3">{format(new Date(trade.date), 'MMM dd')} · {trade.session}</p>
                  </div>
                  <div className="text-right ml-auto min-w-[70px]">
                    <p className={`text-[14px] font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl).toFixed(0)}
                    </p>
                    <p className="text-[12px] text-text-3">{trade.rr}R</p>
                  </div>
                </motion.div>
              ))}
              {recentTrades.length === 0 && (
                <div className="py-8 text-center text-text-3 text-sm m-auto">No trades found for this account.</div>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* 5. Trading Activity Heatmap (Full Width Bottom) */}
      <motion.div variants={fadeUp} className="w-full">
        <TradingActivityHeatmap trades={activeTrades} activeAccountId={selectedAccountId} />
      </motion.div>

    </motion.div>
  );
};
