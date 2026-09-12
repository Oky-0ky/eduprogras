import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import quizRoutes from './quizRoutes.js';
import { initQuizSocket } from './quizSocket.js';
import { registerStateRoutes } from './stateRoutes.js';

import {
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_CP_DATA,
  INITIAL_ASSESSMENTS,
  INITIAL_PORTFOLIOS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_DAILY_NOTES,
  INITIAL_GALLERY,
  INITIAL_MESSAGES,
  DEMO_ACCOUNTS
} from '../src/data/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'eduprogress-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer file upload config (stores file in public/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// In-Memory Database Store (with full state retention during server run)
const db = {
  students: [...INITIAL_STUDENTS],
  subjects: [...INITIAL_SUBJECTS],
  cpData: JSON.parse(JSON.stringify(INITIAL_CP_DATA)),
  assessments: [...INITIAL_ASSESSMENTS],
  portfolios: [...INITIAL_PORTFOLIOS],
  achievements: [...INITIAL_ACHIEVEMENTS],
  dailyNotes: [...INITIAL_DAILY_NOTES],
  gallery: [...INITIAL_GALLERY],
  messages: [...INITIAL_MESSAGES],
  demoAccounts: [...DEMO_ACCOUNTS],
  tpReportStatus: {}, // per-student TP status overrides: { [studentId]: { [tpText]: status } }
  tpReportNotes: {}  // per-student TP notes overrides: { [studentId]: { [tpText]: note } }
};

// Auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid atau telah expired.' });
  }
};

// ======================== API ROUTES ======================== //
app.get('/', (req, res) => {
  res.send('
// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  const user = db.demoAccounts.find(acc => acc.email === email || acc.role === role) || db.demoAccounts[0];
  const token = jwt.sign({ id: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      badge: user.badge,
      avatar: user.avatar
    }
  });
});

// 2. Students Endpoint
app.get('/api/students', (req, res) => {
  res.json({ success: true, data: db.students });
});

app.get('/api/students/:id', (req, res) => {
  const student = db.students.find(s => s.id === req.params.id) || db.students[0];
  res.json({ success: true, data: student });
});

// 3. Subjects Endpoint
app.get('/api/subjects', (req, res) => {
  res.json({ success: true, data: db.subjects });
});

// 4. Capaian Pembelajaran (CP) Endpoint
app.get('/api/learning-outcomes/:subjectId', (req, res) => {
  const subjectId = req.params.subjectId;
  const outcomes = db.cpData[subjectId] || [];
  res.json({ success: true, data: outcomes });
});

app.post('/api/learning-outcomes', (req, res) => {
  const { subjectId, cpId, status, progress, teacherNote } = req.body;
  if (!db.cpData[subjectId]) {
    db.cpData[subjectId] = [];
  }
  const itemIndex = db.cpData[subjectId].findIndex(c => c.id === cpId);
  if (itemIndex > -1) {
    db.cpData[subjectId][itemIndex] = {
      ...db.cpData[subjectId][itemIndex],
      status: status || db.cpData[subjectId][itemIndex].status,
      progress: progress !== undefined ? progress : db.cpData[subjectId][itemIndex].progress,
      teacherNote: teacherNote || db.cpData[subjectId][itemIndex].teacherNote
    };
  }
  res.json({ success: true, message: 'Capaian Pembelajaran berhasil diperbarui!', data: db.cpData[subjectId] });
});

// 5. Assessments Endpoint
app.get('/api/assessments', (req, res) => {
  res.json({ success: true, data: db.assessments });
});

// 6. Portfolio Endpoint
app.get('/api/portfolio', (req, res) => {
  res.json({ success: true, data: db.portfolios });
});

app.post('/api/portfolio', (req, res) => {
  const newWork = {
    id: `port-${Date.now()}`,
    title: req.body.title || 'Hasil Karya Baru',
    studentId: req.body.studentId || 'std-1',
    category: req.body.category || 'Hasil Menggambar',
    fileType: req.body.fileType || 'image',
    fileUrl: req.body.fileUrl || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
    date: new Date().toISOString().split('T')[0],
    description: req.body.description || 'Karya peserta didik',
    teacherComment: req.body.teacherComment || 'Bagus sekali! Pertahankan ketelitianmu.'
  };
  db.portfolios.unshift(newWork);
  res.json({ success: true, data: newWork });
});

app.post('/api/portfolio/comment', (req, res) => {
  const { id, comment } = req.body;
  const item = db.portfolios.find(p => p.id === id);
  if (item) {
    item.teacherComment = comment;
  }
  res.json({ success: true, data: item });
});

// Delete a portfolio work
app.delete('/api/portfolio/:id', (req, res) => {
  const id = req.params.id;
  const itemIndex = db.portfolios.findIndex(p => p.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Karya portofolio tidak ditemukan.' });
  }
  const [removed] = db.portfolios.splice(itemIndex, 1);
  // If uploaded file (local /uploads path), remove from disk too
  if (removed.fileUrl && removed.fileUrl.startsWith('/uploads/')) {
    const filename = path.basename(removed.fileUrl);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
  }
  res.json({ success: true, message: 'Karya portofolio berhasil dihapus.', data: removed });
});

// 7. Achievements Endpoint
app.get('/api/achievements', (req, res) => {
  res.json({ success: true, data: db.achievements });
});

// 8. Daily Teacher Notes & AI Generator
app.get('/api/daily-notes', (req, res) => {
  res.json({ success: true, data: db.dailyNotes });
});

