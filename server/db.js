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
  charset: 'utf8mb4_general_ci',
  timezone: '+07:00',
  connectTimeout: 20000
});

// Test connection with retry logic and exponential backoff.
// The app must start and stay running (so Railway's healthcheck can respond)
// even if the external MySQL database (InfinityFree) is temporarily unreachable.
// Requests to database-dependent endpoints will simply fail gracefully until
// a connection can be established.
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1s, then 2s, 4s, 8s, 16s

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testConnectionWithRetry(attempt = 1) {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully!');
    console.log(`📦 Database: ${process.env.DB_NAME || 'eduprogress'}`);
    conn.release();
  } catch (err) {
    console.error(`❌ Database Connection Failed (attempt ${attempt}/${MAX_RETRIES}):`, err.code || '', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Cek DB_USER / DB_PASSWORD di file .env');
    } else if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error('   → Cek DB_HOST (misal sqlXXX.infinityfree.com) & pastikan koneksi internet aktif');
    }

    if (attempt < MAX_RETRIES) {
      const backoffDelay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`   → Mencoba ulang dalam ${backoffDelay / 1000}s...`);
      await delay(backoffDelay);
      return testConnectionWithRetry(attempt + 1);
    }

    // All retries exhausted — log the final failure but do NOT exit the process.
    // The server must keep running so the healthcheck endpoint (/api/health)
    // stays reachable, even though database-dependent endpoints will fail.
    console.error(`   → Gagal terhubung ke database setelah ${MAX_RETRIES} percobaan.`);
    console.error('   → Server akan tetap berjalan, namun endpoint yang menggunakan database tidak akan berfungsi sampai koneksi berhasil.');
  }
}

testConnectionWithRetry();

export default pool;
