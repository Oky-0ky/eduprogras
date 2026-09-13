import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
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

export default function MobileMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuItems = [
    { label: "Beranda", path: "/", icon: LayoutDashboard, color: "text-sky-500" },
    { label: "Jadwal Pelajaran", path: "/schedule", icon: CalendarCheck, color: "text-amber-500" },
    { label: "Nilai Tugas", path: "/nilai", icon: ClipboardList, color: "text-indigo-500" },
    { label: "Laporan Tugas", path: "/task-report", icon: CheckSquare, color: "text-green-500" },
    { label: "Perkembangan", path: "/learning-progress", icon: TrendingUp, color: "text-emerald-500" },
    { label: "Capaian Pembelajaran", path: "/learning-outcomes", icon: Target, color: "text-amber-600" },
    { label: "Asesmen", path: "/assessment", icon: FileCheck2, color: "text-purple-500" },
    { label: "QuizJuara", path: "/quiz", icon: Gamepad2, color: "text-rose-500" },
    { label: "Portofolio", path: "/portfolio", icon: FolderKanban, color: "text-pink-500" },
    { label: "Prestasi", path: "/achievements", icon: Trophy, color: "text-yellow-500" },
    { label: "Kehadiran", path: "/attendance", icon: CalendarCheck, color: "text-teal-500" },
    { label: "Catatan Guru", path: "/daily-notes", icon: BookOpenCheck, color: "text-indigo-500" },
    { label: "Galeri", path: "/gallery", icon: Image, color: "text-rose-500" },
    { label: "Pesan", path: "/messages", icon: MessageSquareText, color: "text-sky-600" },
    { label: "Laporan TP", path: "/reports", icon: FileSpreadsheet, color: "text-emerald-600" },
    { label: "Penyimpanan", path: "/penyimpanan", icon: Database, color: "text-cyan-500" }
  ];

  const role = user?.role;
  if (role === 'Admin' || role === 'Kepala Sekolah' || role === 'Guru' || role === 'Guru Kelas') {
    menuItems.push({ label: "Kelola Admin", path: "/admin", icon: ShieldCheck, color: "text-amber-600" });
  }

  menuItems.push({ label: "Pengaturan", path: "/settings", icon: Settings, color: "text-slate-500" });

  return (
    <>
      {/* Hamburger Button inside Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition flex-shrink-0 active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
        title="Buka Menu"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Render Drawer into document.body via Portal to break out of glass-nav backdrop-filter */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay covering full screen */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar Drawer Container */}
            <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
              {/* Header with Close Button */}
              <div className="flex-shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <div>
                  <h2 className="text-base font-black bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
                    Menu
                  </h2>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
                    Navigasi
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-95"
                  title="Tutup menu"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items (Scrollable container) */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 ${
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

              {/* Footer Profile */}
              {user && (
                <div className="flex-shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="p-3 bg-gradient-to-br from-sky-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-300 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold truncate">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700 transition flex-shrink-0 active:scale-95"
                      title="Keluar"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
