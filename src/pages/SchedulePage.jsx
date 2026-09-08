import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { DEFAULT_SCHEDULE } from '../data/initialData';
import {
  Calendar, Clock, BookOpen, UserCheck, Sparkles, X, CheckCircle, Info, HelpCircle,
  Plus, Edit2, Trash2, Save, Check, RotateCcw, PenLine
} from 'lucide-react';

// All available mata pelajaran options for the dropdown
const MAPEL_OPTIONS = [
  '-', 'Tahfidz', 'Tahfidz-Tahsin', 'Matematika', 'B. Indonesia', 'IPAS', 'PJOK',
  'B. Inggris', 'B. Arab', 'Seni Rupa', 'TIK', 'PAI Nasional', 'PAI Lokal', 'Pancasila',
  'Kedatangan', 'Shalat Dhuha', 'Jam Istirahat 1', 'Jam Istirahat 2', 'Kepulangan'
];

export default function SchedulePage() {
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(null);
  const { tpData, setTpData, scheduleData, setScheduleData } = useAuth();

  // Form states for manual UI editing of Bab and TP
  const [showAddBab, setShowAddBab] = useState(false);
  const [newBabTitle, setNewBabTitle] = useState('');

  const [addingTpChapIndex, setAddingTpChapIndex] = useState(null);
  const [newTpText, setNewTpText] = useState('');

  const [editingChapIndex, setEditingChapIndex] = useState(null);
  const [editBabTitle, setEditBabTitle] = useState('');

  const [editingTpPos, setEditingTpPos] = useState(null); // { chapIdx, tpIdx }
  const [editTpText, setEditTpText] = useState('');

  // State for inline cell editing in schedule table
  const [editingCell, setEditingCell] = useState(null); // { rowNo, day }
  const [cellEditValue, setCellEditValue] = useState('');
  const [editMode, setEditMode] = useState(false); // Toggle edit mode for schedule

  const timeSlots = scheduleData?.timeSlots || DEFAULT_SCHEDULE.timeSlots;
  const teacherMapping = scheduleData?.teacherMapping || DEFAULT_SCHEDULE.teacherMapping;

  const getSubjectColor = (name) => {
    if (!name || name === '-') return 'bg-slate-100 dark:bg-slate-800 text-slate-400';
    if (name.includes('Kedatangan') || name.includes('Shalat') || name.includes('Kepulangan')) return 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold';
    if (name.includes('Istirahat')) return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold';
    if (name.includes('Tahfidz')) return 'bg-yellow-200/80 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 font-extrabold';
    if (name.includes('Pancasila')) return 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 font-black ring-2 ring-orange-300';
    if (name.includes('Matematika')) return 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black';
    if (name.includes('B. Indonesia')) return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-black';
    if (name.includes('PJOK')) return 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-black';
    if (name.includes('TIK')) return 'bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 font-black';
    if (name.includes('PAI')) return 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-black';
    if (name.includes('B. Arab')) return 'bg-amber-200/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-black';
    if (name.includes('B. Inggris')) return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-black';
    if (name.includes('IPAS')) return 'bg-lime-100 dark:bg-lime-950/80 text-lime-900 dark:text-lime-200 font-black';
    if (name.includes('Seni Rupa')) return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-black';
    return 'bg-sky-50 dark:bg-slate-800 text-slate-700 font-bold';
  };

  const handleCellClick = (subjName) => {
    if (editMode) return; // In edit mode, cell clicks are for editing, not TP modal
    if (!subjName || subjName === '-' || subjName.includes('Kedatangan') || subjName.includes('Shalat') || subjName.includes('Istirahat') || subjName.includes('Kepulangan')) {
      return;
    }
    let key = subjName;
    if (subjName.includes('Pancasila')) key = 'Pancasila';
    else if (subjName.includes('Matematika')) key = 'Matematika';
    else if (subjName.includes('B. Indonesia')) key = 'B. Indonesia';
    else if (subjName.includes('PJOK')) key = 'PJOK';
    else if (subjName.includes('TIK')) key = 'TIK';
    else if (subjName.includes('PAI Lokal')) key = 'PAI Lokal';
    else if (subjName.includes('PAI')) key = 'PAI Nasional';
    else if (subjName.includes('B. Arab')) key = 'B. Arab';
    else if (subjName.includes('B. Inggris')) key = 'B. Inggris';
    else if (subjName.includes('IPAS')) key = 'IPAS';
    else if (subjName.includes('Seni Rupa')) key = 'Seni Rupa';

    setSelectedSubjectKey(key);
    setShowAddBab(false);
    setNewBabTitle('');
    setAddingTpChapIndex(null);
    setNewTpText('');
    setEditingChapIndex(null);
    setEditingTpPos(null);
  };

  // --- SCHEDULE CELL EDIT HANDLERS ---
  const startCellEdit = (rowNo, day, currentValue) => {
    setEditingCell({ rowNo, day });
    setCellEditValue(currentValue || '-');
  };

  const saveCellEdit = () => {
    if (!editingCell) return;
    const { rowNo, day } = editingCell;
    const updatedSlots = timeSlots.map(slot =>
      slot.no === rowNo ? { ...slot, [day]: cellEditValue } : slot
    );
    setScheduleData({ ...scheduleData, timeSlots: updatedSlots });
    setEditingCell(null);
    setCellEditValue('');
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellEditValue('');
  };

  const resetSchedule = () => {
    if (window.confirm('Reset jadwal ke jadwal awal? Semua perubahan jadwal akan hilang.')) {
      setScheduleData(DEFAULT_SCHEDULE);
    }
  };

  const activeTp = selectedSubjectKey ? (tpData[selectedSubjectKey] || { subject: selectedSubjectKey, teacher: 'Guru Pengampu', chapters: [] }) : null;

  // --- MANUAL TP & BAB UI HANDLERS ---
  const handleSaveNewBab = () => {
    if (!newBabTitle.trim() || !selectedSubjectKey) return;
    const currentSubj = tpData[selectedSubjectKey] || { subject: selectedSubjectKey, teacher: 'Guru Pengampu', chapters: [] };
    const nextChapters = [...(currentSubj.chapters || []), { chapter: newBabTitle.trim(), tps: [] }];
    
    setTpData({
      ...tpData,
      [selectedSubjectKey]: { ...currentSubj, chapters: nextChapters }
    });
    setNewBabTitle('');
    setShowAddBab(false);
  };

  const handleSaveEditBab = (chapIdx) => {
    if (!editBabTitle.trim() || !selectedSubjectKey) return;
    const currentSubj = tpData[selectedSubjectKey];
    const nextChapters = [...(currentSubj.chapters || [])];
    nextChapters[chapIdx] = { ...nextChapters[chapIdx], chapter: editBabTitle.trim() };

    setTpData({
      ...tpData,
      [selectedSubjectKey]: { ...currentSubj, chapters: nextChapters }
    });
    setEditingChapIndex(null);
    setEditBabTitle('');
  };

  const handleDeleteBab = (chapIdx) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Bab ini beserta seluruh TP di dalamnya?')) return;
    const currentSubj = tpData[selectedSubjectKey];
    const nextChapters = currentSubj.chapters.filter((_, i) => i !== chapIdx);

    setTpData({
      ...tpData,
      [selectedSubjectKey]: { ...currentSubj, chapters: nextChapters }
    });
  };

  const handleSaveNewTp = (chapIdx) => {
    if (!newTpText.trim() || !selectedSubjectKey) return;
    const currentSubj = tpData[selectedSubjectKey];
    const nextChapters = [...(currentSubj.chapters || [])];
    const currentTps = nextChapters[chapIdx].tps || [];
    
    let formattedTp = newTpText.trim();
    if (!/^\d+\./.test(formattedTp)) {
      formattedTp = `${currentTps.length + 1}. ${formattedTp}`;
    }

    nextChapters[chapIdx] = {
      ...nextChapters[chapIdx],
      tps: [...currentTps, formattedTp]
    };

    setTpData({
      ...tpData,
      [selectedSubjectKey]: { ...currentSubj, chapters: nextChapters }
    });
    setNewTpText('');
    setAddingTpChapIndex(null);
  };

  const handleSaveEditTp = (chapIdx, tpIdx) => {
    if (!editTpText.trim() || !selectedSubjectKey) return;
    const currentSubj = tpData[selectedSubjectKey];
    const nextChapters = [...(currentSubj.chapters || [])];
    const nextTps = [...(nextChapters[chapIdx].tps || [])];
    
    nextTps[tpIdx] = editTpText.trim();
    nextChapters[chapIdx] = { ...nextChapters[chapIdx], tps: nextTps };

    setTpData({
      ...tpData,
      [selectedSubjectKey]: { ...currentSubj, chapters: nextChapters }
    });
    setEditingTpPos(null);
    setEditTpText('');
  };

  const handleDeleteTp = (chapIdx, tpIdx) => {
    if (!window.confirm('Hapus Tujuan Pembelajaran (TP) ini?')) return;
    const currentSubj = tpData[selectedSubjectKey];
    const nextChapters = [...(currentSubj.chapters || [])];
    const nextTps = nextChapters[chapIdx].tps.filter((_, i) => i !== tpIdx);

    nextChapters[chapIdx] = { ...nextChapters[chapIdx], tps: nextTps };

    setTpData({
      ...tpData,
      [selectedSubjectKey]: { ...currentSubj, chapters: nextChapters }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 p-6 rounded-4xl text-slate-900 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Calendar className="w-3.5 h-3.5" /> Tahun Ajaran 2026/2027
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Jadwal Pelajaran TA 26/27</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Konversi 1 JP = 35 Menit | Total JP per Minggu: <span className="font-black bg-white px-2 py-0.5 rounded-full text-slate-900">45 JP</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Toggle Edit Mode Button */}
          <button
            onClick={() => { setEditMode(!editMode); setEditingCell(null); }}
            className={`px-4 py-2.5 font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 border ${
              editMode
                ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-300'
                : 'bg-white/40 hover:bg-white/60 text-slate-900 border-white/40'
            }`}
          >
            <PenLine className="w-4 h-4" />
            {editMode ? '✏️ Mode Edit AKTIF — Klik Sel untuk Ubah' : '✏️ Edit Jadwal'}
          </button>

          {editMode && (
            <button
              onClick={resetSchedule}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 border border-rose-400"
            >
              <RotateCcw className="w-4 h-4" /> Reset Jadwal
            </button>
          )}

          {!editMode && (
            <div className="p-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 text-xs font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-700 shrink-0" />
              <span>Klik Mata Pelajaran untuk melihat & mengedit TP per Bab</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Mode Info Banner */}
      {editMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <p className="font-black text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <PenLine className="w-4 h-4" /> Mode Edit Jadwal Aktif
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-0.5">
              Klik sel mana pun di tabel jadwal untuk mengubah mata pelajaran. Pilih dari daftar atau ketik sendiri. Perubahan tersimpan otomatis.
            </p>
          </div>
          <button
            onClick={() => { setEditMode(false); setEditingCell(null); }}
            className="px-4 py-2 bg-amber-500 text-white font-extrabold text-xs rounded-xl shrink-0 hover:bg-amber-600 transition"
          >
            Selesai Edit
          </button>
        </div>
      )}

      {/* Schedule Table */}
      <GlassCard className="p-4 sm:p-6 overflow-x-auto space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-500" /> Tabel Jadwal Pelajaran Mingguan
          </h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            editMode
              ? 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200'
              : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-200'
          }`}>
            {editMode ? '✏️ Mode Edit — Klik Sel untuk Ubah Mapel' : '💡 Klik Mapel untuk Lihat / Tambah TP Bab'}
          </span>
        </div>

        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold">
              <th className="p-2.5 border">No</th>
              <th className="p-2.5 border">Waktu</th>
              <th className="p-2.5 border">Durasi</th>
              <th className="p-2.5 border">Senin</th>
              <th className="p-2.5 border">Selasa</th>
              <th className="p-2.5 border">Rabu</th>
              <th className="p-2.5 border">Kamis</th>
              <th className="p-2.5 border bg-emerald-50 dark:bg-emerald-950/40">Jumat</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium">
            {timeSlots.map((row) => (
              <tr key={row.no} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition">
                <td className="p-2 border font-bold text-slate-400">{row.no}</td>
                <td className="p-2 border font-mono font-bold">{row.time}</td>
                <td className="p-2 border text-slate-500 font-bold">{row.dur}</td>

                {['senin', 'selasa', 'rabu', 'kamis', 'jumat'].map((day) => {
                  const val = row[day];
                  const isEditingThis = editingCell?.rowNo === row.no && editingCell?.day === day;

                  if (editMode && isEditingThis) {
                    // Show inline edit cell
                    return (
                      <td key={day} className="p-1.5 border bg-amber-50 dark:bg-amber-950/40 min-w-[130px]">
                        <div className="space-y-1">
                          <select
                            autoFocus
                            value={MAPEL_OPTIONS.includes(cellEditValue) ? cellEditValue : '__custom__'}
                            onChange={(e) => {
                              if (e.target.value !== '__custom__') setCellEditValue(e.target.value);
                            }}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 rounded-xl text-xs font-bold focus:outline-none"
                          >
                            {MAPEL_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="__custom__">-- Ketik Sendiri --</option>
                          </select>
                          <input
                            type="text"
                            value={cellEditValue}
                            onChange={(e) => setCellEditValue(e.target.value)}
                            placeholder="atau ketik sendiri..."
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveCellEdit();
                              if (e.key === 'Escape') cancelCellEdit();
                            }}
                          />
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={saveCellEdit}
                              className="flex-1 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Simpan
                            </button>
                            <button
                              onClick={cancelCellEdit}
                              className="py-1 px-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  }

                  const isSubject = val && val !== '-' && !val.includes('Kedatangan') && !val.includes('Shalat') && !val.includes('Istirahat') && !val.includes('Kepulangan');
                  return (
                    <td
                      key={day}
                      onClick={() => {
                        if (editMode) {
                          startCellEdit(row.no, day, val);
                        } else {
                          handleCellClick(val);
                        }
                      }}
                      className={`p-2 border transition ${getSubjectColor(val)} ${
                        editMode
                          ? 'cursor-pointer hover:ring-2 hover:ring-amber-400 hover:shadow-md relative group'
                          : isSubject ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:z-10' : ''
                      }`}
                    >
                      <span className="truncate block max-w-[120px] mx-auto">{val}</span>
                      {editMode && (
                        <span className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition">
                          <PenLine className="w-2.5 h-2.5 text-amber-600" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Teacher Reference Card */}
      <GlassCard className="space-y-3">
        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-500" /> Daftar Pengampu Mata Pelajaran & Kitab PAI Lokal
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {teacherMapping.map((t, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border">
              <p className="font-extrabold text-slate-800 dark:text-slate-100">{t.name}</p>
              <p className="text-amber-600 font-bold text-[11px]">{t.role}</p>
              <p className="text-slate-500 text-[10px] mt-1">Pengampu: {t.mapel}</p>
            </div>
          ))}
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 text-xs text-amber-900 dark:text-amber-300 font-bold">
          📖 PAI Lokal: Semester 1 (Fiqih - Kitab Safinatunnaja) | Semester 2 (Hadits - 'Arbain Nawawi & Sirah - Khulasoh Nurul Yaqin)
        </div>
      </GlassCard>

      {/* Interactive Modal: Tujuan Pembelajaran (TP) per Bab + UI MANAGER */}
      {selectedSubjectKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 w-full max-w-2xl rounded-4xl p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedSubjectKey(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                  🎯 Tujuan Pembelajaran (TP) Kurikulum Merdeka
                </span>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {activeTp?.subject || selectedSubjectKey}
                </h2>
                <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  Pengampu: {activeTp?.teacher || 'Guru Pengampu'}
                </p>
              </div>

              {/* Button: Tambah Bab Baru */}
              <button
                onClick={() => setShowAddBab(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" /> Tambah Bab Baru
              </button>
            </div>

            {/* Inline Form: Tambah Bab Baru */}
            {showAddBab && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-300 space-y-2 animate-in fade-in">
                <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">➕ Tambah Bab Baru untuk {activeTp?.subject}:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Bab 3: Pengukuran dan Luas"
                    value={newBabTitle}
                    onChange={(e) => setNewBabTitle(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleSaveNewBab}
                    className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1 shadow hover:bg-emerald-700"
                  >
                    <Save className="w-3.5 h-3.5" /> Simpan
                  </button>
                  <button
                    onClick={() => setShowAddBab(false)}
                    className="px-3 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* TP Chapters List */}
            <div className="space-y-4 pt-1">
              {activeTp?.chapters && activeTp.chapters.length > 0 ? (
                activeTp.chapters.map((chap, chapIdx) => (
                  <div key={chapIdx} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                    
                    {/* Chapter Header + Edit/Delete Bab Buttons */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      {editingChapIndex === chapIdx ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editBabTitle}
                            onChange={(e) => setEditBabTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold"
                          />
                          <button
                            onClick={() => handleSaveEditBab(chapIdx)}
                            className="p-1.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingChapIndex(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-xl"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-500" /> {chap.chapter}
                        </h3>
                      )}

                      {/* Action Buttons for Chapter */}
                      {editingChapIndex !== chapIdx && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setAddingTpChapIndex(chapIdx);
                              setNewTpText('');
                            }}
                            className="px-2.5 py-1 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-xl text-[11px] font-extrabold hover:bg-sky-200 flex items-center gap-1 transition"
                            title="Tambah TP ke Bab ini"
                          >
                            <Plus className="w-3 h-3" /> Tambah TP
                          </button>
                          <button
                            onClick={() => {
                              setEditingChapIndex(chapIdx);
                              setEditBabTitle(chap.chapter);
                            }}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition"
                            title="Edit Judul Bab"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBab(chapIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Hapus Bab Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline Form: Tambah TP Baru ke Bab Ini */}
                    {addingTpChapIndex === chapIdx && (
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-300 space-y-2">
                        <p className="text-xs font-extrabold text-sky-800 dark:text-sky-300">➕ Tambah Tujuan Pembelajaran (TP) Baru:</p>
                        <textarea
                          rows="2"
                          placeholder="Tuliskan Tujuan Pembelajaran (cth: Peserta didik dapat menganalisis...)"
                          value={newTpText}
                          onChange={(e) => setNewTpText(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setAddingTpChapIndex(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveNewTp(chapIdx)}
                            className="px-4 py-1 bg-sky-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow hover:bg-sky-700"
                          >
                            <Save className="w-3.5 h-3.5" /> Simpan TP
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TP List Items */}
                    <div className="space-y-2">
                      {chap.tps && chap.tps.length > 0 ? (
                        chap.tps.map((tpText, tpIdx) => {
                          const isEditingThisTp = editingTpPos?.chapIdx === chapIdx && editingTpPos?.tpIdx === tpIdx;

                          if (isEditingThisTp) {
                            return (
                              <div key={tpIdx} className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 space-y-2">
                                <textarea
                                  rows="2"
                                  value={editTpText}
                                  onChange={(e) => setEditTpText(e.target.value)}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-medium"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setEditingTpPos(null)}
                                    className="px-3 py-1 bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditTp(chapIdx, tpIdx)}
                                    className="px-3 py-1 bg-amber-500 text-white text-[11px] font-extrabold rounded-xl shadow"
                                  >
                                    Simpan Perubahan
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={tpIdx} className="group flex items-start justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition">
                              <div className="flex items-start gap-2.5">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{tpText}</span>
                              </div>

                              {/* Edit / Delete TP Buttons */}
                              <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingTpPos({ chapIdx, tpIdx });
                                    setEditTpText(tpText);
                                  }}
                                  className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                  title="Edit TP Ini"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTp(chapIdx, tpIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus TP Ini"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-2xl border border-dashed">
                          Belum ada Tujuan Pembelajaran di Bab ini. Klik "+ Tambah TP" di atas!
                        </div>
                      )}
                    </div>

                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-bold space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed">
                  <p>Belum ada Bab dan Tujuan Pembelajaran (TP) untuk {activeTp?.subject || selectedSubjectKey}.</p>
                  <button
                    onClick={() => setShowAddBab(true)}
                    className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Tambah Bab Pertama Sekarang
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                💾 Seluruh perubahan Bab & TP otomatis tersimpan di memori aplikasi.
              </span>
              <button
                onClick={() => setSelectedSubjectKey(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-2xl hover:bg-slate-800 transition"
              >
                Selesai / Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
