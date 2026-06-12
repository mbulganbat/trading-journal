import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  IconBolt, IconLayoutDashboard, IconNotebook, 
  IconChartHistogram, IconBook2, IconTemplate, IconCalendarStats, 
  IconReportAnalytics, IconTarget, IconSettings, IconChevronRight 
} from '@tabler/icons-react';
import { useAppContext } from '../../context/AppContext';
import { format, addHours } from 'date-fns';

const NAV_SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { path: '/', icon: IconLayoutDashboard, label: 'Dashboard' },
      { path: '/journal', icon: IconNotebook, label: 'Journal' },
      { path: '/analytics', icon: IconChartHistogram, label: 'Analytics' },
    ]
  },
  {
    label: 'TOOLS',
    items: [
      { path: '/playbook', icon: IconBook2, label: 'Playbook' },
      { path: '/setups', icon: IconTemplate, label: 'Setups' },
      { path: '/calendar', icon: IconCalendarStats, label: 'Calendar' },
      { path: '/reports', icon: IconReportAnalytics, label: 'Reports' },
      { path: '/goals', icon: IconTarget, label: 'Goals' },
    ]
  },
  {
    label: 'ACCOUNT',
    items: [
      { path: '/settings', icon: IconSettings, label: 'Settings' },
    ]
  }
];

// Helper to simulate timezone offset
const getTimezoneOffset = (tz: string) => {
  if (tz === 'EST') return -5;
  if (tz === 'GMT') return 0;
  if (tz === 'ULAT') return 8; // Ulaanbaatar
  return 0; // UTC default
};

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppContext();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tzOffset = getTimezoneOffset(settings.timezone);
  const localTime = addHours(time, tzOffset);
  
  // Simple mock logic for FX market open (Mon-Fri)
  const day = localTime.getDay();
  const isMarketOpen = day >= 1 && day <= 5;

  return (
    <div className="fixed left-0 top-0 w-[224px] h-full bg-[rgba(6,6,8,0.97)] backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-50 overflow-y-auto">
      
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-em to-em-3 flex items-center justify-center shadow-[0_0_16px_rgba(0,255,178,0.3)]">
          <IconBolt size={18} className="text-black" />
        </div>
        <span className="text-[16px] font-bold text-text-1 tracking-tight">Lumex</span>
        <span className="text-[9px] font-bold text-em bg-em/10 border border-em/30 rounded-full px-1.5 py-0.5 ml-auto">PRO</span>
      </div>

      <div className={`mx-3 my-2 px-3 py-2 rounded-xl border flex items-center gap-2 ${isMarketOpen ? 'bg-em/[0.03] border-em/10' : 'bg-white/[0.02] border-white/[0.05]'}`}>
        <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-em animate-pulse' : 'bg-text-3'}`} />
        <span className="text-[11px] text-text-3">{isMarketOpen ? 'Markets Open' : 'Markets Closed'}</span>
        <span className="text-[11px] text-text-2 ml-auto font-mono">{format(localTime, 'HH:mm:ss')}</span>
      </div>

      <div className="flex-1 px-3 mt-2">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="mb-2">
            <p className="text-[10px] font-semibold text-text-3 uppercase tracking-[1.1px] px-3 pt-5 pb-2">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <div 
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-200 ${
                    isActive ? 'text-em bg-em/[0.08]' : 'text-text-2 hover:text-text-1 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator" 
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-em shadow-[0_0_8px_rgba(0,255,178,0.6)]" 
                    />
                  )}
                  <item.icon size={18} />
                  <span className="text-[13px] font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div 
        className="mt-auto p-3 border-t border-white/5 pt-3 px-3 pb-4 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => navigate('/settings')}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-em to-em-3 flex items-center justify-center text-black text-xs font-bold">
          {settings.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-text-1">{settings.userName}</span>
          <span className="text-[11px] text-em">Pro Trader</span>
        </div>
        <IconChevronRight size={16} className="text-text-3 ml-auto" />
      </div>
    </div>
  );
};
