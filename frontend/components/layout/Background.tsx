import React from 'react';
import { motion } from 'framer-motion';

export const Background = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-bg-0">
      <div 
        className="absolute inset-0 opacity-50"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', 
          backgroundSize: '60px 60px' 
        }} 
      />
      
      <motion.div 
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{ top: '-200px', left: '-200px', background: 'radial-gradient(circle, rgba(0,255,178,0.04) 0%, transparent 70%)' }}
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{ bottom: '-100px', right: '-100px', background: 'radial-gradient(circle, rgba(20,241,149,0.03) 0%, transparent 70%)' }}
        animate={{ y: [0, 40, 0] }}
        transition={{ repeat: Infinity, duration: 30, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{ top: '40%', left: '40%', background: 'radial-gradient(circle, rgba(0,229,160,0.025) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />
    </div>
  );
};