import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSearch, IconEye, IconEdit, IconTrash, IconInbox, 
  IconCalendar, IconLayoutGrid, IconArrowsExchange, IconChevronDown, IconCheck 
} from '@tabler/icons-react';
import { useAppContext } from '../context/AppContext';
import { stagger, fadeUp } from '../lib/animations';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import toast from 'react-hot-toast';
import { Trade } from '../types';

// Custom Dropdown Component for Filters
const FilterDropdown = ({ label, value, options, onChange, icon: Icon, placeholder }: { label?: string, value: string, options: {value: string, label: string}[], onChange: (val: string) => void, icon?: React.ElementType, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative min-w-[160px]" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#16161A] border ${isOpen ? 'border-[#00FFB2]/40' : 'border-white/[0.08]'} rounded-xl h-11 px-4 flex justify-between items-center text-text-1 hover:border-[#00FFB2]/20 transition-all cursor-pointer select-none gap-3`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-text-3" />}
          <span className="text-sm font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <IconChevronDown size={15} className="text-text-3" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+6px)] left-0 w-full bg-[#16161A] border border-white/[0.1] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[100] max-h-60 overflow-y-auto py-1"
          >
            <div 
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                value === '' 
                  ? 'text-[#00FFB2] bg-[#00FFB2]/[0.08] font-semibold' 
                  : 'text-text-2 hover:bg-white/[0.06] hover:text-[#00FFB2]'
              }`}
            >
              {placeholder}
              {value === '' && <IconCheck size={14} />}
            </div>
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                  value === opt.value 
                    ? 'text-[#00FFB2] bg-[#00FFB2]/[0.08] font-semibold' 
                    : 'text-text-2 hover:bg-white/[0.06] hover:text-[#00FFB2]'
                }`}
              >
                {opt.label}
                {value === opt.value && <IconCheck size={14} />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Journal = () => {
  const { trades, setEditingTrade, setOpenNewTrade, deleteTrade, selectedAccountId } = useAppContext();
  const navigate = useNavigate();

  const [filterResult, setFilterResult] = useState<'all'|'wins'|'losses'>('all');
  const [selectedSetup, setSelectedSetup] = useState<string>('');
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null);

  const uniqueSetups = Array.from(new Set(trades.map(t => t.setup))).map(s => ({ value: s, label: s }));
  const uniquePairs = Array.from(new Set(trades.map(t => t.pair))).map(p => ({ value: p, label: p }));
  
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const filteredTrades = useMemo(() => {
    let r = trades;
    
    if (selectedAccountId && selectedAccountId !== 'all') {
      r = r.filter(t => t.accountId === selectedAccountId);
    }
    
    if (filterResult === 'wins') r = r.filter(t => t.result === 'win');
    if (filterResult === 'losses') r = r.filter(t => t.result === 'loss');
    if (selectedSetup) r = r.filter(t => t.setup === selectedSetup);
    if (selectedPair) r = r.filter(t => t.pair === selectedPair);
    
    if (selectedDateRange) {
      r = r.filter(t => {
        const tradeDate = new Date(t.date);
        if (selectedDateRange === 'today') return isToday(tradeDate);
        if (selectedDateRange === 'week') return isThisWeek(tradeDate, { weekStartsOn: 1 });
        if (selectedDateRange === 'month') return isThisMonth(tradeDate);
        return true;
      });
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(t => 
        t.pair.toLowerCase().includes(q) || 
        t.setup.toLowerCase().includes(q) || 
        t.notes.toLowerCase().includes(q)
      );
    }
    
    return [...r].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trades, selectedAccountId, filterResult, selectedSetup, selectedPair, selectedDateRange, searchQuery]);

  const resetFilters = () => {
    setFilterResult('all');
    setSelectedSetup('');
    setSelectedPair('');
    setSelectedDateRange('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterResult !== 'all' || selectedSetup !== '' || selectedPair !== '' || selectedDateRange !== '' || searchQuery !== '';

  const handleDelete = () => {
    if (confirmDeleteId) {
      deleteTrade(confirmDeleteId);
      toast.success("Trade deleted successfully");
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="p-6 md:p-9 pb-20 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-1">Journal</h1>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-text-3 text-xs font-bold">
            {filteredTrades.length} trades found
          </span>
        </div>
      </div>

      {/* Sticky Premium Filter Bar */}
      <div className="sticky top-16 z-30 bg-[#050505]/80 backdrop-blur-xl py-4 mb-8 flex items-center gap-4 flex-wrap border-b border-white/[0.05]">
        
        {/* Search */}
        <div className="relative">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input 
            type="text" 
            placeholder="Search trades..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-64 bg-bg-3 border border-white/[0.08] rounded-xl h-11 px-3 pl-9 text-sm text-text-1 focus:outline-none focus:border-[#00FFB2]/50 transition-colors"
          />
        </div>

        {/* Result Pills */}
        <div className="flex gap-1 bg-bg-3 p-1 rounded-xl border border-white/[0.04] h-11 items-center">
          <button 
            onClick={() => setFilterResult('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors h-full ${filterResult === 'all' ? 'bg-white/[0.08] text-text-1' : 'text-text-3 hover:text-text-2'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterResult('wins')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors h-full ${filterResult === 'wins' ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-text-3 hover:text-text-2'}`}
          >
            Wins
          </button>
          <button 
            onClick={() => setFilterResult('losses')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors h-full ${filterResult === 'losses' ? 'bg-[#FF5A5A]/10 text-[#FF5A5A]' : 'text-text-3 hover:text-text-2'}`}
          >
            Losses
          </button>
        </div>

        {/* Custom Dropdowns */}
        <FilterDropdown 
          value={selectedDateRange} 
          options={dateRangeOptions} 
          onChange={setSelectedDateRange} 
          icon={IconCalendar} 
          placeholder="All Time" 
        />
        
        <FilterDropdown 
          value={selectedSetup} 
          options={uniqueSetups} 
          onChange={setSelectedSetup} 
          icon={IconLayoutGrid} 
          placeholder="All Setups" 
        />
        
        <FilterDropdown 
          value={selectedPair} 
          options={uniquePairs} 
          onChange={setSelectedPair} 
          icon={IconArrowsExchange} 
          placeholder="All Pairs" 
        />

        {/* Clear Filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={resetFilters} 
              className="text-xs font-medium text-[#00FFB2] hover:text-[#00E5A0] transition-colors ml-auto px-4 py-2 rounded-xl hover:bg-[#00FFB2]/10 h-11 flex items-center"
            >
              Clear Filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Masonry Grid */}
      {filteredTrades.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTrades.map(trade => (
              <TradeCard 
                key={trade.id} 
                trade={trade} 
                onView={() => navigate(`/trade/${trade.id}`)}
                onEdit={() => { setEditingTrade(trade); setOpenNewTrade(true); }}
                onDelete={() => setConfirmDeleteId(trade.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center justify-center py-32">
          <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-6">
            <IconInbox size={40} stroke={1.5} className="text-text-3" />
          </div>
          <h3 className="text-[18px] font-bold text-text-1 mb-2">No trades found</h3>
          <p className="text-sm text-text-3 mb-6 text-center max-w-md">
            We couldn't find any trades matching your current filters. Try adjusting your search or clearing the filters.
          </p>
          <button 
            onClick={resetFilters} 
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-br from-[#00FFB2] to-[#00E5A0] shadow-[0_0_15px_rgba(0,255,178,0.2)] hover:brightness-110 transition-all"
          >
            Reset Filters
          </button>
        </motion.div>
      )}

      <ConfirmDialog 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
      />
    </div>
  );
};

const TradeCard = ({ trade, onView, onEdit, onDelete }: { trade: Trade, onView: () => void, onEdit: () => void, onDelete: () => void }) => {
  const isWin = trade.result === 'win';
  const isLoss = trade.result === 'loss';
  const borderColor = isWin ? 'border-l-[#00FFB2]' : isLoss ? 'border-l-[#FF5A5A]' : 'border-l-[#FFB800]';
  const glowColor = isWin ? 'rgba(0,255,178,0.15)' : isLoss ? 'rgba(255,90,90,0.15)' : 'rgba(255,184,0,0.15)';
  const themeColor = isWin ? '#00FFB2' : isLoss ? '#FF5A5A' : '#FFB800';

  // Mock Candlestick Data for Placeholder
  const candles = [
    { h: 16, top: 30, isUp: true },
    { h: 28, top: 20, isUp: false },
    { h: 20, top: 40, isUp: true },
    { h: 36, top: 25, isUp: isWin }
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group bg-bg-2 rounded-[20px] border border-white/[0.06] border-l-[3px] ${borderColor} overflow-hidden relative hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] transition-shadow`}
    >
      {/* Screenshot Placeholder / Image */}
      <div 
        className="aspect-video bg-bg-3 relative overflow-hidden flex items-center justify-center" 
        style={{ 
          boxShadow: `inset 0 0 80px ${glowColor}`,
          backgroundImage: trade.screenshotUrl ? 'none' : 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      >
        {trade.screenshotUrl ? (
          <img src={trade.screenshotUrl} alt={trade.pair} className="w-full h-full object-cover" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center gap-4">
            {/* Simulated Dotted Entry Line */}
            <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-white/[0.08] -translate-y-1/2" />
            
            {/* Glowing Candlesticks */}
            <motion.div 
              className="flex items-center justify-center gap-4 h-full relative z-10"
              whileHover={{ scale: 1.05 }}
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              {candles.map((c, i) => (
                <div key={i} className="relative flex flex-col items-center justify-center h-full" style={{ top: `${c.top - 30}%` }}>
                  {/* Wick */}
                  <div className="absolute w-[1px] h-12 opacity-60" style={{ backgroundColor: themeColor, filter: `drop-shadow(0 0 10px ${themeColor}80)` }} />
                  {/* Body */}
                  <div 
                    className="relative w-[8px] rounded-sm z-10" 
                    style={{ 
                      height: `${c.h}px`, 
                      backgroundColor: c.isUp ? themeColor : 'transparent',
                      border: `1px solid ${themeColor}`,
                      filter: `drop-shadow(0 0 10px ${themeColor}80)`
                    }} 
                  />
                </div>
              ))}
            </motion.div>
            
            {/* Vignette Shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E]/90 to-transparent opacity-80 pointer-events-none" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-[#0C0C0E]/80 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button onClick={onView} className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-[#00FFB2] hover:text-black text-text-1 flex items-center justify-center transition-colors shadow-xl">
            <IconEye size={20} stroke={2.5} />
          </button>
          <button onClick={onEdit} className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.2] text-text-1 flex items-center justify-center transition-colors shadow-xl">
            <IconEdit size={20} stroke={2.5} />
          </button>
          <button onClick={onDelete} className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-[#FF5A5A] hover:text-white text-text-1 flex items-center justify-center transition-colors shadow-xl">
            <IconTrash size={20} stroke={2.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-[16px] font-bold text-text-1">{trade.pair}</h4>
            <p className="text-[12px] text-text-3 mt-0.5">{format(new Date(trade.date), 'MMM dd, yyyy')} · {trade.session}</p>
          </div>
          <div className="text-right">
            <p className={`text-[16px] font-extrabold ${isWin ? 'text-[#00FFB2]' : isLoss ? 'text-[#FF5A5A]' : 'text-[#FFB800]'}`}>
              {isWin ? '+' : isLoss ? '-' : ''}${Math.abs(trade.pnl).toFixed(2)}
            </p>
            <p className="text-[12px] text-text-3 mt-0.5">{trade.rr}R</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-text-2">{trade.setup}</span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-text-2">{trade.emotion}</span>
        </div>
      </div>
    </motion.div>
  );
};
