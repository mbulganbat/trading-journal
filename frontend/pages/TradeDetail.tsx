import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  IconArrowLeft, IconChartCandle, IconChevronLeft, IconChevronRight, 
  IconNotes, IconX, IconBulb, IconActivity, IconMoodSmile, IconSparkles,
  IconMinus
} from '@tabler/icons-react';
import { useAppContext } from '../context/AppContext';
import { stagger, fadeUp } from '../lib/animations';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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

export const TradeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trades, updateTrade } = useAppContext();
  
  const trade = trades.find(t => t.id === id);
  
  const [localNotes, setLocalNotes] = useState('');
  const [localMistakes, setLocalMistakes] = useState<string[]>([]);
  const [localLessons, setLocalLessons] = useState<string[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (trade) {
      setLocalNotes(trade.notes);
      setLocalMistakes(trade.mistakes || []);
      setLocalLessons(trade.lessons || []);
    }
  }, [trade]);

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-text-2 mb-4">Trade not found</p>
        <button onClick={() => navigate('/journal')} className="text-em hover:underline">Back to Journal</button>
      </div>
    );
  }

  const isWin = trade.result === 'win';
  const isLoss = trade.result === 'loss';
  const themeColor = isWin ? '#00FFB2' : isLoss ? '#FF5A5A' : '#FFB800';
  const glowColor = isWin ? 'rgba(0,255,178,0.15)' : isLoss ? 'rgba(255,90,90,0.15)' : 'rgba(255,184,0,0.15)';

  // Mock Candlestick Data for Placeholder
  const candles = [
    { h: 16, top: 30, isUp: true },
    { h: 28, top: 20, isUp: false },
    { h: 20, top: 40, isUp: true },
    { h: 36, top: 25, isUp: isWin }
  ];

  const handleSaveNotes = () => {
    if (localNotes !== trade.notes) {
      updateTrade(trade.id, { notes: localNotes });
      toast.success("Notes saved");
    }
  };

  const handleUpdateList = (type: 'mistakes'|'lessons', list: string[]) => {
    const cleanList = list.filter(i => i.trim() !== '');
    updateTrade(trade.id, { [type]: cleanList });
  };

  const handleOutcomeChange = (newOutcome: 'win' | 'loss' | 'breakeven') => {
    if (newOutcome === trade.result) return;

    const spec = ASSET_SPECS[trade.pair] || { multiplier: 10, pipDecimal: 4 };
    const multiplier = spec.multiplier;
    const lot = trade.lotSize || 1;

    let newPnl = 0;
    if (newOutcome === 'win') {
      const priceDifference = Math.abs(trade.tp - trade.entry);
      newPnl = priceDifference * lot * multiplier;
    } else if (newOutcome === 'loss') {
      const priceDifference = Math.abs(trade.entry - trade.sl);
      newPnl = -(priceDifference * lot * multiplier);
    } else {
      newPnl = 0;
    }

    updateTrade(trade.id, { result: newOutcome, pnl: newPnl });
    toast.success(`Trade outcome updated to ${newOutcome.toUpperCase()}`);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-9 pb-20 max-w-[1600px] mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-3 hover:text-text-1 transition-colors mb-6 text-sm font-medium">
        <IconArrowLeft size={16} /> Back to Journal
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        
        {/* Left Column */}
        <div className="flex flex-col gap-5">
          
          {/* Carousel */}
          <motion.div variants={fadeUp} className="aspect-video bg-bg-3 rounded-xl relative overflow-hidden border border-white/[0.08] group">
            {trade.screenshotUrl ? (
              <img src={trade.screenshotUrl} alt={trade.pair} className="w-full h-full object-cover" />
            ) : (
              <div 
                className="absolute inset-0 flex items-center justify-center" 
                style={{ 
                  boxShadow: `inset 0 0 100px ${glowColor}`,
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Simulated Dotted Entry Line */}
                <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-white/[0.08] -translate-y-1/2" />
                
                {/* Glowing Candlesticks */}
                <motion.div 
                  className="flex items-center justify-center gap-6 h-full relative z-10"
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  {candles.map((c, i) => (
                    <div key={i} className="relative flex flex-col items-center justify-center h-full" style={{ top: `${c.top - 30}%` }}>
                      {/* Wick */}
                      <div className="absolute w-[1px] h-20 opacity-60" style={{ backgroundColor: themeColor, filter: `drop-shadow(0 0 10px ${themeColor}80)` }} />
                      {/* Body */}
                      <div 
                        className="relative w-[10px] rounded-sm z-10" 
                        style={{ 
                          height: `${c.h * 1.5}px`, 
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
                <span className="absolute bottom-4 right-4 text-text-3/50 text-xs font-mono z-20">Screenshot {activeSlide + 1}/3</span>
              </div>
            )}
            <button 
              onClick={() => setActiveSlide(p => Math.max(0, p-1))}
              disabled={activeSlide === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 disabled:opacity-30 transition-all z-20"
            >
              <IconChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setActiveSlide(p => Math.min(2, p+1))}
              disabled={activeSlide === 2}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 disabled:opacity-30 transition-all z-20"
            >
              <IconChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {[0,1,2].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${activeSlide === i ? 'bg-em' : 'bg-white/20'}`} />
              ))}
            </div>
          </motion.div>

          {/* Metadata Grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Pair', v: trade.pair },
              { l: 'Date', v: format(new Date(trade.date), 'MMM dd, yyyy') },
              { l: 'Session', v: trade.session },
              { l: 'Direction', v: <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trade.direction==='long'?'bg-[#00FFB2]/10 text-[#00FFB2]':'bg-[#FF5A5A]/10 text-[#FF5A5A]'}`}>{trade.direction.toUpperCase()}</span> },
              { l: 'Entry', v: trade.entry },
              { l: 'Exit', v: trade.exit },
              { l: 'Stop Loss', v: trade.sl },
              { l: 'Take Profit', v: trade.tp },
            ].map((item, i) => (
              <div key={i} className="bg-bg-3 rounded-xl p-3 border border-white/[0.04]">
                <p className="text-[10px] uppercase text-text-3 tracking-wide mb-1">{item.l}</p>
                <div className="text-[14px] font-bold text-text-1">{item.v}</div>
              </div>
            ))}
          </motion.div>

          {/* Notes */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <IconNotes size={16} className="text-text-3" />
              <h3 className="text-[14px] font-semibold text-text-1">Notes</h3>
            </div>
            <textarea 
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={4}
              className="w-full bg-bg-3 border border-white/[0.06] rounded-xl p-4 text-sm text-text-1 resize-none focus:outline-none focus:border-[#00FFB2]/40 transition-colors"
              placeholder="Add your trade notes here..."
            />
          </motion.div>

          {/* Mistakes & Lessons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-2 mb-3">
                <IconX size={16} className="text-[#FF5A5A]/80" />
                <h3 className="text-[14px] font-semibold text-[#FF5A5A]/80">Mistakes</h3>
              </div>
              <div className="bg-bg-3 border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2 min-h-[120px]">
                {localMistakes.map((m, i) => (
                  <input 
                    key={i} value={m}
                    onChange={e => {
                      const newM = [...localMistakes]; newM[i] = e.target.value; setLocalMistakes(newM);
                    }}
                    onBlur={() => handleUpdateList('mistakes', localMistakes)}
                    className="bg-transparent text-sm text-text-2 focus:outline-none focus:text-text-1 border-b border-transparent focus:border-white/10"
                  />
                ))}
                <button 
                  onClick={() => setLocalMistakes([...localMistakes, ''])}
                  className="text-xs text-[#FF5A5A]/60 hover:text-[#FF5A5A] text-left mt-auto pt-2"
                >+ Add mistake</button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-2 mb-3">
                <IconBulb size={16} className="text-[#00FFB2]" />
                <h3 className="text-[14px] font-semibold text-[#00FFB2]">Lessons</h3>
              </div>
              <div className="bg-bg-3 border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2 min-h-[120px]">
                {localLessons.map((l, i) => (
                  <input 
                    key={i} value={l}
                    onChange={e => {
                      const newL = [...localLessons]; newL[i] = e.target.value; setLocalLessons(newL);
                    }}
                    onBlur={() => handleUpdateList('lessons', localLessons)}
                    className="bg-transparent text-sm text-text-2 focus:outline-none focus:text-text-1 border-b border-transparent focus:border-white/10"
                  />
                ))}
                <button 
                  onClick={() => setLocalLessons([...localLessons, ''])}
                  className="text-xs text-[#00FFB2]/60 hover:text-[#00FFB2] text-left mt-auto pt-2"
                >+ Add lesson</button>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          
          {/* Execution */}
          <motion.div variants={fadeUp} className="bg-bg-2 border border-white/[0.06] rounded-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <IconActivity size={16} className="text-text-3" />
              <h3 className="text-[14px] font-semibold text-text-1">Execution</h3>
            </div>
            <div className="flex items-end gap-3 mb-6">
              <h2 className={`text-[32px] font-extrabold leading-none ${isWin ? 'text-success' : isLoss ? 'text-danger' : 'text-warning'}`}>
                {isWin ? '+' : isLoss ? '-' : ''}${Math.abs(trade.pnl).toFixed(2)}
              </h2>
              <span className={`px-2 py-1 rounded text-[10px] font-bold mb-1 ${isWin ? 'bg-success/10 text-success' : isLoss ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                {trade.result.toUpperCase()}
              </span>
            </div>

            <div className="mb-2 flex justify-between items-end">
              <span className="text-[12px] text-text-3 uppercase tracking-wide">Risk:Reward</span>
              <span className="text-[20px] font-bold text-text-1">{trade.rr}R</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-6">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${Math.min((trade.rr / 4) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00FFB2] to-[#14F195]"
              />
            </div>
          </motion.div>

          {/* Exit Outcome Selector */}
          <motion.div variants={fadeUp} className="bg-bg-2 border border-white/[0.06] rounded-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <IconActivity size={16} className="text-text-3" />
              <h3 className="text-[14px] font-semibold text-text-1">Exit Outcome</h3>
            </div>
            <div className="flex gap-3">
              <motion.button 
                layout
                onClick={() => handleOutcomeChange('win')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  trade.result === 'win' 
                    ? 'bg-[#00FFB2]/10 border border-[#00FFB2]/30 text-[#00FFB2] shadow-[0_0_15px_rgba(0,255,178,0.1)]' 
                    : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                }`}
              >
                TP
              </motion.button>
              <motion.button 
                layout
                onClick={() => handleOutcomeChange('breakeven')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  trade.result === 'breakeven' 
                    ? 'bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.1)]' 
                    : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                }`}
              >
                BE
              </motion.button>
              <motion.button 
                layout
                onClick={() => handleOutcomeChange('loss')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  trade.result === 'loss' 
                    ? 'bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 text-[#FF5A5A] shadow-[0_0_15px_rgba(255,90,90,0.1)]' 
                    : 'bg-white/[0.03] border border-white/[0.06] text-[#8888A0] hover:bg-white/[0.06]'
                }`}
              >
                SL
              </motion.button>
            </div>
          </motion.div>

          {/* Psychology */}
          <motion.div variants={fadeUp} className="bg-bg-2 border border-white/[0.06] rounded-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <IconMoodSmile size={16} className="text-text-3" />
              <h3 className="text-[14px] font-semibold text-text-1">Psychology</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Focused', 'Patient', 'Neutral', 'Rushed', 'FOMO', 'Unsure'].map(emo => (
                <button
                  key={emo}
                  onClick={() => { updateTrade(trade.id, { emotion: emo as any }); toast.success("Emotion updated"); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    trade.emotion === emo 
                      ? 'bg-[#00FFB2]/10 text-[#00FFB2] border-[#00FFB2]/30' 
                      : 'bg-white/[0.04] text-text-2 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div variants={fadeUp} className="bg-bg-2 border border-[#00FFB2]/10 rounded-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00FFB2] to-[#14F195]" />
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <IconSparkles size={16} className="text-[#00FFB2]" />
                <h3 className="text-[14px] font-semibold text-[#00FFB2]">AI Analysis</h3>
              </div>
              <span className="text-[9px] font-bold text-[#00FFB2] bg-[#00FFB2]/10 px-1.5 py-0.5 rounded">BETA</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1.5 shrink-0" />
                <p className="text-[13px] text-text-2 leading-relaxed">
                  {trade.rr > 2 ? "Strong R:R execution — entry timing was efficient." : "R:R is below optimal threshold. Consider tighter invalidation points."}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1.5 shrink-0" />
                <p className="text-[13px] text-text-2 leading-relaxed">
                  {['FOMO', 'Rushed'].includes(trade.emotion) ? `${trade.emotion} trades historically underperform for you — review entry criteria.` : `Emotional state (${trade.emotion}) aligns with your highest probability setups.`}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1.5 shrink-0" />
                <p className="text-[13px] text-text-2 leading-relaxed">
                  Your {trade.setup} setup is performing well recently. This trade aligned with your best pattern.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};
