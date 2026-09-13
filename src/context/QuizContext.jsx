import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const QuizContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialState = {
  // Game state murid
  gameCode: '',
  playerName: '',
  sessionId: '',
  participantId: '',
  gameStatus: 'idle', // idle | joining | lobby | playing | showing-result | result
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  hasAnswered: false,
  myAnswer: null,
  myScore: 0,
  leaderboard: [],
  questionResult: null,
  finalResult: null,
  error: null,
  // Host state guru
  hostSession: null,
  participants: [],
  answeredCount: 0,
  answeredTotal: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ERROR': return { ...state, error: action.error, gameStatus: 'idle' };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'SET_JOINING': return { ...state, gameStatus: 'joining', gameCode: action.gameCode, playerName: action.playerName, error: null };
    case 'JOINED_SUCCESS':
      return { ...state, gameStatus: 'lobby', sessionId: action.sessionId, participantId: action.participantId };
    case 'PLAYER_JOINED':
      return { ...state, participants: action.participants };
    case 'GAME_STARTED':
      return {
        ...state,
        gameStatus: 'playing',
        currentQuestion: action.question,
        questionIndex: action.questionIndex,
        totalQuestions: action.totalQuestions,
        hasAnswered: false,
        myAnswer: null,
        questionResult: null,
        answeredCount: 0,
        answeredTotal: action.totalParticipants || state.participants.length,
        participants: state.participants.map((participant) => ({
          ...participant,
          activity: { status: 'playing', label: 'Sedang mengerjakan soal 1' }
        }))
      };
    case 'NEW_QUESTION':
      return {
        ...state,
        gameStatus: 'playing',
        currentQuestion: action.question,
        questionIndex: action.questionIndex,
        totalQuestions: action.totalQuestions || state.totalQuestions,
        hasAnswered: false,
        myAnswer: null,
        questionResult: null,
        answeredCount: 0,
      };
    case 'ANSWER_SUBMITTED':
      return { ...state, hasAnswered: true, myAnswer: action.answer };
    case 'ANSWER_CONFIRMED':
      return { ...state, myScore: state.myScore + (action.points || 0) };
    case 'ANSWER_RECEIVED':
      if (!action.participant) {
        return { ...state, answeredCount: action.answeredCount, answeredTotal: action.totalParticipants || state.answeredTotal };
      }

      const activityParticipant = {
        ...action.participant,
        id: action.participant.id || action.participant.participantId
      };
      const participantExists = state.participants.some((participant) => (
        participant.id === activityParticipant.id || participant.id === activityParticipant.participantId
      ));

      return {
        ...state,
        answeredCount: action.answeredCount,
        answeredTotal: action.totalParticipants || state.answeredTotal,
        participants: participantExists
          ? state.participants.map((participant) => (
            participant.id === activityParticipant.id || participant.id === activityParticipant.participantId
              ? { ...participant, ...activityParticipant }
              : participant
          ))
          : [...state.participants, activityParticipant]
      };
    case 'QUESTION_RESULT':
      return {
        ...state,
        gameStatus: 'showing-result',
        questionResult: { correctAnswer: action.correctAnswer, explanation: action.explanation, leaderboard: action.leaderboard, questionId: action.questionId },
        leaderboard: action.leaderboard || [],
      };
    case 'GAME_OVER':
      return {
        ...state,
        gameStatus: 'result',
        finalResult: { leaderboard: action.leaderboard, sessionId: action.sessionId, rewards: action.rewards },
        leaderboard: action.leaderboard || [],
      };
    case 'LEADERBOARD_UPDATE':
      return { ...state, leaderboard: action.leaderboard };
    case 'HOST_SESSION_INFO':
      return {
        ...state,
        hostSession: action.session,
        participants: (action.participants || []).map((participant) => action.session?.status === 'playing' && participant.activity?.status === 'ready'
          ? { ...participant, activity: { status: 'playing', label: 'Sedang bermain' } }
          : participant)
      };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);
  const participantsRef = useRef([]);

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      const s = io(SOCKET_URL + '/quiz', { autoConnect: false, transports: ['websocket', 'polling'] });
      socketRef.current = s;

      s.on('join-error', ({ message }) => dispatch({ type: 'SET_ERROR', error: message }));
      s.on('error', ({ message }) => dispatch({ type: 'SET_ERROR', error: message }));

      s.on('joined-success', ({ participantId, sessionId }) => {
        dispatch({ type: 'JOINED_SUCCESS', participantId, sessionId });
      });

      s.on('player-joined', ({ participant }) => {
        participantsRef.current = [...participantsRef.current.filter(p => p.id !== participant.id), participant];
        dispatch({ type: 'PLAYER_JOINED', participants: [...participantsRef.current] });
      });

      s.on('session-info', ({ session, participants }) => {
        participantsRef.current = participants || [];
        dispatch({ type: 'HOST_SESSION_INFO', session, participants: participants || [] });
      });

      s.on('game-started', ({ question, questionIndex, totalQuestions }) => {
        dispatch({ type: 'GAME_STARTED', question, questionIndex, totalQuestions });
      });

      s.on('new-question', ({ question, questionIndex, totalQuestions }) => {
        dispatch({ type: 'NEW_QUESTION', question, questionIndex, totalQuestions });
      });

      s.on('answer-confirmed', ({ points, isCorrect }) => {
        dispatch({ type: 'ANSWER_CONFIRMED', points, isCorrect });
      });

      s.on('answer-received', (data) => {
        participantsRef.current = participantsRef.current.map((participant) => (
          participant.id === data.participantId
            ? {
              ...participant,
              ...data,
              id: participant.id,
              activity: data.activity || participant.activity
            }
            : participant
        ));
        if (!participantsRef.current.some((participant) => participant.id === data.participantId)) {
          participantsRef.current = [...participantsRef.current, { ...data, id: data.participantId }];
        }
        dispatch({ type: 'PLAYER_JOINED', participants: [...participantsRef.current] });
        dispatch({ type: 'ANSWER_RECEIVED', ...data, participant: data });
      });

      s.on('game-over', (data) => {
        dispatch({ type: 'GAME_OVER', ...data });
      });

      s.on('leaderboard-update', ({ leaderboard }) => {
        dispatch({ type: 'LEADERBOARD_UPDATE', leaderboard });
      });
    }
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    return socketRef.current;
  }, []);

  const joinGame = useCallback((gameCode, playerName) => {
    dispatch({ type: 'SET_JOINING', gameCode, playerName });
    const socket = getSocket();
    socket.emit('join-game', { gameCode, playerName });
  }, [getSocket]);

  const submitAnswer = useCallback((answer, responseTime, sessionId, participantId, questionId) => {
    dispatch({ type: 'ANSWER_SUBMITTED', answer });
    const socket = getSocket();
    socket.emit('submit-answer', { sessionId, participantId, questionId, answer, responseTime });
  }, [getSocket]);

  const hostConnect = useCallback((sessionId, token) => {
    const socket = getSocket();
    socket.emit('host-connect', { sessionId, token });
  }, [getSocket]);

  const startGame = useCallback((sessionId, token) => {
    getSocket().emit('start-game', { sessionId, token });
  }, [getSocket]);

  const nextQuestion = useCallback((sessionId, token) => {
    getSocket().emit('next-question', { sessionId, token });
  }, [getSocket]);

  const showResult = useCallback((sessionId, token) => {
    getSocket().emit('show-result', { sessionId, token });
  }, [getSocket]);

  const endGame = useCallback((sessionId, token) => {
    getSocket().emit('end-game', { sessionId, token });
  }, [getSocket]);

  const resetGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    participantsRef.current = [];
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  return (
    <QuizContext.Provider value={{
      ...state,
      joinGame, submitAnswer, hostConnect, startGame,
      nextQuestion, showResult, endGame, resetGame, clearError,
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz harus digunakan di dalam QuizProvider');
  return ctx;
}
