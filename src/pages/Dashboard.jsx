import React from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Sparkles,
  Trophy,
  CalendarCheck,
  BookOpen,
  Award,
  Bell,
  Heart,
  TrendingUp,
  UserCheck,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { selectedStudent, user, tpData, achievements } = useAuth();
  const navigate = useNavigate();

  const totalPrestasi = achievements.filter((item) => item.studentId === selectedStudent.id).length;

  const reportTpSummary = Object.values(tpData || {}).reduce((summary, subject) => {
    (subject.chapters || []).forEach((chapter) => {
      (chapter.tps || []).forEach((tp) => {
        summary.total += 1;
        let status = 'Paham';
        try {
          const overrides = JSON.parse(localStorage.getItem(`tpStatus_${selectedStudent.id}`) || '{}');
          status = overrides[tp] || status;
        } catch (error) {
          // Use the report default when local storage is unavailable.
        }
        if (status === 'Sangat Paham' || status === 'Paham') summary.achieved += 1;
      });
    });
    return summary;
  }, { total: 0, achieved: 0 });

  // Recharts Mock Data for student performance
  const scoreTrendData = [
    { month: 'Jan', Nilai: 85, Target: 80 },
    { month: 'Feb', Nilai: 88, Target: 82 },
    { month: 'Mar', Nilai: 90, Target: 85 },
    { month: 'Apr', Nilai: 89, Target: 85 },
    { month: 'Mei', Nilai: 94, Target: 88 },
    { month: 'Jun', Nilai: 96, Target: 90 },
    { month: 'Jul', Nilai: 95, Target: 90 }
  ];

  const cpRadarData = [
    { subject: 'PAI', value: 92 },
    { subject: 'PPKn', value: 90 },
    { subject: 'B.Indo', value: 88 },
    { subject: 'MTK', value: 85 },
    { subject: 'IPA', value: 94 },
    { subject: 'IPS', value: 82 },
    { subject: 'B.Ing', value: 89 },
    { subject: 'Seni', value: 95 }
  ];

  const academicEvents = [
    { date: "05 Agu", title: "Field Trip Edukasi Sains Kebun Raya", color: "bg-sky-500" },
    { date: "12 Agu", title: "Asesmen Sumatif Bab 1 Matematika", color: "bg-amber-500" },
    { date: "17 Agu", title: "Pentas Seni & Lomba Peringatan Kemerdekaan", color: "bg-rose-500" },
    { date: "25 Agu", title: "Pertemuan Orang Tua & Pameran Karya P5", color: "bg-emerald-500" }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
      
      {/* 1. Header Welcome Banner - Responsive */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
            <img
              src={selectedStudent.avatar}
              alt={selectedStudent.name}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-4 border-white/80 shadow-xl flex-shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-200 animate-spin flex-shrink-0" /> 
                <span className="truncate">{selectedStudent.className}</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight break-words">
                {selectedStudent.name}
              </h1>
              <p className="text-[11px] sm:text-sm text-sky-50 font-medium break-words">
                NISN: <span className="font-extrabold">{selectedStudent.nisn}</span>
              </p>
              <p className="text-[10px] sm:text-xs text-sky-100 font-medium break-words">
                Wali Kelas: <span className="font-bold">{selectedStudent.homeroomTeacher}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                const phone = selectedStudent.parentPhone || "6281234567891";
                const msg = `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu ${selectedStudent.parentName},\n\nBerikut adalah Rekapitulasi Capaian Pembelajaran (CP) Kurikulum Merdeka untuk ananda:\n\n📊 [...]`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-sm">📱</span>
              <span className="truncate">Kirim Rekap CP via WhatsApp</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3 bg-white/15 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/20">
              <div className="text-right min-w-0">
                <p className="text-[9px] sm:text-[10px] uppercase font-black text-sky-100">Total Progres</p>
                <p className="text-xl sm:text-2xl font-black">{selectedStudent.overallProgress}%</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-300 text-slate-900 flex items-center justify-center text-lg sm:text-xl shadow-lg flex-shrink-0">
                🏆
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Key Stats Cards - Mobile-Optimized Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <GlassCard className="border-l-4 border-l-sky-400">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">Kehadiran</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {selectedStudent.attendanceRate}%
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">Sangat Rajin ✨</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-amber-400 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/achievements')}>
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">Prestasi</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {totalPrestasi}
              </h3>
              <p className="text-[10px] text-amber-500 font-bold mt-1">Penghargaan 🏆</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-emerald-400">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">Tujuan Pembelajaran</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {reportTpSummary.achieved}/{reportTpSummary.total}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">TP tercapai</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-purple-400">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">Nilai Rata-Rata</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {selectedStudent.averageScore}
              </h3>
              <p className="text-[10px] text-purple-500 font-bold mt-1">Predikat A 🌟</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </GlassCard>

      </div>

      {/* 3. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left: Trend Nilai */}
        <GlassCard className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 flex-shrink-0" /> Grafik Perkembangan Nilai
              </h3>
              <p className="text-xs text-slate-400 mt-1">Peningkatan performa akademis</p>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 sm:px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 whitespace-nowrap flex-shrink-0">
              Semester Genap
            </span>
          </div>

          <div className="h-48 sm:h-64 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreTrendData}>
                <defs>
                  <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis domain={[60, 100]} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }}
                />
                <Area type="monotone" dataKey="Nilai" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorNilai)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Right: Radar Analysis CP */}
        <GlassCard className="space-y-3 sm:space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" /> Analisis CP
            </h3>
            <p className="text-xs text-slate-400 mt-1">Pemetaan potensi per mata pelajaran</p>
          </div>

          <div className="h-48 sm:h-64 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={cpRadarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Capaian CP" dataKey="value" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* 4. Bottom Grid: Kalender & Notifikasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left: Kalender Akademik */}
        <GlassCard className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" /> Agenda Sekolah
            </h3>
            <button 
              onClick={() => navigate('/attendance')}
              className="text-xs font-bold text-sky-500 hover:underline whitespace-nowrap"
            >
              Lihat Semuanya →
            </button>
          </div>

          <div className="space-y-2">
            {academicEvents.map((evt, idx) => (
              <div key={idx} className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-start sm:items-center gap-3 border border-slate-100 dark:border-slate-700/60">
                <div className={`px-2 sm:px-3 py-1.5 ${evt.color} text-white font-extrabold text-[10px] sm:text-xs rounded-xl shadow-sm text-center flex-shrink-0`}>
                  {evt.date}
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-2">{evt.title}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right: Notifikasi Perkembangan */}
        <GlassCard className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" /> Catatan Wali Kelas
            </h3>
            <button 
              onClick={() => navigate('/daily-notes')}
              className="text-xs font-bold text-sky-500 hover:underline whitespace-nowrap"
            >
              Buka Catatan →
            </button>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 rounded-3xl border border-amber-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
              <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" /> Catatan Hari Ini:
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-3">
              "Ananda {selectedStudent.name} hari ini sangat aktif dalam diskusi kelompok IPA dan menunjukkan kepemimpinan yang santun."
            </p>
            <p className="text-[10px] font-bold text-slate-400 text-right">— {selectedStudent.homeroomTeacher}</p>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
