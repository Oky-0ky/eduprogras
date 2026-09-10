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

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Database Connected Successfully!');
    console.log(`📦 Database: ${process.env.DB_NAME || 'eduprogress'}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err.code || '', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Cek DB_USER / DB_PASSWORD di file .env');
    } else if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error('   → Cek DB_HOST (misal sqlXXX.infinityfree.com) & pastikan koneksi internet aktif');
    }
    console.error('   → Server akan tetap berjalan, namun endpoint yang menggunakan database tidak akan berfungsi sampai koneksi berhasil.');
  });

export default pool;
