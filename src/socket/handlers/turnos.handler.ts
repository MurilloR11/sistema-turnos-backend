import type { TypedSocket } from '../../types/socket.types';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../types/socket.types';

/**
 * Turno subscription tracking
 * Maps socket ID to subscription filters
 */
const turnoSubscriptions = new Map<
  string,
  { doctorId?: string; date?: string }
>();

/**
 * Turnos (appointments) event handlers
 * 
 * Handles real-time appointment updates and notifications
 */
export const registerTurnosHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  socket: TypedSocket
) => {
  /**
   * Subscribe to turno updates
   */
  socket.on('turnos:subscribe', (data) => {
    const { doctorId, date } = data;
    
    turnoSubscriptions.set(socket.id, { doctorId, date });
    
    console.log(
      `[Turnos] ${socket.data.username} subscribed to updates:`,
      { doctorId, date }
    );
    
    // Join specific room for filtered updates
    if (doctorId) {
      socket.join(`doctor:${doctorId}`);
    }
    if (date) {
      socket.join(`date:${date}`);
    }
  });
  
  /**
   * Unsubscribe from turno updates
   */
  socket.on('turnos:unsubscribe', () => {
    const subscription = turnoSubscriptions.get(socket.id);
    
    if (subscription) {
      // Leave all subscribed rooms
      if (subscription.doctorId) {
        socket.leave(`doctor:${subscription.doctorId}`);
      }
      if (subscription.date) {
        socket.leave(`date:${subscription.date}`);
      }
      
      turnoSubscriptions.delete(socket.id);
      
      console.log(`[Turnos] ${socket.data.username} unsubscribed from updates`);
    }
  });
  
  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    turnoSubscriptions.delete(socket.id);
  });
};

/**
 * Emit turno created event to relevant subscribers
 */
export function emitTurnoCreated(
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  turno: any
) {
  const payload = {
    id: turno.id,
    paciente: turno.paciente,
    fecha: turno.fecha,
    hora: turno.hora,
    doctor: turno.doctor,
    especialidad: turno.especialidad,
    estado: turno.estado,
    timestamp: new Date().toISOString(),
  };
  
  // Emit to all subscribers
  io.emit('turnos:created', payload);
  
  console.log(`[Turnos] Emitted turno created: ${turno.id}`);
}

/**
 * Emit turno updated event to relevant subscribers
 */
export function emitTurnoUpdated(
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  turno: any
) {
  const payload = {
    id: turno.id,
    paciente: turno.paciente,
    fecha: turno.fecha,
    hora: turno.hora,
    doctor: turno.doctor,
    especialidad: turno.especialidad,
    estado: turno.estado,
    timestamp: new Date().toISOString(),
  };
  
  // Emit to all subscribers
  io.emit('turnos:updated', payload);
  
  console.log(`[Turnos] Emitted turno updated: ${turno.id}`);
}

/**
 * Emit turno cancelled event
 */
export function emitTurnoCancelled(
  io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  turnoId: number,
  reason?: string
) {
  io.emit('turnos:cancelled', { turnoId, reason });
  
  console.log(`[Turnos] Emitted turno cancelled: ${turnoId}`);
}
