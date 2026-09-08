import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const DEFAULT_Q = {
  type: 'multiple_choice',
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correctAnswer: 'A',
  timeLimit: 20,
  points: 1000,
  explanation: ''
};

export default function QuestionEditor({ question = DEFAULT_Q, index, onUpdate, onDelete }) {
  const [open, setOpen] = useState(true);

  const update = (field, value) => onUpdate({ ...question, [field]: value });
  const updateOption = (key, value) => onUpdate({ ...question, options: { ...question.options, [key]: value } });

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-violet-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-none">
            {question.question || `Soal ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {['multiple_choice', 'true_false'].map(t => (
                  <button
                    key={t}
                    onClick={() => update('type', t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      question.type === t
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar / Salah'}
                  </button>
                ))}
              </div>

              {/* Question text */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Pertanyaan</label>
                <textarea
                  value={question.question}
                  onChange={e => update('question', e.target.value)}
                  rows={2}
                  placeholder="Tulis pertanyaan di sini..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>

              {/* Options */}
              {question.type === 'multiple_choice' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={question.correctAnswer === opt}
                          onChange={() => update('correctAnswer', opt)}
                          className="accent-violet-500"
                        />
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          question.correctAnswer === opt ? 'bg-violet-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>{opt}</span>
                      </label>
                      <input
                        value={question.options?.[opt] || ''}
                        onChange={e => updateOption(opt, e.target.value)}
                        placeholder={`Pilihan ${opt}`}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3">
                  {['true', 'false'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => update('correctAnswer', opt)}
                      className={`flex-1 py-3 rounded-2xl font-black text-sm transition ${
                        question.correctAnswer === opt
                          ? opt === 'true' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt === 'true' ? '✅ Benar' : '❌ Salah'}
                    </button>
                  ))}
                </div>
              )}

              {/* Time & Points */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">⏱ Waktu (detik)</label>
                  <input
                    type="number" min={5} max={120}
                    value={question.timeLimit || 20}
                    onChange={e => update('timeLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">⭐ Poin</label>
                  <input
                    type="number" min={100} max={2000} step={100}
                    value={question.points || 1000}
                    onChange={e => update('points', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">💡 Penjelasan (opsional)</label>
                <input
                  value={question.explanation || ''}
                  onChange={e => update('explanation', e.target.value)}
                  placeholder="Penjelasan jawaban yang benar..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
