// ============================================
// EduProgress - Sync Store (lintas perangkat)
// Pengganti localStorage: data disimpan di
// backend API Railway + MySQL.
// localStorage tetap dipakai sebagai CACHE
// agar aplikasi tetap cepat & offline-tolerant.
// ============================================

export const API_URL = import.meta.env.VITE_API_URL || 'https://eduprogress-api-production.up.railway.app';

// ── Simpan satu key ke server + cache lokal ──────────────────────────
export async function setState(key, value) {
  // 1. Simpan ke cache lokal (tanpa prefix agar kompatibel dengan kode lama)
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(`sync_${key}`, JSON.stringify(value));
  } catch (_) {}

  // 2. Kirim/Sinkronkan ke Backend Railway
  try {
    const res = await fetch(`\({API_URL}/api/state/\){encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value ?? null)
    });
    return res.ok;
  } catch (e) {
    console.warn(`[syncStore] Gagal simpan "${key}" ke server (mode offline):`, e.message);
    return false;
  }
}

// ── Ambil satu key: server dulu, fallback ke cache lokal ─────────────
export async function getState(key, fallback = null) {
  try {
    const res = await fetch(`\({API_URL}/api/state/\){encodeURIComponent(key)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && (json.success || json.data !== undefined)) {
        const serverData = json.data !== undefined ? json.data : json;
        if (serverData !== null && serverData !== undefined) {
          try {
            localStorage.setItem(key, JSON.stringify(serverData));
            localStorage.setItem(`sync_${key}`, JSON.stringify(serverData));
          } catch (_) {}
          return serverData;
        }
      }
    }
  } catch (e) {
    console.warn(`[syncStore] Gagal ambil "${key}" dari server, pakai cache lokal:`, e.message);
  }

  // Fallback ke LocalStorage jika offline atau server belum punya data
  try {
    const raw = localStorage.getItem(key) || localStorage.getItem(`sync_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

// ── Ambil SEMUA state sekaligus (untuk boot cepat) ───────────────────
export async function getAllState() {
  try {
    const res = await fetch(`${API_URL}/api/state`);
    if (res.ok) {
      const json = await res.json();
      const dataObj = json.data || json;
      if (dataObj && typeof dataObj === 'object') {
        for (const [k, v] of Object.entries(dataObj)) {
          try {
            localStorage.setItem(k, JSON.stringify(v));
            localStorage.setItem(`sync_${k}`, JSON.stringify(v));
          } catch (_) {}
        }
        return dataObj;
      }
    }
  } catch (_) {}
  return null;
}

// Helper untuk kompatibilitas
export const syncGet = getState;
export const syncSet = setState;