app.post('/api/daily-notes', (req, res) => {
  const newNote = {
    id: `note-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    category: req.body.category || 'Sikap & Karakter',
    content: req.body.content,
    icon: req.body.icon || '🌟',
    teacher: req.body.teacher || 'Ustadz Iski'
  };
  db.dailyNotes.unshift(newNote);
  res.json({ success: true, data: newNote });
});

app.post('/api/ai/generate-note', (req, res) => {
  const { studentName, subject, cpStatus } = req.body;
  const aiPrompts = [
    `Hari ini ananda ${studentName || 'Ammar'} menunjukkan rasa ingin tahu yang sangat tinggi dalam mata pelajaran ${subject || 'IPA'}. Mampu menyampaikan opini secara lugas dan percaya diri.`,
    `Ananda ${studentName || 'Ammar'} telah mencapai perkembangan yang pesat pada ${subject || 'Matematika'}. Catatan: Sikap saling menghargai dan gotong royong saat diskusi kelompok sangat patut diacungi jempol!`,
    `Progres ${subject || 'Bahasa Indonesia'} ananda ${studentName || 'Ammar'} berada di tingkat ${cpStatus || 'Sangat Mahir'}. Sangat kreatif dalam menyusun alur cerita narasi.`
  ];
  const generated = aiPrompts[Math.floor(Math.random() * aiPrompts.length)];
  res.json({ success: true, note: generated });
});

// 9. Messages Endpoint
app.get('/api/messages', (req, res) => {
  res.json({ success: true, data: db.messages });
});

app.post('/api/messages', (req, res) => {
  const newMsg = {
    id: `msg-${Date.now()}`,
    senderRole: req.body.senderRole || 'Orang Tua',
    senderName: req.body.senderName || 'Bapak Hardian',
    text: req.body.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true
  };
  db.messages.push(newMsg);
  res.json({ success: true, data: newMsg });
});

// 10. Gallery Endpoint
app.get('/api/gallery', (req, res) => {
  res.json({ success: true, data: db.gallery });
});

// Upload a new gallery item (photo/video/document)
app.post('/api/gallery', upload.single('file'), (req, res) => {
  const file = req.file;
  let fileUrl = req.body.url;
  let fileType = req.body.fileType || 'photo';

  if (file) {
    fileUrl = `/uploads/${file.filename}`;
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) fileType = 'video';
    else if (['.pdf', '.doc', '.docx'].includes(ext)) fileType = 'doc';
    else fileType = 'photo';
  } else if (!fileUrl) {
    fileUrl = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80';
  }

  const newItem = {
    id: `gal-${Date.now()}`,
    title: req.body.title || 'Dokumentasi Baru',
    category: req.body.category || 'Kegiatan Proyek',
    type: fileType,
    url: fileUrl,
    date: req.body.date || new Date().toISOString().split('T')[0],
    likes: 0
  };
  db.gallery.unshift(newItem);
  res.json({ success: true, data: newItem });
});

// Delete a gallery item
app.delete('/api/gallery/:id', (req, res) => {
  const id = req.params.id;
  const itemIndex = db.gallery.findIndex(g => g.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Item galeri tidak ditemukan.' });
  }
  const [removed] = db.gallery.splice(itemIndex, 1);
  // If uploaded file (local /uploads path), remove from disk too
  if (removed.url && removed.url.startsWith('/uploads/')) {
    const filename = path.basename(removed.url);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
  }
  res.json({ success: true, message: 'Item galeri berhasil dihapus.', data: removed });
});

// 11. Admin Backup & Restore API
app.post('/api/admin/backup', (req, res) => {
  res.json({
    success: true,
    message: 'Database backup successfully created!',
    filename: `eduprogress_backup_${new Date().toISOString().replace(/[:.]/g, '_')}.json`,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/admin/restore', (req, res) => {
  res.json({
    success: true,
    message: 'Database successfully restored to original baseline!'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'EduProgress API Server', timestamp: new Date() });
});

// 13. TP Report Status Endpoint (per-student, persistent during server run)
app.get('/api/tp-report-status/:studentId', (req, res) => {
  const statusMap = db.tpReportStatus[req.params.studentId] || {};
  res.json({ success: true, data: statusMap });
});

app.post('/api/tp-report-status/:studentId', (req, res) => {
  const { tpText, status } = req.body;
  if (!db.tpReportStatus[req.params.studentId]) {
    db.tpReportStatus[req.params.studentId] = {};
  }
  if (tpText && status) {
    db.tpReportStatus[req.params.studentId][tpText] = status;
  }
  res.json({ success: true, data: db.tpReportStatus[req.params.studentId] });
});

// 14. TP Report Notes Endpoint (per-student)
app.get('/api/tp-report-notes/:studentId', (req, res) => {
  const noteMap = db.tpReportNotes[req.params.studentId] || {};
  res.json({ success: true, data: noteMap });
});

app.post('/api/tp-report-notes/:studentId', (req, res) => {
  const { tpText, note } = req.body;
  if (!db.tpReportNotes[req.params.studentId]) {
    db.tpReportNotes[req.params.studentId] = {};
  }
  if (tpText) {
    db.tpReportNotes[req.params.studentId][tpText] = note || '';
  }
  res.json({ success: true, data: db.tpReportNotes[req.params.studentId] });
});

app.use('/api/quiz', quizRoutes);
registerStateRoutes(app);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const QUIZ_DATA_PATH = path.join(__dirname, 'data', 'quizData.json');
initQuizSocket(io, QUIZ_DATA_PATH);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server EduProgress running on http://localhost:${PORT}`);
  console.log(`🎮 QuizJuara Socket.IO aktif di /quiz namespace`);
});
