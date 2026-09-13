import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, ExternalLink, FileUp, Gamepad2, Link, Plus, RefreshCw, Users, X } from 'lucide-react';
import QuestionEditor from '../components/quiz/QuestionEditor';
import QuizCard from '../components/quiz/QuizCard';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const blankQuestion = () => ({ type: 'multiple_choice', question: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', timeLimit: 20, points: 1000, explanation: '' });

export default function QuizPage() {
  const { user } = useAuth();
  const { hostConnect, participants, hostSession, currentQuestion, totalQuestions, answeredCount, answeredTotal, startGame: socketStart } = useQuiz();
  const [token, setToken] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: '', description: '', subject: 'Matematika', grade: 'Kelas 5', duration: 25, questions: [blankQuestion()] });
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [importNotice, setImportNotice] = useState('');

  const authenticate = async () => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { role: user?.role || 'Guru Kelas' });
    setToken(response.data.token);
    return response.data.token;
  };

  const loadQuizzes = async (authToken = token) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/quiz`, { headers: { Authorization: `Bearer ${authToken}` } });
      setQuizzes(response.data);
    } catch (error) {
      setNotice(error.response?.data?.error || 'Backend kuis belum berjalan di port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authenticate().then(loadQuizzes).catch(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDraft({ title: '', description: '', subject: 'Matematika', grade: 'Kelas 5', duration: 25, questions: [blankQuestion()] });
    setFormOpen(true);
    setImportNotice('');
    setNotice('');
  };

  const openEdit = (quiz) => {
    setEditing(quiz);
    setDraft({ ...quiz, questions: quiz.questions.map((question) => ({ ...question, options: { ...question.options } })) });
    setFormOpen(true);
    setImportNotice('');
  };

  const saveQuiz = async (event) => {
    event.preventDefault();
    if (!draft.title.trim() || draft.questions.some((question) => !question.question.trim())) {
      setNotice('Judul dan teks setiap soal wajib diisi.');
      return;
    }
    try {
      const authToken = token || await authenticate();
      const url = editing ? `${API_URL}/api/quiz/${editing.id}` : `${API_URL}/api/quiz`;
      const response = await axios({ method: editing ? 'put' : 'post', url, data: draft, headers: { Authorization: `Bearer ${authToken}` } });
      setQuizzes((current) => editing ? current.map((quiz) => quiz.id === editing.id ? response.data : quiz) : [response.data, ...current]);
      setFormOpen(false);
      setNotice('Kuis berhasil disimpan.');
    } catch (error) {
      setNotice(error.response?.data?.error || 'Kuis gagal disimpan.');
    }
  };

  const startQuiz = async (quiz) => {
    try {
      const authToken = token || await authenticate();
      const response = await axios.post(`${API_URL}/api/quiz/${quiz.id}/start`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
      setActiveSession(response.data);
      hostConnect(response.data.sessionId, authToken);
      setNotice('Room aktif. Bagikan kode ke murid.');
    } catch (error) {
      setNotice(error.response?.data?.error || 'Room gagal dibuat.');
    }
  };

  const deleteQuiz = async (quiz) => {
    if (!window.confirm(`Hapus kuis “${quiz.title}”?`)) return;
    try {
      await axios.delete(`${API_URL}/api/quiz/${quiz.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id));
    } catch (error) {
      setNotice(error.response?.data?.error || 'Kuis gagal dihapus.');
    }
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(activeSession?.gameCode || '');
    setNotice('Kode permainan tersalin.');
  };

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join` : '/join';

  const copyJoinLink = async () => {
    await navigator.clipboard?.writeText(joinUrl);
    setNotice('Link masuk murid tersalin. Kirim bersama kode permainan.');
  };

  const activitySummary = participants.reduce((summary, participant) => ({
    score: summary.score + (Number(participant.score) || 0),
    correct: summary.correct + (Number(participant.correctAnswers) || 0),
    wrong: summary.wrong + (Number(participant.wrongAnswers) || 0)
  }), { score: 0, correct: 0, wrong: 0 });

  const importQuestions = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const questions = Array.isArray(parsed)
          ? parsed
          : parsed.questions || parsed.data || parsed.soal;
        if (!Array.isArray(questions)) throw new Error();
        const normalizedQuestions = questions.map((question) => {
          const defaults = blankQuestion();
          const sourceOptions = question.options || question.choices || question.pilihan || {};
          const optionValues = Array.isArray(sourceOptions)
            ? Object.fromEntries(sourceOptions.slice(0, 4).map((value, index) => [String.fromCharCode(65 + index), value]))
            : sourceOptions;
          const correctAnswer = question.correctAnswer || question.correct || question.answer || question.jawaban || defaults.correctAnswer;
          return {
            ...defaults,
            ...question,
            question: question.question || question.text || question.pertanyaan || '',
            options: { ...defaults.options, ...optionValues },
            correctAnswer
          };
        });
        if (!normalizedQuestions.length) throw new Error();
        setDraft((current) => ({ ...current, questions: normalizedQuestions }));
        setImportNotice(`${normalizedQuestions.length} soal berhasil diimpor.`);
      } catch {
        setImportNotice('JSON tidak terbaca. Gunakan array soal atau objek dengan properti questions.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[2rem] bg-gradient-to-br from-rose-500 via-fuchsia-500 to-violet-600 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black"><Gamepad2 className="h-4 w-4" /> QuizJuara</span>
            <h1 className="mt-3 text-3xl font-black">Kuis Kompetisi Kelas</h1>
            <p className="mt-1 max-w-xl text-sm text-rose-100">Buat soal, bagikan kode permainan, lalu lihat kelas menjawab bersama secara realtime.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-700 shadow-lg hover:-translate-y-0.5 transition"><Plus className="h-4 w-4" /> Buat Kuis Baru</button>
        </div>
      </section>

      {notice && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{notice}</div>}

      {activeSession && <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-widest text-emerald-600">Room menunggu peserta</p><p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">Bagikan link ini kepada murid:</p><div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow"><Link className="h-4 w-4 text-emerald-500" /><span className="truncate">{joinUrl}</span></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={copyJoinLink} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black shadow"><Copy className="h-4 w-4" /> Salin Link</button><button onClick={copyCode} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black shadow"><Copy className="h-4 w-4" /> Salin Kode</button><button onClick={() => window.open(joinUrl, '_blank', 'noopener,noreferrer')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white shadow"><ExternalLink className="h-4 w-4" /> Buka Halaman Murid</button></div></div>
          <div className="text-center"><p className="text-6xl font-black tracking-[0.2em] text-emerald-600">{activeSession.gameCode}</p><p className="mt-2 text-sm font-bold text-emerald-700">{participants.length || hostSession?.participants?.length || 0} peserta bergabung</p></div>
          <button onClick={() => socketStart(activeSession.sessionId, token)} disabled={!participants.length} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Users className="h-4 w-4" /> Mulai Kuis</button>
        </div>
      </section>}

      {activeSession && <section className="rounded-[2rem] bg-white p-6 shadow-md dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-widest text-violet-500">Monitor realtime</p><h2 className="mt-1 text-xl font-black text-slate-800 dark:text-white">Aktivitas Murid</h2></div>
          <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">{participants.length} murid aktif · progres realtime</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3"><div className="rounded-2xl bg-violet-50 p-3 text-center dark:bg-violet-950/30"><p className="text-[10px] font-black uppercase text-violet-500">Total Skor</p><p className="mt-1 text-xl font-black text-violet-700 dark:text-violet-300">{activitySummary.score}</p></div><div className="rounded-2xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/30"><p className="text-[10px] font-black uppercase text-emerald-500">Jawaban Benar</p><p className="mt-1 text-xl font-black text-emerald-700 dark:text-emerald-300">{activitySummary.correct}</p></div><div className="rounded-2xl bg-rose-50 p-3 text-center dark:bg-rose-950/30"><p className="text-[10px] font-black uppercase text-rose-500">Jawaban Salah</p><p className="mt-1 text-xl font-black text-rose-700 dark:text-rose-300">{activitySummary.wrong}</p></div></div>
        {participants.length === 0 ? <p className="py-8 text-center text-sm font-bold text-slate-400">Belum ada murid di room.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{participants.map((participant) => {
          const activity = participant.activity || { status: 'ready', label: 'Siap bermain' };
          const answered = activity.status === 'answered';
          const nextQuestion = Number.isInteger(participant.nextQuestionIndex) ? participant.nextQuestionIndex : 0;
          return <div key={participant.id} className={`rounded-2xl border p-4 transition ${answered ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'}`}>
            <div className="flex items-start justify-between gap-2"><div><p className="font-black text-slate-800 dark:text-white">{participant.name}</p><p className="mt-1 text-xs font-bold text-slate-400">{participant.nextQuestionIndex === undefined ? activity.label : nextQuestion >= totalQuestions ? 'Selesai menjawab' : `Sedang mengerjakan soal ${nextQuestion + 1}`}</p></div>{answered ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />}</div>
            {activity.status === 'answered' && <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-slate-600">Jawaban {activity.answer || 'kosong'} · {activity.isCorrect ? 'Benar' : 'Salah'}{activity.responseTime !== undefined ? ` · ${Number(activity.responseTime).toFixed(1)} detik` : ''}</p>}
            <div className="mt-3 flex items-center justify-between text-xs"><span className="font-bold text-slate-500">Skor <strong className="text-slate-800 dark:text-white">{participant.score || 0}</strong></span><span className="font-bold text-emerald-600">Benar {participant.correctAnswers || 0}</span><span className="font-bold text-rose-500">Salah {participant.wrongAnswers || 0}</span></div>
          </div>;
        })}</div>}
      </section>}

      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-800 dark:text-white">Kuis Saya</h2><button onClick={() => loadQuizzes()} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Muat ulang"><RefreshCw className="h-4 w-4" /></button></div>
      {loading ? <p className="text-sm font-bold text-slate-400">Memuat kuis...</p> : quizzes.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center"><p className="text-4xl">📝</p><p className="mt-2 font-black text-slate-700 dark:text-slate-200">Belum ada kuis</p><p className="text-sm text-slate-500">Mulai dengan satu kuis kecil untuk kelas hari ini.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{quizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} onStart={() => startQuiz(quiz)} onEdit={() => openEdit(quiz)} onDelete={() => deleteQuiz(quiz)} />)}</div>}

      {formOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4"><motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} onSubmit={saveQuiz} className="mx-auto max-w-3xl space-y-5 rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-7">
        <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-violet-500">QuizJuara</p><h2 className="text-2xl font-black text-slate-800 dark:text-white">{editing ? 'Edit Kuis' : 'Buat Kuis Baru'}</h2></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X /></button></div>
        <div className="grid gap-3 sm:grid-cols-2"><input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Judul kuis, contoh: Fiqih - Zakat" className="rounded-xl border p-3 text-sm sm:col-span-2" /><input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Mata pelajaran" className="rounded-xl border p-3 text-sm" /><input value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value })} placeholder="Kelas" className="rounded-xl border p-3 text-sm" /><label className="text-xs font-bold text-slate-600 sm:col-span-2">Durasi kuis<select value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })} className="mt-1 block w-full rounded-xl border p-3 text-sm font-bold"><option value={25}>25 menit</option><option value={30}>30 menit</option><option value={35}>35 menit</option><option value={40}>40 menit</option><option value={45}>45 menit</option><option value={50}>50 menit</option><option value={55}>55 menit</option><option value={60}>1 jam</option></select></label><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Deskripsi singkat" className="rounded-xl border p-3 text-sm sm:col-span-2" rows={2} /></div>
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black text-slate-800 dark:text-white">Soal ({draft.questions.length})</h3><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black"><FileUp className="h-4 w-4" /> Import JSON<input type="file" accept=".json,application/json" onChange={importQuestions} className="hidden" /></label></div>
        {importNotice && <p className={`rounded-xl px-3 py-2 text-xs font-bold ${importNotice.includes('berhasil') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{importNotice}</p>}
        <div className="space-y-3">{draft.questions.map((question, index) => <QuestionEditor key={question.id || index} question={question} index={index} onUpdate={(next) => setDraft((current) => ({ ...current, questions: current.questions.map((item, itemIndex) => itemIndex === index ? next : item) }))} onDelete={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) }))} />)}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={() => setDraft((current) => ({ ...current, questions: [...current.questions, blankQuestion()] }))} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700"><Plus className="mr-1 inline h-4 w-4" /> Tambah Soal</button><button className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Simpan Kuis</button></div>
      </motion.form></div>}
    </div>
  );
}
