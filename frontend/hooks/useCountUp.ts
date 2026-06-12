import { useState, useEffect } from 'react';

export function useCountUp(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easedProgress = easeOutCubic(percentage);
      setCurrent(target * easedProgress);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return current;
}