import express from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eduprogress-secret-key-2026';
const DATA_PATH = path.join(__dirname, 'data', 'quizData.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { quizzes: [], gameSessions: [], rewards: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateGameCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token diperlukan' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

// ─── QUIZ CRUD ───────────────────────────────────────────────────────────────

// GET /api/quiz — list kuis guru
router.get('/', authMiddleware, (req, res) => {
  const data = readData();
  const quizzes = data.quizzes.filter(q => q.createdBy === req.user.id || req.user.role === 'Admin');
  res.json(quizzes);
});

// POST /api/quiz — buat kuis baru
router.post('/', authMiddleware, (req, res) => {
  const { title, description, subject, grade, duration, questions } = req.body;
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: 'Judul dan soal wajib diisi' });
  }
  const data = readData();
  const quiz = {
    id: uid(),
    title,
    description: description || '',
    subject: subject || 'Umum',
    grade: grade || 'Kelas 5',
    duration: duration || 20,
    questions: questions.map((q, i) => ({
      id: uid(),
      index: i,
      type: q.type || 'multiple_choice',
      question: q.question,
      options: q.options || { A: '', B: '', C: '', D: '' },
      correctAnswer: q.correctAnswer,
      timeLimit: q.timeLimit || duration || 20,
      points: q.points || 1000,
      explanation: q.explanation || ''
    })),
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.quizzes.push(quiz);
  writeData(data);
  res.status(201).json(quiz);
});

// GET /api/quiz/history — riwayat permainan
router.get('/history', authMiddleware, (req, res) => {
  const data = readData();
  const sessions = data.gameSessions
    .filter(s => s.hostId === req.user.id || req.user.role === 'Admin')
    .map(s => {
      const quiz = data.quizzes.find(q => q.id === s.quizId);
      const sortedP = [...(s.participants || [])].sort((a, b) => b.score - a.score);
      return {
        id: s.id,
        gameCode: s.gameCode,
        quizTitle: quiz ? quiz.title : 'Kuis Dihapus',
        subject: quiz ? quiz.subject : '-',
        grade: quiz ? quiz.grade : '-',
        status: s.status,
        participantCount: s.participants?.length || 0,
        winner: sortedP[0]?.name || '-',
        avgScore: sortedP.length
          ? Math.round(sortedP.reduce((a, b) => a + b.score, 0) / sortedP.length)
          : 0,
        startedAt: s.startedAt,
        endedAt: s.endedAt
      };
    })
    .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
  res.json(sessions);
});

// GET /api/quiz/session/check/:code — cek kode valid
router.get('/session/check/:code', (req, res) => {
  const data = readData();
  const session = data.gameSessions.find(
    s => s.gameCode === req.params.code && s.status === 'waiting'
  );
  if (!session) return res.status(404).json({ error: 'Kode tidak valid atau permainan sudah dimulai' });
  const quiz = data.quizzes.find(q => q.id === session.quizId);
  res.json({
    sessionId: session.id,
    quizTitle: quiz?.title || 'Kuis',
    participantCount: session.participants?.length || 0
  });
});

