import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './jwt';
import { env } from '../config/env';

let io: SocketIOServer;

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = verifyToken(token);
      (socket as unknown as Record<string, unknown>).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as unknown as Record<string, unknown>).user as { userId: string; email: string };
    socket.join(`user:${user.userId}`);
    socket.join('all');
  });

  return io;
}

export function emitEvent(event: string, data: unknown, room?: string): void {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

export function emitUserEvent(userId: string, event: string, data: unknown): void {
  emitEvent(event, data, `user:${userId}`);
}

export function getIO(): SocketIOServer {
  return io;
}
