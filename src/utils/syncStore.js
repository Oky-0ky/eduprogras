// ============================================
// EduProgress - Sync Store (lintas perangkat)
// Pengganti localStorage: data disimpan di
// backend API + MySQL (InfinityFree).
// localStorage tetap dipakai sebagai CACHE
// agar aplikasi tetap cepat & offline-tolerant.
// ============================================

export const API_URL = import.meta.env.VITE_API_URL || 'https://eduprogress-api-production.up.railway.app';

// ── Simpan satu key ke server + cache lokal ──────────────────────────
export async function setState(key, value) {
  try { localStorage.setItem(`sync_${key}`, JSON.stringify(value)); } catch (_) {}
  try {
    const res = await fetch(`${API_URL}/api/state/${encodeURIComponent(key)}`, {
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
    const res = await fetch(`${API_URL}/api/state/${encodeURIComponent(key)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        if (json.data !== null && json.data !== undefined) {
          try { localStorage.setItem(`sync_${key}`, JSON.stringify(json.data)); } catch (_) {}
          return json.data;
        }
        return fallback; // belum ada di server
      }
    }
  } catch (e) {
    console.warn(`[syncStore] Gagal ambil "${key}" dari server, pakai cache lokal:`, e.message);
  }
  try {
    const raw = localStorage.getItem(`sync_${key}`);
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
      if (json.success) {
        for (const [k, v] of Object.entries(json.data || {})) {
          try { localStorage.setItem(`sync_${k}`, JSON.stringify(v)); } catch (_) {}
        }
        return json.data;
      }
    }
  } catch (_) {}
  return null;
}

// ── Helper kompatibel localStorage, tapi versi async + sinkron server ─
// Pemakaian di komponen:
//   const data = await syncGet('eduprogress_students', INITIAL);
//   await syncSet('eduprogress_students', next);
export const syncGet = getState;
export const syncSet = setState;
