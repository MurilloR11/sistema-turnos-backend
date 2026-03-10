import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import type { TypedSocket } from '../../types/socket.types';

/**
 * Logging middleware for Socket.IO
 * 
 * Logs all socket connections, disconnections, and events
 */
export const loggingMiddleware = (
  socket: TypedSocket,
  next: (err?: ExtendedError) => void
) => {
  const socketId = socket.id;
  const timestamp = new Date().toISOString();
  
  console.log(`[Socket] 🔌 Connection: ${socketId} at ${timestamp}`);
  console.log(`[Socket] Client IP: ${socket.handshake.address}`);
  console.log(`[Socket] User Agent: ${socket.handshake.headers['user-agent']}`);
  
  // Log all incoming events
  const originalOnAny = socket.onAny || (() => {});
  socket.onAny((event, ...args) => {
    console.log(`[Socket] 📨 Event received: ${event} from ${socketId}`);
    if (args.length > 0) {
      console.log(`[Socket] Data:`, args[0]);
    }
  });
  
  // Log disconnection
  socket.on('disconnect', (reason) => {
    const duration = Date.now() - socket.data.connectedAt.getTime();
    const durationSec = (duration / 1000).toFixed(2);
    
    console.log(
      `[Socket] ⚡ Disconnection: ${socketId} after ${durationSec}s (reason: ${reason})`
    );
  });
  
  // Log errors
  socket.on('error', (error) => {
    console.error(`[Socket] ❌ Error on ${socketId}:`, error);
  });
  
  next();
};
