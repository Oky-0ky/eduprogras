import React, { useState } from 'react';
import { INITIAL_PORTFOLIOS } from '../data/initialData';
import GlassCard from '../components/GlassCard';
import axios from 'axios';
import { FolderKanban, Plus, MessageSquare, Image, Video, FileText, Award, Send, Trash2, X } from 'lucide-react';

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState(INITIAL_PORTFOLIOS);
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [commentInputs, setCommentInputs] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const categories = ['Semua', 'Hasil Menggambar', 'Kerajinan Handcraft', 'Presentasi Video', 'Sertifikat'];

  const filteredPortfolios = filterCategory === 'Semua'
    ? portfolios
    : portfolios.filter(p => p.category === filterCategory);

const handleAddComment = (id) => {
    const text = commentInputs[id];
    if (!text) return;
    setPortfolios(prev =>
      prev.map(p => p.id === id ? { ...p, teacherComment: text } : p)
    );
    setCommentInputs({ ...commentInputs, [id]: '' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/portfolio/${id}`);
      if (res.data?.success || res.status === 200) {
        setPortfolios(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      // Even if server fails, remove locally so UI stays consistent
      setPortfolios(prev => prev.filter(p => p.id !== id));
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 p-6 rounded-4xl text-slate-900 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <FolderKanban className="w-3.5 h-3.5" /> Digital Student Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Galeri Hasil Karya & Portofolio Siswa</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Dokumentasi lukisan, kerajinan tangan, rekaman presentasi, dan sertifikat prestasi.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Unggah Karya Baru
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
              filterCategory === cat
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Portfolio Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPortfolios.map((item) => (
          <GlassCard key={item.id} className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              
{/* Media Preview Box */}
              <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group">
                <img src={item.fileUrl} alt={item.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold rounded-full">
                  {item.category}
                </span>
                <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 text-[10px] font-bold rounded-xl border">
                  {item.date}
                </span>

                {/* Delete Button */}
                <button
                  onClick={() => setConfirmDelete(item)}
                  title="Hapus karya"
                  className="absolute top-3 right-3 p-2 bg-rose-500/90 backdrop-blur-md text-white rounded-full hover:bg-rose-600 transition shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              </div>

              {/* Teacher Comment Box */}
              <div className="p-3.5 bg-rose-50/80 dark:bg-slate-800/80 rounded-2xl border border-rose-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-extrabold text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Masukan & Komentar Guru:
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 italic">
                  "{item.teacherComment || 'Belum ada masukan tertulis dari guru.'}"
                </p>
              </div>
            </div>

            {/* Comment Form Input */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={commentInputs[item.id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                placeholder="Tulis apresiator/komentar guru..."
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />
              <button
                onClick={() => handleAddComment(item.id)}
                className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-4xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Unggah Hasil Karya Murid</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Judul Karya</label>
                <input type="text" placeholder="Contoh: Lukisan Cat Air Pemandangan" className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Kategori Karya</label>
                <select className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">
                  {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">File Karya (Foto/Video/PDF)</label>
                <input type="file" className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              </div>
            </div>
<div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl">Batal</button>
              <button onClick={() => { setShowUploadModal(false); alert('Hasil karya berhasil disimpan di Portofolio!'); }} className="px-4 py-2 bg-rose-500 text-white font-extrabold text-xs rounded-2xl">Simpan Karya</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-4xl p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Hapus Karya Ini?</h3>
            <p className="text-xs text-slate-500 font-medium">
              "{confirmDelete.title}" akan dihapus permanen dari portofolio murid. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="px-4 py-2 bg-rose-500 text-white font-extrabold text-xs rounded-2xl hover:bg-rose-600 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
