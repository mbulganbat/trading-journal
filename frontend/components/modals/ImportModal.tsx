import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUpload, IconX, IconFile, IconCheck, IconLoader2 } from '@tabler/icons-react';
import { useAppContext } from '../../context/AppContext';
import { scaleIn } from '../../lib/animations';
import toast from 'react-hot-toast';

export const ImportModal = () => {
  const { openImport, setOpenImport } = useAppContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("12 trades imported successfully");
      setFile(null);
      setOpenImport(false);
    }, 1500);
  };

  const close = () => {
    if (!loading) {
      setFile(null);
      setOpenImport(false);
    }
  };

  return (
    <AnimatePresence>
      {openImport && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={close}
          >
            <motion.div 
              variants={scaleIn} initial="hidden" animate="show" exit="hidden"
              onClick={e => e.stopPropagation()}
              className="w-[460px] bg-bg-2 border border-white/[0.08] rounded-card p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <IconUpload size={20} className="text-em" />
                  <h2 className="text-[18px] font-bold text-text-1">Import Trades</h2>
                </div>
                <button onClick={close} className="text-text-3 hover:text-text-1 transition-colors">
                  <IconX size={18} />
                </button>
              </div>
              <p className="text-text-3 text-sm mb-6">Upload a CSV file or connect your broker</p>

              <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                  file ? 'border-em/40 bg-em/[0.04]' : 'border-em/20 bg-em/[0.02] hover:border-em/40 hover:bg-em/[0.04]'
                }`}
                onClick={() => fileRef.current?.click()}
              >
                <input type="file" accept=".csv" hidden ref={fileRef} onChange={handleFile} />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-em/10 flex items-center justify-center mb-3">
                      <IconCheck size={24} className="text-em" />
                    </div>
                    <p className="text-text-1 font-medium text-sm">{file.name}</p>
                    <p className="text-text-3 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <IconFile size={32} className="text-text-3 mb-3" />
                    <p className="text-text-2 text-[13px]">Drop CSV here or click to browse</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-text-3 text-xs uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="flex gap-2 justify-center">
                {['MT4/MT5', 'cTrader', 'TradingView'].map(broker => (
                  <button key={broker} className="px-3 py-1.5 rounded-lg border border-white/10 text-text-2 text-xs hover:border-em/20 hover:text-em transition-colors">
                    {broker}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={close} className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:text-text-1 hover:bg-white/[0.04] transition-colors">
                  Cancel
                </button>
                {file && (
                  <button 
                    onClick={handleImport}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-black bg-gradient-to-br from-[#00FFB2] to-[#00E5A0] shadow-[0_0_15px_rgba(0,255,178,0.2)] hover:brightness-110 transition-all disabled:opacity-70"
                  >
                    {loading ? <IconLoader2 size={16} className="animate-spin" /> : null}
                    {loading ? 'Importing...' : 'Import'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};