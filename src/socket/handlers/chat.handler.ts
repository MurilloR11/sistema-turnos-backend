import type { TypedSocket } from '../../types/socket.types';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../types/socket.types';

/**
 * Chat event handlers
 * 
 * Handles real-time chat functionality with room support
 */
export const registerChatHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  socket: TypedSocket
) => {
  /**
   * Handle incoming chat messages
   */
  socket.on('chat:message', (data) => {
    const { message, room } = data;
    
    if (!message || message.trim().length === 0) {
      socket.emit('error', {
        code: 'INVALID_MESSAGE',
        message: 'Message cannot be empty',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const messagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.data.userId!,
      username: socket.data.username!,
      message: message.trim(),
      room,
      timestamp: new Date().toISOString(),
    };
    
    // Emit to room or broadcast to all
    if (room && socket.data.rooms.has(room)) {
      io.to(room).emit('chat:message', messagePayload);
      console.log(`[Chat] Message sent to room ${room} by ${socket.data.username}`);
    } else {
      io.emit('chat:message', messagePayload);
      console.log(`[Chat] Broadcast message by ${socket.data.username}`);
    }
  });
  
  /**
   * Handle user joining a chat room
   */
  socket.on('chat:join_room', (data) => {
    const { roomId } = data;
    
    if (!roomId || roomId.trim().length === 0) {
      socket.emit('error', {
        code: 'INVALID_ROOM',
        message: 'Room ID cannot be empty',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    socket.join(roomId);
    socket.data.rooms.add(roomId);
    
    // Notify room members
    socket.to(roomId).emit('chat:user_joined', {
      userId: socket.data.userId!,
      username: socket.data.username!,
      room: roomId,
    });
    
    console.log(`[Chat] ${socket.data.username} joined room: ${roomId}`);
  });
  
  /**
   * Handle user leaving a chat room
   */
  socket.on('chat:leave_room', (data) => {
    const { roomId } = data;
    
    if (!roomId || !socket.data.rooms.has(roomId)) {
      return;
    }
    
    socket.leave(roomId);
    socket.data.rooms.delete(roomId);
    
    // Notify room members
    socket.to(roomId).emit('chat:user_left', {
      userId: socket.data.userId!,
      username: socket.data.username!,
      room: roomId,
    });
    
    console.log(`[Chat] ${socket.data.username} left room: ${roomId}`);
  });
};
