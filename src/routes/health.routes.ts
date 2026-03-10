import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { SocketIOServer } from '../socket';

/**
 * Health check route
 * 
 * Returns server health status and connected clients count
 */
export function healthRoute(io: SocketIOServer) {
  const app = new Hono();

  app.get('/api/health', (c) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      connectedClients: io.engine.clientsCount,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    return c.json(health);
  });

  return app;
}
