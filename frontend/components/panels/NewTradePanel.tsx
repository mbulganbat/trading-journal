import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconX, IconWallet, IconTrendingUp, IconTrendingDown, 
  IconChevronDown, IconCheck, IconUpload, IconLoader2, IconAlertTriangle,
  IconCalendar, IconChevronLeft, IconChevronRight, IconMinus
} from '@tabler/icons-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from 'date-fns';
import { getNetPnL, filterByAccount } from '../../data/mockTrades';

const EMOTIONS = ['Focused', 'Patient', 'Neutral', 'Rushed', 'FOMO', 'Unsure'];
const SETUPS = ['BMS+FVG', 'Order Block', 'CISD', 'Liquidity', 'Other'];
const SESSIONS = ['London', 'NY AM', 'NY PM', 'Asian', 'Overlap'];
const MISTAKES_LIST = ['No SL', 'Moved SL', 'Overleveraged', 'Revenge trade', 'Chased entry', 'Closed early', 'Held too long', 'Against trend'];
const CHECKLIST_ITEMS = ['Trend aligned', 'Key level tested', 'Confirmation candle', 'R:R > 1.5', 'No major news'];

const ASSET_SPECS: Record<string, { multiplier: number, pipDecimal: number }> = {
  'EURUSD': { multiplier: 100000, pipDecimal: 4 },
  'GBPUSD': { multiplier: 100000, pipDecimal: 4 },
  'AUDUSD': { multiplier: 100000, pipDecimal: 4 },
  'USDJPY': { multiplier: 1000, pipDecimal: 2 },
  'USDCAD': { multiplier: 100000, pipDecimal: 4 },
  'XAUUSD': { multiplier: 100, pipDecimal: 1 }, // Gold: $1 movement on 1 Lot = $100
  'XAGUSD': { multiplier: 5000, pipDecimal: 2 }, // Silver: $1 movement on 1 Lot = $5000
  'USOIL': { multiplier: 1000, pipDecimal: 2 }, // Crude Oil: $1 movement on 1 Lot = $1000
  'NAS100': { multiplier: 1, pipDecimal: 1 }, // Nasdaq standard multiplier
  'SPX500': { multiplier: 1, pipDecimal: 1 }, // S&P 500 standard multiplier
};

const SYMBOL_OPTIONS = Object.keys(ASSET_SPECS).map(s => ({ value: s, label: s }));

