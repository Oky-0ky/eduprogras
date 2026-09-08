import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, BookOpen, ChevronDown, Clock, GraduationCap, Star, School, Award } from 'lucide-react';
import { getDefaultPrePostScores, getTpPoints, getAllTpTexts, CODE_TO_STATUS } from './Reports';
import { fetchReportFromCloud } from '../utils/cloudSync';

// Status badge styles
const statusStyles = {
  'Sangat Paham': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Paham':        'bg-sky-100 text-sky-700 border-sky-200',
  'Sedang Proses':'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Cukup Paham':  'bg-amber-100 text-amber-700 border-amber-200',
  'Belum Paham':  'bg-rose-100 text-rose-700 border-rose-200',
};

const statusIcon = {
  'Sangat Paham': '🌟',
  'Paham':        '✅',
  'Sedang Proses':'⏳',
  'Cukup Paham':  '📝',
  'Belum Paham':  '💪',
};

/**
 * Halaman Laporan TP untuk Orang Tua — TANPA MENU, TANPA NAVBAR
 * Diakses via /ortu/:studentId
 */
export default function ParentReport({ student, selectedChapters = null }) {
  const { tpData: globalTpData } = useAuth();

  const [tpStatusOverrides, setTpStatusOverrides] = useState({});
  const [tpNoteOverrides, setTpNoteOverrides] = useState({});
  const [prePostOverrides, setPrePostOverrides] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Load saved statuses, teacher notes, and pre/post test scores
  // Prioritas: localStorage → URL params → cloud sync
  useEffect(() => {
    if (!student?.id) return;

    let cancelled = false;
    const allTps = getAllTpTexts(globalTpData);

    // ── 1. Decode URL params (fallback untuk link lama) ───────────────────
    let urlStatus = {};
    let urlNotes = {};
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);

        const nParam = searchParams.get('n');
        if (nParam) {
          nParam.split('||').forEach(item => {
            const colonIdx = item.indexOf(':');
            if (colonIdx !== -1) {
              const tpIdx = Number(item.slice(0, colonIdx));
              const noteText = item.slice(colonIdx + 1);
              const fullTpText = allTps[tpIdx];
              if (fullTpText && noteText) urlNotes[fullTpText] = noteText;
            }
          });
        }

        const sParam = searchParams.get('s');
        if (sParam) {
          sParam.split(',').forEach(item => {
            const [idxStr, code] = item.split(':');
            const fullTpText = allTps[Number(idxStr)];
            const statusText = CODE_TO_STATUS[code];
            if (fullTpText && statusText) urlStatus[fullTpText] = statusText;
          });
        }

        // Legacy formats
        const ntParam = searchParams.get('nt') || searchParams.get('notes');
        const stParam = searchParams.get('st') || searchParams.get('status');
        if (ntParam) {
          try { Object.assign(urlNotes, JSON.parse(decodeURIComponent(atob(ntParam)))); } catch (_) {
            try { Object.assign(urlNotes, JSON.parse(ntParam)); } catch (_2) {}
          }
        }
        if (stParam) {
          try { Object.assign(urlStatus, JSON.parse(decodeURIComponent(atob(stParam)))); } catch (_) {
            try { Object.assign(urlStatus, JSON.parse(stParam)); } catch (_2) {}
          }
        }
      } catch (_) {}
    }

    // ── 2. Baca localStorage sebagai nilai awal ───────────────────────────
    let localStatus = {};
    let localNotes = {};
    let localPrePost = {};
    try { localStatus = JSON.parse(localStorage.getItem(`tpStatus_${student.id}`) || '{}'); } catch (_) {}
    try { localNotes = JSON.parse(localStorage.getItem(`tpNotes_${student.id}`) || '{}'); } catch (_) {}
    try { localPrePost = JSON.parse(localStorage.getItem(`tpPrePost_${student.id}`) || '{}'); } catch (_) {}

    // Tampilkan data lokal lebih dulu agar halaman tidak kosong
    setTpStatusOverrides({ ...localStatus, ...urlStatus });
    setTpNoteOverrides({ ...localNotes, ...urlNotes });
    setPrePostOverrides(localPrePost);

    // ── 3. Cloud sync sebagai sumber tambahan ────────────────────────────
    fetchReportFromCloud(student.id).then(cloudData => {
      if (!cloudData || cancelled) return;
      if (cloudData.status && Object.keys(cloudData.status).length > 0) {
        setTpStatusOverrides(prev => ({ ...prev, ...cloudData.status, ...urlStatus }));
      }
      if (cloudData.notes && Object.keys(cloudData.notes).length > 0) {
        setTpNoteOverrides(prev => ({ ...prev, ...cloudData.notes, ...urlNotes }));
      }
      if (cloudData.prePost) {
        setPrePostOverrides(prev => ({ ...prev, ...cloudData.prePost }));
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [student?.id]);

  if (!student) return null;

  const getPrePostScores = (chapterTitle) => {
    const custom = prePostOverrides[chapterTitle];
    if (custom) {
      return { preTest: Number(custom.preTest) || 0, postTest: Number(custom.postTest) || 0 };
    }
    return getDefaultPrePostScores(student.id, chapterTitle);
  };

  // Build chapters data from globalTpData
  const reportData = (!globalTpData || Object.keys(globalTpData).length === 0)
    ? []
    : Object.entries(globalTpData).map(([key, subjObj]) => {
        const chapters = (subjObj.chapters || []).map(chap => ({
          title: chap.chapter,
          tps: (chap.tps || []).map(tpText => ({
            text: tpText,
            status: tpStatusOverrides[tpText] || 'Paham',
            note: tpNoteOverrides[tpText] || ''
          }))
        }));

        // Apply chapter filter if provided (from teacher's selection)
        const filteredChapters = selectedChapters
          ? chapters.filter(c => selectedChapters.includes(c.title))
          : chapters;

        return {
          subject: subjObj.subject || key,
          teacher: subjObj.teacher || 'Ustadz Iski',
          chapters: filteredChapters
        };
      }).filter(s => s.chapters.length > 0 && s.chapters.some(c => c.tps.length > 0));

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50">

      {/* TOP HEADER — Sekolah Identity, tanpa navbar aplikasi */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-4 py-6 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
              🎓
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-100">Sistem Monitoring EduProgress</p>
              <h1 className="text-xl font-black">Laporan Tujuan Pembelajaran</h1>
              <p className="text-xs text-emerald-200">Kurikulum Merdeka TA 2026/2027</p>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-4 flex items-center gap-4 border border-white/20">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/60 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Laporan untuk Ananda</p>
              <h2 className="text-xl font-black truncate">{student.name}</h2>
              <p className="text-xs text-emerald-100">{student.className}</p>
              <p className="text-xs text-emerald-200 mt-0.5">Wali Kelas: <span className="font-bold text-white">{student.homeroomTeacher}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* DATE & Info Banner */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black text-amber-800">📅 {today}</p>
            <p className="text-[10px] text-amber-600 font-bold">
              Laporan ini menampilkan Nilai Pre-Test/Post-Test & Capaian TP Ananda.
            </p>
          </div>
          <div className="w-8 h-8 bg-amber-200 rounded-xl flex items-center justify-center text-base shrink-0">
            📊
          </div>
        </div>
      </div>

      {/* Subjects & Bab List */}
      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

        {reportData.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-black text-slate-800">Belum Ada Data TP</p>
            <p className="text-xs text-slate-500 mt-1">Guru belum menginput Bab & Tujuan Pembelajaran untuk laporan ini.</p>
          </div>
        ) : reportData.map((subj) => {
          const isExpanded = expandedSubjects[subj.subject] !== false; // Default expanded
          const totalTps = subj.chapters.reduce((sum, c) => sum + c.tps.length, 0);
          const pahamCount = subj.chapters.reduce((sum, c) =>
            sum + c.tps.filter(t => t.status === 'Sangat Paham' || t.status === 'Paham').length, 0);

          return (
            <div key={subj.subject} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

              {/* Subject Header — Clickable Accordion */}
              <button
                onClick={() => toggleSubject(subj.subject)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{subj.subject}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {subj.teacher} · {subj.chapters.length} Bab · {pahamCount}/{totalTps} TP Tercapai
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    {totalTps > 0 ? Math.round((pahamCount / totalTps) * 100) : 0}%
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Chapters & TPs */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {subj.chapters.map((chap, chapIdx) => {
                    const scores = getPrePostScores(chap.title);
                    const chapTotalPoints = chap.tps.reduce((sum, tp) => sum + getTpPoints(tp.status), 0);
                    const chapMaxPoints = chap.tps.length * 25;

                    return (
                      <div key={chapIdx} className="p-4 space-y-3">

                        {/* Chapter Title */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
                            <BookOpen className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h4 className="font-black text-sm text-slate-800">{chap.title}</h4>
                        </div>

                        {/* Pre-Test & Post-Test + Total Points per Bab */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Pre-Test */}
                          <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2">
                            <div className="w-7 h-7 rounded-xl bg-orange-400 flex items-center justify-center shrink-0">
                              <span className="text-white text-[10px] font-black">📝</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-600">Pre-Test</p>
                              <p className="text-lg font-black text-orange-700 leading-tight">{scores.preTest}<span className="text-[10px] font-bold text-orange-400 ml-0.5">/100</span></p>
                            </div>
                          </div>

                          {/* Post-Test */}
                          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2">
                            <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                              <span className="text-white text-[10px] font-black">✅</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Post-Test</p>
                              <p className="text-lg font-black text-emerald-700 leading-tight">{scores.postTest}<span className="text-[10px] font-bold text-emerald-400 ml-0.5">/100</span></p>
                            </div>
                            {scores.postTest > scores.preTest && (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                +{scores.postTest - scores.preTest}
                              </span>
                            )}
                          </div>

                          {/* Total Points Bab */}
                          <div className="flex items-center gap-2 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2">
                            <div className="w-7 h-7 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
                              <Award className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-600">Total Point</p>
                              <p className="text-lg font-black text-purple-700 leading-tight">{chapTotalPoints}<span className="text-[10px] font-bold text-purple-400 ml-0.5">/{chapMaxPoints}</span></p>
                            </div>
                            <div className="w-10 h-10 relative">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#a855f7" strokeWidth="3"
                                  strokeDasharray={`${chapMaxPoints > 0 ? (chapTotalPoints / chapMaxPoints) * 88 : 0} 88`}
                                  strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-purple-600">
                                {chapMaxPoints > 0 ? Math.round(chapTotalPoints / chapMaxPoints * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* TPs List */}
                        <div className="space-y-2 pl-2">
                          {chap.tps.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Belum ada Tujuan Pembelajaran di Bab ini.</p>
                          ) : chap.tps.map((tp, tpIdx) => {
                            const tpPoints = getTpPoints(tp.status);
                            return (
                              <div
                                key={tpIdx}
                                className="flex flex-col gap-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-100"
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="text-base shrink-0 mt-0.5">{statusIcon[tp.status] || '•'}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{tp.text}</p>

                                    {/* Status Badge + Point Badge */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                      <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-black ${statusStyles[tp.status] || statusStyles['Paham']}`}>
                                        {tp.status === 'Sedang Proses' ? (
                                          <><Clock className="w-2.5 h-2.5" /> Sedang Proses</>
                                        ) : tp.status}
                                      </span>

                                      {tp.status === 'Sedang Proses' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-500 text-[10px] font-black">
                                          <Clock className="w-3 h-3 text-slate-400" /> Tanpa Nilai
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-black">
                                          <Award className="w-3 h-3 text-purple-500" /> +{tpPoints} Pt
                                        </span>
                                      )}
                                    </div>

                                  </div>
                                </div>
                                {tp.note && tp.note.trim() !== '' && (
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-slate-800">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700">📝 Catatan Guru</p>
                                    <p className="mt-1.5 text-[11px] italic leading-relaxed text-slate-700">"{tp.note}"</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">📖 Keterangan Status Capaian & Poin</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(statusStyles).map(([status, cls]) => (
              <div key={status} className={`flex items-center justify-between px-2 py-1 rounded-xl border text-[10px] font-bold ${cls}`}>
                <span className="flex items-center gap-1"><span>{statusIcon[status]}</span> {status}</span>
                <span className="text-[9px] opacity-80">{status === 'Sedang Proses' ? 'Tanpa Nilai' : `+${getTpPoints(status)} Pt`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4 space-y-1">
          <p className="font-black">{student.homeroomTeacher || 'Wali Kelas'}</p>
          <p>Wali Kelas {student.className}</p>
          <p className="text-[10px]">Laporan ini dibuat otomatis oleh Sistem EduProgress</p>
        </div>

      </div>
    </div>
  );
}
