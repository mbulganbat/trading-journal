import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAlertTriangle } from '@tabler/icons-react';
import { scaleIn } from '../../lib/animations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            variants={scaleIn} initial="hidden" animate="show" exit="hidden"
            className="relative w-[400px] bg-bg-2 border border-white/[0.08] rounded-card p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                <IconAlertTriangle size={20} className="text-danger" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-text-1">{title}</h3>
                <p className="text-[13px] text-text-3 mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:text-text-1 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-danger hover:bg-danger/90 transition-colors shadow-[0_0_15px_rgba(255,90,90,0.2)]"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};