// Custom Dropdown Component
const CustomDropdown = ({ label, value, options, onChange, icon: Icon }: { label?: string, value: string, options: {value: string, label: string}[], onChange: (val: string) => void, icon?: React.ElementType }) => {
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
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#16161A] border ${isOpen ? 'border-[#00FFB2]/40' : 'border-white/[0.08]'} rounded-xl h-11 px-4 flex justify-between items-center text-text-1 hover:border-[#00FFB2]/20 transition-all cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-text-3" />}
          <span className="text-sm">{selectedOption ? selectedOption.label : 'Select...'}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <IconChevronDown size={16} className="text-text-3" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#16161A] border border-white/[0.1] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[100] max-h-60 overflow-y-auto py-1"
          >
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

// Custom Date Picker Component
const CustomDatePicker = ({ date, setDate }: { date: Date, setDate: (d: Date) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(date);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDayOfWeek = getDay(monthStart);
  const prefixCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday = 0

  return (
    <div className="relative w-full" ref={calendarRef}>
      <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Date</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#16161A] border ${isOpen ? 'border-[#00FFB2]/40' : 'border-white/[0.08]'} rounded-xl h-11 px-4 flex justify-between items-center text-text-1 hover:border-[#00FFB2]/20 transition-all cursor-pointer`}
      >
        <span className="text-sm font-medium">{format(date, 'yyyy.MM.dd')}</span>
        <IconCalendar size={16} className="text-[#00FFB2]" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+4px)] left-0 w-[280px] bg-[#16161A] border border-white/[0.1] rounded-xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[100]"
          >
            <div className="flex justify-between items-center mb-4">
              <button onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }} className="p-1 text-text-3 hover:text-text-1 transition-colors rounded-md hover:bg-white/[0.08]">
                <IconChevronLeft size={16} />
              </button>
              <span className="text-[13px] font-semibold text-text-1">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }} className="p-1 text-text-3 hover:text-text-1 transition-colors rounded-md hover:bg-white/[0.08]">
                <IconChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <div key={d} className="text-center text-[10px] text-text-3 font-semibold">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: prefixCount }).map((_, i) => (
                <div key={`pad-${i}`} className="p-2" />
              ))}
              {daysInMonth.map(d => {
                const isSelected = isSameDay(d, date);
                const isCurrentMonth = isSameMonth(d, currentMonth);
                return (
                  <div 
                    key={d.toISOString()}
                    onClick={() => { setDate(d); setIsOpen(false); }}
                    className={`p-2 text-center text-xs rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-[#00FFB2] text-black font-bold' 
                        : isCurrentMonth 
                          ? 'text-[#8888A0] hover:bg-white/[0.05] hover:text-[#00FFB2]' 
                          : 'text-text-3/30'
                    }`}
                  >
                    {format(d, 'd')}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const NewTradePanel = () => {
  const { openNewTrade, setOpenNewTrade, addTrade, updateTrade, editingTrade, accounts, activeAccountId, trades } = useAppContext();

  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId === 'all' ? accounts[0]?.id : activeAccountId);
  const [pair, setPair] = useState('EURUSD');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [outcome, setOutcome] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [date, setDate] = useState<Date>(new Date());
  const [session, setSession] = useState('London');
  
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [lotSize, setLotSize] = useState('1');
  
  const [setup, setSetup] = useState('BMS+FVG');
  const [emotion, setEmotion] = useState('Neutral');
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Screenshot Upload State
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openNewTrade) {
      if (editingTrade) {
        setSelectedAccountId(editingTrade.accountId);
        setPair(editingTrade.pair);
        setDirection(editingTrade.direction);
        setOutcome(editingTrade.result);
        setDate(new Date(editingTrade.date));
        setSession(editingTrade.session);
        setEntry(editingTrade.entry.toString());
        setSl(editingTrade.sl.toString());
        setTp(editingTrade.tp.toString());
        setLotSize(editingTrade.lotSize?.toString() || '1');
        setSetup(editingTrade.setup);
        setEmotion(editingTrade.emotion);
        setMistakes(editingTrade.mistakes || []);
        setNotes(editingTrade.notes);
        setChecklist([]); // Reset checklist for edit mode unless saved
        setScreenshot(editingTrade.screenshotUrl || null);
      } else {
        // Reset
        setSelectedAccountId(activeAccountId === 'all' ? accounts[0]?.id : activeAccountId);
        setPair('EURUSD');
        setDirection('long');
        setOutcome('win');
        setDate(new Date());
        setSession('London');
        setEntry('');
        setSl('');
        setTp('');
        setLotSize('1');
        setSetup('BMS+FVG');
        setEmotion('Neutral');
        setMistakes([]);
        setChecklist([]);
        setNotes('');
        setScreenshot(null);
      }
      setErrors({});
    }
  }, [openNewTrade, editingTrade, activeAccountId, accounts]);

  const toggleMistake = (m: string) => {
    setMistakes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const toggleChecklist = (item: string) => {
    setChecklist(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const checklistScore = Math.round((checklist.length / CHECKLIST_ITEMS.length) * 100);

  // Dynamic Setup Quality Score Engine
  const setupQualityScore = useMemo(() => {
    const checklistWeight = (checklist.length / CHECKLIST_ITEMS.length) * 60;
    
    let emotionWeight = 25; // Neutral
    if (['Focused', 'Patient'].includes(emotion)) emotionWeight = 40;
    if (['Rushed', 'FOMO', 'Unsure'].includes(emotion)) emotionWeight = 10;

    return Math.round(checklistWeight + emotionWeight);
  }, [checklist, emotion]);

  // Screenshot Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setScreenshot(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload an image file (PNG, JPG)");
    }
  };

  // Real-time Calculations
  const calcData = useMemo(() => {
    const en = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp);
    const lot = parseFloat(lotSize) || 1;
    
    // Calculate dynamic account balance
    let balance = 100000;
    if (selectedAccountId) {
      const activeAcc = accounts.find(a => a.id === selectedAccountId);
      if (activeAcc) {
        const accTrades = filterByAccount(trades, selectedAccountId);
        balance = activeAcc.initialBalance + getNetPnL(accTrades);
      }
    } else {
      balance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0) + getNetPnL(trades);
    }

    // Symbol-Aware Multiplier Engine
    const spec = ASSET_SPECS[pair] || { multiplier: 10, pipDecimal: 4 };
    const multiplier = spec.multiplier;
    const pipMultiplier = Math.pow(10, spec.pipDecimal);

    let slPips = 0;
    let tpPips = 0;
    let riskAmount = 0;
    let rewardAmount = 0;
    let rr = 0;

    if (!isNaN(en) && !isNaN(s) && en !== s) {
      const priceDifference = Math.abs(en - s);
      riskAmount = priceDifference * lot * multiplier;
      slPips = priceDifference * pipMultiplier; // Rough pip estimate for display
    }
    
    if (!isNaN(en) && !isNaN(t) && en !== t) {
      const priceDifference = Math.abs(en - t);
      rewardAmount = priceDifference * lot * multiplier;
      tpPips = priceDifference * pipMultiplier;
    }

    if (riskAmount > 0) {
      rr = rewardAmount / riskAmount;
    }

    const riskPercent = balance > 0 ? (riskAmount / balance) * 100 : 0;

    return { slPips, tpPips, riskAmount, rewardAmount, rr, riskPercent, balance };
  }, [entry, sl, tp, lotSize, selectedAccountId, accounts, direction, pair, trades]);

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!pair) newErrors.pair = true;
    if (!entry) newErrors.entry = true;
    if (!sl) newErrors.sl = true;
    if (!tp) newErrors.tp = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill required fields");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let finalPnl = 0;
      let finalExit = parseFloat(entry);

      if (outcome === 'win') {
        finalPnl = calcData.rewardAmount;
        finalExit = parseFloat(tp);
      } else if (outcome === 'loss') {
        finalPnl = -calcData.riskAmount;
        finalExit = parseFloat(sl);
      } else {
        finalPnl = 0;
        finalExit = parseFloat(entry);
      }

      const tradeData = {
        accountId: selectedAccountId || accounts[0].id,
        pair: pair.toUpperCase(),
        direction,
        date: date.toISOString(),
        session: session as any,
        entry: parseFloat(entry),
        exit: finalExit,
        sl: parseFloat(sl),
        tp: parseFloat(tp),
        lotSize: parseFloat(lotSize) || 1,
        setup,
        emotion: emotion as any,
        notes,
        pnl: finalPnl,
        rr: outcome === 'breakeven' ? 0 : Number(calcData.rr.toFixed(2)),
        result: outcome,
        mistakes,
        lessons: [],
        checklistScore,
        screenshotUrl: screenshot
      };

      if (editingTrade) {
        updateTrade(editingTrade.id, tradeData);
        toast.success("Trade updated successfully");
      } else {
        addTrade(tradeData);
        toast.success("Trade saved successfully");
      }
      
      setIsSubmitting(false);
      setOpenNewTrade(false);
    }, 600);
  };

  const inputClass = (field: string) => `w-full bg-[#16161A] border ${errors[field] ? 'border-[#FF5A5A]' : 'border-white/[0.08]'} rounded-xl h-11 px-4 text-sm text-text-1 focus:outline-none focus:border-[#00FFB2]/40 transition-colors`;

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const sessionOptions = SESSIONS.map(s => ({ value: s, label: s }));
  const setupOptions = SETUPS.map(s => ({ value: s, label: s }));
  const emotionOptions = EMOTIONS.map(e => ({ value: e, label: e }));

  return (
    <AnimatePresence>
      {openNewTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isSubmitting && setOpenNewTrade(false)}
          />
          
          {/* Modal Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-[900px] max-h-[90vh] bg-[#111114] border border-white/[0.07] rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.85)] flex flex-col md:flex-row relative z-50 overflow-hidden"
          >
            {/* Close Button (Mobile Absolute) */}
            <button 
              onClick={() => !isSubmitting && setOpenNewTrade(false)} 
              className="md:hidden absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white"
            >
              <IconX size={20} />
            </button>

            {/* LEFT COLUMN - FORM (55%) */}
            <div className="w-full md:w-[55%] h-[calc(90vh-100px)] overflow-y-auto overflow-x-visible pr-4 pb-12 custom-scrollbar space-y-6 flex-1 p-6 md:p-8">
                
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <h2 className="text-[20px] font-bold text-text-1 mb-1">{editingTrade ? "Edit Trade Entry" : "New Trade Entry"}</h2>
                  <p className="text-[13px] text-text-3">Log your execution details and psychology.</p>
                </motion.div>

                {/* Account & Symbol */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
                  <CustomDropdown 
                    label="Account" 
                    value={selectedAccountId || ''} 
                    options={accountOptions} 
                    onChange={setSelectedAccountId} 
                    icon={IconWallet}
                  />
                  <CustomDropdown 
                    label="Symbol" 
                    value={pair} 
                    options={SYMBOL_OPTIONS} 
                    onChange={setPair} 
                  />
                </motion.div>

                {/* Direction Toggle */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Direction</label>
                  <div className="flex gap-3">
                    <motion.button 
                      layout
                      onClick={() => setDirection('long')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        direction === 'long' 
                          ? 'bg-[#00FFB2]/15 border border-[#00FFB2]/40 text-[#00FFB2] shadow-[0_0_20px_rgba(0,255,178,0.15)]' 
                          : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                      }`}
                    >
                      <IconTrendingUp size={18} /> BUY
                    </motion.button>
                    <motion.button 
                      layout
                      onClick={() => setDirection('short')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        direction === 'short' 
                          ? 'bg-[#FF5A5A]/15 border border-[#FF5A5A]/40 text-[#FF5A5A] shadow-[0_0_20px_rgba(255,90,90,0.15)]' 
                          : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                      }`}
                    >
                      <IconTrendingDown size={18} /> SELL
                    </motion.button>
                  </div>
                </motion.div>

                {/* Outcome Selector */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                  <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Outcome</label>
                  <div className="flex gap-3">
                    <motion.button 
                      layout
                      onClick={() => setOutcome('win')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        outcome === 'win' 
                          ? 'bg-[#00FFB2]/15 border border-[#00FFB2]/40 text-[#00FFB2] shadow-[0_0_20px_rgba(0,255,178,0.15)]' 
                          : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                      }`}
                    >
                      TP
                    </motion.button>
                    <motion.button 
                      layout
                      onClick={() => setOutcome('loss')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        outcome === 'loss' 
                          ? 'bg-[#FF5A5A]/15 border border-[#FF5A5A]/40 text-[#FF5A5A] shadow-[0_0_20px_rgba(255,90,90,0.15)]' 
                          : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                      }`}
                    >
                      SL
                    </motion.button>
                    <motion.button 
                      layout
                      onClick={() => setOutcome('breakeven')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        outcome === 'breakeven' 
                          ? 'bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.15)]' 
                          : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                      }`}
                    >
                      BE
                    </motion.button>
                  </div>
                </motion.div>

                {/* Price Inputs */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Entry Price</label>
                    <input type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} className={inputClass('entry')} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Stop Loss</label>
                    <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} className={inputClass('sl')} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Take Profit</label>
                    <input type="number" step="any" value={tp} onChange={e => setTp(e.target.value)} className={inputClass('tp')} />
                  </div>
                </motion.div>

                {/* Date, Session, Lot Size */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-3 gap-4">
                  <CustomDatePicker date={date} setDate={setDate} />
                  <CustomDropdown label="Session" value={session} options={sessionOptions} onChange={setSession} />
                  <div>
                    <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Lot Size</label>
                    <input type="number" step="any" value={lotSize} onChange={e => setLotSize(e.target.value)} className={inputClass('lotSize')} />
                  </div>
                </motion.div>

                {/* Strategy & Emotion */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
                  <CustomDropdown label="Strategy" value={setup} options={setupOptions} onChange={setSetup} />
                  <CustomDropdown label="Emotion" value={emotion} options={emotionOptions} onChange={setEmotion} />
                </motion.div>

                {/* Checklist */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-2">Setup Checklist</label>
                  <div className="flex flex-col gap-2 bg-[#16161A] border border-white/[0.06] rounded-xl p-4">
                    {CHECKLIST_ITEMS.map(item => {
                      const isChecked = checklist.includes(item);
                      return (
                        <div 
                          key={item} 
                          onClick={() => toggleChecklist(item)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-[#00FFB2] border-[#00FFB2] scale-100' : 'border-white/[0.15] group-hover:border-white/[0.3] scale-95'}`}>
                            {isChecked && <IconCheck size={12} className="text-black" stroke={3} />}
                          </div>
                          <span className={`text-[13px] transition-all ${isChecked ? 'text-[#F0F0F5] line-through opacity-70' : 'text-[#8888A0] group-hover:text-text-2'}`}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Checklist Score Indicator */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center">
                      <span className="text-[11px] text-text-3 uppercase tracking-wide font-semibold">Checklist Score</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                        checklistScore >= 80 ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {checklistScore}%
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Mistakes */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-2">Mistakes Made</label>
                  <div className="flex flex-wrap gap-2">
                    {MISTAKES_LIST.map(m => {
                      const isSelected = mistakes.includes(m);
                      return (
                        <motion.button
                          key={m}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleMistake(m)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                            isSelected 
                              ? 'bg-[#FF5A5A]/10 border-[#FF5A5A]/30 text-[#FF5A5A] font-semibold' 
                              : 'bg-white/[0.04] border-white/[0.08] text-[#8888A0] hover:bg-white/[0.08]'
                          }`}
                        >
                          {m}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Screenshot Upload */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                  <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-2">Chart Screenshot</label>
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group relative overflow-hidden ${
                      isDragging ? 'border-[#00FFB2]/40 bg-[#00FFB2]/[0.04]' : 'border-white/[0.08] hover:border-[#00FFB2]/20 bg-white/[0.01] hover:bg-[#00FFB2]/[0.02]'
                    }`}
                  >
                    <input type="file" accept="image/png, image/jpeg" hidden ref={fileInputRef} onChange={handleFileInput} />
                    
                    {screenshot ? (
                      <>
                        <img src={screenshot} alt="Screenshot preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#00FFB2]/20 flex items-center justify-center mb-2 backdrop-blur-md">
                            <IconCheck size={20} className="text-[#00FFB2]" />
                          </div>
                          <p className="text-[13px] text-text-1 font-medium">Image attached</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}
                            className="mt-2 text-[11px] text-[#FF5A5A] hover:underline relative z-20"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <IconUpload size={24} className="text-[#00FFB2] mb-2" />
                        <p className="text-[13px] text-text-2 group-hover:text-text-1 transition-colors">Drag chart image here or click to browse</p>
                        <p className="text-[11px] text-text-3 mt-1">Supports PNG, JPG (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Notes */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <label className="block text-[10px] uppercase text-text-3 tracking-wide mb-1.5">Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="bg-[#16161A] border border-white/[0.08] rounded-xl p-4 min-h-[100px] w-full resize-none text-sm text-text-1 focus:border-[#00FFB2]/40 focus:outline-none transition-colors"
                    placeholder="What went well? What could be improved?"
                  />
                </motion.div>

                {/* Save Button */}
                <motion.button 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-[#00FFB2] text-[#0C0C0E] font-bold rounded-xl h-12 text-[14px] hover:brightness-110 shadow-[0_8px_24px_rgba(0,255,178,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 mb-6"
                >
                  {isSubmitting ? <IconLoader2 size={18} className="animate-spin" /> : null}
                  {isSubmitting ? 'Saving Trade...' : 'Save Trade Entry'}
                </motion.button>

            </div>

            {/* RIGHT COLUMN - LIVE PREVIEW (45%) */}
            <div className="hidden md:flex w-[45%] bg-[#0C0C0E] border-l border-white/[0.06] p-4 lg:p-5 flex-col justify-between relative">
              
              {/* Close Button (Desktop) */}
              <button 
                onClick={() => !isSubmitting && setOpenNewTrade(false)} 
                className="absolute top-6 right-6 text-text-3 hover:text-text-1 transition-colors"
              >
                <IconX size={20} />
              </button>

              <div>
                <h3 className="text-[11px] uppercase text-text-3 tracking-widest font-bold mb-6">Live Preview</h3>
                
                <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5 mb-4 shadow-xl">
                  <div className="flex justify-between items-center mb-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide ${direction === 'long' ? 'bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20' : 'bg-[#FF5A5A]/10 text-[#FF5A5A] border border-[#FF5A5A]/20'}`}>
                      {direction.toUpperCase()}
                    </span>
                    <span className="text-[16px] font-bold text-text-1 tracking-wide">{pair || 'SYMBOL'}</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-text-3 font-medium">Stop Loss</span>
                      <motion.span key={calcData.slPips} initial={{ opacity: 0.5, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[14px] font-bold text-[#FF5A5A]">
                        {calcData.slPips.toFixed(1)} pips
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-text-3 font-medium">Take Profit</span>
                      <motion.span key={calcData.tpPips} initial={{ opacity: 0.5, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[14px] font-bold text-[#00FFB2]">
                        {calcData.tpPips.toFixed(1)} pips
                      </motion.span>
                    </div>
                    
                    <div className="h-px bg-white/[0.06] my-1" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-text-3 font-medium">Risk:Reward</span>
                      <motion.span key={calcData.rr} initial={{ opacity: 0.5, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[18px] font-extrabold text-[#00FFB2]">
                        {calcData.rr.toFixed(2)}R
                      </motion.span>
                    </div>
                    
                    {/* Visual R:R Bar */}
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden flex mt-1">
                      <div className="bg-[#FF5A5A] h-full transition-all duration-300" style={{ width: `${(1 / (1 + calcData.rr)) * 100}%` }} />
                      <div className="bg-[#00FFB2] h-full transition-all duration-300" style={{ width: `${(calcData.rr / (1 + calcData.rr)) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-[#FF5A5A]/[0.03] border border-[#FF5A5A]/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5A5A]" />
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[11px] uppercase text-[#FF5A5A]/80 tracking-wide font-semibold">Expected Loss</p>
                      <motion.span key={`risk-${calcData.riskPercent}`} initial={{ opacity: 0.5, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-2 py-0.5 rounded bg-[#FF5A5A]/10 text-[#FF5A5A] text-[10px] font-bold border border-[#FF5A5A]/20">
                        Risking {calcData.riskPercent.toFixed(2)}%
                      </motion.span>
                    </div>
                    <motion.p key={calcData.riskAmount} initial={{ opacity: 0.5, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[24px] font-extrabold text-[#FF5A5A]">
                      -${calcData.riskAmount.toFixed(2)}
                    </motion.p>
                  </div>
                  
                  <div className="bg-[#00FFB2]/[0.03] border border-[#00FFB2]/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00FFB2]" />
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[11px] uppercase text-[#00FFB2]/80 tracking-wide font-semibold">Expected Profit</p>
                      <motion.span key={`reward-${calcData.riskPercent}`} initial={{ opacity: 0.5, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-2 py-0.5 rounded bg-[#00FFB2]/10 text-[#00FFB2] text-[10px] font-bold border border-[#00FFB2]/20">
                        Reward {(calcData.riskPercent * calcData.rr).toFixed(2)}%
                      </motion.span>
                    </div>
                    <motion.p key={calcData.rewardAmount} initial={{ opacity: 0.5, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[24px] font-extrabold text-[#00FFB2]">
                      +${calcData.rewardAmount.toFixed(2)}
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Setup Quality Badge */}
              <div className="mt-4 flex justify-center">
                {calcData.rr > 0 && (
                  <motion.div 
                    key={setupQualityScore >= 90 ? 'pristine' : setupQualityScore >= 70 ? 'good' : setupQualityScore >= 50 ? 'average' : 'critical'}
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-3 rounded-xl text-[12px] font-bold border flex flex-col items-center text-center gap-1 w-full ${
                      setupQualityScore >= 90 
                        ? 'bg-[#00FFB2]/10 text-[#00FFB2] border-[#00FFB2]/30 shadow-[0_0_15px_rgba(0,255,178,0.15)]' 
                        : setupQualityScore >= 70
                          ? 'bg-[#00FFB2]/5 text-[#00E5A0] border-[#00E5A0]/20'
                          : setupQualityScore >= 50
                            ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20'
                            : 'bg-[#FF5A5A]/10 text-[#FF5A5A] border-[#FF5A5A]/30 shadow-[0_0_15px_rgba(255,90,90,0.15)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {setupQualityScore >= 70 ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
                      <span>
                        {setupQualityScore >= 90 ? 'A+ Pristine Setup' : setupQualityScore >= 70 ? 'Good Setup Quality' : setupQualityScore >= 50 ? 'Average Setup Quality' : 'Critical Setup Risk'}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium opacity-80">
                      {setupQualityScore >= 90 ? 'Flawless technical pattern backed by optimal psychology. High probability.' : setupQualityScore >= 70 ? 'Solid technical pattern with high confirmation alignment.' : setupQualityScore >= 50 ? 'Acceptable pattern, but caution advised due to missing confirmations.' : 'Poor execution risk — psychology & checklist severely misaligned!'}
                    </span>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
