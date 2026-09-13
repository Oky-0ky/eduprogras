import { useRef } from 'react';
import { io } from 'socket.io-client';

export function useQuizSocket() {
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { autoConnect: false });
  }
  return socketRef.current;
}
