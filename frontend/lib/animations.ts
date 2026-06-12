export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } 
  }
};

export const stagger = {
  hidden: {},
  show: { 
    transition: { staggerChildren: 0.07 } 
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.35 } 
  }
};