
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
  instance.on('connect', () => {
    console.log('[Socket] Connected');
    setState('connected');
  });
  instance.on('disconnect', () => {
    console.log('[Socket] Disconnected');
    setState('disconnected');
  });
  instance.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
    setState('error');
  });
  instance.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });
  instance.io.on('reconnect_attempt', () => {
    console.log('[Socket] Reconnecting...');
    setState('reconnecting');
  });
  instance.io.on('reconnect', () => {
    console.log('[Socket] Reconnected');
    setState('connected');
  });
}

export function getSocketClient() {
  const token = getAccessToken();
  if (!token) {
    console.warn('[Socket] No access token available');
    return null;
  }

  if (!socket) {
    console.log('[Socket] Creating new socket connection');
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
    // Update token if it changed
    if (socket.auth?.token !== token) {
      console.log('[Socket] Token updated, reconnecting...');
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect();
      }
    }
  }

  if (!socket.connected && !socket.connecting) {
    console.log('[Socket] Connecting...');
    setState(socket.active ? 'reconnecting' : 'connecting');
    socket.connect();
  }

  return socket;
}

export function disconnectSocketClient() {
  if (socket) {
    console.log('[Socket] Disconnecting');
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
  console.log('[Socket] Manual reconnect');
  setState('reconnecting');
  socket.connect();
  return socket;
}
