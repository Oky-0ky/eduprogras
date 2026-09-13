import pool from './db.js';

// Generic key-value state store backed by MySQL (app_state table).
// Each key stores one JSON document — the whole app syncs through this.

const readState = async (key) => {
  const [rows] = await pool.query(
    'SELECT state_value FROM app_state WHERE state_key = ?',
    [key]
  );
  return rows.length ? JSON.parse(rows[0].state_value) : null;
};

const writeState = async (key, value) => {
  await pool.query(
    `INSERT INTO app_state (state_key, state_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE state_value = VALUES(state_value), updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(value)]
  );
};

// ── Pastikan tabel ada (dipanggil ulang jika perlu) ────────────────────────────
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key   VARCHAR(255) PRIMARY KEY,
      state_value LONGTEXT     NOT NULL,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// ======================== STATE API ROUTES ======================== //

export function registerStateRoutes(app) {

  // ── GET all state keys ──────────────────────────────────────────────────────
  app.get('/api/state', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT state_key, state_value FROM app_state');
      const out = {};
      for (const r of rows) {
        try { out[r.state_key] = JSON.parse(r.state_value); } catch (_) { out[r.state_key] = null; }
      }
      res.json({ success: true, data: out });
    } catch (err) {
      // Tabel belum ada? buat dulu lalu kembalikan data kosong
      if (err.code === 'ER_NO_SUCH_TABLE') {
        try { await ensureTable(); } catch (_) {}
        return res.json({ success: true, data: {} });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── GET one key ─────────────────────────────────────────────────────────────
  app.get('/api/state/:key', async (req, res) => {
    try {
      const value = await readState(req.params.key);
      res.json({ success: true, data: value });
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        try { await ensureTable(); } catch (_) {}
        return res.json({ success: true, data: null });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── PUT (upsert) one key ────────────────────────────────────────────────────
  app.put('/api/state/:key', async (req, res) => {
    try {
      await writeState(req.params.key, req.body ?? null);
      res.json({ success: true, message: 'State tersimpan.', key: req.params.key });
    } catch (err) {
      // Tabel belum ada? buat dulu, lalu coba simpan lagi
      if (err.code === 'ER_NO_SUCH_TABLE') {
        try {
          await ensureTable();
          await writeState(req.params.key, req.body ?? null);
          return res.json({ success: true, message: 'State tersimpan (setelah auto-create tabel).', key: req.params.key });
        } catch (e2) {
          return res.status(500).json({ success: false, message: e2.message });
        }
      }
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── DELETE one key ──────────────────────────────────────────────────────────
  app.delete('/api/state/:key', async (req, res) => {
    try {
      await pool.query('DELETE FROM app_state WHERE state_key = ?', [req.params.key]);
      res.json({ success: true, message: 'State dihapus.', key: req.params.key });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── POST /api/setup — trigger manual pembuatan tabel (untuk debug/deploy) ───
  app.post('/api/setup', async (req, res) => {
    try {
      await ensureTable();
      res.json({ success: true, message: 'Tabel app_state berhasil dibuat / sudah ada.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── GET /api/db-status — cek status koneksi database ─────────────────────
  app.get('/api/db-status', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM app_state');
      res.json({ success: true, connected: true, rowCount: rows[0].total });
    } catch (err) {
      res.json({ success: false, connected: false, error: err.message, code: err.code });
    }
  });
}
