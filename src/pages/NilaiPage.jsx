import React, { useState } from 'react';
import { INITIAL_STUDENTS, INITIAL_SUBJECTS } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import {
  ClipboardList, Plus, Trash2, Edit2, Save, X, TrendingUp,
  BookOpen, FileText, CheckCircle2, ChevronDown, Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// Seed nilai awal
const generateInitialGrades = () => {
  const grades = {};
  (INITIAL_STUDENTS || []).forEach(st => {
    grades[st.id] = {};
    (INITIAL_SUBJECTS || []).forEach(sub => {
      grades[st.id][sub.id] = {
        tugas: [
          { id: 't1', title: 'Tugas 1 - Lembar Kerja Bab 1', score: Math.floor(75 + Math.random() * 25), date: '2026-07-10' },
          { id: 't2', title: 'Tugas 2 - PR Soal Latihan',    score: Math.floor(75 + Math.random() * 25), date: '2026-07-18' },
        ],
        ulangan: [
          { id: 'u1', title: 'Ulangan Harian Bab 1', score: Math.floor(70 + Math.random() * 30), date: '2026-07-25' },
        ]
      };
    });
  });
  return grades;
};

export default function NilaiPage() {
  const { students, selectedStudent, switchStudent, grades, setGrades, addGrade, editGrade, removeGrade } = useAuth();
  const subjectList = INITIAL_SUBJECTS || [];
  const [activeSubject, setActiveSubject] = useState(subjectList[0]?.id || 'pancasila');
  const [activeTab, setActiveTab] = useState('tugas'); // 'tugas' | 'ulangan'


  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formScore, setFormScore] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // WhatsApp kirim rekap nilai
  const [showWaModal, setShowWaModal] = useState(false);

  const currentStudent = selectedStudent || INITIAL_STUDENTS[0];
  const studentId = currentStudent?.id || 'std-1';

  const currentSubjectData = grades[studentId]?.[activeSubject] || { tugas: [], ulangan: [] };
  const currentList = currentSubjectData[activeTab] || [];

  const subjectInfo = subjectList.find(s => s.id === activeSubject) || subjectList[0];

  const avg = (arr) => (!arr || arr.length === 0) ? 0 : Math.round(arr.reduce((s, i) => s + i.score, 0) / arr.length);
  const avgTugas = avg(currentSubjectData.tugas);
  const avgUlangan = avg(currentSubjectData.ulangan);
  const nilaiAkhir = Math.round(avgTugas * 0.4 + avgUlangan * 0.6);

  const getGrade = (n) => {
    if (n >= 90) return { label: 'Sangat Baik (A)', color: 'text-emerald-600' };
    if (n >= 80) return { label: 'Baik (B)', color: 'text-sky-600' };
    if (n >= 70) return { label: 'Cukup (C)', color: 'text-amber-600' };
    return { label: 'Perlu Bimbingan (D)', color: 'text-rose-600' };
  };

  const resetForm = () => {
    setFormTitle(''); setFormScore(''); setFormDate(new Date().toISOString().split('T')[0]);
    setEditId(null); setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormTitle(item.title);
    setFormScore(String(item.score));
    setFormDate(item.date);
    setShowForm(true);
  };

  const handleSave = async () => {
    const score = parseInt(formScore);
    if (!formTitle.trim() || isNaN(score) || score < 0 || score > 100) return;

    if (editId) {
      if (editGrade) {
        try {
          await editGrade(editId, {
            studentId, subjectId: activeSubject, type: activeTab,
            title: formTitle, score, date: formDate,
          });
        } catch (_) {
          // fallback ke local update
          setGrades(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            const list = clone[studentId]?.[activeSubject]?.[activeTab] || [];
            const idx = list.findIndex(x => x.id === editId);
            if (idx > -1) list[idx] = { ...list[idx], title: formTitle, score, date: formDate };
            return clone;
          });
        }
      } else {
        setGrades(prev => {
          const clone = JSON.parse(JSON.stringify(prev));
          const list = clone[studentId]?.[activeSubject]?.[activeTab] || [];
          const idx = list.findIndex(x => x.id === editId);
          if (idx > -1) list[idx] = { ...list[idx], title: formTitle, score, date: formDate };
          return clone;
        });
      }
    } else {
      // Tambah baru
      if (addGrade) {
        try {
          await addGrade({
            studentId, subjectId: activeSubject, type: activeTab,
            title: formTitle, score, date: formDate,
          });
        } catch (_) {
          // fallback ke local insert
          setGrades(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            if (!clone[studentId]) clone[studentId] = {};
            if (!clone[studentId][activeSubject]) clone[studentId][activeSubject] = { tugas: [], ulangan: [] };
            clone[studentId][activeSubject][activeTab].push({
              id: `${activeTab}-${Date.now()}`, title: formTitle, score, date: formDate,
            });
            return clone;
          });
        }
      } else {
        setGrades(prev => {
          const clone = JSON.parse(JSON.stringify(prev));
          if (!clone[studentId]) clone[studentId] = {};
          if (!clone[studentId][activeSubject]) clone[studentId][activeSubject] = { tugas: [], ulangan: [] };
          clone[studentId][activeSubject][activeTab].push({
            id: `${activeTab}-${Date.now()}`, title: formTitle, score, date: formDate,
          });
          return clone;
        });
      }
    }
    resetForm();
  };

  const handleDelete = async (id) => {
    const isUuid = /^[0-9a-f-]{36}$/.test(id);
    if (isUuid && removeGrade) {
      try {
        await removeGrade(id, { studentId, subjectId: activeSubject, type: activeTab });
        return;
      } catch (_) { /* fallback */ }
    }
    setGrades(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      if (clone[studentId]?.[activeSubject]?.[activeTab]) {
        clone[studentId][activeSubject][activeTab] =
          clone[studentId][activeSubject][activeTab].filter(x => x.id !== id);
      }
      return clone;
    });
  };

  // Build chart data for current subject
  const chartData = [
    ...(currentSubjectData.tugas || []).map((t, i) => ({ name: `T${i + 1}`, nilai: t.score, type: 'Tugas' })),
    ...(currentSubjectData.ulangan || []).map((u, i) => ({ name: `UH${i + 1}`, nilai: u.score, type: 'Ulangan' })),
  ];

  // Build WhatsApp rekap for ALL subjects
  const buildWaMessage = () => {
    const lines = INITIAL_SUBJECTS.map(sub => {
      const d = grades[studentId]?.[sub.id] || { tugas: [], ulangan: [] };
      const at = avg(d.tugas);
      const au = avg(d.ulangan);
      const na = Math.round(at * 0.4 + au * 0.6);
      return `• ${sub.name}: Tugas ${at} | UH ${au} | *NA ${na}*`;
    }).join('\n');

    return `Assalamu'alaikum Wr. Wb. Yth. ${currentStudent.parentName},\n\nBerikut *Rekap Nilai* ananda *${currentStudent.name}* (${currentStudent.className}):\n\n${lines}\n\nKeterangan: NA = Nilai Akhir (Tugas 40% + Ulangan 60%)\n\n-- ${currentStudent.homeroomTeacher}`;
  };

  const sendWA = () => {
    const msg = buildWaMessage();
    const phone = currentStudent.parentPhone || '6281234567891';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setShowWaModal(false);
  };


  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 p-6 rounded-4xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <ClipboardList className="w-3.5 h-3.5" /> Manajemen Nilai Akademik
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Nilai Tugas & Ulangan Harian</h1>
          <p className="text-xs text-indigo-100">Input, edit, dan pantau nilai seluruh mata pelajaran per siswa.</p>
        </div>

        <button
          onClick={() => setShowWaModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 border border-emerald-300"
        >
          <span>📱 Kirim Rekap Nilai via WhatsApp</span>
        </button>
      </div>

      {/* Selector: Siswa + Mapel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pilih Siswa */}
        <GlassCard className="p-4 space-y-2">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pilih Peserta Didik</p>
          <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
            {(students || INITIAL_STUDENTS).map(st => (
              <button
                key={st.id}
                onClick={() => switchStudent(st.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold transition text-left ${
                  studentId === st.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50'
                }`}
              >
                <img src={st.avatar} alt={st.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                <div className="truncate">
                  <p className="truncate">{st.name}</p>
                  <p className="text-[10px] opacity-70 font-normal">NISN: {st.nisn}</p>
                </div>
                {studentId === st.id && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Pilih Mata Pelajaran */}
        <GlassCard className="p-4 space-y-2">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pilih Mata Pelajaran</p>
          <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
            {subjectList.map(sub => {
              const d = grades[studentId]?.[sub.id] || { tugas: [], ulangan: [] };
              const na = Math.round(avg(d.tugas) * 0.4 + avg(d.ulangan) * 0.6);
              const g = getGrade(na);
              return (
                <button
                  key={sub.id}
                  onClick={() => { setActiveSubject(sub.id); resetForm(); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition ${
                    activeSubject === sub.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50'
                  }`}
                >
                  <span className="truncate">{sub.name}</span>
                  <span className={`font-black shrink-0 ml-2 ${activeSubject === sub.id ? 'text-white' : g.color}`}>{na}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Rata-rata Tugas', val: avgTugas, color: 'border-l-sky-400', badge: 'bg-sky-100 text-sky-700' },
          { label: 'Rata-rata Ulangan', val: avgUlangan, color: 'border-l-purple-400', badge: 'bg-purple-100 text-purple-700' },
          { label: 'Nilai Akhir (NA)', val: nilaiAkhir, color: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
          { label: 'Predikat', val: getGrade(nilaiAkhir).label, color: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700' },
        ].map((c, i) => (
          <GlassCard key={i} className={`border-l-4 ${c.color} p-4`} hoverable={false}>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">{c.label}</p>
            <p className={`text-xl font-black mt-1 ${i === 3 ? 'text-sm' : ''} ${getGrade(nilaiAkhir).color}`}>{c.val}</p>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>
              {subjectInfo?.name}
            </span>
          </GlassCard>
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Grafik */}
        <GlassCard className="lg:col-span-1 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" /> Grafik Nilai {subjectInfo?.name}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', fontSize: '11px' }} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'KKM 75', fontSize: 10, fill: '#f59e0b' }} />
                <Bar dataKey="nilai" radius={[8, 8, 0, 0]}
                  fill="#6366f1"
                  label={{ position: 'top', fontSize: 9, fontWeight: 'bold', fill: '#374151' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-bold">T = Tugas | UH = Ulangan Harian | KKM = 75</p>
        </GlassCard>

        {/* Input & List */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['tugas', 'ulangan'].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); resetForm(); }}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
                    activeTab === tab
                      ? (tab === 'tugas' ? 'bg-sky-500 text-white' : 'bg-purple-500 text-white')
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                  {tab === 'tugas' ? '📝 Nilai Tugas' : '📋 Ulangan Harian'}
                </button>
              ))}
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah {activeTab === 'tugas' ? 'Tugas' : 'Ulangan'}
            </button>
          </div>

          {/* Inline Form */}
          {showForm && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl border border-indigo-200 dark:border-indigo-800 space-y-3">
              <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                {editId ? '✏️ Edit' : '➕ Tambah'} {activeTab === 'tugas' ? 'Nilai Tugas' : 'Ulangan Harian'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Judul (cth: Tugas Bab 2)"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="col-span-1 sm:col-span-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="number" min="0" max="100"
                  placeholder="Nilai (0-100)"
                  value={formScore}
                  onChange={e => setFormScore(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={resetForm} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
                <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1 shadow">
                  <Save className="w-3.5 h-3.5" /> Simpan
                </button>
              </div>
            </div>
          )}

          {/* List Nilai */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {currentList.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-bold">
                Belum ada data {activeTab === 'tugas' ? 'tugas' : 'ulangan harian'}. Klik "+ Tambah" untuk mulai!
              </div>
            ) : currentList.map((item, idx) => {
              const g = getGrade(item.score);
              return (
                <div key={item.id}
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                      item.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                      item.score >= 80 ? 'bg-sky-100 text-sky-700' :
                      item.score >= 70 ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {item.score}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                      <p className={`text-[10px] font-bold ${g.color}`}>{g.label} · {item.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-xl text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

      </div>

      {/* Rekap Tabel Semua Mapel */}
      <GlassCard className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" /> Rekap Nilai Semua Mata Pelajaran — {currentStudent?.name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px]">
                <th className="p-3 border">No</th>
                <th className="p-3 border">Mata Pelajaran</th>
                <th className="p-3 border text-center">Jml Tugas</th>
                <th className="p-3 border text-center">Rata Tugas</th>
                <th className="p-3 border text-center">Jml UH</th>
                <th className="p-3 border text-center">Rata UH</th>
                <th className="p-3 border text-center font-black">Nilai Akhir</th>
                <th className="p-3 border text-center">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium">
              {subjectList.map((sub, idx) => {
                const d = grades[studentId]?.[sub.id] || { tugas: [], ulangan: [] };
                const at = avg(d.tugas);
                const au = avg(d.ulangan);
                const na = Math.round(at * 0.4 + au * 0.6);
                const g = getGrade(na);
                const isActive = sub.id === activeSubject;
                return (
                  <tr key={sub.id}
                    onClick={() => { setActiveSubject(sub.id); resetForm(); }}
                    className={`cursor-pointer transition ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/40 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                    <td className="p-3 border text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 border font-extrabold text-slate-800 dark:text-slate-100">{sub.name}</td>
                    <td className="p-3 border text-center">{d.tugas.length}</td>
                    <td className="p-3 border text-center font-bold text-sky-600">{at}</td>
                    <td className="p-3 border text-center">{d.ulangan.length}</td>
                    <td className="p-3 border text-center font-bold text-purple-600">{au}</td>
                    <td className={`p-3 border text-center font-black text-lg ${g.color}`}>{na}</td>
                    <td className="p-3 border text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        na >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        na >= 80 ? 'bg-sky-100 text-sky-700' :
                        na >= 70 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>{g.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 font-bold">
          *Nilai Akhir = (Rata-rata Tugas × 40%) + (Rata-rata Ulangan Harian × 60%)
        </p>
      </GlassCard>


      {/* Modal Konfirmasi WA */}
      {showWaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-400 w-full max-w-md rounded-4xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              📱 Kirim Rekap Nilai via WhatsApp
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rekap nilai seluruh mata pelajaran untuk <strong>{selectedStudent.name}</strong> akan dikirim ke WhatsApp{' '}
              <strong>{selectedStudent.parentName}</strong> (+{selectedStudent.parentPhone}).
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {buildWaMessage()}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowWaModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl">Batal</button>
              <button onClick={sendWA} className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow">
                <Send className="w-3.5 h-3.5" /> Kirim WA Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
