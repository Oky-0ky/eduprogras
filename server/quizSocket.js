import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'eduprogress-secret-key-2026';

function readData(dataPath) {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf-8')); }
  catch { return { quizzes: [], gameSessions: [], rewards: [] }; }
}
function writeData(dataPath, data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function initQuizSocket(io, dataPath) {
  // Namespace terpisah agar tidak konflik dengan socket lain
  const quizIo = io.of('/quiz');

  // Map: socketId → { sessionId, participantId, role: 'host'|'student', gameCode }
  const socketMeta = new Map();

  quizIo.on('connection', (socket) => {
    // ── HOST CONNECT ─────────────────────────────────────────────────────────
    socket.on('host-connect', ({ sessionId, token }) => {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        const data = readData(dataPath);
        const session = data.gameSessions.find(s => s.id === sessionId && s.hostId === user.id);
        if (!session) return socket.emit('error', { message: 'Sesi tidak ditemukan' });

        socket.join(`host-${sessionId}`);
        socket.join(session.gameCode);
        socketMeta.set(socket.id, { sessionId, role: 'host', gameCode: session.gameCode });

        const quiz = data.quizzes.find(q => q.id === session.quizId);
        socket.emit('session-info', {
          session,
          quiz,
          participants: session.participants
        });
      } catch {
        socket.emit('error', { message: 'Token tidak valid' });
      }
    });

    // ── STUDENT JOIN GAME ─────────────────────────────────────────────────────
    socket.on('join-game', ({ gameCode, playerName }) => {
      const data = readData(dataPath);
      const session = data.gameSessions.find(
        s => s.gameCode === gameCode && s.status === 'waiting'
      );
      if (!session) {
        return socket.emit('join-error', { message: 'Kode tidak valid atau permainan sudah dimulai' });
      }
      if (!playerName || playerName.trim() === '') {
        return socket.emit('join-error', { message: 'Nama tidak boleh kosong' });
      }

      const participantId = uid();
      const participant = {
        id: participantId,
        name: playerName.trim(),
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        answers: [],
        badges: [],
        activity: { status: 'ready', label: 'Siap bermain' },
        joinedAt: new Date().toISOString()
      };

      session.participants.push(participant);
      writeData(dataPath, data);

      socket.join(gameCode);
      socketMeta.set(socket.id, { sessionId: session.id, participantId, role: 'student', gameCode });

      socket.emit('joined-success', {
        participantId,
        sessionId: session.id,
        playerName: playerName.trim()
      });

      // Beritahu host
      quizIo.to(`host-${session.id}`).emit('player-joined', {
        participant,
        totalParticipants: session.participants.length
      });
    });

    // ── START GAME ────────────────────────────────────────────────────────────
    socket.on('start-game', ({ sessionId, token }) => {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        const data = readData(dataPath);
        const session = data.gameSessions.find(s => s.id === sessionId && s.hostId === user.id);
        if (!session) return socket.emit('error', { message: 'Sesi tidak ditemukan' });
        if (session.participants.length === 0) return socket.emit('error', { message: 'Belum ada peserta' });

        const quiz = data.quizzes.find(q => q.id === session.quizId);
        if (!quiz) return socket.emit('error', { message: 'Kuis tidak ditemukan' });

        session.status = 'playing';
        session.currentQuestion = 0;
        session.startedAt = new Date().toISOString();
        writeData(dataPath, data);

        const firstQuestion = sanitizeQuestion(quiz.questions[0], quiz);
        quizIo.to(session.gameCode).emit('game-started', {
          totalQuestions: quiz.questions.length,
          question: firstQuestion,
          questionIndex: 0
        });
      } catch {
        socket.emit('error', { message: 'Token tidak valid' });
      }
    });

    // ── SUBMIT ANSWER ─────────────────────────────────────────────────────────
    socket.on('submit-answer', ({ sessionId, participantId, questionId, answer, responseTime }) => {
      const data = readData(dataPath);
      const session = data.gameSessions.find(s => s.id === sessionId);
      if (!session || session.status !== 'playing') return;

      const quiz = data.quizzes.find(q => q.id === session.quizId);
      if (!quiz) return;

      const question = quiz.questions.find(q => q.id === questionId);
      if (!question) return;

      const participant = session.participants.find(p => p.id === participantId);
      if (!participant) return;

      // Cek sudah menjawab soal ini
      const alreadyAnswered = participant.answers.find(a => a.questionId === questionId);
      if (alreadyAnswered) return;

      const isCorrect = answer === question.correctAnswer;
      const timeLimit = getQuestionTimeLimit(quiz, question);
      const safeResponseTime = Math.min(responseTime, timeLimit);
      const nextQuestionIndex = quiz.questions.findIndex(q => q.id === questionId) + 1;

      // Hitung skor
      let points = 0;
      if (isCorrect) {
        const baseScore = question.points || 1000;
        const maxBonus = 500;
        const speedBonus = Math.floor((1 - safeResponseTime / timeLimit) * maxBonus);
        points = baseScore + Math.max(0, speedBonus);
      }

      const answerRecord = {
        id: uid(),
        questionId,
        answer,
        isCorrect,
        responseTime: safeResponseTime,
        points,
        answeredAt: new Date().toISOString()
      };

      participant.answers.push(answerRecord);
      participant.score += points;
      if (isCorrect) participant.correctAnswers++;
      else participant.wrongAnswers++;

      participant.activity = {
        status: 'answered',
        label: 'Jawaban terkirim',
        questionId,
        questionIndex: quiz.questions.findIndex(q => q.id === questionId),
        answer,
        isCorrect,
        responseTime: safeResponseTime,
        updatedAt: new Date().toISOString()
      };

      writeData(dataPath, data);

      // Konfirmasi ke murid
      socket.emit('answer-confirmed', { points, isCorrect });

      // Update host
      const answeredCount = session.participants.filter(
        p => p.answers.find(a => a.questionId === questionId)
      ).length;

      quizIo.to(`host-${sessionId}`).emit('answer-received', {
        participantId,
        playerName: participant.name,
        isCorrect,
        answer,
        questionId,
        nextQuestionIndex,
        activity: participant.activity,
        score: participant.score,
        correctAnswers: participant.correctAnswers,
        wrongAnswers: participant.wrongAnswers,
        answeredCount,
        totalParticipants: session.participants.length
      });

      // Setiap murid maju sendiri setelah jawabannya diterima.
      setTimeout(() => {
        const latestData = readData(dataPath);
        const latestSession = latestData.gameSessions.find(s => s.id === session.id);
        if (!latestSession || latestSession.status !== 'playing') return;

        if (nextQuestionIndex >= quiz.questions.length) {
          socket.emit('game-over', {
            leaderboard: buildLeaderboard(latestSession),
            sessionId: latestSession.id,
            rewards: (latestData.rewards || []).filter(r => r.isActive)
          });
          return;
        }

        socket.emit('new-question', {
          question: sanitizeQuestion(quiz.questions[nextQuestionIndex], quiz),
          questionIndex: nextQuestionIndex,
          totalQuestions: quiz.questions.length
        });
      }, 700);
    });

    // ── NEXT QUESTION ─────────────────────────────────────────────────────────
    socket.on('next-question', ({ sessionId, token }) => {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        const data = readData(dataPath);
        const session = data.gameSessions.find(s => s.id === sessionId && s.hostId === user.id);
        if (!session) return;
        const quiz = data.quizzes.find(q => q.id === session.quizId);
        if (!quiz) return;

        session.currentQuestion += 1;

        if (session.currentQuestion >= quiz.questions.length) {
          // Game over
          endGame(quizIo, session, quiz, data, dataPath);
        } else {
          writeData(dataPath, data);
          const nextQ = sanitizeQuestion(quiz.questions[session.currentQuestion], quiz);
          quizIo.to(session.gameCode).emit('new-question', {
            question: nextQ,
            questionIndex: session.currentQuestion,
            totalQuestions: quiz.questions.length
          });
        }
      } catch {
        socket.emit('error', { message: 'Token tidak valid' });
      }
    });

    // ── SHOW QUESTION RESULT (guru trigger manual) ────────────────────────────
    socket.on('show-result', ({ sessionId, token }) => {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        const data = readData(dataPath);
        const session = data.gameSessions.find(s => s.id === sessionId && s.hostId === user.id);
        if (!session) return;
        const quiz = data.quizzes.find(q => q.id === session.quizId);
        if (!quiz) return;
        const question = quiz.questions[session.currentQuestion];
        emitQuestionResult(quizIo, session, quiz, question, data, dataPath);
      } catch { /* ignore */ }
    });

    // ── END GAME ──────────────────────────────────────────────────────────────
    socket.on('end-game', ({ sessionId, token }) => {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        const data = readData(dataPath);
        const session = data.gameSessions.find(s => s.id === sessionId && s.hostId === user.id);
        if (!session) return;
        const quiz = data.quizzes.find(q => q.id === session.quizId);
        endGame(quizIo, session, quiz, data, dataPath);
      } catch { /* ignore */ }
    });

    // ── LEADERBOARD ───────────────────────────────────────────────────────────
    socket.on('get-leaderboard', ({ sessionId }) => {
      const data = readData(dataPath);
      const session = data.gameSessions.find(s => s.id === sessionId);
      if (!session) return;
      socket.emit('leaderboard-update', buildLeaderboard(session));
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      socketMeta.delete(socket.id);
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getQuestionTimeLimit(quiz, question) {
  const totalDurationSeconds = Math.max(25, Number(quiz.duration) || 25) * 60;
  return Math.max(20, Math.ceil(totalDurationSeconds / Math.max(1, quiz.questions.length)));
}

function sanitizeQuestion(q, quiz) {
  // Kirim soal tanpa jawaban benar ke murid
  return {
    id: q.id,
    index: q.index,
    type: q.type,
    question: q.question,
    options: q.options,
    timeLimit: getQuestionTimeLimit(quiz, q),
    points: q.points || 1000
  };
}

function buildLeaderboard(session) {
  return [...session.participants]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      correctAnswers: p.correctAnswers,
      wrongAnswers: p.wrongAnswers,
      rank: i + 1,
      accuracy: (p.correctAnswers + p.wrongAnswers) > 0
        ? Math.round((p.correctAnswers / (p.correctAnswers + p.wrongAnswers)) * 100)
        : 0
    }));
}

