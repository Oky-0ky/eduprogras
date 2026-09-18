import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ClipboardList, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_SUBJECTS } from '../data/initialData';
import { getState } from '../utils/syncStore';

export default function ParentTaskReport({
  student,
  tasks: directTasks = null,
  legacyTasks = null,
  selectedSubjects = null
}) {
  const { grades } = useAuth();

  // Inisialisasi state: gunakan tasks langsung / legacy jika ada, atau ambil dari cache lokal (0ms)
  const [tasks, setTasks] = useState(() => {
    if (Array.isArray(directTasks) && directTasks.length > 0) return directTasks;
    if (Array.isArray(legacyTasks) && legacyTasks.length > 0) return legacyTasks;
    if (typeof window !== 'undefined' && student?.id) {
      try {
        const cached = JSON.parse(localStorage.getItem(`taskReport_${student.id}`) || 'null');
        if (cached?.tasks && Array.isArray(cached.tasks) && cached.tasks.length > 0) {
          if (selectedSubjects && selectedSubjects.length > 0) {
            return cached.tasks.filter(t => selectedSubjects.includes(t.subId));
          }
          return cached.tasks;
        }
      } catch (_) {}
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    if (Array.isArray(directTasks) && directTasks.length > 0) return false;
    if (Array.isArray(legacyTasks) && legacyTasks.length > 0) return false;
    return tasks.length === 0;
  });

  useEffect(() => {
    if (Array.isArray(directTasks) && directTasks.length > 0) {
      setTasks(directTasks);
      setLoading(false);
      return;
    }
    if (Array.isArray(legacyTasks) && legacyTasks.length > 0) {
      setTasks(legacyTasks);
      setLoading(false);
      return;
    }

    if (!student?.id) return;
    let cancelled = false;

    const fetchTasks = async () => {
      try {
        // 1. Ambil snapshot laporan tugas dari database cloud sync
        const snapshot = await getState(`taskReport_${student.id}`);
        if (cancelled) return;

        if (snapshot?.tasks && Array.isArray(snapshot.tasks) && snapshot.tasks.length > 0) {
          let list = snapshot.tasks;
          if (selectedSubjects && selectedSubjects.length > 0) {
            list = list.filter(t => selectedSubjects.includes(t.subId));
          }
          setTasks(list);
          setLoading(false);
          return;
        }

        // 2. Fallback: ambil data grades dari context atau database
        let currentGrades = (grades && grades[student.id]) ? grades : null;
        if (!currentGrades) {
          const serverGrades = await getState('eduprogress_grades');
          if (cancelled) return;
          if (serverGrades && typeof serverGrades === 'object') {
            currentGrades = serverGrades;
          }
        }

        if (currentGrades && currentGrades[student.id]) {
          const list = [];
          INITIAL_SUBJECTS.forEach(sub => {
            if (selectedSubjects && selectedSubjects.length > 0 && !selectedSubjects.includes(sub.id)) {
              return;
            }
            const d = currentGrades[student.id]?.[sub.id] || { tugas: [], ulangan: [] };
            (d.tugas || []).forEach(t => list.push({
              ...t, subId: sub.id, subName: sub.name, type: 'Tugas',
              status: Number(t.score) === 0 ? 'missing' : (t.status || 'submitted')
            }));
            (d.ulangan || []).forEach(u => list.push({
              ...u, subId: sub.id, subName: sub.name, type: 'Ulangan Harian',
              status: Number(u.score) === 0 ? 'missing' : (u.status || 'submitted')
            }));
          });
          setTasks(list);
        }
      } catch (e) {
        console.warn('Gagal memuat tugas:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTasks();
    return () => { cancelled = true; };
  }, [student?.id, directTasks, legacyTasks, selectedSubjects, grades]);

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
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <ClipboardList className="w-4 h-4" /> Laporan Tugas Anak
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Laporan Pengumpulan Tugas</h1>
          <p className="text-sm text-white/90 mt-1">{student.name} · {student.className}</p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Total Tugas', tasks.length, 'bg-sky-100 text-sky-700'],
            ['Sudah Mengumpulkan', submitted.length, 'bg-emerald-100 text-emerald-700'],
            ['Belum Mengumpulkan', missing.length, 'bg-rose-100 text-rose-700'],
            ['Rata-rata Nilai', average, 'bg-amber-100 text-amber-700']
          ].map(([label, value, color]) => (
            <div key={label} className={`rounded-2xl p-4 ${color}`}>
              <p className="text-[10px] font-black uppercase">{label}</p>
              <p className="text-2xl font-black mt-1">
                {loading && tasks.length === 0 ? '...' : value}
              </p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-3xl shadow-lg p-4 sm:p-6">
          <h2 className="font-black text-lg text-slate-800 mb-4">Rincian Tugas</h2>

          {loading && tasks.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Memuat rincian tugas ananda...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-black text-slate-700">Belum Ada Tugas yang Dilaporkan</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Belum ada data tugas yang tercatat untuk ditampilkan pada laporan ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-3">Tugas</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b border-slate-100">
                      <td className="p-3 font-bold text-slate-800">{task.title}</td>
                      <td className="p-3 text-slate-600">{task.subName}</td>
                      <td className="p-3 text-slate-500">{task.date}</td>
                      <td className="p-3 text-center">
                        {!isSubmitted(task) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold">
                            <AlertCircle className="w-3 h-3" /> Belum Mengumpulkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Mengumpulkan
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-black text-slate-800">
                        {!isSubmitted(task) ? '-' : task.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-500">
          Laporan ini dibagikan oleh {student.homeroomTeacher || 'Wali Kelas'}.
        </p>
      </div>
    </div>
  );
}
