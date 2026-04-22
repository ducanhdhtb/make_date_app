
'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth';
import { SocketConnectionState } from './types';

let socket: Socket | null = null;
let state: SocketConnectionState = 'idle';
const listeners = new Set<(next: SocketConnectionState) => void>();

function getSocketBaseUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
}

function setState(next: SocketConnectionState) {
  state = next;
  listeners.forEach((listener) => listener(next));
}

function bindSocketEvents(instance: Socket) {
  instance.on('connect', () => setState('connected'));
  instance.on('disconnect', () => setState('disconnected'));
  instance.on('connect_error', () => setState('error'));
  instance.io.on('reconnect_attempt', () => setState('reconnecting'));
  instance.io.on('reconnect', () => setState('connected'));
}

export function getSocketClient() {
  const token = getAccessToken();
  if (!token) return null;

  if (!socket) {
    socket = io(`${getSocketBaseUrl()}/realtime`, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token }
    });
    bindSocketEvents(socket);
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) {
    setState(socket.active ? 'reconnecting' : 'connecting');
    socket.connect();
  }

  return socket;
}

export function disconnectSocketClient() {
  if (socket) {
    socket.disconnect();
    socket = null;
    setState('idle');
  }
}

export function subscribeSocketState(listener: (next: SocketConnectionState) => void) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getSocketState() {
  return state;
}

export function reconnectSocketClient() {
  if (!socket) return getSocketClient();
  setState('reconnecting');
  socket.connect();
  return socket;
}
