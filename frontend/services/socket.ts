import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const url = base.replace(/\/api$/, '');
    socket = io(url, { transports: ['websocket'] });
  }
  return socket;
}

