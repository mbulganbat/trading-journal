import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { stagger, fadeUp } from '../lib/animations';
import { Toggle } from '../components/ui/Shared';
import toast from 'react-hot-toast';
import { IconCheck } from '@tabler/icons-react';

const SECTIONS = ['Account', 'Notifications', 'Trading Prefs', 'Subscription'];

export const Settings = () => {
  const { settings, updateSettings } = useAppContext();
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);

  // Local state for forms
  const [userName, setUserName] = useState(settings.userName || 'Alex');
  const [currency, setCurrency] = useState(settings.currency || 'USD');
  
  const [risk, setRisk] = useState(settings.tradingPrefs?.defaultRisk || 1);

  const handleSaveAccount = () => {
    updateSettings({ userName, currency });
    toast.success("Account settings saved");
  };

  const handleSavePrefs = () => {
    updateSettings({ tradingPrefs: { ...settings.tradingPrefs, defaultRisk: risk } });
    toast.success("Trading preferences saved");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-9 pb-20 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-text-1 mb-8">Settings</h1>

      <div className="grid grid-cols-[220px_1fr] gap-8">
        
        {/* Left Nav */}
        <div className="flex flex-col gap-1">
          {SECTIONS.map(sec => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeSection === sec ? 'bg-em/[0.08] text-em' : 'text-text-2 hover:text-text-1 hover:bg-white/[0.04]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="bg-bg-2 border border-white/[0.06] rounded-card p-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} variants={fadeUp} initial="hidden" animate="show" exit="hidden">
              
              {activeSection === 'Account' && (
                <div className="flex flex-col gap-6 max-w-md">
                  <div className="flex items-center gap-5 mb-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-em to-em-3 flex items-center justify-center text-black text-2xl font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <button onClick={() => toast("Feature coming soon")} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-text-2 hover:text-text-1 transition-colors">
                      Change Photo
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase text-text-3 tracking-wide mb-2">Display Name</label>
                    <input 
                      type="text" value={userName} onChange={e => setUserName(e.target.value)}
                      className="w-full bg-bg-3 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-em/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase text-text-3 tracking-wide mb-2">Currency</label>
                    <select 
                      value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full bg-bg-3 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-em/50"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <button onClick={handleSaveAccount} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-em hover:bg-em-2 transition-colors w-fit">
                    Save Changes
                  </button>
                </div>
              )}

              {activeSection === 'Notifications' && (
                <div className="flex flex-col gap-6 max-w-md">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and alerts' },
                    { key: 'push', label: 'Push Notifications', desc: 'Real-time alerts in browser' },
                    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Detailed performance breakdown every Sunday' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-bg-3 border border-white/[0.04]">
                      <div>
                        <p className="text-sm font-semibold text-text-1">{item.label}</p>
                        <p className="text-xs text-text-3 mt-1">{item.desc}</p>
                      </div>
                      <Toggle 
                        checked={(settings.notifications as any)[item.key]} 
                        onChange={() => {
                          const current = (settings.notifications as any)[item.key];
                          updateSettings({ notifications: { ...settings.notifications, [item.key]: !current } });
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'Trading Prefs' && (
                <div className="flex flex-col gap-8 max-w-md">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] uppercase text-text-3 tracking-wide">Default Risk per Trade</label>
                      <span className="text-em font-bold text-sm">{risk}%</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="5" step="0.5" value={risk} onChange={e => setRisk(Number(e.target.value))}
                      className="w-full accent-em"
                    />
                  </div>
                  
                  <button onClick={handleSavePrefs} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-em hover:bg-em-2 transition-colors w-fit">
                    Save Preferences
                  </button>
                </div>
              )}

              {activeSection === 'Subscription' && (
                <div className="max-w-md">
                  <div className="p-6 rounded-2xl border border-em/30 bg-em/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-em text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">ACTIVE</div>
                    <h3 className="text-xl font-bold text-text-1 mb-1">Lumex PRO</h3>
                    <p className="text-text-3 text-sm mb-6">$79 / month</p>
                    
                    <div className="flex flex-col gap-3 mb-8">
                      {['Unlimited trades', 'AI Insights', 'Advanced Analytics', 'Priority Support'].map(f => (
                        <div key={f} className="flex items-center gap-3">
                          <IconCheck size={16} className="text-em" />
                          <span className="text-sm text-text-2">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => toast.success("Opening billing portal...")} className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-sm font-medium hover:bg-white/[0.12] transition-colors">
                        Manage Billing
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
