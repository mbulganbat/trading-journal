import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IconChevronUp, IconChevronDown, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useAppContext } from '../context/AppContext';
import { stagger, fadeUp } from '../lib/animations';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Trade } from '../types';

export const Trades = () => {
  const { trades, setEditingTrade, setOpenNewTrade, deleteTrade } = useAppContext();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState<keyof Trade>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 15;

  const handleSort = (col: keyof Trade) => {
    if (sortBy === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      const dir = sortDir === 'asc' ? 1 : -1;
      
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * dir;
      }
      return (Number(av) - Number(bv)) * dir;
    });
  }, [trades, sortBy, sortDir]);

  const paginatedTrades = sortedTrades.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const totalPages = Math.ceil(sortedTrades.length / PER_PAGE);

  const Th = ({ col, label }: { col: keyof Trade, label: string }) => (
    <th 
      onClick={() => handleSort(col)}
      className="text-[10px] uppercase text-text-3 tracking-wide px-4 py-3 cursor-pointer hover:text-text-1 transition-colors text-left font-semibold"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === col && (sortDir === 'asc' ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />)}
      </div>
    </th>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-9 pb-20">
      <h1 className="text-2xl font-bold text-text-1 mb-6">All Trades</h1>

      <motion.div variants={fadeUp} className="w-full bg-bg-2 rounded-card border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-bg-3 border-b border-white/[0.06]">
              <tr>
                <Th col="date" label="Date" />
                <Th col="pair" label="Pair" />
                <Th col="direction" label="Dir" />
                <Th col="entry" label="Entry" />
                <Th col="exit" label="Exit" />
                <Th col="pnl" label="P&L" />
                <Th col="rr" label="R:R" />
                <Th col="setup" label="Setup" />
                <th className="text-[10px] uppercase text-text-3 tracking-wide px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map(trade => (
                <tr key={trade.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[13px] text-text-2">{format(new Date(trade.date), 'MMM dd, HH:mm')}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-text-1">{trade.pair}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trade.direction === 'long' ? 'bg-em/10 text-em' : 'bg-danger/10 text-danger'}`}>
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-2">{trade.entry}</td>
                  <td className="px-4 py-3 text-[13px] text-text-2">{trade.exit}</td>
                  <td className={`px-4 py-3 text-[13px] font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-2">{trade.rr}R</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-text-2 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
                      {trade.setup}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => navigate(`/trade/${trade.id}`)} className="p-1.5 text-text-3 hover:text-em transition-colors"><IconEye size={16} /></button>
                      <button onClick={() => { setEditingTrade(trade); setOpenNewTrade(true); }} className="p-1.5 text-text-3 hover:text-text-1 transition-colors"><IconEdit size={16} /></button>
                      <button onClick={() => deleteTrade(trade.id)} className="p-1.5 text-text-3 hover:text-danger transition-colors"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-white/[0.06] flex justify-center gap-2">
          <button 
            disabled={currentPage === 1} onClick={() => setCurrentPage(p=>p-1)}
            className="px-3 py-1 rounded-lg bg-white/[0.04] text-text-2 hover:bg-white/[0.08] disabled:opacity-30 text-sm"
          >Prev</button>
          <span className="px-3 py-1 text-sm text-text-3">Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} onClick={() => setCurrentPage(p=>p+1)}
            className="px-3 py-1 rounded-lg bg-white/[0.04] text-text-2 hover:bg-white/[0.08] disabled:opacity-30 text-sm"
          >Next</button>
        </div>
      </motion.div>
    </motion.div>
  );
};