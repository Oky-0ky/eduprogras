import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { Trophy, Plus, Pencil, Trash2, X, Save, User } from 'lucide-react';

const CATEGORIES = ['Sains', 'Tahfidz', 'Disiplin', 'Festival Seni', 'Pramuka', 'Akademik', 'Olahraga', 'Apresiasi'];
const ICON_OPTIONS = ['🏆', '🥇', '🥈', '🥉', '📖', '⭐', '🎨', '⛺', '🌟', '🎯', '⚽', '🎤'];
const BADGE_COLORS = [
  { label: 'Emas', value: 'from-amber-400 to-yellow-500' },
  { label: 'Hijau', value: 'from-emerald-400 to-teal-500' },
  { label: 'Biru', value: 'from-sky-400 to-blue-500' },
  { label: 'Pink', value: 'from-pink-400 to-rose-500' },
  { label: 'Ungu', value: 'from-purple-400 to-indigo-500' },
  { label: 'Oranye', value: 'from-orange-400 to-red-500' }
];

const EMPTY_FORM = {
  title: '',
  category: 'Sains',
  year: new Date().getFullYear().toString(),
  icon: '🏆',
  badgeColor: 'from-amber-400 to-yellow-500',
  description: ''
};

export default function Achievement() {
  const { selectedStudent, achievements, setAchievements } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const studentAchievements = achievements.filter((item) => item.studentId === selectedStudent.id);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, year: new Date().getFullYear().toString() });
    setShowForm(true);
  };

  const openEditForm = (ach) => {
    setEditingId(ach.id);
    setForm({
      title: ach.title,
      category: ach.category,
      year: ach.year,
      icon: ach.icon,
      badgeColor: ach.badgeColor,
      description: ach.description
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingId) {
      setAchievements((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...form, title: form.title.trim() } : item
        )
      );
    } else {
      setAchievements((prev) => [
        {
          id: `ach-${selectedStudent.id}-${Date.now()}`,
          studentId: selectedStudent.id,
          ...form,
          title: form.title.trim()
        },
        ...prev
      ]);
    }
    closeForm();
  };

  const handleDelete = (id) => {
    setAchievements((prev) => prev.filter((item) => item.id !== id));
    setConfirmDelete(null);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-6 rounded-4xl text-slate-900 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Trophy className="w-3.5 h-3.5" /> Ruang Penghargaan & Prestasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Prestasi & Rekam Jejak Siswa</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Kelola prestasi <strong>{selectedStudent.name}</strong> — perubahan otomatis tersinkron ke Total Prestasi di Beranda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl text-center">
            <p className="text-2xl font-black">{studentAchievements.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider">Total Prestasi</p>
          </div>
          <button
            onClick={openAddForm}
            className="px-4 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Prestasi
          </button>
        </div>
      </div>

      {/* Student info */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-10 h-10 rounded-full object-cover border-2 border-amber-300" />
        <div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{selectedStudent.name}</p>
          <p className="text-xs text-slate-500">{selectedStudent.className} • NISN {selectedStudent.nisn}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-xl border border-amber-200 dark:border-amber-800">
          <User className="w-3 h-3" /> Ganti siswa via menu atas
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {editingId ? 'Edit Prestasi' : 'Tambah Prestasi Baru'}
              </h3>
              <button onClick={closeForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Judul Prestasi *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Contoh: Juara 1 Lomba Sains Tingkat Kota"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tahun</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => updateField('year', e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Ikon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => updateField('icon', icon)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                        form.icon === icon
                          ? 'bg-amber-200 dark:bg-amber-900 ring-2 ring-amber-500'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Warna Badge</label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateField('badgeColor', color.value)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black text-white bg-gradient-to-r ${color.value} transition ${
                        form.badgeColor === color.value ? 'ring-2 ring-offset-2 ring-amber-500' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Deskripsi</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Ceritakan singkat tentang prestasi ini..."
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-2xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {editingId ? 'Simpan Perubahan' : 'Tambah Prestasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Prestasi?</h3>
            <p className="text-xs text-slate-500">
              Prestasi <strong>"{confirmDelete.title}"</strong> akan dihapus. Total Prestasi di Beranda akan otomatis berkurang.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-2xl">
                Batal
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-2xl">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Achievements */}
      {studentAchievements.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
          <div className="text-5xl">🏆</div>
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">Belum Ada Prestasi</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Klik <strong>"Tambah Prestasi"</strong> untuk mencatat penghargaan ananda {selectedStudent.name.split(' ')[0]}.
          </p>
          <button onClick={openAddForm} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl shadow transition">
            <Plus className="w-4 h-4" /> Tambah Prestasi Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentAchievements.map((ach) => (
            <GlassCard key={ach.id} className="relative overflow-hidden space-y-4 group">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => openEditForm(ach)}
                  className="p-1.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition shadow"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(ach)}
                  className="p-1.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition shadow"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${ach.badgeColor} text-white flex items-center justify-center text-3xl shadow-lg`}>
                {ach.icon}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {ach.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{ach.year}</span>
                </div>

                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-2">{ach.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 font-bold">
        🔄 Total <strong>{studentAchievements.length} prestasi</strong> untuk {selectedStudent.name} tersinkron otomatis ke kartu <strong>Total Prestasi</strong> di menu Beranda.
      </div>
    </div>
  );
}
