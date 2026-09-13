import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import { Settings as SettingsIcon, Sun, Moon, Contrast, UserCheck, Lock } from 'lucide-react';

export default function Settings() {
  const { user, selectedStudent } = useAuth();
  const { themeMode, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <SettingsIcon className="w-3.5 h-3.5" /> Pengaturan Sistem & Profil
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Pengaturan & Aksesibilitas</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Kelola profil pengguna, preferensi tema tampilan (Light/Dark/High Contrast), dan notifikasi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left: User Profile Summary */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-500" /> Profil Pengguna Aktif
          </h3>

          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-amber-300" />
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user.name}</h4>
              <p className="text-xs font-bold text-amber-600">{user.role}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-semibold">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex justify-between">
              <span className="text-slate-500">Status Akun:</span>
              <span className="font-extrabold text-emerald-600">Terverifikasi (Aktif)</span>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex justify-between">
              <span className="text-slate-500">Siswa yang Dipantau:</span>
              <span className="font-extrabold text-sky-600">{selectedStudent.name}</span>
            </div>
          </div>
        </GlassCard>

        {/* Password management */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" /> Keamanan Akun
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Manajemen password dinonaktifkan karena aplikasi berjalan tanpa server autentikasi (mode lokal).
          </p>
        </GlassCard>

        {/* Right: Theme & Display Accessibility Settings */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" /> Preferensi Tampilan & Aksesibilitas
          </h3>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500">Pilih Mode Tampilan Layar:</p>

            <button
              onClick={() => toggleTheme('light')}
              className={`w-full p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition ${
                themeMode === 'light' ? 'bg-amber-100 border-amber-400 text-amber-900 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-500" /> Mode Terang (Light Mode)
              </div>
              {themeMode === 'light' && <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black">Aktif</span>}
            </button>

            <button
              onClick={() => toggleTheme('dark')}
              className={`w-full p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition ${
                themeMode === 'dark' ? 'bg-sky-950 border-sky-600 text-sky-200 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-sky-400" /> Mode Gelap (Dark Mode)
              </div>
              {themeMode === 'dark' && <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-black">Aktif</span>}
            </button>

            <button
              onClick={() => toggleTheme('high-contrast')}
              className={`w-full p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition ${
                themeMode === 'high-contrast' ? 'bg-yellow-400 text-black border-black shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Contrast className="w-4 h-4 text-yellow-500" /> High Contrast Mode (Kontras Tinggi)
              </div>
              {themeMode === 'high-contrast' && <span className="text-[10px] bg-black text-yellow-300 px-2 py-0.5 rounded-full font-black">Aktif</span>}
            </button>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
