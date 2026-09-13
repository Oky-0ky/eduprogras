import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  FileCheck2,
  FolderKanban,
  Trophy,
  CalendarCheck,
  BookOpenCheck,
  Image,
  MessageSquareText,
  FileSpreadsheet,
  ShieldCheck,
  Database,
  ClipboardList,
  Gamepad2,
  Settings,
  LogOut,
  CheckSquare
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "Beranda", path: "/", icon: LayoutDashboard, color: "text-sky-500" },
    { label: "Jadwal Pelajaran", path: "/schedule", icon: CalendarCheck, color: "text-amber-500" },
    { label: "Nilai Tugas & Ulangan", path: "/nilai", icon: ClipboardList, color: "text-indigo-500" },
    { label: "Laporan Tugas Selesai", path: "/task-report", icon: CheckSquare, color: "text-green-500" },
    { label: "Perkembangan Belajar", path: "/learning-progress", icon: TrendingUp, color: "text-emerald-500" },
    { label: "Capaian Pembelajaran", path: "/learning-outcomes", icon: Target, color: "text-amber-600" },
    { label: "Asesmen", path: "/assessment", icon: FileCheck2, color: "text-purple-500" },
    { label: "QuizJuara", path: "/quiz", icon: Gamepad2, color: "text-rose-500" },
    { label: "Portofolio Murid", path: "/portfolio", icon: FolderKanban, color: "text-pink-500" },
    { label: "Prestasi Siswa", path: "/achievements", icon: Trophy, color: "text-yellow-500" },
    { label: "Kehadiran", path: "/attendance", icon: CalendarCheck, color: "text-teal-500" },
    { label: "Catatan Guru", path: "/daily-notes", icon: BookOpenCheck, color: "text-indigo-500" },
    { label: "Galeri Sekolah", path: "/gallery", icon: Image, color: "text-rose-500" },
    { label: "Pesan Guru", path: "/messages", icon: MessageSquareText, color: "text-sky-600" },
    { label: "Laporan TP Anak", path: "/reports", icon: FileSpreadsheet, color: "text-emerald-600" },
    { label: "Penyimpanan", path: "/penyimpanan", icon: Database, color: "text-cyan-500" }
  ];

  if (user.role === 'Admin' || user.role === 'Kepala Sekolah' || user.role === 'Guru' || user.role === 'Guru Kelas') {
    menuItems.push({ label: "Kelola Admin", path: "/admin", icon: ShieldCheck, color: "text-amber-600" });
  }

  menuItems.push({ label: "Pengaturan", path: "/settings", icon: Settings, color: "text-slate-500" });

  return (
    <aside className="w-64 bg-white/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)] no-print overflow-y-auto">
      <div className="space-y-1">
        <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Menu Utama
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-emerald-400 text-white shadow-md shadow-sky-500/20 translate-x-1'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Banner */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 bg-gradient-to-br from-sky-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-3xl border border-sky-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-8 h-8 rounded-full object-cover border flex-shrink-0" 
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700 transition flex-shrink-0"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
