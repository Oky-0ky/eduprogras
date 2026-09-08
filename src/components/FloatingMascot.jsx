import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Rocket, Smile } from 'lucide-react';

export default function FloatingMascot({ studentName = "Ammar" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    `Hai Ayah/Bunda! ${studentName} hari ini sangat bersemangat belajar! 🌟`,
    `Tahu tidak? Capaian Pembelajaran ${studentName} sudah mencapai 88%! 🚀`,
    `Hebat sekali! ${studentName} rajin menghafal Al-Qur'an dan selalu disiplin. ❤️`,
    `Ayo beri apresiasi bintang untuk ${studentName} hari ini! ⭐`
  ];

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.8 }
    });
    setMessageIndex((prev) => (prev + 1) % messages.length);
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-3 max-w-xs bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-600 rounded-3xl p-4 shadow-2xl relative text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-1 text-amber-600 dark:text-amber-400 font-bold">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>EduBuddy - Si Bintang Smart</span>
            </div>
            <p>{messages[messageIndex]}</p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={triggerConfetti}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 px-3 py-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
              >
                <Rocket className="w-3.5 h-3.5" /> Sebar Selebrasi! 🎉
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={triggerConfetti}
        className="relative group bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 p-3 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 cursor-pointer"
        title="Klik Si Bintang Smart untuk kejutan!"
      >
        <div className="w-12 h-12 flex items-center justify-center text-3xl">
          ⭐
        </div>
        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
          AI
        </span>
      </motion.button>
    </div>
  );
}
