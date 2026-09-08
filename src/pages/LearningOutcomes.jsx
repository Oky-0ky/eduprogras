import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { INITIAL_CP_DATA } from '../data/initialData';
import { setState, getState } from '../utils/syncStore';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import confetti from 'canvas-confetti';
import {
  Target,
  Sparkles,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  FileCheck,
  CheckCircle2,
  Upload,
  Plus,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';

export default function LearningOutcomes() {
  const { selectedStudent, tpData, scheduleData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load saved CP list from localStorage or fallback
  const [cpList, setCpList] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_cp_list');
      return saved ? JSON.parse(saved) : INITIAL_CP_DATA;
    } catch (e) {
      return INITIAL_CP_DATA;
    }
  });

  // Calculate dynamic progress and status per subject
  const calculateSubjectProgress = (subjectId) => {
    const cps = cpList[subjectId] || INITIAL_CP_DATA[subjectId] || [];
    if (!cps || cps.length === 0) return { progress: 0, status: 'Belum Diinput' };

    const totalProg = cps.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
    const avgProg = Math.round(totalProg / cps.length);

    let status = 'Belum';
    if (avgProg >= 90) status = 'Sangat Mahir';
    else if (avgProg >= 80) status = 'Mahir';
    else if (avgProg >= 60) status = 'Berkembang';
    else if (avgProg >= 35) status = 'Mulai Berkembang';

    return { progress: avgProg, status };
  };

  const subjectList = Object.entries(tpData || {}).map(([id, item]) => {
    const teacherName = item?.teacher || 'Ustadz Iski';
    const avatar = scheduleData?.teacherMapping?.find((t) => t.name === teacherName)?.avatar
      || 'https://i.pinimg.com/1200x/1d/c1/39/1dc139c14c38e85d8c05f5d250df1743.jpg';
    const { progress, status } = calculateSubjectProgress(id);

    return {
      id,
      name: item?.subject || id,
      teacher: teacherName,
      avatar,
      progress,
      status
    };
  });

  const initialSubId = searchParams.get('subject') || subjectList[0]?.id || 'mtk';
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubId);

  // Save to localStorage + server whenever cpList updates
  useEffect(() => {
    try {
      localStorage.setItem('edu_cp_list', JSON.stringify(cpList));
    } catch (e) { /* ignore */ }
    setState('edu_cp_list', cpList);
  }, [cpList]);

  // Muat CP dari server saat halaman dibuka
  useEffect(() => {
    getState('edu_cp_list', null).then((data) => {
      if (data && Object.keys(data).length) setCpList(data);
    });
  }, []);

  // Modal / Form states for Adding & Editing CP
  const [showModal, setShowModal] = useState(false);
  const [editingCp, setEditingCp] = useState(null); // null = Add Mode, object = Edit Mode
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    status: 'Berkembang',
    progress: 70,
    teacherNote: '',
    proofPhoto: '',
    proofVideo: '',
    proofDoc: ''
  });

  const activeSubject = subjectList.find(s => s.id === selectedSubjectId) || subjectList[0] || { id: 'mtk', name: 'Mapel', teacher: 'Guru', avatar: '', progress: 0, status: 'Mahir' };
  const activeCps = cpList[selectedSubjectId] || INITIAL_CP_DATA[selectedSubjectId] || [];

  const handleStatusChange = (cpId, newStatus, newProgress) => {
    setCpList(prev => {
      const updatedList = { ...prev };
      if (!updatedList[selectedSubjectId]) updatedList[selectedSubjectId] = [];
      const itemIndex = updatedList[selectedSubjectId].findIndex(c => c.id === cpId);
      if (itemIndex > -1) {
        updatedList[selectedSubjectId][itemIndex] = {
          ...updatedList[selectedSubjectId][itemIndex],
          status: newStatus,
          progress: newProgress
        };
      }
      return updatedList;
    });

    if (newStatus === 'Sangat Mahir' || newStatus === 'Mahir') {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleOpenAddModal = () => {
    setEditingCp(null);
    const count = activeCps.length + 1;
    setFormData({
      code: `CP ${count}.1`,
      title: '',
      description: '',
      status: 'Berkembang',
      progress: 70,
      teacherNote: '',
      proofPhoto: '',
      proofVideo: '',
      proofDoc: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cp) => {
    setEditingCp(cp);
    setFormData({
      code: cp.code || 'CP 1.0',
      title: cp.title || '',
      description: cp.description || '',
      status: cp.status || 'Berkembang',
      progress: cp.progress || 70,
      teacherNote: cp.teacherNote || '',
      proofPhoto: cp.proofPhoto || '',
      proofVideo: cp.proofVideo || '',
      proofDoc: cp.proofDoc || ''
    });
    setShowModal(true);
  };

  const handleDeleteCp = (cpId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus Indikator Capaian Pembelajaran (CP) ini?')) {
      setCpList(prev => {
        const updated = { ...prev };
        updated[selectedSubjectId] = (updated[selectedSubjectId] || []).filter(c => c.id !== cpId);
        return updated;
      });
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Judul Capaian Pembelajaran wajib diisi!');
      return;
    }

    setCpList(prev => {
      const updated = { ...prev };
      const currentList = updated[selectedSubjectId] ? [...updated[selectedSubjectId]] : [];

      if (editingCp) {
        // Edit Mode
        const idx = currentList.findIndex(c => c.id === editingCp.id);
        if (idx > -1) {
          currentList[idx] = {
            ...currentList[idx],
            ...formData,
            date: new Date().toISOString().split('T')[0]
          };
        }
      } else {
        // Add Mode
        const newCp = {
          id: `cp-${Date.now()}`,
          ...formData,
          date: new Date().toISOString().split('T')[0]
        };
        currentList.push(newCp);
      }

      updated[selectedSubjectId] = currentList;
      return updated;
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 p-6 rounded-4xl text-slate-900 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Target className="w-3.5 h-3.5" /> Capaian Pembelajaran (CP) Kurikulum Merdeka
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Detail CP per Mata Pelajaran</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Kelola, edit indikator kompetensi dasar & upload bukti pembelajaran siswa.
          </p>
        </div>

        {/* Subject Dropdown Selector */}
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="px-4 py-2.5 bg-white text-slate-900 font-extrabold text-xs rounded-2xl border-2 border-slate-900/10 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
        >
          {subjectList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.teacher.split(' ')[0]})
            </option>
          ))}
        </select>
      </div>

      {/* Active Subject Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={activeSubject.avatar} alt={activeSubject.teacher} className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300" />
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{activeSubject.name}</h2>
            <p className="text-xs text-slate-500 font-medium">Pengampu: <span className="font-bold text-slate-700 dark:text-slate-300">{activeSubject.teacher}</span> | Kemajuan: <span className="font-extrabold text-emerald-600">{activeSubject.progress}%</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const phone = selectedStudent.parentPhone || "6281234567891";
              const msg = `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu ${selectedStudent.parentName},\n\nBerikut adalah Rekapitulasi Capaian Pembelajaran (CP) mata pelajaran *${activeSubject.name}* untuk ananda *${selectedStudent.name}*:\n\n📊 *PERSENTASE CP: ${activeSubject.progress}% (${activeSubject.status})*\n\nTerima kasih atas bimbingannya! 🌟\n-- Ustadz Iski (Kelas 5 SDQ - Madani Al washiyyah)`;
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5"
          >
            <span>📱 Kirim CP Mapel ini via WA</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md hover:brightness-105 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Tambah Indikator CP
          </button>
        </div>
      </div>

      {/* List of CP Items */}
      <div className="space-y-6">
        {activeCps.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2">
            <div className="text-3xl">📋</div>
            <h3 className="font-black text-slate-800 dark:text-slate-200">Belum Ada Indikator CP</h3>
            <p className="text-xs text-slate-500">Klik tombol "+ Tambah Indikator CP" untuk membuat Capaian Pembelajaran baru.</p>
            <button onClick={handleOpenAddModal} className="mt-2 px-4 py-2 bg-amber-500 text-white text-xs font-black rounded-xl">
              Tambah CP Sekarang
            </button>
          </GlassCard>
        ) : activeCps.map((cp) => (
          <GlassCard key={cp.id} className="space-y-4">

            {/* Title & Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300">
                    {cp.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(cp)}
                      className="p-1 text-slate-400 hover:text-sky-600 transition rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                      title="Edit Indikator CP ini"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCp(cp.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
                      title="Hapus Indikator CP ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                  {cp.title}
                </h3>
              </div>

              {/* Status Selector Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "Belum", prog: 15, color: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
                  { label: "Mulai Berkembang", prog: 40, color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
                  { label: "Berkembang", prog: 70, color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
                  { label: "Mahir", prog: 85, color: "bg-sky-100 text-sky-700 hover:bg-sky-200" },
                  { label: "Sangat Mahir", prog: 98, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" }
                ].map((st) => (
                  <button
                    key={st.label}
                    onClick={() => handleStatusChange(cp.id, st.label, st.prog)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition ${st.color} ${
                      cp.status === st.label ? 'ring-2 ring-slate-800 dark:ring-white scale-105 font-black' : 'opacity-70'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar Component */}
            <ProgressBar progress={cp.progress} status={cp.status} />

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {cp.description}
            </p>

            {/* Teacher Note */}
            {cp.teacherNote && (
              <div className="p-3 bg-amber-50/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200 dark:border-slate-700/60 text-xs">
                <p className="font-extrabold text-amber-800 dark:text-amber-300 mb-0.5">Catatan Masukan Guru:</p>
                <p className="text-slate-700 dark:text-slate-200 italic">"{cp.teacherNote}"</p>
              </div>
            )}

            {/* Evidences Section (Bukti Foto, Video, Dokumen) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">

              {cp.proofPhoto && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-sky-500" /> Bukti Foto:
                  </span>
                  <a href={cp.proofPhoto} target="_blank" rel="noreferrer" className="text-sky-600 font-extrabold hover:underline">
                    Lihat Foto →
                  </a>
                </div>
              )}

              {cp.proofVideo && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Video className="w-4 h-4 text-rose-500" /> Bukti Video:
                  </span>
                  <a href={cp.proofVideo} target="_blank" rel="noreferrer" className="text-rose-600 font-extrabold hover:underline">
                    Putar Video →
                  </a>
                </div>
              )}

              {cp.proofDoc && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-500" /> Dokumen:
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                    {cp.proofDoc}
                  </span>
                </div>
              )}

              <div className="ml-auto text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Diperbarui: {cp.date}
              </div>
            </div>

          </GlassCard>
        ))}
      </div>

      {/* Modal Tambah / Edit CP */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-4xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                {editingCp ? 'Edit Capaian Pembelajaran' : 'Tambah CP Baru'} ({activeSubject.name})
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode CP</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Contoh: CP 1.3"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Awal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const st = e.target.value;
                      const progMap = { 'Belum': 15, 'Mulai Berkembang': 40, 'Berkembang': 70, 'Mahir': 85, 'Sangat Mahir': 98 };
                      setFormData({ ...formData, status: st, progress: progMap[st] || 70 });
                    }}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  >
                    <option value="Belum">Belum (15%)</option>
                    <option value="Mulai Berkembang">Mulai Berkembang (40%)</option>
                    <option value="Berkembang">Berkembang (70%)</option>
                    <option value="Mahir">Mahir (85%)</option>
                    <option value="Sangat Mahir">Sangat Mahir (98%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Pokok Kompetensi CP</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Misal: Operasi Perkalian & Pembagian Desimal"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Indikator Capaian</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan indikator yang harus dicapai siswa..."
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Guru (Opsional)</label>
                <textarea
                  rows="2"
                  value={formData.teacherNote}
                  onChange={(e) => setFormData({ ...formData, teacherNote: e.target.value })}
                  placeholder="Catatan perkembangan atau saran untuk orang tua..."
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="font-black text-slate-700 dark:text-slate-300">Link Bukti Belajar (Opsional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.proofPhoto}
                    onChange={(e) => setFormData({ ...formData, proofPhoto: e.target.value })}
                    placeholder="URL Foto Bukti (https://...)"
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    value={formData.proofVideo}
                    onChange={(e) => setFormData({ ...formData, proofVideo: e.target.value })}
                    placeholder="URL Video Bukti (https://...)"
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px]"
                  />
                </div>
                <input
                  type="text"
                  value={formData.proofDoc}
                  onChange={(e) => setFormData({ ...formData, proofDoc: e.target.value })}
                  placeholder="Nama Dokumen PDF (Contoh: Karangan_Siswa.pdf)"
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px]"
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Simpan CP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
