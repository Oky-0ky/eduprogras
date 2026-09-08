import React from 'react';
import { CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react';

export default function ParentTaskReport({ student, tasks = [] }) {
  const isSubmitted = (task) => task.status !== 'missing' && Number(task.score) > 0;
  const submitted = tasks.filter(isSubmitted);
  const missing = tasks.filter(task => !isSubmitted(task));
  const average = submitted.length
    ? Math.round(submitted.reduce((sum, task) => sum + Number(task.score || 0), 0) / submitted.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <header className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase"><ClipboardList className="w-4 h-4" /> Laporan Tugas Anak</div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Laporan Pengumpulan Tugas</h1>
          <p className="text-sm text-white/90 mt-1">{student.name} · {student.className}</p>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Total Tugas', tasks.length, 'bg-sky-100 text-sky-700'],
            ['Sudah Mengumpulkan', submitted.length, 'bg-emerald-100 text-emerald-700'],
            ['Belum Mengumpulkan', missing.length, 'bg-rose-100 text-rose-700'],
            ['Rata-rata Nilai', average, 'bg-amber-100 text-amber-700']
          ].map(([label, value, color]) => <div key={label} className={`rounded-2xl p-4 ${color}`}><p className="text-[10px] font-black uppercase">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>)}
        </div>
        <section className="bg-white rounded-3xl shadow-lg p-4 sm:p-6">
          <h2 className="font-black text-lg text-slate-800 mb-4">Rincian Tugas</h2>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-100 text-left"><th className="p-3">Tugas</th><th className="p-3">Mata Pelajaran</th><th className="p-3">Tanggal</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Nilai</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id} className="border-b border-slate-100"><td className="p-3 font-bold">{task.title}</td><td className="p-3">{task.subName}</td><td className="p-3">{task.date}</td><td className="p-3 text-center">{!isSubmitted(task) ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-1 text-xs font-bold"><AlertCircle className="w-3 h-3" /> Belum Mengumpulkan</span> : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> Sudah Mengumpulkan</span>}</td><td className="p-3 text-center font-black">{!isSubmitted(task) ? '-' : task.score}</td></tr>)}</tbody></table></div>
        </section>
        <p className="text-center text-xs text-slate-500">Laporan ini dibagikan oleh {student.homeroomTeacher || 'Wali Kelas'}.</p>
      </div>
    </div>
  );
}
