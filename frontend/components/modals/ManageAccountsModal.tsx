import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconPlus, IconBuildingBank, IconEdit, IconTrash, IconTrophy } from '@tabler/icons-react';
import { useAppContext } from '../../context/AppContext';
import { scaleIn } from '../../lib/animations';
import { getFundedProgress, getNetPnL, filterByAccount } from '../../data/mockTrades';
import { ProgressBar } from '../ui/Shared';
import toast from 'react-hot-toast';
import { ConfirmDialog } from './ConfirmDialog';
import { useNavigate } from 'react-router-dom';

export const ManageAccountsModal = () => {
  const { openManageAccounts, setOpenManageAccounts, accounts, addAccount, deleteAccount, trades, setSelectedAccountId } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Funded' | 'Demo' | 'Personal'>('Funded');
  const [broker, setBroker] = useState('');
  const [platform, setPlatform] = useState<'MT4' | 'MT5' | 'cTrader' | 'TradingView' | 'Other'>('MT5');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [initialBalance, setInitialBalance] = useState('100000');
  const [profitTarget, setProfitTarget] = useState('10');
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState('5');
  const [maxTotalDrawdown, setMaxTotalDrawdown] = useState('10');

  const handleClose = () => {
    setOpenManageAccounts(false);
    setShowForm(false);
  };

  const handleAddAccount = () => {
    if (!name || !broker || !initialBalance) {
      toast.error("Please fill required fields");
      return;
    }
    addAccount({
      name, type, broker, platform, currency,
      initialBalance: Number(initialBalance),
      profitTarget: type === 'Funded' ? Number(profitTarget) : undefined,
      maxDailyDrawdown: type === 'Funded' ? Number(maxDailyDrawdown) : undefined,
      maxTotalDrawdown: type === 'Funded' ? Number(maxTotalDrawdown) : undefined,
    });
    toast.success("Account added successfully");
    setShowForm(false);
    // Reset form
    setName(''); setBroker(''); setInitialBalance('100000');
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setOpenManageAccounts(false);
    navigate('/');
  };

  const inputClass = "w-full bg-bg-3 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-em/50 transition-colors";

  return (
    <>
      <AnimatePresence>
        {openManageAccounts && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={handleClose}
            />
            <motion.div 
              variants={scaleIn} initial="hidden" animate="show" exit="hidden"
              className="relative w-full max-w-4xl max-h-[90vh] bg-bg-2 border border-white/[0.08] rounded-card shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex justify-between items-center bg-bg-2 z-10">
                <h2 className="text-[20px] font-bold text-text-1">Manage Accounts</h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-text-1 transition-colors"
                  >
                    <IconPlus size={16} /> New Account
                  </button>
                  <button onClick={handleClose} className="p-2 text-text-3 hover:text-text-1 transition-colors rounded-xl hover:bg-white/[0.04]">
                    <IconX size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence>
                  {showForm && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-bg-3 border border-white/[0.06] rounded-xl p-5">
                        <h3 className="text-[14px] font-bold text-text-1 mb-4">Add New Account</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Account Name</label>
                            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. FTMO 100k" className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Type</label>
                            <select value={type} onChange={e=>setType(e.target.value as any)} className={inputClass}>
                              <option value="Funded">Funded</option>
                              <option value="Personal">Personal</option>
                              <option value="Demo">Demo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Broker</label>
                            <input type="text" value={broker} onChange={e=>setBroker(e.target.value)} placeholder="e.g. FTMO" className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Platform</label>
                            <select value={platform} onChange={e=>setPlatform(e.target.value as any)} className={inputClass}>
                              <option value="MT4">MT4</option>
                              <option value="MT5">MT5</option>
                              <option value="cTrader">cTrader</option>
                              <option value="TradingView">TradingView</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Currency</label>
                            <select value={currency} onChange={e=>setCurrency(e.target.value as any)} className={inputClass}>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Initial Balance</label>
                            <input type="number" value={initialBalance} onChange={e=>setInitialBalance(e.target.value)} className={inputClass} />
                          </div>
                        </div>

                        {type === 'Funded' && (
                          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-bg-2 rounded-xl border border-white/[0.04]">
                            <div>
                              <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Profit Target (%)</label>
                              <input type="number" value={profitTarget} onChange={e=>setProfitTarget(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Max Daily Drawdown (%)</label>
                              <input type="number" value={maxDailyDrawdown} onChange={e=>setMaxDailyDrawdown(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Max Total Drawdown (%)</label>
                              <input type="number" value={maxTotalDrawdown} onChange={e=>setMaxTotalDrawdown(e.target.value)} className={inputClass} />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-3">
                          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:bg-white/[0.04]">Cancel</button>
                          <button onClick={handleAddAccount} className="px-6 py-2 rounded-xl text-sm font-bold text-black bg-em hover:bg-em-2 transition-colors">Save Account</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {accounts.map(acc => {
                    const accTrades = filterByAccount(trades, acc.id);
                    const netPnl = getNetPnL(accTrades);
                    const balance = acc.initialBalance + netPnl;
                    const winRate = accTrades.length > 0 ? Math.round((accTrades.filter(t=>t.result==='win').length / accTrades.length) * 100) : 0;
                    const progress = getFundedProgress(acc, trades);

                    let statusColor = 'text-text-2 bg-white/[0.04] border-white/[0.08]';
                    if (progress.status === 'Passed') statusColor = 'text-warning bg-warning/10 border-warning/30';
                    if (progress.status === 'On Track') statusColor = 'text-em bg-em/10 border-em/30';
                    if (progress.status === 'At Risk') statusColor = 'text-warning bg-warning/10 border-warning/30';
                    if (progress.status === 'Blown') statusColor = 'text-danger bg-danger/10 border-danger/30';

                    return (
                      <div key={acc.id} className="bg-bg-3 border border-white/[0.06] rounded-xl p-5 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-em/10 flex items-center justify-center border border-em/20">
                              <IconBuildingBank size={20} className="text-em" />
                            </div>
                            <div>
                              <h3 className="text-[15px] font-bold text-text-1">{acc.name}</h3>
                              <p className="text-[11px] text-text-3">{acc.broker} · {acc.platform} · {acc.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleSelectAccount(acc.id)} className="px-3 py-1.5 bg-white/[0.04] hover:bg-em/10 hover:text-em rounded-lg text-xs font-medium transition-colors mr-1">Select</button>
                            <button onClick={() => toast("Edit coming soon")} className="p-1.5 text-text-3 hover:text-text-1 transition-colors rounded-lg hover:bg-white/[0.04]"><IconEdit size={16} /></button>
                            <button onClick={() => setConfirmDeleteId(acc.id)} className="p-1.5 text-text-3 hover:text-danger transition-colors rounded-lg hover:bg-white/[0.04]"><IconTrash size={16} /></button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <div className="bg-bg-2 rounded-lg p-3 border border-white/[0.04]">
                            <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">Balance</p>
                            <p className="text-[14px] font-bold text-text-1">${balance.toLocaleString()}</p>
                          </div>
                          <div className="bg-bg-2 rounded-lg p-3 border border-white/[0.04]">
                            <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">Net P&L</p>
                            <p className={`text-[14px] font-bold ${netPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                              {netPnl >= 0 ? '+' : '-'}${Math.abs(netPnl).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-bg-2 rounded-lg p-3 border border-white/[0.04]">
                            <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">Win Rate</p>
                            <p className="text-[14px] font-bold text-text-1">{winRate}%</p>
                          </div>
                        </div>

                        {acc.type === 'Funded' && (
                          <div className="mt-auto pt-4 border-t border-white/[0.04]">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[11px] font-semibold text-text-2 uppercase tracking-wide">Funded Objectives</span>
                              <motion.span 
                                animate={{ scale: [1, 1.03, 1] }} 
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusColor}`}
                              >
                                {progress.status === 'Passed' && <IconTrophy size={12} />}
                                {progress.status}
                              </motion.span>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-text-3">Profit Target ({acc.profitTarget}%)</span>
                                  <span className="text-em font-bold">{progress.profitPct.toFixed(1)}%</span>
                                </div>
                                <ProgressBar percentage={Math.min((progress.profitPct / (acc.profitTarget || 10)) * 100, 100)} colorClass="bg-em" />
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-text-3">Daily Drawdown (Max {acc.maxDailyDrawdown}%)</span>
                                  <span className="text-warning font-bold">{progress.dailyDrawdownPct.toFixed(1)}%</span>
                                </div>
                                <ProgressBar percentage={(progress.dailyDrawdownPct / (acc.maxDailyDrawdown || 5)) * 100} colorClass="bg-warning" />
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-text-3">Total Drawdown (Max {acc.maxTotalDrawdown}%)</span>
                                  <span className="text-danger font-bold">{progress.totalDrawdownPct.toFixed(1)}%</span>
                                </div>
                                <ProgressBar percentage={(progress.totalDrawdownPct / (acc.maxTotalDrawdown || 10)) * 100} colorClass="bg-danger" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <ConfirmDialog 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if(confirmDeleteId) deleteAccount(confirmDeleteId); setConfirmDeleteId(null); toast.success("Account deleted"); }}
        title="Delete Account"
        message="Are you sure? This will permanently delete the account and ALL associated trades. This action cannot be undone."
      />
    </>
  );
};
