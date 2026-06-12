import { Trade, Account, HeatmapDay } from '../types';
import { subDays, startOfYear, subMonths, format, parseISO, startOfWeek, isSameDay, eachDayOfInterval } from 'date-fns';

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Main Funded',
    type: 'Funded',
    broker: 'FTMO',
    platform: 'MT5',
    currency: 'USD',
    initialBalance: 100000,
    profitTarget: 10,
    maxDailyDrawdown: 5,
    maxTotalDrawdown: 10
  },
  {
    id: 'acc-2',
    name: 'Practice Demo',
    type: 'Demo',
    broker: 'IC Markets',
    platform: 'MT5',
    currency: 'USD',
    initialBalance: 10000
  }
];

function generateMockTrades(): Trade[] {
  const trades: Trade[] = [];
  
  const sessions = [
    ...Array(18).fill('London'),
    ...Array(14).fill('NY AM'),
    ...Array(8).fill('NY PM'),
    ...Array(5).fill('Asian'),
    ...Array(5).fill('Overlap')
  ];
  
  const pairs = [
    ...Array(20).fill('XAUUSD'),
    ...Array(12).fill('EURUSD'),
    ...Array(8).fill('GBPUSD'),
    ...Array(6).fill('USDJPY'),
    ...Array(4).fill('GBPJPY')
  ];
  
  const setups = [
    ...Array(18).fill('BMS+FVG'),
    ...Array(12).fill('Order Block'),
    ...Array(11).fill('CISD'),
    ...Array(9).fill('Liquidity')
  ];
  
  const emotions = [
    ...Array(12).fill('Focused'),
    ...Array(8).fill('Patient'),
    ...Array(22).fill('Neutral'),
    ...Array(5).fill('Rushed'),
    ...Array(3).fill('FOMO')
  ];

  const results = [
    ...Array(35).fill('win'),
    ...Array(12).fill('loss'),
    ...Array(3).fill('breakeven')
  ];

  // Deterministic shuffle
  const shuffle = (arr: any[]) => {
    let seed = 1;
    return arr.sort(() => {
      const x = Math.sin(seed++) * 10000;
      return (x - Math.floor(x)) - 0.5;
    });
  };
  
  shuffle(sessions);
  shuffle(pairs);
  shuffle(setups);
  shuffle(emotions);
  shuffle(results);

  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const result = results[i];
    const isWin = result === 'win';
    const isBE = result === 'breakeven';
    
    // Pseudo-random values based on index for consistency
    const randomFactor = Math.abs(Math.sin(i + 1));
    
    let pnl = 0;
    if (isWin) {
      pnl = Math.floor(randomFactor * (1800 - 150 + 1)) + 150;
    } else if (!isBE) {
      pnl = -(Math.floor(randomFactor * (480 - 80 + 1)) + 80);
    }
      
    const rr = isWin
      ? Number((randomFactor * (4.2 - 1.5) + 1.5).toFixed(2))
      : isBE ? 0 : Number((randomFactor * (0.9 - 0.5) + 0.5).toFixed(2));

    const direction = randomFactor > 0.5 ? 'long' : 'short';
    const entry = direction === 'long' ? 100 : 110;
    const exit = direction === 'long' ? entry + (pnl/1000) : entry - (pnl/1000);
    const sl = direction === 'long' ? entry - ((exit-entry)/(rr || 1)) : entry + ((entry-exit)/(rr || 1));

    // Spread dates over last 90 days
    const daysAgo = Math.floor(randomFactor * 90);
    const date = subDays(now, daysAgo).toISOString();

    trades.push({
      id: `trd_${i}_${Math.random().toString(36).substr(2, 9)}`,
      accountId: i < 35 ? 'acc-1' : 'acc-2',
      pair: pairs[i],
      date,
      session: sessions[i] as Trade['session'],
      direction,
      entry: Number(entry.toFixed(5)),
      exit: Number(exit.toFixed(5)),
      sl: Number(sl.toFixed(5)),
      tp: Number((direction === 'long' ? entry + ((entry-sl)*3) : entry - ((sl-entry)*3)).toFixed(5)),
      lotSize: 1,
      pnl,
      rr,
      setup: setups[i],
      emotion: emotions[i] as Trade['emotion'],
      notes: "Saw the setup form perfectly on the 15m timeframe. Executed according to plan without hesitation.",
      result: result as 'win' | 'loss' | 'breakeven',
      mistakes: isWin ? [] : ["Entered too early", "Didn't wait for confirmation"],
      lessons: ["Always wait for the candle to close", "Trust the higher timeframe bias"],
      checklistScore: Math.floor(randomFactor * 100),
      screenshotUrl: null
    });
  }

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const mockTrades = generateMockTrades();

// Multi-Account Helpers
export const filterByAccount = (trades: Trade[], accountId: string | null): Trade[] => {
  if (!accountId) return trades;
  return trades.filter(t => t.accountId === accountId);
};

export const getAccountBalance = (account: Account, trades: Trade[]): number => {
  const accTrades = filterByAccount(trades, account.id);
  return account.initialBalance + getNetPnL(accTrades);
};

