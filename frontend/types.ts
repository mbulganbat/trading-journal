export interface Account {
  id: string;
  name: string;
  type: 'Funded' | 'Demo' | 'Personal';
  broker: string;
  platform: 'MT4' | 'MT5' | 'cTrader' | 'TradingView' | 'Other';
  currency: 'USD' | 'EUR' | 'GBP';
  initialBalance: number;
  profitTarget?: number; // %
  maxDailyDrawdown?: number; // %
  maxTotalDrawdown?: number; // %
}

export interface Trade {
  id: string;
  accountId: string;
  pair: string;
  date: string; // ISO string
  session: 'London' | 'NY AM' | 'NY PM' | 'Asian' | 'Overlap';
  direction: 'long' | 'short';
  entry: number;
  exit: number;
  sl: number;
  tp: number;
  lotSize: number;
  pnl: number;
  rr: number;
  setup: string;
  emotion: 'Focused' | 'Patient' | 'Neutral' | 'Rushed' | 'FOMO' | 'Unsure';
  notes: string;
  result: 'win' | 'loss' | 'breakeven';
  mistakes: string[];
  lessons: string[];
  checklistScore?: number; // Representing checklist completion percentage (0 - 100)
  screenshotUrl?: string | null;
}

export interface AppSettings {
  userName: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    weeklyReport: boolean;
  };
  tradingPrefs: {
    defaultRisk: number;
    maxDailyDrawdown: number;
    maxOpenTrades: number;
  };
  twoFactor: boolean;
}

export interface AppContextValue {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  accounts: Account[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  openManageAccounts: boolean;
  setOpenManageAccounts: (v: boolean) => void;

  openNewTrade: boolean;
  setOpenNewTrade: (v: boolean) => void;
  openImport: boolean;
  setOpenImport: (v: boolean) => void;
  editingTrade: Trade | null;
  setEditingTrade: (t: Trade | null) => void;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  color: 'em' | 'warning' | 'danger';
  iconName: string;
}

export interface PlaybookRule {
  id: string;
  category: string;
  title: string;
  content: string;
  followed: boolean;
}

export interface HeatmapDay {
  date: Date;
  pnl: number;
  count: number;
}
