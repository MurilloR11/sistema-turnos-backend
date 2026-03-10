import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types/socket.types';
import {
  authMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
} from './middleware';
import {
  registerChatHandlers,
  registerPresenceHandlers,
  registerTurnosHandlers,
} from './handlers';

/**
 * Initialize and configure Socket.IO server
 * 
 * @param httpServer - Node.js HTTP server instance from Hono
 * @returns Configured Socket.IO server instance
 */
export function initializeSocketIO(httpServer: any) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    {},
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  console.log('[Socket.IO] Initializing server...');

  // ============ Apply Global Middleware ============
  io.use(loggingMiddleware);
  io.use(authMiddleware);
  io.use(rateLimitMiddleware({
    windowMs: 1000,
    maxRequests: 20,
  }));

  // ============ Connection Handler ============
  io.on('connection', (socket) => {
    console.log(
      `[Socket.IO] ✅ Client connected: ${socket.id} | User: ${socket.data.username}`
    );

    // Send connection confirmation
    socket.emit('connected', {
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Register all event handlers
    registerChatHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerTurnosHandlers(io, socket);

    // Global error handler
    socket.on('error', (error) => {
      console.error(`[Socket.IO] Error on socket ${socket.id}:`, error);
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket.IO] ❌ Client disconnected: ${socket.id} | Reason: ${reason}`
      );
    });
  });

  console.log('[Socket.IO] ✅ Server initialized successfully');

  return io;
}

/**
 * Get Socket.IO server instance
 * Useful for emitting events from HTTP routes
 */
export type { Server };
export type SocketIOServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;
