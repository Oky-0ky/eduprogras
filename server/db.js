import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Validate required env vars
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.warn(`⚠️  Variabel lingkungan belum lengkap: ${missing.join(', ')}`);
  console.warn('   Pastikan file .env sudah diisi (lihat .env.example).');
}

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eduprogress',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  connectTimeout: 20000
});

// ── Auto-migrate: buat tabel app_state jika belum ada ──────────────────────
// Ini yang menjamin data tersimpan lintas browser setelah deploy ke Railway
async function ensureSchema() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        state_key   VARCHAR(255) PRIMARY KEY,
        state_value LONGTEXT     NOT NULL,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ MySQL Connected — tabel app_state siap digunakan');
    console.log(`📦 Database: ${process.env.DB_NAME || 'eduprogress'}`);
    conn.release();
  } catch (err) {
    console.error('❌ Database Connection / Migration Failed:', err.code || '', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Cek DB_USER / DB_PASSWORD di Railway Environment Variables');
    } else if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error('   → Cek DB_HOST di Railway Environment Variables');
    }
    console.error('   → Server tetap berjalan, endpoint database tidak aktif sampai koneksi berhasil.');
  }
}

ensureSchema();

export default pool;
