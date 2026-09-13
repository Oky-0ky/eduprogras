import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Gamepad2, LoaderCircle, Sparkles } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

export default function JoinPage() {
  const { gameStatus, gameCode, playerName, sessionId, participantId, error, currentQuestion, questionIndex, totalQuestions, hasAnswered, myAnswer, myScore, joinGame, submitAnswer, resetGame, clearError } = useQuiz();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(20);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (gameStatus === 'playing' && currentQuestion) {
      setStartedAt(Date.now());
      setSecondsLeft(currentQuestion.timeLimit || 20);
    }
  }, [gameStatus, currentQuestion?.id]);

  useEffect(() => {
    if (gameStatus !== 'playing' || hasAnswered) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((current) => {
      if (current <= 1) {
        window.clearInterval(timer);
        if (!hasAnswered && currentQuestion) submitAnswer('', currentQuestion.timeLimit || 20, sessionId, participantId, currentQuestion.id);
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [gameStatus, hasAnswered, currentQuestion, submitAnswer]);

  const answer = (option) => {
    if (hasAnswered || !currentQuestion) return;
    submitAnswer(option, Math.max(0, (Date.now() - startedAt) / 1000), sessionId, participantId, currentQuestion.id);
  };

  if (gameStatus === 'idle' || gameStatus === 'joining') return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-white to-amber-100 p-5"><motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-xl"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-rose-500 text-3xl shadow-lg">🏆</div><h1 className="mt-5 text-center text-3xl font-black text-slate-800">Siap Menjadi Juara?</h1><p className="mt-2 text-center text-sm font-medium text-slate-500">Masukkan kode dari guru dan bergabung ke kelas.</p><form onSubmit={(event) => { event.preventDefault(); clearError(); joinGame(code.trim(), name.trim()); }} className="mt-7 space-y-3"><input required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Kode Permainan" inputMode="numeric" className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-center text-xl font-black tracking-[0.3em] outline-none focus:border-sky-400" /><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama Kamu" className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 font-bold outline-none focus:border-sky-400" /><button disabled={gameStatus === 'joining'} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 p-4 font-black text-white shadow-lg disabled:opacity-60">{gameStatus === 'joining' ? <LoaderCircle className="animate-spin" /> : <><Gamepad2 /> Gabung Permainan <ArrowRight className="h-4 w-4" /></>}</button></form>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-center text-sm font-bold text-rose-600">{error}</p>}</motion.section></main>;

  if (gameStatus === 'lobby') return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-5"><section className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="text-5xl">🚀</div><p className="mt-4 text-xs font-black uppercase tracking-widest text-emerald-500">Berhasil Bergabung!</p><h1 className="mt-2 text-2xl font-black text-slate-800">Menunggu Guru Memulai Permainan...</h1><p className="mt-3 text-sm text-slate-500">Hai {playerName || name}, tetap siap ya!</p><div className="my-7 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black text-slate-400">GAME CODE</p><p className="mt-1 text-4xl font-black tracking-[0.2em] text-violet-600">{gameCode}</p></div><Sparkles className="mx-auto animate-pulse text-amber-400" /></section></main>;

  if (gameStatus === 'playing' && currentQuestion) return <main className="min-h-screen bg-slate-50 p-4 sm:p-8"><section className="mx-auto max-w-3xl"><div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">Soal {questionIndex + 1} / {totalQuestions}</span><span className={`rounded-full px-4 py-2 text-lg font-black ${secondsLeft <= 10 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>⏱ {formatTime(secondsLeft)}</span></div><section className="rounded-[2rem] bg-white p-6 shadow-lg sm:p-9"><h1 className="text-xl font-black leading-relaxed text-slate-800 sm:text-2xl">{currentQuestion.question}</h1><div className="mt-7 grid gap-3 sm:grid-cols-2">{Object.entries(currentQuestion.options || {}).map(([key, value]) => <button key={key} disabled={hasAnswered} onClick={() => answer(key)} className={`rounded-2xl border-2 p-5 text-left font-black transition ${hasAnswered && myAnswer === key ? 'border-violet-500 bg-violet-100 text-violet-800' : 'border-slate-100 bg-slate-50 hover:-translate-y-1 hover:border-sky-300 hover:bg-sky-50'} disabled:cursor-not-allowed disabled:opacity-70`}><span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow">{key}</span>{value}</button>)}</div>{hasAnswered && <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-center font-black text-emerald-700">Jawaban Kamu Terkunci!</p>}</section></section></main>;
  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 p-5"><section className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="text-5xl">🎉</div><h1 className="mt-4 text-3xl font-black text-slate-800">Kuis Selesai!</h1><p className="mt-2 text-slate-500">Skor kamu: <strong>{myScore}</strong></p><button onClick={resetGame} className="mt-6 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Main Lagi</button></section></main>;
}