export const getFundedProgress = (account: Account, trades: Trade[]) => {
  const accTrades = filterByAccount(trades, account.id);
  const netPnl = getNetPnL(accTrades);
  const profitPct = (netPnl / account.initialBalance) * 100;
  
  // Mocking drawdowns for UI demonstration
  const dailyDrawdownPct = 2.1; 
  const totalDrawdownPct = 3.8;
  
  const uniqueDays = new Set(accTrades.map(t => t.date.split('T')[0]));
  const daysTraded = uniqueDays.size;

  let status: 'On Track' | 'At Risk' | 'Passed' | 'Blown' = 'On Track';
  
  if (account.profitTarget && profitPct >= account.profitTarget) {
    status = 'Passed';
  } else if (account.maxTotalDrawdown && totalDrawdownPct >= account.maxTotalDrawdown) {
    status = 'Blown';
  } else if (account.maxDailyDrawdown && dailyDrawdownPct >= account.maxDailyDrawdown) {
    status = 'Blown';
  } else if (account.maxTotalDrawdown && totalDrawdownPct > account.maxTotalDrawdown * 0.8) {
    status = 'At Risk';
  }

  return { profitPct, dailyDrawdownPct, totalDrawdownPct, daysTraded, status };
};

export const getTradingHeatmap = (trades: Trade[]): HeatmapDay[] => {
  const today = new Date();
  const startDate = subDays(today, 364); // 365 days total
  const days = eachDayOfInterval({ start: startDate, end: today });
  
  return days.map(date => {
    const dayTrades = trades.filter(t => isSameDay(new Date(t.date), date));
    const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    return { date, pnl, count: dayTrades.length };
  });
};

// Pure Functions for Statistics
export const getNetPnL = (trades: Trade[]): number => trades.reduce((sum, t) => sum + t.pnl, 0);

export const getWinRate = (trades: Trade[]): number => {
  const resolvedTrades = trades.filter(t => t.result !== 'breakeven');
  if (resolvedTrades.length === 0) return 0;
  const wins = resolvedTrades.filter(t => t.result === 'win').length;
  return Math.round((wins / resolvedTrades.length) * 100);
};

export const getProfitFactor = (trades: Trade[]): number => {
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  if (grossLoss === 0) return grossProfit > 0 ? 99 : 0;
  return Number((grossProfit / grossLoss).toFixed(2));
};

export const getExpectancy = (trades: Trade[]): number => {
  const resolvedTrades = trades.filter(t => t.result !== 'breakeven');
  if (resolvedTrades.length === 0) return 0;
  const wins = resolvedTrades.filter(t => t.result === 'win');
  const losses = resolvedTrades.filter(t => t.result === 'loss');
  
  const winRate = wins.length / resolvedTrades.length;
  const lossRate = losses.length / resolvedTrades.length;
  
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) / losses.length : 0;
  
  return Number(((winRate * avgWin) - (lossRate * avgLoss)).toFixed(2));
};

export const getAvgRR = (trades: Trade[]): number => {
  const resolvedTrades = trades.filter(t => t.result !== 'breakeven');
  if (resolvedTrades.length === 0) return 0;
  return Number((resolvedTrades.reduce((sum, t) => sum + t.rr, 0) / resolvedTrades.length).toFixed(2));
};

export const getAvgWin = (trades: Trade[]): number => {
  const wins = trades.filter(t => t.result === 'win');
  if (wins.length === 0) return 0;
  return wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length;
};

export const getAvgLoss = (trades: Trade[]): number => {
  const losses = trades.filter(t => t.result === 'loss');
  if (losses.length === 0) return 0;
  return Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) / losses.length;
};

export const getActiveDays = (trades: Trade[]): number => {
  const uniqueDays = new Set(trades.map(t => t.date.split('T')[0]));
  return uniqueDays.size;
};

export const groupBySession = (trades: Trade[]): Record<string, Trade[]> => {
  return trades.reduce((acc, trade) => {
    if (!acc[trade.session]) acc[trade.session] = [];
    acc[trade.session].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);
};

export const groupBySetup = (trades: Trade[]): Record<string, Trade[]> => {
  return trades.reduce((acc, trade) => {
    if (!acc[trade.setup]) acc[trade.setup] = [];
    acc[trade.setup].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);
};

export const groupByWeek = (trades: Trade[]): Record<string, { wins: number; losses: number; pnl: number }> => {
  const weeks: Record<string, { wins: number; losses: number; pnl: number }> = {};
  trades.forEach(trade => {
    const date = parseISO(trade.date);
    const weekStart = format(startOfWeek(date), 'MMM dd');
    if (!weeks[weekStart]) weeks[weekStart] = { wins: 0, losses: 0, pnl: 0 };
    
    if (trade.result === 'win') weeks[weekStart].wins++;
    else if (trade.result === 'loss') weeks[weekStart].losses++;
    
    weeks[weekStart].pnl += trade.pnl;
  });
  return weeks;
};

export const getEquityCurve = (trades: Trade[], initialBalance: number = 100000): { date: string; equity: number }[] => {
  let currentEquity = initialBalance;
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return sorted.map(trade => {
    currentEquity += trade.pnl;
    return {
      date: trade.date,
      equity: currentEquity
    };
  });
};

export const filterByPeriod = (trades: Trade[], period: '1W' | '1M' | '3M' | 'YTD'): Trade[] => {
  const now = new Date();
  let cutoffDate: Date;
  
  switch (period) {
    case '1W': cutoffDate = subDays(now, 7); break;
    case '1M': cutoffDate = subMonths(now, 1); break;
    case '3M': cutoffDate = subMonths(now, 3); break;
    case 'YTD': cutoffDate = startOfYear(now); break;
    default: cutoffDate = subMonths(now, 1);
  }
  
  return trades.filter(t => new Date(t.date) >= cutoffDate);
};
