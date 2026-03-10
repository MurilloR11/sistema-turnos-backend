import type { TypedSocket } from '../../types/socket.types';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../types/socket.types';

/**
 * Online users tracking
 * Maps userId to array of socket IDs (for multiple tabs/devices)
 */
const onlineUsers = new Map<string, Set<string>>();

/**
 * Presence event handlers
 * 
 * Handles user online/offline status and typing indicators
 */
export const registerPresenceHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  socket: TypedSocket
) => {
  /**
   * Handle user coming online
   */
  socket.on('presence:online', () => {
    const userId = socket.data.userId!;
    
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    
    const userSockets = onlineUsers.get(userId)!;
    const wasOffline = userSockets.size === 0;
    
    userSockets.add(socket.id);
    
    // Only broadcast if this is the user's first connection
    if (wasOffline) {
      io.emit('presence:user_online', {
        userId,
        username: socket.data.username!,
      });
      
      console.log(`[Presence] ${socket.data.username} is now online`);
    }
  });
  
  /**
   * Handle user going offline
   */
  socket.on('presence:offline', () => {
    handleUserOffline(io, socket);
  });
  
  /**
   * Handle typing indicator
   */
  socket.on('presence:typing', (data) => {
    const { isTyping, room } = data;
    
    const typingPayload = {
      userId: socket.data.userId!,
      isTyping,
      room,
    };
    
    // Emit to room or broadcast to all
    if (room) {
      socket.to(room).emit('presence:user_typing', typingPayload);
    } else {
      socket.broadcast.emit('presence:user_typing', typingPayload);
    }
  });
  
  /**
   * Handle disconnect - update presence
   */
  socket.on('disconnect', () => {
    handleUserOffline(io, socket);
  });
};

/**
 * Helper function to handle user going offline
 */
function handleUserOffline(
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  socket: TypedSocket
) {
  const userId = socket.data.userId!;
  const userSockets = onlineUsers.get(userId);
  
  if (!userSockets) return;
  
  userSockets.delete(socket.id);
  
  // Only broadcast offline if this was the user's last connection
  if (userSockets.size === 0) {
    onlineUsers.delete(userId);
    
    io.emit('presence:user_offline', {
      userId,
      username: socket.data.username!,
    });
    
    console.log(`[Presence] ${socket.data.username} is now offline`);
  }
}

/**
 * Get all currently online users
 */
export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

/**
 * Get count of online users
 */
export function getOnlineUserCount(): number {
  return onlineUsers.size;
}
