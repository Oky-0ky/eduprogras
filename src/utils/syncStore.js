// ============================================
// EduProgress - Sync Store (lintas perangkat)
// Data disimpan ke backend API Railway + MySQL.
// localStorage dipakai sebagai CACHE agar aplikasi
// tetap cepat & offline-tolerant.
// ============================================

export const API_URL = import.meta.env.VITE_API_URL || 'https://eduprogress-api-production.up.railway.app';

// ── Helper: kirim dengan retry sekali ────────────────────────────────────────
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // 4xx tidak perlu retry
      if (res.status >= 400 && res.status < 500) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

// ── Simpan satu key ke server + cache lokal ───────────────────────────────────
export async function setState(key, value) {
  // 1. Simpan ke cache lokal terlebih dahulu (agar UI tetap konsisten)
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(`sync_${key}`, JSON.stringify(value));
  } catch (_) {}

  // 2. Kirim ke Backend Railway via PUT /api/state/:key
  try {
    const res = await fetchWithRetry(
      `${API_URL}/api/state/${encodeURIComponent(key)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value ?? null)
      }
    );
    return res && res.ok;
  } catch (e) {
    console.warn(`[syncStore] Gagal simpan "${key}" ke server (mode offline):`, e.message);
    return false;
  }
}

// ── Ambil satu key: server dulu, fallback ke cache lokal ──────────────────────
export async function getState(key, fallback = null) {
  try {
    const res = await fetchWithRetry(
      `${API_URL}/api/state/${encodeURIComponent(key)}`,
      { method: 'GET' }
    );
    if (res && res.ok) {
      const json = await res.json();
      if (json && (json.success || json.data !== undefined)) {
        const serverData = json.data !== undefined ? json.data : json;
        if (serverData !== null && serverData !== undefined) {
          // Update cache lokal dengan data terbaru dari server
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

  // Fallback ke localStorage jika offline atau server belum punya data
  try {
    const raw = localStorage.getItem(key) || localStorage.getItem(`sync_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

// ── Ambil SEMUA state sekaligus (untuk boot cepat) ────────────────────────────
export async function getAllState() {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/state`, { method: 'GET' });
    if (res && res.ok) {
      const json = await res.json();
      const dataObj = json.data || json;
      if (dataObj && typeof dataObj === 'object') {
        // Simpan semua ke cache lokal
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

// ── Hapus satu key dari server + cache lokal ──────────────────────────────────
export async function deleteState(key) {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`sync_${key}`);
  } catch (_) {}
  try {
    await fetchWithRetry(
      `${API_URL}/api/state/${encodeURIComponent(key)}`,
      { method: 'DELETE' }
    );
  } catch (_) {}
}

// ── Helper kompatibilitas ─────────────────────────────────────────────────────
export const syncGet = getState;
export const syncSet = setState;
