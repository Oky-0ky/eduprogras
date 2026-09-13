import React, { useState } from 'react';
import { INITIAL_DAILY_NOTES } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { BookOpenCheck, Sparkles, Plus, Calendar, User, Heart, Send } from 'lucide-react';

export default function DailyNotes() {
  const { selectedStudent } = useAuth();
  const [notes, setNotes] = useState(INITIAL_DAILY_NOTES);
  const [newCategory, setNewCategory] = useState('Sikap & Character Building');
  const [newContent, setNewContent] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const item = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      content: newContent,
      icon: '🌟',
      teacher: selectedStudent.homeroomTeacher
    };
    setNotes([item, ...notes]);
    setNewContent('');
  };

  const generateAINote = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const suggestions = [
        `Hari ini ananda ${selectedStudent.name} sangat aktif berdiskusi dan mampu memimpin kelompok sains dengan penuh rasa tanggung jawab.`,
        `Ananda ${selectedStudent.name} menunjukkan perkembangan luar biasa pada konsentrasi belajar dan sikap saling menghargai sesama teman sekelas.`,
        `Perkembangan kemandirian ${selectedStudent.name} sangat baik! Sudah mampu menyelesaikan tugas tanpa bimbingan berlebih.`
      ];
      const randomNote = suggestions[Math.floor(Math.random() * suggestions.length)];
      setNewContent(randomNote);
      setIsGeneratingAI(false);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <BookOpenCheck className="w-3.5 h-3.5" /> Catatan Perkembangan Harian
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Catatan Guru & Asisten AI</h1>
          <p className="text-xs sm:text-sm text-indigo-100">
            Jurnal perkembangan harian perilaku, sikap sosial, dan pencapaian karakter peserta didik.
          </p>
        </div>
      </div>

      {/* Form Input Catatan Baru dengan AI Assist */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" /> Tulis Catatan Perkembangan Baru
          </h3>
          <button
            onClick={generateAINote}
            disabled={isGeneratingAI}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 font-extrabold text-xs rounded-2xl shadow hover:brightness-105 transition flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAI ? 'Generasi AI...' : 'Bantu Tulis dengan AI ✨'}</span>
          </button>
        </div>

        <form onSubmit={handleAddNote} className="space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1">Kategori Perkembangan</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold"
            >
              <option value="Sikap & Gotong Royong">Sikap & Gotong Royong</option>
              <option value="Kemandirian & Disiplin">Kemandirian & Disiplin</option>
              <option value="Kreativitas & Nalar Kritis">Kreativitas & Nalar Kritis</option>
              <option value="Tahfidz & Akhlak">Tahfidz & Akhlak</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Isi Catatan Perkembangan</label>
            <textarea
              rows="3"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Contoh: Hari ini ananda aktif berdiskusi dan mampu menyelesaikan soal secara mandiri..."
              className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Simpan Catatan
            </button>
          </div>
        </form>
      </GlassCard>

      {/* List Daily Notes */}
      <div className="space-y-4">
        {notes.map((note) => (
          <GlassCard key={note.id} className="space-y-2 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold px-3 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200">
                {note.category}
              </span>
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {note.date}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic pt-1">
              "{note.content}"
            </p>

            <div className="text-right text-[10px] text-slate-400 font-extrabold pt-1">
              — Ditulis oleh: {note.teacher}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
