import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Confetti({ trigger, duration = 3000 }) {
  useEffect(() => {
    if (!trigger) return;
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) { clearInterval(interval); return; }
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6'],
      });
    }, 600);
    return () => clearInterval(interval);
  }, [trigger, duration]);
  return null;
}
