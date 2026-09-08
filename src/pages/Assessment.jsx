import React, { useState, useEffect } from 'react';
import { INITIAL_ASSESSMENTS } from '../data/initialData';
import { setState, getState } from '../utils/syncStore';
import GlassCard from '../components/GlassCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  FileCheck2,
  Sparkles,
  Award,
  Calendar,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Filter
} from 'lucide-react';

export default function Assessment() {
  // Load saved assessments from localStorage or fallback
  const [assessments, setAssessments] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_assessments');
      return saved ? JSON.parse(saved) : INITIAL_ASSESSMENTS;
    } catch (e) {
      return INITIAL_ASSESSMENTS;
    }
  });

  // Save to localStorage + server whenever assessments change
  useEffect(() => {
    try {
      localStorage.setItem('edu_assessments', JSON.stringify(assessments));
    } catch (e) { /* ignore */ }
    setState('edu_assessments', assessments);
  }, [assessments]);

  // Muat penilaian dari server saat halaman dibuka
  useEffect(() => {
    getState('edu_assessments', null).then((data) => {
      if (Array.isArray(data) && data.length) setAssessments(data);
    });
  }, []);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSubject, setSelectedSubject] = useState('Semua');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingAss, setEditingAss] = useState(null); // null = Add, object = Edit
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Matematika',
    category: 'Formatif',
    score: 90,
    predicate: 'Sangat Baik (A)',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const categories = ['Semua', 'Formatif', 'Sumatif', 'Proyek', 'Praktik', 'Observasi', 'Portofolio'];
  const subjects = ['Semua', ...Array.from(new Set(assessments.map(a => a.subject)))];

  // Helper auto predicate
  const getAutoPredicate = (scoreNum) => {
    if (scoreNum >= 95) return 'Sangat Baik (A+)';
    if (scoreNum >= 85) return 'Baik (A)';
    if (scoreNum >= 70) return 'Cukup Baik (C)';
    return 'Kurang Baik (D)';
  };

  // Filtered List
  const filteredAssessments = assessments.filter(a => {
    const matchCat = selectedCategory === 'Semua' || a.category === selectedCategory;
    const matchSub = selectedSubject === 'Semua' || a.subject === selectedSubject;
    return matchCat && matchSub;
  });

  // Chart data calculation
  const chartData = filteredAssessments.map(a => ({
    name: `${a.subject} (${a.category})`,
    Nilai: Number(a.score) || 0
  }));

  const handleOpenAddModal = () => {
    setEditingAss(null);
    setFormData({
      title: '',
      subject: 'Matematika',
      category: 'Formatif',
      score: 90,
      predicate: getAutoPredicate(90),
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (ass) => {
    setEditingAss(ass);
    setFormData({
      title: ass.title || '',
      subject: ass.subject || 'Matematika',
      category: ass.category || 'Formatif',
      score: ass.score || 0,
      predicate: ass.predicate || getAutoPredicate(ass.score || 0),
      date: ass.date || new Date().toISOString().split('T')[0],
      description: ass.description || ''
    });
    setShowModal(true);
  };

  const handleDeleteAss = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data Asesmen ini?')) {
      setAssessments(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Judul Asesmen wajib diisi!');
      return;
    }

    setAssessments(prev => {
      if (editingAss) {
        // Edit Mode
        return prev.map(a => a.id === editingAss.id ? { ...a, ...formData, score: Number(formData.score) } : a);
      } else {
        // Add Mode
        const newAss = {
          id: `ass-${Date.now()}`,
          ...formData,
          score: Number(formData.score)
        };
        return [newAss, ...prev];
      }
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Asesmen Pembelajaran Siswa
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Halaman Hasil Asesmen</h1>
          <p className="text-xs sm:text-sm text-purple-100">
            Input, edit & kelola Rekapitulasi Asesmen Formatif, Sumatif, Proyek, Praktik, dan Observasi.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-white text-purple-900 font-extrabold text-xs rounded-2xl shadow-lg hover:bg-purple-50 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-purple-600" /> + Tambah Nilai Asesmen
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">Mapel:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl outline-none"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recharts Assessment Score Visualizer */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-500" /> Visualisasi Grafik Nilai Asesmen ({filteredAssessments.length} Data)
          </h3>
        </div>

        {chartData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            Tidak ada data grafik untuk filter ini.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="Nilai" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      {/* Assessment Cards Grid */}
      {filteredAssessments.length === 0 ? (
        <GlassCard className="p-8 text-center space-y-2">
          <div className="text-3xl">📝</div>
          <h3 className="font-black text-slate-800 dark:text-slate-200">Belum Ada Asesmen</h3>
          <p className="text-xs text-slate-500">Klik "+ Tambah Nilai Asesmen" untuk menginput nilai formatif/sumatif baru.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((ass) => (
            <GlassCard key={ass.id} className="flex flex-col justify-between space-y-3 border-t-4 border-t-purple-400">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300">
                    {ass.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                      <Calendar className="w-3.5 h-3.5" /> {ass.date}
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(ass)}
                      className="p-1 text-slate-400 hover:text-sky-600 transition rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                      title="Edit Nilai Asesmen"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAss(ass.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
                      title="Hapus Asesmen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{ass.title}</h3>
                <p className="text-xs text-slate-500 font-medium">Mata Pelajaran: <span className="font-bold text-slate-700 dark:text-slate-300">{ass.subject}</span></p>

                {ass.description && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{ass.description}"</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Predikat</p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{ass.predicate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Nilai Akhir</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{ass.score}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit Asesmen */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-4xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-500" />
                {editingAss ? 'Edit Data Asesmen' : 'Tambah Nilai Asesmen Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Nama Asesmen</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Asesmen Sumatif Bab 1 - Operasi Hitung"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  >
                    {['Matematika', 'Pendidikan Pancasila', 'IPAS', 'Bahasa Indonesia', 'PJOK', 'Bahasa Inggris', 'Bahasa Arab', 'Seni Rupa', 'TIK', 'PAI Nasional', 'PAI Lokal'].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Asesmen</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  >
                    {['Formatif', 'Sumatif', 'Proyek', 'Praktik', 'Observasi', 'Portofolio'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nilai Akhir (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, score: val, predicate: getAutoPredicate(val) });
                    }}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-black text-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Predikat Capaian</label>
                <select
                  value={formData.predicate}
                  onChange={(e) => setFormData({ ...formData, predicate: e.target.value })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-extrabold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                >
                  <option value="Sangat Baik (A+)">Sangat Baik (A+)</option>
                  <option value="Baik (A)">Baik (A)</option>
                  <option value="Cukup Baik (C)">Cukup Baik (C)</option>
                  <option value="Kurang Baik (D)">Kurang Baik (D)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Catatan Asesmen</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan materi ujian atau proyek yang dinilai..."
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Simpan Asesmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
