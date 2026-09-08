import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Trash2,
  Clock,
  User,
  BookOpen,
  Link as LinkIcon,
  Filter,
  Send,
  CheckCircle2
} from 'lucide-react';
import { getSentReports, deleteSentReport } from '../utils/reportArchive';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

export default function PenyimpananPage() {
  const { students, selectedStudent } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filterStudent, setFilterStudent] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const loadReports = () => setReports(getSentReports());

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = filterStudent === 'all'
    ? reports
    : reports.filter((r) => r.studentId === filterStudent);

  const handleCopyLink = (report) => {
    navigator.clipboard.writeText(report.parentLink).then(() => {
      setCopiedId(report.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleDelete = (reportId) => {
    if (!window.confirm('Hapus laporan ini dari arsip penyimpanan?')) return;
    setReports(deleteSentReport(reportId));
  };

  const handleViewReport = (report) => {
    navigate(`/reports/${report.studentId}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-6 rounded-4xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Database className="w-3.5 h-3.5" /> Arsip Laporan TP
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Penyimpanan Laporan</h1>
          <p className="text-xs sm:text-sm text-cyan-100">
            Riwayat laporan TP anak yang sudah dikirim ke orang tua via WhatsApp beserta link online.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-center">
            <p className="text-2xl font-black">{filteredReports.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-100">Laporan Tersimpan</p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2.5 bg-white text-teal-700 font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 hover:bg-cyan-50"
          >
            <Send className="w-4 h-4" /> Kirim Laporan Baru
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider shrink-0">
          <Filter className="w-4 h-4" /> Filter Siswa
        </div>
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <option value="all">Semua Siswa ({reports.length})</option>
          {students.map((st) => {
            const count = reports.filter((r) => r.studentId === st.id).length;
            return (
              <option key={st.id} value={st.id}>
                {st.name} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Report List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
          <div className="text-5xl">📂</div>
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">Belum Ada Laporan Tersimpan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Laporan akan otomatis tersimpan di sini setelah Anda menekan tombol{' '}
            <strong>"Kirim WA + Link ke Ortu"</strong> di halaman Laporan TP Anak.
          </p>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Buka Laporan TP Anak
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100">{report.studentName}</h3>
                    <p className="text-xs text-slate-500">{report.className} • NISN {report.nisn}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Terkirim ke Ortu
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <User className="w-3 h-3" /> {report.parentName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500">
                    <Clock className="w-3 h-3" /> {formatDate(report.sentAt)}
                  </div>
                </div>
              </div>

              {/* Chapters summary */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] font-black rounded-xl border border-sky-200 dark:border-sky-800">
                  <BookOpen className="w-3 h-3" /> {report.chapterCount || report.selectedChapters?.length || 0} Bab
                </span>
                {report.tpCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-black rounded-xl border border-purple-200 dark:border-purple-800">
                    {report.tpCount} TP
                  </span>
                )}
                {report.selectedChapters?.slice(0, 3).map((chap) => (
                  <span key={chap} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-xl border border-amber-200 dark:border-amber-800 truncate max-w-[180px]">
                    {chap}
                  </span>
                ))}
                {(report.selectedChapters?.length || 0) > 3 && (
                  <span className="px-2.5 py-1 text-[10px] font-bold text-slate-400">
                    +{report.selectedChapters.length - 3} bab lainnya
                  </span>
                )}
              </div>

              {/* Parent link */}
              {report.parentLink && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <LinkIcon className="w-4 h-4 text-sky-600 shrink-0" />
                    <p className="text-[11px] text-sky-600 dark:text-sky-400 font-mono truncate">{report.parentLink}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleViewReport(report)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Lihat Laporan
                </button>
                {report.parentLink && (
                  <>
                    <a
                      href={report.parentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Link Ortu
                    </a>
                    <button
                      onClick={() => handleCopyLink(report)}
                      className={`px-3 py-1.5 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition border ${
                        copiedId === report.id
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" /> {copiedId === report.id ? 'Tersalin!' : 'Salin Link'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(report.id)}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-bold">
        💡 Laporan otomatis masuk ke penyimpanan setiap kali Anda menekan <strong>"Kirim WA + Link ke Ortu"</strong> di menu Laporan TP Anak.
        {selectedStudent && (
          <> Saat ini siswa aktif: <strong>{selectedStudent.name}</strong>.</>
        )}
      </div>
    </div>
  );
}
