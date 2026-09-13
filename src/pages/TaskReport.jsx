import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_STUDENTS, INITIAL_SUBJECTS } from '../data/initialData';
import GlassCard from '../components/GlassCard';
import {
  CheckSquare, Printer, Send, CheckCircle2, XCircle, X,
  BookOpen, TrendingUp, FileText, Filter, ChevronDown,
  AlertCircle, Award, Link as LinkIcon, Copy, Users, Pencil
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const KKM = 75;

const getGrade = (n) => {
  if (n >= 90) return { label: 'Sangat Baik (A)', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (n >= 80) return { label: 'Baik (B)',         color: 'text-sky-600',     bg: 'bg-sky-100'     };
  if (n >= 70) return { label: 'Cukup (C)',         color: 'text-amber-600',  bg: 'bg-amber-100'   };
  return           { label: 'Perlu Bimbingan (D)', color: 'text-rose-600',   bg: 'bg-rose-100'    };
};

const avg = (arr) => (!arr || arr.length === 0) ? 0 : Math.round(arr.reduce((s, i) => s + i.score, 0) / arr.length);

// ─── Component ────────────────────────────────────────────────────────────────
export default function TaskReport() {
  const { students, selectedStudent, switchStudent, grades, setGrades, toggleGradeStatus } = useAuth();
  const subjectList = INITIAL_SUBJECTS || [];

  const [filter, setFilter] = useState('all');
  const [activeSubject, setActiveSubject] = useState('all');
  const [showWaModal, setShowWaModal] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedReportSubjects, setSelectedReportSubjects] = useState(() => subjectList.map(subject => subject.id));

  const currentStudent = selectedStudent || INITIAL_STUDENTS[0];
  const studentId      = currentStudent?.id || 'std-1';

  // ── Build flat task list ──────────────────────────────────────────────────
  const allTasks = useMemo(() => {
    const list = [];
    subjectList.forEach(sub => {
      const d = grades[studentId]?.[sub.id] || { tugas: [], ulangan: [] };
      (d.tugas || []).forEach(t => list.push({
        ...t, subId: sub.id, subName: sub.name, type: 'Tugas',
        status: Number(t.score) === 0 ? 'missing' : (t.status || 'submitted')
      }));
      (d.ulangan || []).forEach(u => list.push({
        ...u, subId: sub.id, subName: sub.name, type: 'Ulangan Harian',
        status: Number(u.score) === 0 ? 'missing' : (u.status || 'submitted')
      }));
    });
    return list;
  }, [studentId, grades, subjectList]);

  const isSubmitted = (task) => task.status !== 'missing' && Number(task.score) > 0;

  const toggleSubmissionStatus = async (task) => {
    const isUuid = /^[0-9a-f-]{36}$/.test(task.id);
    if (isUuid && toggleGradeStatus) {
      try {
        await toggleGradeStatus(task.id, {
          studentId, subjectId: task.subId, type: task.type === 'Ulangan Harian' ? 'ulangan' : 'tugas',
          currentStatus: isSubmitted(task) ? 'submitted' : 'missing',
        });
        return;
      } catch (_) { /* fallback */ }
    }
    setGrades(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const listKey = task.type === 'Ulangan Harian' ? 'ulangan' : 'tugas';
      const list = next[studentId]?.[task.subId]?.[listKey] || [];
      const item = list.find(entry => entry.id === task.id);
      if (item) item.status = isSubmitted(item) ? 'missing' : 'submitted';
      return next;
    });
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      const subOk = activeSubject === 'all' || t.subId === activeSubject;
      const scoreOk = filter === 'all' ? true : filter === 'pass' ? isSubmitted(t) && t.score >= KKM : filter === 'missing' ? !isSubmitted(t) : isSubmitted(t) && t.score < KKM;
      return subOk && scoreOk;
    });
  }, [allTasks, filter, activeSubject]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalTasks = allTasks.length;
  const submittedTasks = allTasks.filter(isSubmitted);
  const missingCount = allTasks.filter(t => !isSubmitted(t)).length;
  const passCount = submittedTasks.filter(t => t.score >= KKM).length;
  const failCount = submittedTasks.filter(t => t.score < KKM).length;
  const avgAll = submittedTasks.length === 0 ? 0 : Math.round(submittedTasks.reduce((s, t) => s + Number(t.score || 0), 0) / submittedTasks.length);

  // ── Chart data (rata per mapel) ───────────────────────────────────────────
  const chartData = useMemo(() => {
    return subjectList.map(sub => {
      const d = grades[studentId]?.[sub.id] || { tugas: [], ulangan: [] };
      const submitted = [...(d.tugas || []), ...(d.ulangan || [])].filter(task => Number(task.score) > 0 && task.status !== 'missing');
      const a = avg(submitted);
      return { name: sub.name.length > 8 ? sub.name.slice(0, 8) + '…' : sub.name, fullName: sub.name, nilai: a, pass: a >= KKM };
    });
  }, [studentId, grades, subjectList]);

  // ── Group filtered tasks by subject ───────────────────────────────────────
  const groupedBySubject = useMemo(() => {
    const map = {};
    filteredTasks.forEach(t => {
      if (!map[t.subId]) map[t.subId] = { name: t.subName, tasks: [] };
      map[t.subId].tasks.push(t);
    });
    return Object.values(map);
  }, [filteredTasks]);

  const reportTasks = useMemo(
    () => allTasks.filter(task => selectedReportSubjects.includes(task.subId)),
    [allTasks, selectedReportSubjects]
  );
  const reportSubmittedTasks = reportTasks.filter(isSubmitted);
  const reportMissingCount = reportTasks.filter(task => !isSubmitted(task)).length;
  const reportAverage = reportSubmittedTasks.length
    ? Math.round(reportSubmittedTasks.reduce((sum, task) => sum + Number(task.score || 0), 0) / reportSubmittedTasks.length)
    : 0;

  // Pemberitahuan otomatis: siswa yang diberi nilai 0 = belum mengumpulkan tugas
  const zeroScoreTasks = allTasks.filter(t => Number(t.score) === 0);
  const [showZeroNotice, setShowZeroNotice] = useState(true);

  const toggleReportSubject = (subjectId) => {
    setSelectedReportSubjects(prev => prev.includes(subjectId)
      ? prev.filter(id => id !== subjectId)
      : [...prev, subjectId]
    );
  };

  // ── WhatsApp message ──────────────────────────────────────────────────────
  const reportPayload = encodeURIComponent(JSON.stringify(reportTasks.map(({ id, title, date, score, subName, status, type }) => ({ id, title, date, score, subName, status, type }))));
  const parentLink = `${window.location.origin}/ortu/${studentId}?report=tasks&t=${reportPayload}`;

  const buildWaMessage = () => `Assalamu'alaikum Wr. Wb. Yth. ${currentStudent.parentName},\n\nBerikut *Laporan Pengumpulan Tugas* ananda *${currentStudent.name}* (${currentStudent.className}).\n\n📚 Total tugas dilaporkan: ${reportTasks.length}\n✅ Sudah mengumpulkan: ${reportSubmittedTasks.length}\n⚠️ Belum mengumpulkan: ${reportMissingCount}\n📊 Rata-rata nilai: ${reportAverage}\n\nLaporan lengkap dapat dilihat melalui tautan berikut:\n${parentLink}\n\n-- ${currentStudent.homeroomTeacher}`;

  const copyParentLink = async () => {
    try {
      await navigator.clipboard.writeText(parentLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (error) {
      window.prompt('Salin link laporan orang tua:', parentLink);
    }
  };

  const sendWA = () => {
    const phone = currentStudent.parentPhone || '6281234567891';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildWaMessage())}`, '_blank');
    setShowWaModal(false);
  };

  const handlePrint = () => window.print();

  const FILTER_OPTIONS = [
    { key: 'all', label: '📋 Semua Tugas', color: 'bg-slate-500' },
    { key: 'pass', label: '✅ ≥ KKM (75+)', color: 'bg-emerald-500' },
    { key: 'fail', label: '⚠️ < KKM (<75)', color: 'bg-rose-500' },
    { key: 'missing', label: '⚠️ Belum Mengumpulkan', color: 'bg-rose-600' },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 p-6 rounded-4xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <CheckSquare className="w-3.5 h-3.5" /> Laporan Tugas Selesai
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Rekap Tugas yang Sudah Diselesaikan</h1>
          <p className="text-xs text-emerald-100">Lihat, filter, cetak, dan kirim laporan tugas per mata pelajaran ke orang tua.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 border border-white/30"
          >
            <Printer className="w-4 h-4" /> Print Laporan
          </button>
          <button
            onClick={copyParentLink}
            className="px-4 py-2.5 bg-white/20 text-white font-extrabold text-xs rounded-2xl border-white/30"
          >
            {linkCopied ? '✓ Link Disalin' : '🔗 Salin Link Ortu'}
          </button>
          <button
            onClick={() => setShowWaModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 border border-emerald-400"
          >
            <Send className="w-4 h-4" /> Kirim ke WA Ortu
          </button>
        </div>
      </div>

      {/* ── Pemberitahuan Otomatis: Nilai 0 = Belum Mengumpulkan Tugas ── */}
      {showZeroNotice && zeroScoreTasks.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-3xl p-4 flex items-start gap-3 no-print">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-rose-700 dark:text-rose-300">
              ⚠️ Pemberitahuan: {currentStudent?.name} belum mengumpulkan {zeroScoreTasks.length} tugas (nilai 0)
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {zeroScoreTasks.map(t => (
                <li key={t.id} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  • {t.title} — {t.subName} ({t.type}, {t.date})
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-rose-500 mt-1.5 font-bold">
              Siswa diberi nilai 0 otomatis tercatat "Belum Mengumpulkan" di ceklis tugas. Berikan nilai &gt; 0 setelah tugas dikumpulkan.
            </p>
          </div>
          <button
            onClick={() => setShowZeroNotice(false)}
            className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Pilih Siswa ── */}
      <GlassCard className="p-4 space-y-2 no-print">
        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pilih Peserta Didik</p>
        <div className="flex flex-wrap gap-2">
          {(students || INITIAL_STUDENTS).map(st => (
            <button
              key={st.id}
              onClick={() => switchStudent(st.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
                studentId === st.id
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50'
              }`}
            >
              <img src={st.avatar} alt={st.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
              <span className="truncate max-w-[120px]">{st.name}</span>
              {studentId === st.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Pilih Mapel untuk Link Laporan Ortu ── */}
      <GlassCard className="p-4 space-y-3 no-print">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pilih Mata Pelajaran untuk Dilaporkan</p>
            <p className="text-[11px] text-slate-500 mt-1">Hanya mapel yang dicentang akan masuk ke link orang tua dan pesan WhatsApp.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedReportSubjects(subjectList.map(subject => subject.id))} className="px-3 py-1.5 rounded-xl bg-teal-100 text-teal-700 text-[10px] font-extrabold">Pilih Semua</button>
            <button onClick={() => setSelectedReportSubjects([])} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-extrabold">Kosongkan</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {subjectList.map(subject => (
            <label key={subject.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer text-xs font-bold border ${selectedReportSubjects.includes(subject.id) ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <input type="checkbox" checked={selectedReportSubjects.includes(subject.id)} onChange={() => toggleReportSubject(subject.id)} className="accent-teal-500" />
              <span className="truncate">{subject.name}</span>
            </label>
          ))}
        </div>
        <p className="text-[10px] font-bold text-teal-600">{selectedReportSubjects.length} dari {subjectList.length} mata pelajaran dipilih</p>
      </GlassCard>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tugas', val: totalTasks, icon: CheckSquare, color: 'border-l-teal-400', badge: 'bg-teal-100 text-teal-700' },
          { label: 'Sudah Mengumpulkan', val: submittedTasks.length, icon: CheckCircle2, color: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
          { label: 'Belum Mengumpulkan', val: missingCount, icon: AlertCircle, color: 'border-l-rose-400', badge: 'bg-rose-100 text-rose-700' },
          { label: 'Rata-rata Nilai', val: avgAll, icon: TrendingUp, color: 'border-l-sky-400', badge: 'bg-sky-100 text-sky-700' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <GlassCard key={i} className={`border-l-4 ${c.color} p-4`} hoverable={false}>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">{c.label}</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{c.val}</p>
              <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${c.badge} mt-1`}>
                <Icon className="w-3 h-3" /> {currentStudent?.name?.split(' ')[0]}
              </span>
            </GlassCard>
          );
        })}
      </div>

      {/* ── Grafik Bar Per Mapel ── */}
      <GlassCard className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" /> Grafik Rata-rata Nilai Tugas Per Mata Pelajaran
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: '1rem', fontSize: '11px' }}
                formatter={(val, _name, props) => [val, props.payload.fullName]}
              />
              <ReferenceLine y={KKM} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `KKM ${KKM}`, fontSize: 10, fill: '#f59e0b' }} />
              <Bar dataKey="nilai" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 9, fontWeight: 'bold', fill: '#374151' }}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pass ? '#14b8a6' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-slate-400 font-bold text-center">🟢 Hijau = ≥ KKM ({KKM}) · 🔴 Merah = &lt; KKM</p>
      </GlassCard>

      {/* ── Filter + Pilih Mapel ── */}
      <div className="flex flex-wrap gap-3 items-center no-print">
        {/* Filter by score */}
        <div className="flex gap-2">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition ${
                filter === f.key ? `${f.color} text-white shadow-md` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filter by subject */}
        <div className="relative">
          <select
            value={activeSubject}
            onChange={e => setActiveSubject(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-700 dark:text-slate-300"
          >
            <option value="all">📚 Semua Mapel</option>
            {subjectList.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="text-xs text-slate-400 font-bold ml-auto">
          {filteredTasks.length} tugas ditampilkan
        </span>
      </div>

      {/* ── Tabel Detail Tugas Per Mapel ── */}
      {groupedBySubject.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-400">Tidak ada tugas yang sesuai filter.</p>
        </GlassCard>
      ) : (
        groupedBySubject.map(group => {
          const groupAvg = Math.round(group.tasks.reduce((s, t) => s + t.score, 0) / group.tasks.length);
          const g = getGrade(groupAvg);
          return (
            <GlassCard key={group.name} className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  {group.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">{group.tasks.length} tugas</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${g.bg} ${g.color}`}>
                    Rata-rata: {groupAvg} — {g.label}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px]">
                      <th className="p-3 border border-slate-200 dark:border-slate-700">No</th>
                      <th className="p-3 border border-slate-200 dark:border-slate-700">Nama Tugas</th>
                      <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Tanggal</th>
                      <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Nilai</th>
                      <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Pengumpulan</th>
                      <th className="p-3 border-slate-200 dark:border-slate-700 text-center">Status KKM</th>
                      <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.tasks.map((task, idx) => {
                      const tg = getGrade(task.score);
                      const tuntas = isSubmitted(task) && task.score >= KKM;
                      return (
                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                          <td className="p-3 border border-slate-100 dark:border-slate-800 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 border border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100">
                            {task.title}
                          </td>
                          <td className="p-3 border border-slate-100 dark:border-slate-800 text-center text-slate-500">{task.date}</td>
                          <td className="p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <span className={`inline-block w-9 h-9 leading-9 rounded-2xl font-black text-sm ${
                              task.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                              task.score >= 80 ? 'bg-sky-100 text-sky-700' :
                              task.score >= 70 ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {isSubmitted(task) ? task.score : '-'}
                            </span>
                          </td>
                          <td className="p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <button onClick={() => toggleSubmissionStatus(task)} className={`px-2 py-1 rounded-xl text-[10px] font-extrabold ${isSubmitted(task) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {isSubmitted(task) ? 'Sudah Mengumpulkan' : 'Belum Mengumpulkan'}
                            </button>
                          </td>
                          <td className="p-3 border-slate-100 dark:border-slate-800 text-center">
                            {tuntas ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> Tuntas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700">
                                <XCircle className="w-3 h-3" /> Remidi
                              </span>
                            )}
                          </td>
                          <td className="p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tg.bg} ${tg.color}`}>
                              {tg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          );
        })
      )}

      {/* ── Rekap Ringkasan Semua Mapel (Print-friendly) ── */}
      <GlassCard className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Rekap Ringkasan — {currentStudent?.name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px]">
                <th className="p-3 border border-slate-200 dark:border-slate-700">No</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700">Mata Pelajaran</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Jumlah Tugas</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Tuntas (≥{KKM})</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Remidi (&lt;{KKM})</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Rata-rata</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium">
              {subjectList.map((sub, idx) => {
                const d    = grades[studentId]?.[sub.id] || { tugas: [], ulangan: [] };
                const tgs  = [...(d.tugas || []), ...(d.ulangan || [])];
                const a    = avg(tgs.filter(isSubmitted));
                const pass = tgs.filter(t => t.score >= KKM).length;
                const fail = tgs.length - pass;
                const g    = getGrade(a);
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <td className="p-3 border border-slate-100 dark:border-slate-800 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 border border-slate-100 dark:border-slate-800 font-extrabold text-slate-800 dark:text-slate-100">{sub.name}</td>
                    <td className="p-3 border border-slate-100 dark:border-slate-800 text-center">{tgs.length}</td>
                    <td className="p-3 border border-slate-100 dark:border-slate-800 text-center font-bold text-emerald-600">{pass}</td>
                    <td className="p-3 border border-slate-100 dark:border-slate-800 text-center font-bold text-rose-600">{fail}</td>
                    <td className={`p-3 border border-slate-100 dark:border-slate-800 text-center font-black text-lg ${g.color}`}>{a}</td>
                    <td className="p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${g.bg} ${g.color}`}>{g.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 font-bold">
          *KKM = {KKM} | Tuntas = nilai ≥ KKM | Remidi = nilai &lt; KKM
        </p>
      </GlassCard>

      {/* ── Modal WhatsApp ── */}
      {showWaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-400 w-full max-w-md rounded-4xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              📱 Kirim Laporan Tugas via WhatsApp
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rekap tugas selesai ananda <strong>{currentStudent.name}</strong> akan dikirim ke WhatsApp{' '}
              <strong>{currentStudent.parentName}</strong> (+{currentStudent.parentPhone}).
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {buildWaMessage()}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowWaModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={sendWA}
                className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" /> Kirim WA Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
