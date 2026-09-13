import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shield, User, Lock, ArrowRight, Star, Heart, Rocket } from 'lucide-react';

export default function Login() {
  const { loginWithRole } = useAuth();
  const [selectedRole] = useState('Guru Kelas');
  const [email, setEmail] = useState('walikelas.nur@eduprogress.id');
  const [password, setPassword] = useState('password123');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    loginWithRole('Guru Kelas');
    navigate('/');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-100 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      
      {/* Decorative Ornaments */}
      <div className="absolute top-10 left-10 text-6xl animate-float opacity-30 pointer-events-none">🚀</div>
      <div className="absolute top-1/4 right-12 text-6xl animate-float-slow opacity-30 pointer-events-none">🌈</div>
      <div className="absolute bottom-12 left-16 text-6xl animate-float opacity-30 pointer-events-none">📚</div>
      <div className="absolute bottom-10 right-20 text-6xl animate-float-slow opacity-30 pointer-events-none">⭐</div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl glass-card border-2 border-white/80 dark:border-slate-800 shadow-2xl rounded-4xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
      >
        
        {/* Left Side: Friendly Mascot & Hero Info */}
        <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-emerald-400 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center text-2xl shadow-lg">
                🎒
              </div>
              <div>
                <h1 className="text-2xl font-black font-sans tracking-tight">EduProgress</h1>
                <p className="text-xs font-bold text-sky-100">Kurikulum Merdeka 2026</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-300" /> Platform Monitoring Anak Real-Time
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Pantau Perkembangan Capaian Pembelajaran (CP) Anak dengan Ceria & Visual!
              </h2>
              <p className="text-xs sm:text-sm text-sky-50 leading-relaxed font-medium">
                Visualisasi 12 Mata Pelajaran, Portofolio Karya Digital, Grafik Nilai, dan Catatan Guru Berbasis AI.
              </p>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md p-4 rounded-3xl border border-white/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 text-slate-900 flex items-center justify-center text-xl shadow-md">
              ⭐
            </div>
            <div>
              <p className="text-xs font-extrabold">Si Bintang Smart (EduBuddy)</p>
              <p className="text-[11px] text-sky-100 font-medium">"Setiap anak adalah bintang yang bersinar!"</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              Selamat Datang Guru Kelas! 👋
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Portal Pengelola Utama: Kelola 9 siswa, edit seluruh CP 12 mapel, dan kirim persentase laporan via WhatsApp Orang Tua.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Akun Guru Kelas
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400 hover:brightness-105 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>Masuk ke Dashboard Guru Kelas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>


          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Aplikasi Monitoring Perkembangan Peserta Didik SD/MI Kurikulum Merdeka © 2026
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
