import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MobileMenu from './MobileMenu';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Contrast,
  UserCheck,
  ChevronDown,
  CheckCircle2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onSearchQuery }) {
  const { user, selectedStudent, switchStudent, students } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (onSearchQuery) {
      onSearchQuery(e.target.value);
    }
  };

  // Close dropdown on outside click (desktop & mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicked inside the desktop dropdown/button
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      // Don't close if clicked inside the mobile modal
      if (modalRef.current && modalRef.current.contains(event.target)) {
        return;
      }
      setShowStudentMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: "Nilai Asesmen Baru", desc: "Ustadz Iski telah menginput Nilai Matematika: 95 (A)", time: "10 menit lalu", unread: true },
    { id: 2, title: "Progres CP Mahir!", desc: "Seni Rupa: CP 1.2 meraih predikat Sangat Mahir 🎉", time: "1 jam lalu", unread: true },
    { id: 3, title: "Catatan Guru Baru", desc: "Ustadz Ahmad: 'Hari ini ananda rajin menyimak PAI'", time: "3 jam lalu", unread: false }
  ];

  return (
    <>
      <header className="sticky top-0 z-30 glass-nav px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-colors duration-300 w-full">
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
          
          {/* Left: Mobile Menu + Brand Logo */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <MobileMenu />
            <div 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer group min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-emerald-400 to-amber-300 p-0.5 shadow-md group-hover:scale-105 transition transform flex-shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[12px] sm:rounded-[14px] flex items-center justify-center text-base sm:text-xl">
                  🎒
                </div>
              </div>
              <div className="hidden xs:block min-w-0">
                <span className="text-sm sm:text-lg font-black bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent font-sans tracking-tight block">
                  EduProgress
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Bar - Hidden on Mobile */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari Siswa, NISN, Guru..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-600"
            />
          </div>

          {/* Right Controls - Always on a single row (flex-nowrap) */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 justify-end flex-nowrap flex-shrink-0">
            
            {/* Student Selector Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowStudentMenu(!showStudentMenu)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-2xl hover:bg-sky-100 dark:hover:bg-slate-700 transition flex-shrink-0 active:scale-95"
                title={`Pilih Siswa: ${selectedStudent.name}`}
              >
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-amber-300 flex-shrink-0"
                />
                <div className="text-left hidden sm:flex flex-col min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                    {selectedStudent.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium truncate">{selectedStudent.className}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 flex-shrink-0 hidden sm:block transition-transform ${showStudentMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Dropdown: Positioned directly under button on sm+ */}
              {showStudentMenu && (
                <div className="hidden sm:block absolute right-0 top-full mt-2 w-72 lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Pilih Peserta Didik ({students.length} Siswa)
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1 space-y-1">
                    {students.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          switchStudent(st.id);
                          setShowStudentMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-2xl flex items-center gap-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 transition ${
                          selectedStudent.id === st.id ? 'bg-sky-100 dark:bg-sky-950 font-bold border border-sky-300 dark:border-sky-700' : ''
                        }`}
                      >
                        <img src={st.avatar} alt={st.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-amber-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-800 dark:text-slate-100 font-semibold truncate">{st.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">NISN: {st.nisn}</p>
                        </div>
                        {selectedStudent.id === st.id && <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Student Modal: Rendered via Portal to avoid being cut off */}
            {showStudentMenu &&
              createPortal(
                <div className="fixed inset-0 z-50 sm:hidden flex items-start justify-center pt-16 px-4">
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                    onClick={() => setShowStudentMenu(false)}
                    aria-hidden="true"
                  />

                  {/* Centered Modal Card */}
                  <div
                    ref={modalRef}
                    className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-4 z-10 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Pilih Peserta Didik</h3>
                        <p className="text-[10px] text-slate-400 font-medium">{students.length} Siswa Terdaftar</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStudentMenu(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                        title="Tutup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
                      {students.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            switchStudent(st.id);
                            setShowStudentMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-2xl flex items-center gap-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer ${
                            selectedStudent.id === st.id ? 'bg-sky-100 dark:bg-sky-950 font-bold border border-sky-300 dark:border-sky-700' : ''
                          }`}
                        >
                          <img src={st.avatar} alt={st.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-amber-300" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800 dark:text-slate-100 font-semibold truncate">{st.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">NISN: {st.nisn}</p>
                          </div>
                          {selectedStudent.id === st.id && <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* Guru Kelas Badge (Visible on sm+ screens) */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-900 font-black text-xs rounded-2xl shadow-sm whitespace-nowrap flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Guru / Wali Kelas</span>
            </div>

            {/* Theme Toggle - Compact and clean */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <button
                onClick={() => toggleTheme('light')}
                className={`p-1.5 rounded-xl text-xs transition active:scale-95 ${themeMode === 'light' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Mode Terang"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                className={`p-1.5 rounded-xl text-xs transition active:scale-95 ${themeMode === 'dark' ? 'bg-slate-700 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Mode Gelap"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleTheme('high-contrast')}
                className={`p-1.5 rounded-xl text-xs transition active:scale-95 ${themeMode === 'high-contrast' ? 'bg-yellow-400 text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="High Contrast Mode"
              >
                <Contrast className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition active:scale-95"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-1 ring-white dark:ring-slate-900 animate-ping"></span>
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-sky-500" /> Notifikasi Terbaru
                      </h4>
                      <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">3 Baru</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2.5 bg-sky-50/60 dark:bg-slate-800/60 rounded-2xl text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{n.desc}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </header>
    </>
  );
}
