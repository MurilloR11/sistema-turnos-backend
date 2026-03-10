import { Hono } from 'hono';
import type { SocketIOServer } from '../socket';
import { emitTurnoCreated, emitTurnoUpdated, emitTurnoCancelled } from '../socket/handlers';

/**
 * In-memory turnos store (replace with database in production)
 */
let turnos = [
  {
    id: 1,
    paciente: 'Juan Pérez',
    fecha: '2026-03-05',
    hora: '10:00',
    doctor: 'Dra. María González',
    especialidad: 'Cardiología',
    estado: 'confirmado' as const,
  },
  {
    id: 2,
    paciente: 'Ana Martínez',
    fecha: '2026-03-05',
    hora: '11:30',
    doctor: 'Dr. Carlos Rodríguez',
    especialidad: 'Pediatría',
    estado: 'pendiente' as const,
  },
  {
    id: 3,
    paciente: 'Roberto Silva',
    fecha: '2026-03-06',
    hora: '09:00',
    doctor: 'Dra. Laura Fernández',
    especialidad: 'Dermatología',
    estado: 'confirmado' as const,
  },
];

/**
 * Turnos routes
 * 
 * HTTP API for appointments management with Socket.IO integration
 */
export function turnosRoutes(io: SocketIOServer) {
  const app = new Hono();

  // Get all turnos
  app.get('/api/turnos', (c) => {
    return c.json({
      turnos,
      total: turnos.length,
    });
  });

  // Get single turno
  app.get('/api/turnos/:id', (c) => {
    const id = parseInt(c.req.param('id'));
    const turno = turnos.find((t) => t.id === id);

    if (!turno) {
      return c.json({ error: 'Turno not found' }, 404);
    }

    return c.json(turno);
  });

  // Create new turno
  app.post('/api/turnos', async (c) => {
    const body = await c.req.json();

    const newTurno = {
      id: Math.max(...turnos.map(t => t.id), 0) + 1,
      paciente: body.paciente,
      fecha: body.fecha,
      hora: body.hora,
      doctor: body.doctor,
      especialidad: body.especialidad,
      estado: body.estado || 'pendiente' as const,
    };

    turnos.push(newTurno);

    // Emit Socket.IO event
    emitTurnoCreated(io, newTurno);

    return c.json(newTurno, 201);
  });

  // Update turno
  app.put('/api/turnos/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const index = turnos.findIndex((t) => t.id === id);

    if (index === -1) {
      return c.json({ error: 'Turno not found' }, 404);
    }

    const updatedTurno = {
      ...turnos[index],
      ...body,
      id, // Ensure ID doesn't change
    };

    turnos[index] = updatedTurno;

    // Emit Socket.IO event
    emitTurnoUpdated(io, updatedTurno);

    return c.json(updatedTurno);
  });

  // Cancel turno
  app.delete('/api/turnos/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const index = turnos.findIndex((t) => t.id === id);

    if (index === -1) {
      return c.json({ error: 'Turno not found' }, 404);
    }

    // Mark as cancelled instead of deleting
    turnos[index].estado = 'cancelado';

    // Emit Socket.IO event
    emitTurnoCancelled(io, id, 'Cancelled by user');

    return c.json({ success: true, id });
  });

  return app;
}
