import type { Socket } from 'socket.io';

/**
 * Socket events emitted by clients
 */
export interface ClientToServerEvents {
  // Chat events
  'chat:message': (data: { message: string; room?: string }) => void;
  'chat:join_room': (data: { roomId: string }) => void;
  'chat:leave_room': (data: { roomId: string }) => void;
  
  // Presence events
  'presence:online': () => void;
  'presence:offline': () => void;
  'presence:typing': (data: { isTyping: boolean; room?: string }) => void;
  
  // Turnos events (appointments)
  'turnos:subscribe': (data: { doctorId?: string; date?: string }) => void;
  'turnos:unsubscribe': () => void;
}

/**
 * Socket events emitted by server
 */
export interface ServerToClientEvents {
  // Chat events
  'chat:message': (data: MessagePayload) => void;
  'chat:user_joined': (data: { userId: string; username: string; room: string }) => void;
  'chat:user_left': (data: { userId: string; username: string; room: string }) => void;
  
  // Presence events
  'presence:user_online': (data: { userId: string; username: string }) => void;
  'presence:user_offline': (data: { userId: string; username: string }) => void;
  'presence:user_typing': (data: { userId: string; isTyping: boolean; room?: string }) => void;
  
  // Turnos events
  'turnos:created': (data: TurnoPayload) => void;
  'turnos:updated': (data: TurnoPayload) => void;
  'turnos:cancelled': (data: { turnoId: number; reason?: string }) => void;
  
  // System events
  'error': (data: ErrorPayload) => void;
  'connected': (data: { clientId: string; timestamp: string }) => void;
}

/**
 * Socket data stored on each connection
 */
export interface SocketData {
  userId?: string;
  username?: string;
  sessionId: string;
  connectedAt: Date;
  rooms: Set<string>;
}

/**
 * Typed Socket with custom data
 */
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

// ============ Payload Types ============

export interface MessagePayload {
  id: string;
  userId: string;
  username: string;
  message: string;
  room?: string;
  timestamp: string;
}

export interface TurnoPayload {
  id: number;
  paciente: string;
  fecha: string;
  hora: string;
  doctor: string;
  especialidad: string;
  estado: 'confirmado' | 'pendiente' | 'cancelado';
  timestamp?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  timestamp: string;
}
