// ============================================
// EduProgress - Arsip Laporan TP yang Dikirim
// Disimpan ke server (MySQL via /api/state) DAN
// localStorage sebagai cache offline.
// ============================================
import { setState, getState } from './syncStore';

const STORAGE_KEY = 'eduprogress_sent_reports';

// ── Baca dari cache lokal ──────────────────────────────────────────────────────
const readLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ── Tulis ke cache lokal ──────────────────────────────────────────────────────
const writeLocal = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
};

// ── Ambil semua laporan (server dulu, fallback lokal) ─────────────────────────
export const getSentReports = async () => {
  try {
    const serverData = await getState(STORAGE_KEY);
    if (Array.isArray(serverData) && serverData.length >= 0) {
      writeLocal(serverData);
      return serverData;
    }
  } catch (_) {}
  return readLocal();
};

// ── Versi sinkron untuk komponen yang tidak bisa async (baca cache lokal saja) ─
export const getSentReportsSync = () => readLocal();

// ── Simpan laporan baru (lokal + server) ──────────────────────────────────────
export const saveSentReport = async (report) => {
  const existing = readLocal();
  const entry = {
    id: `report-${Date.now()}`,
    sentAt: new Date().toISOString(),
    ...report
  };
  const updated = [entry, ...existing];
  writeLocal(updated);
  // Kirim ke server (tidak perlu await — biarkan jalan di background)
  setState(STORAGE_KEY, updated);
  return entry;
};

// ── Hapus satu laporan (lokal + server) ────────────────────────────────────────
export const deleteSentReport = (reportId) => {
  const updated = readLocal().filter((item) => item.id !== reportId);
  writeLocal(updated);
  setState(STORAGE_KEY, updated);
  return updated;
};

// ── Filter laporan milik satu siswa ───────────────────────────────────────────
export const getReportsForStudent = (studentId) => {
  return readLocal().filter((item) => item.studentId === studentId);
};