// GET /api/quiz/session/:sessionId/results — hasil detail session
router.get('/session/:sessionId/results', authMiddleware, (req, res) => {
  const data = readData();
  const session = data.gameSessions.find(s => s.id === req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
  const quiz = data.quizzes.find(q => q.id === session.quizId);
  const sorted = [...(session.participants || [])].sort((a, b) => b.score - a.score);

  // Hitung soal paling sulit dan paling mudah
  const questionStats = quiz?.questions.map(q => {
    const answers = (session.participants || []).flatMap(p =>
      (p.answers || []).filter(a => a.questionId === q.id)
    );
    const correct = answers.filter(a => a.isCorrect).length;
    return {
      id: q.id,
      question: q.question,
      correctCount: correct,
      totalAnswers: answers.length,
      accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0
    };
  }) || [];

  res.json({
    session,
    quiz,
    leaderboard: sorted.map((p, i) => ({ ...p, rank: i + 1 })),
    questionStats,
    avgScore: sorted.length
      ? Math.round(sorted.reduce((a, b) => a + b.score, 0) / sorted.length)
      : 0
  });
});

// GET /api/quiz/:id — detail kuis
router.get('/:id', authMiddleware, (req, res) => {
  const data = readData();
  const quiz = data.quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Kuis tidak ditemukan' });
  res.json(quiz);
});

// PUT /api/quiz/:id — edit kuis
router.put('/:id', authMiddleware, (req, res) => {
  const data = readData();
  const idx = data.quizzes.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Kuis tidak ditemukan' });
  const { title, description, subject, grade, duration, questions } = req.body;
  data.quizzes[idx] = {
    ...data.quizzes[idx],
    title: title || data.quizzes[idx].title,
    description: description ?? data.quizzes[idx].description,
    subject: subject || data.quizzes[idx].subject,
    grade: grade || data.quizzes[idx].grade,
    duration: duration || data.quizzes[idx].duration,
    questions: questions
      ? questions.map((q, i) => ({
          id: q.id || uid(),
          index: i,
          type: q.type || 'multiple_choice',
          question: q.question,
          options: q.options || { A: '', B: '', C: '', D: '' },
          correctAnswer: q.correctAnswer,
          timeLimit: q.timeLimit || duration || 20,
          points: q.points || 1000,
          explanation: q.explanation || ''
        }))
      : data.quizzes[idx].questions,
    updatedAt: new Date().toISOString()
  };
  writeData(data);
  res.json(data.quizzes[idx]);
});

// DELETE /api/quiz/:id — hapus kuis
router.delete('/:id', authMiddleware, (req, res) => {
  const data = readData();
  const idx = data.quizzes.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Kuis tidak ditemukan' });
  data.quizzes.splice(idx, 1);
  writeData(data);
  res.json({ message: 'Kuis berhasil dihapus' });
});

// POST /api/quiz/:id/start — mulai game, generate GAME CODE
router.post('/:id/start', authMiddleware, (req, res) => {
  const data = readData();
  const quiz = data.quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Kuis tidak ditemukan' });
  if (quiz.questions.length === 0) return res.status(400).json({ error: 'Kuis belum memiliki soal' });

  // Hapus session lama yang masih waiting dari host ini
  data.gameSessions = data.gameSessions.filter(
    s => !(s.hostId === req.user.id && s.status === 'waiting')
  );

  const gameCode = generateGameCode();
  const session = {
    id: uid(),
    gameCode,
    quizId: quiz.id,
    hostId: req.user.id,
    hostName: req.user.name,
    status: 'waiting',
    participants: [],
    currentQuestion: 0,
    startedAt: null,
    endedAt: null,
    createdAt: new Date().toISOString()
  };
  data.gameSessions.push(session);
  writeData(data);
  res.json({ sessionId: session.id, gameCode, quizTitle: quiz.title });
});

// ─── REWARDS ─────────────────────────────────────────────────────────────────

router.get('/rewards', authMiddleware, (req, res) => {
  const data = readData();
  res.json(data.rewards || []);
});

router.post('/rewards', authMiddleware, (req, res) => {
  const { name, icon, description, minimumScore } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama hadiah wajib diisi' });
  const data = readData();
  const reward = {
    id: uid(),
    name,
    icon: icon || '🎁',
    description: description || '',
    minimumScore: minimumScore || 0,
    isActive: true,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  if (!data.rewards) data.rewards = [];
  data.rewards.push(reward);
  writeData(data);
  res.status(201).json(reward);
});

router.put('/rewards/:id', authMiddleware, (req, res) => {
  const data = readData();
  const idx = (data.rewards || []).findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Hadiah tidak ditemukan' });
  data.rewards[idx] = { ...data.rewards[idx], ...req.body };
  writeData(data);
  res.json(data.rewards[idx]);
});

router.delete('/rewards/:id', authMiddleware, (req, res) => {
  const data = readData();
  const idx = (data.rewards || []).findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Hadiah tidak ditemukan' });
  data.rewards.splice(idx, 1);
  writeData(data);
  res.json({ message: 'Hadiah berhasil dihapus' });
});

export default router;
