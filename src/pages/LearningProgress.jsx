import React from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, User, ArrowRight, Award } from 'lucide-react';

export default function LearningProgress() {
  const navigate = useNavigate();
  const { tpData, scheduleData } = useAuth();

  const subjectList = Object.entries(tpData || {}).map(([id, item]) => ({
    id,
    name: item?.subject || id,
    teacher: item?.teacher || 'Guru Pengampu',
    avatar: scheduleData?.teacherMapping?.find((teacher) => teacher.name === item?.teacher)?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    badge: '📘 Mapel',
    progress: Math.min(100, Math.max(0, Math.round(((item?.chapters?.length || 1) / 4) * 100))),
    status: 'Mahir'
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" /> Kurikulum Merdeka (12 Mata Pelajaran)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Halaman Perkembangan Belajar</h1>
          <p className="text-xs sm:text-sm text-emerald-50">
            Monitoring kemajuan belajar peserta didik di seluruh mata pelajaran pokok dan muatan lokal.
          </p>
        </div>
      </div>

      {/* 12 Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjectList.map((sub) => (
          <GlassCard key={sub.id} className="flex flex-col justify-between space-y-4">
            <div>
              {/* Header Mapel & Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {sub.badge}
                  </span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2">{sub.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-500 flex items-center justify-center font-bold text-lg">
                  📚
                </div>
              </div>

              {/* Teacher Info */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-4">
                <img src={sub.avatar} alt={sub.teacher} className="w-9 h-9 rounded-full object-cover border-2 border-sky-300" />
                <div className="truncate">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Pengampu Mapel</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{sub.teacher}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <ProgressBar progress={sub.progress} status={sub.status} />
            </div>

            {/* Action Button to CP details */}
            <button
              onClick={() => navigate(`/learning-outcomes?subject=${sub.id}`)}
              className="w-full py-2.5 px-4 bg-sky-50 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-300 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 group"
            >
              <span>Detail Capaian Pembelajaran (CP)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
