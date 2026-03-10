import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import type { TypedSocket } from '../../types/socket.types';

/**
 * Authentication middleware for Socket.IO
 * 
 * Validates auth token and attaches user data to socket
 * In production, replace with JWT validation or session check
 */
export const authMiddleware = (
  socket: TypedSocket,
  next: (err?: ExtendedError) => void
) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  // TODO: In production, validate JWT or check session
  // For now, accept any token that exists
  if (!token) {
    // Allow anonymous connections with limited functionality
    socket.data.userId = `anonymous_${socket.id.substring(0, 8)}`;
    socket.data.username = 'Anónimo';
    socket.data.sessionId = socket.id;
    socket.data.connectedAt = new Date();
    socket.data.rooms = new Set();
    
    console.log(`[Auth] Anonymous connection: ${socket.data.userId}`);
    return next();
  }
  
  // Mock user authentication
  // In production: const decoded = jwt.verify(token, SECRET);
  const mockUser = {
    userId: token === 'admin' ? 'admin_001' : `user_${token}`,
    username: token === 'admin' ? 'Admin' : `Usuario ${token}`,
  };
  
  socket.data.userId = mockUser.userId;
  socket.data.username = mockUser.username;
  socket.data.sessionId = socket.id;
  socket.data.connectedAt = new Date();
  socket.data.rooms = new Set();
  
  console.log(`[Auth] Authenticated: ${socket.data.username} (${socket.data.userId})`);
  next();
};
