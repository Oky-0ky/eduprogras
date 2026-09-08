import React, { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { CalendarCheck, CheckCircle2, Clock, AlertTriangle, XCircle, PencilLine, X, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper: is this day a weekend (Sabtu & Ahad/Minggu)?
// getDay(): 0=Sunday(Ahad), 6=Saturday(Sabtu)
const isWeekend = (day, month, year) => {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const getLeadingBlanks = (month, year) => {
  const dow = new Date(year, month, 1).getDay();
  return (dow + 6) % 7;
};

const buildInitialDays = (month, year) => Array.from(
  { length: new Date(year, month + 1, 0).getDate() },
  (_, i) => {
  const day = i + 1;
  let status = 'Hadir';
  if (isWeekend(day, month, year)) status = 'Libur';
  else if (year === 2026 && month === 6 && day === 12) status = 'Izin';
  else if (year === 2026 && month === 6 && day === 21) status = 'Sakit';
  return { day, status };
});

const STATUS_META = {
  Hadir: { color: '#10B981', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 border-emerald-300', icon: CheckCircle2 },
  Izin: { color: '#3B82F6', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 border-blue-300 font-black', icon: Clock },
  Sakit: { color: '#F59E0B', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 border-amber-300 font-black', icon: AlertTriangle },
  Alpha: { color: '#EF4444', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 border-rose-300 font-black', icon: XCircle },
  Libur: { color: '#94A3B8', bg: 'bg-slate-100 text-slate-400 dark:bg-slate-800 border-slate-200', icon: Lock }
};

import { setState, getState } from '../utils/syncStore';

const ATTENDANCE_STORAGE_KEY = 'eduprogress_attendance_by_student';

const loadAttendanceStorage = () => {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveAttendanceStorage = (data) => {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage failures.
  }
  setState(ATTENDANCE_STORAGE_KEY, data);
};

const getStudentMonthDays = (studentId, month, year) => {
  if (!studentId) return buildInitialDays(month, year);
  const storage = loadAttendanceStorage();
  const monthKey = `${year}-${month}`;
  return (storage[studentId] || {})[monthKey] || buildInitialDays(month, year);
};

export default function Attendance() {
  const { selectedStudent } = useAuth();
  const studentId = selectedStudent?.id || 'default';

  const [month, setMonth] = useState(6); // Juli sebagai bulan awal
  const [year, setYear] = useState(2026);
  const [attendanceByStudent, setAttendanceByStudent] = useState(() => loadAttendanceStorage());

  // Muat presensi dari server saat halaman dibuka
  useEffect(() => {
    getState(ATTENDANCE_STORAGE_KEY, {}).then((data) => {
      if (data && Object.keys(data).length) setAttendanceByStudent(data);
    });
  }, []);
  const [days, setDays] = useState(() => getStudentMonthDays(studentId, 6, 2026));
  const [openPicker, setOpenPicker] = useState(null); // day number whose picker is open

  useEffect(() => {
    const nextDays = getStudentMonthDays(studentId, month, year);
    setDays(nextDays);
    setOpenPicker(null);
  }, [studentId, month, year]);

  const leadingBlanks = getLeadingBlanks(month, year);

  const persistStudentMonthDays = (newDays) => {
    const monthKey = `${year}-${month}`;
    setAttendanceByStudent((prev) => {
      const next = {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [monthKey]: newDays
        }
      };
      saveAttendanceStorage(next);
      return next;
    });
  };

  const changeMonth = (direction) => {
    const nextDate = new Date(year, month + direction, 1);
    setMonth(nextDate.getMonth());
    setYear(nextDate.getFullYear());
    setOpenPicker(null);
  };

  // Recount stats from editable state
  const counts = days.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Libur: 0 });

  const attendancePieData = [
    { name: 'Hadir', value: counts.Hadir, color: STATUS_META.Hadir.color },
    { name: 'Izin', value: counts.Izin, color: STATUS_META.Izin.color },
    { name: 'Sakit', value: counts.Sakit, color: STATUS_META.Sakit.color },
    { name: 'Alpha', value: counts.Alpha, color: STATUS_META.Alpha.color }
  ];

  const changeStatus = (day, newStatus) => {
    setDays((prev) => {
      const next = prev.map((d) => (d.day === day ? { ...d, status: newStatus } : d));
      persistStudentMonthDays(next);
      return next;
    });
    setOpenPicker(null);
  };

  // Available options for a given day.
  // Sabtu & Ahad (weekend) are always Libur and NOT editable.
  const statusOptions = (day) => {
    if (isWeekend(day, month, year)) return ['Libur'];
    return ['Hadir', 'Izin', 'Sakit', 'Alpha'];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400 p-6 rounded-4xl text-slate-900 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <CalendarCheck className="w-3.5 h-3.5" /> Kalender & Rekap Kehadiran
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Presensi & Kedisiplinan Siswa</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Pemantauan presensi harian Hadir, Izin, Sakit, dan Alpha. Klik tanggal untuk mengubah status.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-extrabold text-emerald-800 flex-wrap">
            <PencilLine className="w-3.5 h-3.5" /> Mode Edit Aktif — klik tanggal Senin–Jumat untuk mengubah status. Sabtu & Ahad otomatis Libur (tidak bisa diedit)
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Hadir</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.Hadir} Hari</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Izin</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{counts.Izin} Hari</h3>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Sakit</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{counts.Sakit} Hari</h3>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Alpha</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{counts.Alpha} Hari</h3>
            </div>
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Libur (Sab/Ahad)</p>
              <h3 className="text-2xl font-black text-slate-500 dark:text-slate-300">{counts.Libur} Hari</h3>
            </div>
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
        </GlassCard>
      </div>

      {/* Calendar & Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Monthly Calendar */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Bulan sebelumnya"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 min-w-36 text-center">
                Kalender Kehadiran - {MONTH_NAMES[month]} {year}
              </h3>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Bulan berikutnya"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs font-extrabold flex-wrap">
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Hadir</span>
              <span className="flex items-center gap-1 text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Izin</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sakit</span>
              <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Alpha</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Libur</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
              <div key={d} className="font-extrabold text-slate-400 py-1">{d}</div>
            ))}
{Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="p-2.5 rounded-2xl border border-transparent h-14"></div>
            ))}
{days.map(item => {
              const meta = STATUS_META[item.status] || STATUS_META.Hadir;
              const isOpen = openPicker === item.day;
              const editable = !isWeekend(item.day, month, year);
              return (
                <div key={item.day} className="relative">
                  <button
                    onClick={() => editable && setOpenPicker(isOpen ? null : item.day)}
                    className={`w-full p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-between h-14 ${meta.bg} ${
                      editable ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'
                    }`}
                    title={editable ? `Klik untuk mengubah status tanggal ${item.day}` : `Sabtu/Ahad - Libur`}
                  >
                    <span>{item.day}</span>
                    <span className="text-[9px] font-extrabold">{item.status}</span>
                  </button>

                  {/* Picker Popover (only for editable weekdays) */}
                  {isOpen && editable && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenPicker(null)} />
                      <div className="absolute left-0 top-full mt-1 z-40 w-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1.5">
                        <div className="px-2 py-1 text-[10px] font-black text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                          Tanggal {item.day} {MONTH_NAMES[month]}
                        </div>
                        {statusOptions(item.day).map(opt => {
                          const om = STATUS_META[opt];
                          return (
                            <button
                              key={opt}
                              onClick={() => changeStatus(item.day, opt)}
                              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl text-[11px] font-black text-left cursor-pointer transition ${
                                item.status === opt ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: om.color }} />
                                {opt}
                              </span>
                              {item.status === opt && <span className="text-emerald-500">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right: Pie Chart Distribution */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            Persentase Kehadiran
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