function emitQuestionResult(quizIo, session, quiz, question, data, dataPath) {
  const leaderboard = buildLeaderboard(session);
  writeData(dataPath, data);

  quizIo.to(session.gameCode).emit('question-result', {
    correctAnswer: question.correctAnswer,
    explanation: question.explanation || '',
    leaderboard,
    questionId: question.id
  });
}

function endGame(quizIo, session, quiz, data, dataPath) {
  session.status = 'ended';
  session.endedAt = new Date().toISOString();

  // Assign badges
  const leaderboard = buildLeaderboard(session);
  leaderboard.forEach((entry, i) => {
    const participant = session.participants.find(p => p.id === entry.id);
    if (!participant) return;
    if (i === 0) participant.badges.push({ name: 'Juara 1', icon: '🏆' });
    if (i === 1) participant.badges.push({ name: 'Juara 2', icon: '🥈' });
    if (i === 2) participant.badges.push({ name: 'Juara 3', icon: '🥉' });
    if (entry.accuracy >= 80) participant.badges.push({ name: 'Jawaban Tepat', icon: '🎯' });
    if (participant.score >= 1500) participant.badges.push({ name: 'Top Scorer', icon: '⭐' });
  });

  // Hadiah yang tersedia
  const rewards = (data.rewards || []).filter(r => r.isActive);

  writeData(dataPath, data);

  quizIo.to(session.gameCode).emit('game-over', {
    leaderboard,
    sessionId: session.id,
    rewards: rewards.map(r => ({ id: r.id, name: r.name, icon: r.icon, description: r.description, minimumScore: r.minimumScore }))
  });
}

function advanceQuestion(quizIo, sessionId, gameCode, dataPath) {
  const data = readData(dataPath);
  const session = data.gameSessions.find(s => s.id === sessionId && s.gameCode === gameCode);
  if (!session || session.status !== 'playing') return;
  const quiz = data.quizzes.find(q => q.id === session.quizId);
  if (!quiz) return;

  session.currentQuestion += 1;
  if (session.currentQuestion >= quiz.questions.length) {
    endGame(quizIo, session, quiz, data, dataPath);
    return;
  }

  writeData(dataPath, data);
  quizIo.to(session.gameCode).emit('new-question', {
    question: sanitizeQuestion(quiz.questions[session.currentQuestion], quiz),
    questionIndex: session.currentQuestion,
    totalQuestions: quiz.questions.length
  });
}
