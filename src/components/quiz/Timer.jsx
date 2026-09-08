import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Timer({ timeLeft, totalTime, onTimeUp }) {
  const prevTimeLeft = useRef(timeLeft);
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const offset = circumference * (1 - progress);

  const color = timeLeft > totalTime * 0.5 ? '#10b981'
    : timeLeft > totalTime * 0.25 ? '#f59e0b'
    : '#ef4444';

  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  useEffect(() => {
    if (timeLeft === 0 && prevTimeLeft.current > 0 && onTimeUp) onTimeUp();
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, onTimeUp]);

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={isUrgent ? { repeat: Infinity, duration: 0.6 } : {}}
      className="relative inline-flex items-center justify-center"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.3, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-black"
          style={{ color }}
        >
          {timeLeft}
        </motion.span>
      </div>
    </motion.div>
  );
}
