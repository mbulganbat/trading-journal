import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trade, AppSettings, AppContextValue, Account } from '../types';
import { mockTrades, mockAccounts } from '../data/mockTrades';

const defaultSettings: AppSettings = {
  userName: "Alex",
  currency: "USD",
  timezone: "UTC",
  notifications: {
    email: true,
    push: false,
    weeklyReport: true
  },
  tradingPrefs: {
    defaultRisk: 1,
    maxDailyDrawdown: 3,
    maxOpenTrades: 3
  },
  twoFactor: false
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('lumex_accounts');
    return saved ? JSON.parse(saved) : mockAccounts;
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    const saved = localStorage.getItem('lumex_selected_account');
    return saved && saved !== 'null' ? saved : null;
  });

  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('lumex_trades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse trades from localStorage", e);
      }
    }
    return mockTrades;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lumex_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
      }
    }
    return defaultSettings;
  });

  const [openManageAccounts, setOpenManageAccounts] = useState(false);
  const [openNewTrade, setOpenNewTrade] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('lumex_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('lumex_selected_account', selectedAccountId || 'null');
  }, [selectedAccountId]);

  useEffect(() => {
    localStorage.setItem('lumex_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('lumex_settings', JSON.stringify(settings));
  }, [settings]);

  const addAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: crypto.randomUUID()
    };
    setAccounts(prev => [...prev, newAcc]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setTrades(prev => prev.filter(t => t.accountId !== id));
    if (selectedAccountId === id) setSelectedAccountId(null);
  };

  const addTrade = (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: crypto.randomUUID()
    };
    setTrades(prev => [newTrade, ...prev]);
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider value={{
      trades,
      addTrade,
      updateTrade,
      deleteTrade,
      settings,
      updateSettings,
      accounts,
      selectedAccountId,
      setSelectedAccountId,
      addAccount,
      updateAccount,
      deleteAccount,
      openManageAccounts,
      setOpenManageAccounts,
      openNewTrade,
      setOpenNewTrade,
      openImport,
      setOpenImport,
      editingTrade,
      setEditingTrade
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
