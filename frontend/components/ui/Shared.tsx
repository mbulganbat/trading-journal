import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../lib/animations';
import { useCountUp } from '../../hooks/useCountUp';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  change?: string;
  changeColor?: string;
  sparkline?: ReactNode;
  iconColor?: string;
  iconBg?: string;
  hoverType?: 'positive' | 'negative' | 'neutral' | 'warning' | 'info';
}

export const premiumHoverProps = {
  whileHover: { 
    y: -4, 
    scale: 1.005, 
    boxShadow: "0 12px 30px rgba(0, 255, 178, 0.06)", 
    border: "1px solid rgba(0, 255, 178, 0.2)" 
  },
  transition: { duration: 0.25, ease: "easeOut" }
};

export const MetricCard = ({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  icon: Icon, 
  change, 
  changeColor = 'text-text-3', 
  sparkline, 
  iconColor, 
  iconBg,
  hoverType = 'neutral'
}: MetricCardProps) => {
  const animatedValue = useCountUp(value);
  
  let hoverShadow = 'hover:shadow-[0_12px_30px_rgba(255,255,255,0.06)] hover:border-white/20';
  let glowColor = 'from-[#FFB800]/25'; // Default neutral/warning glow
  
  if (hoverType === 'positive') {
    hoverShadow = 'hover:shadow-[0_12px_30px_rgba(0,255,178,0.12)] hover:border-[#00FFB2]/30 hover:bg-[rgba(0,255,178,0.02)]';
    glowColor = 'from-[#00FFB2]/25';
  } else if (hoverType === 'negative') {
    hoverShadow = 'hover:shadow-[0_12px_30px_rgba(255,90,90,0.12)] hover:border-[#FF5A5A]/30 hover:bg-[rgba(255,90,90,0.02)]';
    glowColor = 'from-[#FF5A5A]/25';
  } else if (hoverType === 'warning') {
    hoverShadow = 'hover:shadow-[0_12px_30px_rgba(255,184,0,0.12)] hover:border-[#FFB800]/30 hover:bg-[rgba(255,184,0,0.02)]';
    glowColor = 'from-[#FFB800]/25';
  } else if (hoverType === 'info') {
    hoverShadow = 'hover:shadow-[0_12px_30px_rgba(0,229,160,0.12)] hover:border-[#00E5A0]/30 hover:bg-[rgba(0,229,160,0.02)]';
    glowColor = 'from-[#00E5A0]/25';
  }

  return (
    <motion.div 
      variants={fadeUp} 
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25, ease: "easeOut" } }}
      className={`group bg-[rgba(255,255,255,0.025)] border border-white/[0.06] rounded-card p-6 transition-all duration-300 relative overflow-hidden ${hoverShadow}`}
    >
      {/* Top-Right Neon Hover Glow */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl pointer-events-none`} />

      <div className="flex justify-between items-start relative z-10">
        <div className={`w-10 h-10 ${iconBg || 'bg-white/[0.04]'} rounded-xl flex items-center justify-center mb-4`}>
          <Icon size={22} stroke={2.5} className={iconColor || "text-text-3"} />
        </div>
        {sparkline && (
          <div className="w-20 h-10 opacity-60">
            {sparkline}
          </div>
        )}
      </div>
      <p className="uppercase text-[11px] text-text-3 tracking-wide font-semibold relative z-10">{title}</p>
      <h3 className="text-[24px] font-extrabold text-text-1 mt-1 relative z-10">
        {prefix}{animatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}{suffix}
      </h3>
      {change && <p className={`text-[13px] mt-1.5 font-medium ${changeColor} relative z-10`}>{change}</p>}
    </motion.div>
  );
};

export const ProgressBar = ({ percentage, colorClass = 'bg-em' }: { percentage: number, colorClass?: string }) => {
  return (
    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden w-full">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full ${colorClass}`}
      />
    </div>
  );
};

export const TagPill = ({ children, active, onClick, color = 'em' }: { children: ReactNode, active: boolean, onClick: () => void, color?: string }) => {
  const base = "px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 border";
  const activeClasses = active 
    ? `bg-${color}/10 text-${color} border-${color}/30` 
    : "bg-white/[0.04] text-text-2 border-white/[0.08] hover:bg-white/[0.08]";
    
  return (
    <button type="button" onClick={onClick} className={`${base} ${activeClasses}`}>
      {children}
    </button>
  );
};

export const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => {
  return (
    <div 
      className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-em' : 'bg-white/[0.1]'}`}
      onClick={onChange}
    >
      <motion.div 
        className="w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
};
