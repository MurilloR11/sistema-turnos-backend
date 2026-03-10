import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { initializeSocketIO } from './socket';
import { healthRoute, turnosRoutes } from './routes';

/**
 * Main server entry point
 * 
 * Bootstraps Hono HTTP server + Socket.IO on the same port
 */

// ============ Initialize Hono App ============
const app = new Hono();

// ============ Global Middleware ============
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ============ Base Routes ============
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sistema de Turnos - Backend</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 50px auto; padding: 0 20px; }
          h1 { color: #333; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Sistema de Turnos - Backend</h1>
        <p>Server is running! 🚀</p>
        <ul>
          <li><a href="/api/health">Health Check</a></li>
          <li><a href="/api/turnos">Ver Turnos</a></li>
        </ul>
        <p>Socket.IO endpoint: <code>ws://localhost:3000</code></p>
      </body>
    </html>
  `);
});

// ============ Start Server ============
const port = Number(process.env.PORT) || 3000;

console.log('🚀 Starting server...');

const server = serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ HTTP Server listening on http://localhost:${info.port}`);
});

// ============ Initialize Socket.IO ============
const io = initializeSocketIO(server);

// ============ Mount HTTP Routes (after Socket.IO init) ============
// This ensures routes have access to the io instance
app.route('/', healthRoute(io));
app.route('/', turnosRoutes(io));

console.log(`✅ Socket.IO Server ready on ws://localhost:${port}`);
console.log('📡 Available endpoints:');
console.log('  - GET  /api/health');
console.log('  - GET  /api/turnos');
console.log('  - GET  /api/turnos/:id');
console.log('  - POST /api/turnos');
console.log('  - PUT  /api/turnos/:id');
console.log('  - DELETE /api/turnos/:id');
console.log('\n🔌 Socket.IO events:');
console.log('  - chat:message, chat:join_room, chat:leave_room');
console.log('  - presence:online, presence:offline, presence:typing');
console.log('  - turnos:subscribe, turnos:unsubscribe');

// ============ Graceful Shutdown ============
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  io.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  io.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});

// Export for testing or programmatic use
export { app, io, server };
