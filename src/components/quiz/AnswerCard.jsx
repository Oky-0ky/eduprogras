import React from 'react';
import { motion } from 'framer-motion';

const OPTION_STYLES = {
  A: { bg: 'from-blue-400 to-blue-600', light: 'bg-blue-100', label: 'A' },
  B: { bg: 'from-pink-400 to-rose-500', light: 'bg-pink-100', label: 'B' },
  C: { bg: 'from-emerald-400 to-green-500', light: 'bg-emerald-100', label: 'C' },
  D: { bg: 'from-amber-400 to-orange-500', light: 'bg-amber-100', label: 'D' },
};

export default function AnswerCard({ option, text, isSelected, isDisabled, isCorrect, showResult, onClick }) {
  const style = OPTION_STYLES[option] || OPTION_STYLES.A;

  let bgClass = `bg-gradient-to-br ${style.bg}`;
  let ringClass = '';
  let icon = null;

  if (showResult) {
    if (isCorrect) {
      bgClass = 'bg-gradient-to-br from-green-400 to-emerald-600';
      icon = '✅';
    } else if (isSelected && !isCorrect) {
      bgClass = 'bg-gradient-to-br from-red-400 to-red-600';
      icon = '❌';
    } else {
      bgClass = 'bg-gray-200';
    }
  } else if (isSelected) {
    ringClass = 'ring-4 ring-white ring-offset-2';
  }

  return (
    <motion.button
      onClick={!isDisabled && !showResult ? onClick : undefined}
      whileHover={!isDisabled && !showResult ? { scale: 1.03 } : {}}
      whileTap={!isDisabled && !showResult ? { scale: 0.97 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative w-full min-h-[80px] sm:min-h-[90px] rounded-3xl p-4 flex items-center gap-3
        text-left font-bold text-white shadow-lg transition-all duration-200
        ${bgClass} ${ringClass}
        ${isDisabled || showResult ? 'cursor-default' : 'cursor-pointer'}
        ${showResult && !isCorrect && !isSelected ? 'opacity-50 text-gray-500' : ''}
      `}
    >
      <span className={`
        w-10 h-10 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0
        ${showResult && !isCorrect && !isSelected ? 'bg-gray-300 text-gray-500' : 'bg-white/30 text-white'}
      `}>
        {icon || style.label}
      </span>
      <span className={`text-sm sm:text-base leading-snug ${showResult && !isCorrect && !isSelected ? 'text-gray-600' : 'text-white'}`}>
        {text}
      </span>
    </motion.button>
  );
}
