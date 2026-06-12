import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCalendarWeek, IconCalendar, IconFlame, IconTrendingUp } from '@tabler/icons-react';
import { format, subDays, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Trade } from '../../types';

interface Props {
  trades: Trade[];
  activeAccountId: string | null;
}

interface HeatmapCell {
  date: Date;
  pnl: number;
  count: number;
  isFuture: boolean;
  dominantEmotion: string;
}

export const TradingActivityHeatmap = ({ trades, activeAccountId }: Props) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<'profit' | 'loss' | 'neutral' | null>(null);

  // 1. Dynamic Status Badges Calculations
  const { bestStreak, mostActiveDay, bestMonth, activeDays, netPnl } = useMemo(() => {
    let activeDaysCount = 0;
    let totalPnl = 0;
    
    const dailyPnL: Record<string, number> = {};
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const monthlyPnL: Record<string, number> = {};

    trades.forEach(t => {
      const d = t.date.split('T')[0];
      dailyPnL[d] = (dailyPnL[d] || 0) + t.pnl;
      dayOfWeekCounts[new Date(t.date).getDay()]++;
      
      const m = format(new Date(t.date), 'MMMM');
      monthlyPnL[m] = (monthlyPnL[m] || 0) + t.pnl;
      
      totalPnl += t.pnl;
    });

    activeDaysCount = Object.keys(dailyPnL).length;

    // Best Streak
    let maxStreak = 0;
    let currentStreak = 0;
    const sortedDays = Object.entries(dailyPnL).sort((a, b) => a[0].localeCompare(b[0]));
    sortedDays.forEach(([_, pnl]) => {
      if (pnl > 0) { 
        currentStreak++; 
        maxStreak = Math.max(maxStreak, currentStreak); 
      } else { 
        currentStreak = 0; 
      }
    });

    // Most Active Day
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const maxIdx = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
    const activeDayStr = trades.length > 0 ? days[maxIdx] : "None";

    // Best Month
    let bestM = "None";
    let maxM = -Infinity;
    Object.entries(monthlyPnL).forEach(([m, pnl]) => {
      if (pnl > maxM) { maxM = pnl; bestM = m; }
    });

    return { 
      bestStreak: maxStreak, 
      mostActiveDay: activeDayStr, 
      bestMonth: bestM,
      activeDays: activeDaysCount,
      netPnl: totalPnl
    };
  }, [trades]);

  // 2. Grid Math (365 Days / 53 Columns)
  const { columns, monthLabels, maxProfit, maxLoss } = useMemo(() => {
    const today = new Date();
    const gridEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday
    const gridStart = subDays(gridEnd, 53 * 7 - 1); // 53 weeks ago, Monday

    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const cols: HeatmapCell[][] = [];
    const mLabels: { colIndex: number, label: string }[] = [];
    let currentWeek: HeatmapCell[] = [];
    
    let maxP = 0;
    let maxL = 0;

    let currentMonth = -1;

    days.forEach((date) => {
      const dayTrades = trades.filter(t => isSameDay(new Date(t.date), date));
      const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      const count = dayTrades.length;
      
      if (pnl > maxP) maxP = pnl;
      if (pnl < maxL) maxL = pnl;
      
      const emotions = dayTrades.map(t => t.emotion);
      const dominantEmotion = emotions.length > 0 
        ? emotions.sort((a,b) => emotions.filter(v => v===a).length - emotions.filter(v => v===b).length).pop() || 'Neutral'
        : 'Neutral';

      currentWeek.push({ 
        date, 
        pnl, 
        count, 
        isFuture: date > today, 
        dominantEmotion 
      });

      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        
        // Check if this week contains the 1st of a month
        const firstDayOfMonth = currentWeek.find(d => d.date.getDate() === 1);
        if (firstDayOfMonth) {
          mLabels.push({ colIndex: cols.length - 1, label: format(firstDayOfMonth.date, 'MMM') });
        } else if (cols.length === 1) {
          // Always label the very first column
          mLabels.push({ colIndex: 0, label: format(currentWeek[0].date, 'MMM') });
        }
        
        currentWeek = [];
      }
    });

    return { columns: cols, monthLabels: mLabels, maxProfit: maxP || 1, maxLoss: Math.abs(maxL) || 1 };
  }, [trades]);

  const getCellBg = (day: HeatmapCell) => {
    if (day.date.getTime() === 0) return 'transparent'; // Padding cells
    if (day.isFuture || day.count === 0) return 'rgba(255,255,255,0.02)';
    if (day.pnl > 0) {
      const intensity = Math.min(day.pnl / maxProfit, 1);
      return `rgba(0, 255, 178, ${0.2 + intensity * 0.8})`;
    } else if (day.pnl < 0) {
      const intensity = Math.min(Math.abs(day.pnl) / maxLoss, 1);
      return `rgba(255, 90, 90, ${0.2 + intensity * 0.8})`;
    }
    return 'rgba(255,255,255,0.04)'; // Break even
  };

  const getCellBorderColor = (day: HeatmapCell) => {
    if (day.date.getTime() === 0) return 'transparent'; // Padding cells
    if (day.isFuture || day.count === 0) return 'rgba(255,255,255,0.04)';
    if (day.pnl > 0) return 'rgba(0,255,178,0.3)';
    if (day.pnl < 0) return 'rgba(255,90,90,0.3)';
    return 'rgba(255,255,255,0.1)';
  };

  const isCellDimmed = (day: HeatmapCell) => {
    if (!hoveredLegend || day.isFuture || day.date.getTime() === 0) return false;
    if (hoveredLegend === 'profit' && day.pnl <= 0) return true;
    if (hoveredLegend === 'loss' && day.pnl >= 0) return true;
    if (hoveredLegend === 'neutral' && day.count > 0) return true;
    return false;
  };

  const isCellPulsing = (day: HeatmapCell) => {
    if (!hoveredLegend || day.isFuture || day.date.getTime() === 0) return false;
    if (hoveredLegend === 'profit' && day.pnl > 0) return true;
    if (hoveredLegend === 'loss' && day.pnl < 0) return true;
    return false;
  };

  return (
    <div className="w-full">
      <motion.div 
        key={activeAccountId ?? 'all'}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-bg-2 border border-white/[0.06] rounded-card p-6 relative w-full overflow-visible"
      >
        {/* Header & Status Pills */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
              <IconCalendarWeek size={20} className="text-text-3" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-1">Trading Activity Heatmap</h3>
              <p className="text-[12px] text-text-3">Trailing 365 days of execution</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800]">
              <IconFlame size={14} />
              <span className="text-[11px] font-bold">Best streak: {bestStreak} days</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00E5A0]/10 border border-[#00E5A0]/20 text-[#00E5A0]">
              <IconCalendar size={14} />
              <span className="text-[11px] font-bold">Most active: {mostActiveDay}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/20 text-[#00FFB2]">
              <IconTrendingUp size={14} />
              <span className="text-[11px] font-bold">Best month: {bestMonth}</span>
            </div>
          </div>
        </div>
        
        {/* Unified Horizontal Scroll Wrapper */}
        <div className="w-full overflow-x-auto overflow-y-visible scrollbar-none pb-2 flex justify-center">
          
          {/* Locked Grid Container */}
          <div className="w-full flex flex-col">
            
            {/* Month Labels Row (CSS Grid matching the columns) */}
            <div className="grid grid-cols-[auto_1fr] gap-3 mb-2">
              {/* Empty space for weekday labels column */}
              <div className="w-8"></div>
              
              {/* Grid for Month Labels */}
              <div 
                className="grid gap-[4px]" 
                style={{ gridTemplateColumns: `repeat(${columns.length}, 14px)` }}
              >
                {monthLabels.map((m, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] text-[#505060] font-semibold tracking-wider"
                    style={{ gridColumnStart: m.colIndex + 1 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Main Heatmap Area (Weekday Labels + Day Cells) */}
            <div className="grid grid-cols-[auto_1fr] gap-3">
              
              {/* Weekday Labels */}
              <div className="flex flex-col gap-[4px] text-[10px] text-[#505060] font-semibold tracking-wider justify-between py-[2px]">
                <span className="h-[14px] leading-[14px]">MON</span>
                <span className="h-[14px]"></span>
                <span className="h-[14px] leading-[14px]">WED</span>
                <span className="h-[14px]"></span>
                <span className="h-[14px] leading-[14px]">FRI</span>
                <span className="h-[14px]"></span>
                <span className="h-[14px]"></span>
              </div>

              {/* Grid for Day Cells */}
              <div 
                className="grid gap-[4px]" 
                style={{ gridTemplateColumns: `repeat(${columns.length}, 14px)` }}
              >
                {columns.map((week, colIndex) => (
                  <div key={`col-${colIndex}`} className="flex flex-col gap-[4px]">
                    {week.map((day, rowIndex) => {
                      const isPadding = day.date.getTime() === 0;
                      const isTopRow = rowIndex <= 2;
                      
                      return (
                        <motion.div 
                          key={`cell-${colIndex}-${rowIndex}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: isCellDimmed(day) ? 0.15 : 1, 
                            scale: 1,
                            backgroundColor: getCellBg(day),
                            borderColor: getCellBorderColor(day)
                          }}
                          transition={{ 
                            duration: 0.4, 
                            delay: (colIndex * 0.003) + (rowIndex * 0.001),
                            backgroundColor: { duration: 0.4 }
                          }}
                          whileHover={!day.isFuture && !isPadding ? { scale: 1.18, zIndex: 30 } : {}}
                          onMouseEnter={() => !day.isFuture && !isPadding && setHoveredDate(day.date.toISOString())}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`w-[14px] h-[14px] rounded-[3px] border border-solid ${!day.isFuture && !isPadding ? 'cursor-pointer' : ''} relative ${isCellPulsing(day) ? 'animate-pulse' : ''}`}
                        >
                          {/* Inline Absolute Tooltip */}
                          <AnimatePresence>
                            {hoveredDate === day.date.toISOString() && !day.isFuture && !isPadding && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: isTopRow ? -5 : 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: isTopRow ? -5 : 5 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute ${isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 transform -translate-x-1/2 z-50 pointer-events-none bg-[#0C0C0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl min-w-[180px] w-auto whitespace-nowrap`}
                              >
                                <div className="flex items-center gap-2 mb-2 border-b border-white/[0.06] pb-2">
                                  <IconCalendar size={12} className="text-text-3" />
                                  <span className="text-[11px] font-semibold text-text-1">{format(day.date, 'EEEE, MMM d, yyyy')}</span>
                                </div>
                                
                                {day.count > 0 ? (
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-[10px] text-text-3 uppercase tracking-wide">Trades</span>
                                      <span className="text-[12px] font-bold text-text-1">{day.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-[10px] text-text-3 uppercase tracking-wide">Net P&L</span>
                                      <span className={`text-[13px] font-extrabold ${day.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="mt-1">
                                      <span className="inline-block px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] text-text-2">
                                        {day.dominantEmotion}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-text-3 italic">No trading activity</div>
                                )}
                                {/* Tooltip Arrow */}
                                <div className={`absolute ${isTopRow ? 'bottom-full mb-[-1px]' : 'top-full mt-[-1px]'} left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#0C0C0E]/95 border-white/10 rotate-45 ${isTopRow ? 'border-t border-l' : 'border-r border-b'}`} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Legend & Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-5 border-t border-white/[0.04] gap-4">
          <div className="text-[12px] text-text-2 font-medium">
            <span className="text-text-1 font-bold">{activeDays}</span> active days · <span className="text-text-1 font-bold">{trades.length}</span> trades · <span className={`font-bold ${netPnl >= 0 ? 'text-success' : 'text-danger'}`}>{netPnl >= 0 ? '+' : '-'}${Math.abs(netPnl).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-text-3 uppercase tracking-wider font-semibold">Filter:</span>
            <div 
              onMouseEnter={() => setHoveredLegend('loss')} onMouseLeave={() => setHoveredLegend(null)}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-3 h-3 rounded-[3px] bg-danger/60 group-hover:bg-danger transition-colors shadow-[0_0_8px_rgba(255,90,90,0.3)]" />
              <span className="text-[11px] text-text-2 group-hover:text-text-1 transition-colors font-medium">Loss</span>
            </div>
            <div 
              onMouseEnter={() => setHoveredLegend('neutral')} onMouseLeave={() => setHoveredLegend(null)}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-3 h-3 rounded-[3px] bg-white/[0.08] border border-white/[0.04] group-hover:bg-white/[0.2] transition-colors" />
              <span className="text-[11px] text-text-2 group-hover:text-text-1 transition-colors font-medium">Break Even / No Trades</span>
            </div>
            <div 
              onMouseEnter={() => setHoveredLegend('profit')} onMouseLeave={() => setHoveredLegend(null)}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-3 h-3 rounded-[3px] bg-em/60 group-hover:bg-em transition-colors shadow-[0_0_8px_rgba(0,255,178,0.3)]" />
              <span className="text-[11px] text-text-2 group-hover:text-text-1 transition-colors font-medium">Profit</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
