# 🚀 Panduan Deploy EduProgress (Backend Render + Frontend InfinityFree)

Arsitektur:
```
[HP/Laptop/Browser] → Frontend (dist/ di InfinityFree)
                          │  fetch /api/state, /api/quiz, Socket.IO
                          ▼
                     Backend API (Render, gratis)
                          │  mysql2
                          ▼
                     MySQL (InfinityFree: if0_42858697_eduprogress)
```

---

## LANGKAH 1 — Siapkan Database (InfinityFree)

1. Buka Panel InfinityFree → **MySQL Databases**
2. Catat:
   - **Host**: `sqlXXX.infinityfree.com` (lihat kolom "SQL Host")
   - **Username**: `if0_42858697`
   - **Password**: password MySQL kamu (tombol "View" / buat baru)
   - **Database**: `if0_42858697_eduprogress`
3. Buka **phpMyAdmin** → pilih database → tab **SQL** → paste seluruh isi `server/schema.sql` → **Go**
4. Pastikan muncul tabel: `app_state`, `accounts`, `students`, `subjects`, dll.

> ⚠️ **PENTING**: MySQL InfinityFree kadang menolak koneksi dari luar.
> Kalau Render gagal koneksi (error `ENOTFOUND` / `ETIMEDOUT` / `ER_HOST_NOT_ALLOWED`),
> gunakan database gratisan yang mendukung remote penuh:
> **[Aiven MySQL Free](https://aiven.io)** atau **[Clever Cloud MySQL](https://www.clever-cloud.com)**.
> Caranya sama: buat database → catat host/user/pass → jalankan `schema.sql` via phpMyAdmin/Aiven console → isi env di Render.

---

## LANGKAH 2 — Deploy Backend ke Render (gratis)

1. Push semua kode ini ke GitHub (repo kamu yang sudah ada)
2. Buka https://dashboard.render.com → **New +** → **Web Service**
3. Pilih **Build and deploy from a Git repository** → connect repo GitHub kamu
4. Isi:
   - **Name**: `eduprogress-api`
   - **Root Directory**: (kosongkan)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: Free
5. Buka bagian **Environment** → tambahkan:
   ```
   NODE_ENV     = production
   DB_HOST      = sqlXXX.infinityfree.com   (atau host Aiven)
   DB_PORT      = 3306
   DB_USER      = if0_42858697
   DB_PASSWORD  = ••••••
   DB_NAME      = if0_42858697_eduprogress
   JWT_SECRET   = (string acak panjang, buat sendiri)
   ```
   > Kalau ada file `render.yaml`, Render bisa membaca setting ini otomatis.
6. Klik **Create Web Service** → tunggu build selesai
7. Cek **Logs** — harus muncul:
   ```
   ✅ MySQL Database Connected Successfully!
   📦 Database: if0_42858697_eduprogress
   🚀 Server EduProgress running ...
   ```
8. Catat URL backend kamu, misal: `https://eduprogress-api.onrender.com`
9. Tes di browser: `https://eduprogress-api.onrender.com/api/health`
   → harus tampil `{"status":"ok",...}`

> ℹ️ Free tier Render tidur setelah 15 menit kosong.
> Request pertama setelah tidur butuh ~30 detik. Bisa diatasi dengan cron pinger gratis (UptimeRobot / cron-job.org) tiap 10 menit.

---

## LANGKAH 3 — Build & Deploy Frontend ke InfinityFree

1. Buat file `.env.production` di root project:
   ```
   VITE_API_URL=https://eduprogress-api.onrender.com
   ```
2. Build frontend:
   ```bash
   npm run build
   ```
3. Upload **seluruh isi folder `dist/`** ke InfinityFree via FTP / File Manager
   (folder htdocs, ganti file lama). Pastikan `public/.htaccess` ikut ter-upload
   (diperlukan agar routing React berfungsi).
4. Buka website kamu dari HP & laptop → login → ubah satu data (misal status TP)
5. Buka di perangkat lain & refresh → data harus sama ✅

> Untuk GitHub Actions (deploy otomatis), pastikan repo secret:
> - `FTP_PASSWORD` → password FTP InfinityFree
> dan file `.github/workflows/deploy.yml` menambahkan step `npm run build`
> sebelum upload (VITE_API_URL diambil dari `.env.production`).

---

## LANGKAH 4 — Verifikasi Sinkronisasi

Cek data tersimpan di MySQL:
1. phpMyAdmin → database `if0_42858697_eduprogress`
2. Jalankan: `SELECT state_key, updated_at FROM app_state;`
3. Harus muncul key seperti:
   ```
   eduprogress_students
   eduprogress_grades
   eduprogress_tp_data
   eduprogress_schedule_data
   eduprogress_achievements
   eduprogress_attendance_by_student
   tpStatus_std-1
   tpNotes_std-1
   tpPrePost_std-1
   edu_assessments
   edu_cp_list
   ```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `ENOTFOUND sqlXXX.infinityfree.com` | Host salah — salin persis dari panel (termasuk nomornya) |
| `ER_HOST_NOT_ALLOWED` | InfinityFree blok IP Render → pakai Aiven/Clever Cloud MySQL |
| Render "sleeping" 30 detik | Normal di free tier; pakai UptimeRobot untuk keep-alive |
| Data tidak sinkron | Cek `VITE_API_URL` di `.env.production` lalu build ulang (`npm run build`) |
| Socket.IO quiz gagal | Pastikan `VITE_API_URL` tanpa garis miring di akhir, dan backend aktif |
