import pool from './db.js';

// Generic key-value state store backed by MySQL (app_state table).
// Each key stores one JSON document — the whole app syncs through this.

const readState = async (key) => {
  try {
    const [rows] = await pool.query('SELECT state_value FROM app_state WHERE state_key = ?', [key]);
    return rows.length ? JSON.parse(rows[0].state_value) : null;
  } catch (err) {
    console.error('readState error:', err.message);
    throw err;
  }
};

const writeState = async (key, value) => {
  await pool.query(
    'INSERT INTO app_state (state_key, state_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)',
    [key, JSON.stringify(value)]
  );
};

// ======================== STATE API ROUTES ======================== //

export function registerStateRoutes(app) {
  // GET all state keys -> { key: value, ... }
  app.get('/api/state', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT state_key, state_value FROM app_state');
      const out = {};
      for (const r of rows) {
        try { out[r.state_key] = JSON.parse(r.state_value); } catch (_) { out[r.state_key] = null; }
      }
      res.json({ success: true, data: out });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET one key
  app.get('/api/state/:key', async (req, res) => {
    try {
      const value = await readState(req.params.key);
      res.json({ success: true, data: value });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PUT (upsert) one key
  app.put('/api/state/:key', async (req, res) => {
    try {
      await writeState(req.params.key, req.body ?? null);
      res.json({ success: true, message: 'State tersimpan.', key: req.params.key });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE one key
  app.delete('/api/state/:key', async (req, res) => {
    try {
      await pool.query('DELETE FROM app_state WHERE state_key = ?', [req.params.key]);
      res.json({ success: true, message: 'State dihapus.', key: req.params.key });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}
