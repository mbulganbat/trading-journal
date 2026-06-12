import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUpload, IconPlus, IconChevronDown, IconWallet, IconCheck, IconSettings } from '@tabler/icons-react';
import { useAppContext } from '../../context/AppContext';
import { format } from 'date-fns';
import { getNetPnL, filterByAccount } from '../../data/mockTrades';
import { useNavigate } from 'react-router-dom';

export const Topbar = () => {
  const { settings, setOpenNewTrade, setOpenImport, setEditingTrade, trades, accounts, selectedAccountId, setSelectedAccountId, setOpenManageAccounts } = useAppContext();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  
  const activeTrades = filterByAccount(trades, selectedAccountId);
  const netPnl = getNetPnL(activeTrades);
  const performanceHint = netPnl >= 0 ? "Up this month" : "Down this month";

  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const displayTitle = selectedAccountId === null ? "All Accounts" : activeAccount?.name;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAccountDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleAccountSelect = (id: string | null) => {
    setSelectedAccountId(id);
    setIsAccountDropdownOpen(false);
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-40 bg-[rgba(5,5,5,0.85)] backdrop-blur-xl border-b border-white/[0.05] px-9 h-16 flex items-center justify-between shrink-0">
      <div>
        <span className="text-[16px] font-semibold text-text-2">
          {greeting}, <span className="text-em font-bold">{settings.userName}</span>
        </span>
        <p className="text-[13px] text-text-3 mt-0.5">
          {format(new Date(), 'EEEE, MMM d')} · {performanceHint}
        </p>
      </div>

      <div className="flex items-center gap-4">
        
        {/* Premium Account Selector */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="bg-white/[0.04] border border-white/[0.08] hover:border-[#00FFB2]/20 hover:bg-white/[0.06] rounded-xl px-3 py-2 text-text-1 flex items-center gap-2 cursor-pointer transition-all"
          >
            <IconWallet size={16} className="text-text-3" />
            <span className="text-[13px] font-semibold">{displayTitle}</span>
            {selectedAccountId === null && (
              <div className="bg-[#00FFB2] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1">
                {accounts.length}
              </div>
            )}
            <motion.div animate={{ rotate: isAccountDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <IconChevronDown size={16} className="text-text-3 ml-1" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isAccountDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-[calc(100%+8px)] right-0 z-[100] w-[320px] bg-[#0C0C0E]/95 backdrop-blur-xl border border-white/[0.08] rounded-[20px] p-2 shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleAccountSelect(null)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${selectedAccountId === null ? 'bg-[#00FFB2]/8 border border-[#00FFB2]/20 text-[#00FFB2]' : 'hover:bg-white/[0.04] text-text-2 border border-transparent'}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[13px] font-bold">All Accounts</span>
                      <span className="text-[11px] opacity-70">Combined Portfolio</span>
                    </div>
                    {selectedAccountId === null && <IconCheck size={16} />}
                  </button>
                  
                  <div className="h-px bg-white/[0.06] my-1 mx-2" />
                  
                  {accounts.map(acc => {
                    const accTrades = trades.filter(t => t.accountId === acc.id);
                    const accPnl = getNetPnL(accTrades);
                    const isActive = selectedAccountId === acc.id;
                    
                    return (
                      <button
                        key={acc.id}
                        onClick={() => handleAccountSelect(acc.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-[#00FFB2]/8 border border-[#00FFB2]/20 text-[#00FFB2]' : 'hover:bg-white/[0.04] text-text-2 border border-transparent hover:scale-[1.02]'}`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-[13px] font-bold">{acc.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[11px] font-semibold ${accPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                              {accPnl >= 0 ? '+' : '-'}${Math.abs(accPnl).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-text-3">• {acc.broker} · {acc.platform}</span>
                          </div>
                        </div>
                        {isActive && <IconCheck size={16} />}
                      </button>
                    );
                  })}

                  <div className="h-px bg-white/[0.06] my-1 mx-2" />
                  
                  <button
                    onClick={() => { setOpenManageAccounts(true); setIsAccountDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-text-2 transition-colors"
                  >
                    <IconSettings size={16} className="text-text-3" />
                    <span className="text-[13px] font-medium">Manage Accounts</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-8 bg-white/[0.08]" />

        <button 
          onClick={() => setOpenImport(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-text-2 text-sm hover:border-em/30 hover:text-em transition-all"
        >
          <IconUpload size={15} />
          Import
        </button>
        
        <button 
          onClick={() => { setEditingTrade(null); setOpenNewTrade(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold bg-gradient-to-br from-[#00FFB2] to-[#00E5A0] shadow-[0_0_20px_rgba(0,255,178,0.25)] hover:brightness-110 transition-all"
        >
          <IconPlus size={15} />
          New Trade
        </button>
      </div>
    </div>
  );
};
