# Sistema de Turnos - Backend

Backend del sistema de gestión de turnos médicos construido con **Hono**, **Socket.IO** y **TypeScript**.

## 🚀 Características

- ✅ **HTTP API REST** con Hono (Node.js adapter)
- ✅ **WebSocket en tiempo real** con Socket.IO
- ✅ **TypeScript** con tipado completo
- ✅ **Arquitectura modular** y escalable
- ✅ **Middleware personalizados** (auth, rate limiting, logging)
- ✅ **Eventos en tiempo real** para chat, presencia y turnos

## 📁 Estructura del Proyecto

```
src/
├── server.ts                 # Punto de entrada principal
├── socket/
│   ├── index.ts             # Inicialización de Socket.IO
│   ├── handlers/            # Manejadores de eventos
│   │   ├── chat.handler.ts
│   │   ├── presence.handler.ts
│   │   └── turnos.handler.ts
│   └── middleware/          # Middleware de Socket.IO
│       ├── auth.middleware.ts
│       ├── rate-limit.middleware.ts
│       └── logging.middleware.ts
├── routes/                  # Rutas HTTP
│   ├── health.routes.ts
│   └── turnos.routes.ts
└── types/
    └── socket.types.ts      # Tipos TypeScript para Socket.IO
```

## 🛠️ Instalación

```bash
npm install
```

## 🏃 Desarrollo

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

## 📡 Endpoints HTTP

### Health Check
```
GET /api/health
```

Devuelve:
```json
{
  "status": "ok",
  "timestamp": "2026-03-09T...",
  "connectedClients": 5,
  "uptime": 123.45,
  "memory": {
    "used": 45,
    "total": 128
  }
}
```

### Turnos (Appointments)
```
GET    /api/turnos          # Listar todos los turnos
GET    /api/turnos/:id      # Obtener un turno
POST   /api/turnos          # Crear nuevo turno
PUT    /api/turnos/:id      # Actualizar turno
DELETE /api/turnos/:id      # Cancelar turno
```

## 🔌 Eventos Socket.IO

### Conectar al servidor
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-auth-token'  // opcional
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data.clientId);
});
```

### Eventos de Chat
```javascript
// Unirse a una sala
socket.emit('chat:join_room', { roomId: 'room-123' });

// Enviar mensaje
socket.emit('chat:message', { 
  message: 'Hola!', 
  room: 'room-123' 
});

// Escuchar mensajes
socket.on('chat:message', (data) => {
  console.log(data.username, ':', data.message);
});
```

### Eventos de Presencia
```javascript
// Marcar como online
socket.emit('presence:online');

// Indicar que está escribiendo
socket.emit('presence:typing', { 
  isTyping: true, 
  room: 'room-123' 
});

// Escuchar usuarios online
socket.on('presence:user_online', (data) => {
  console.log(data.username, 'está online');
});
```

### Eventos de Turnos
```javascript
// Suscribirse a actualizaciones
socket.emit('turnos:subscribe', { 
  doctorId: 'doctor-123',
  date: '2026-03-10'
});

// Escuchar nuevo turno
socket.on('turnos:created', (turno) => {
  console.log('Nuevo turno:', turno);
});

// Escuchar actualización
socket.on('turnos:updated', (turno) => {
  console.log('Turno actualizado:', turno);
});

// Escuchar cancelación
socket.on('turnos:cancelled', (data) => {
  console.log('Turno cancelado:', data.turnoId);
});
```

## 🔐 Autenticación

Por defecto, el servidor acepta conexiones anónimas. Para autenticación, pasa un token:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'admin' }  // Ejemplo
});
```

En producción, implementa validación JWT en `src/socket/middleware/auth.middleware.ts`.

## ⚙️ Configuración

Variables de entorno (opcional):

```bash
PORT=3000                    # Puerto del servidor
CORS_ORIGIN=*                # Origen CORS permitido
```

## 🏗️ Arquitectura

### Integración Hono + Socket.IO

El servidor utiliza `@hono/node-server` para obtener la instancia nativa de Node.js HTTP Server, que luego se pasa a Socket.IO:

```typescript
// src/server.ts
const server = serve({ fetch: app.fetch, port });
const io = initializeSocketIO(server);
```

Esto permite que ambos (HTTP y WebSocket) compartan el mismo puerto y proceso.

### Middleware de Socket.IO

Cada conexión Socket pasa por:
1. **Logging** - registra conexiones/desconexiones
2. **Auth** - valida token y adjunta datos de usuario
3. **Rate Limiting** - previene spam (20 req/segundo por defecto)

### Handlers Modulares

Los eventos se organizan por dominio:
- `chat.handler.ts` - mensajería en tiempo real
- `presence.handler.ts` - estado online/offline
- `turnos.handler.ts` - actualizaciones de turnos

### Type Safety

TypeScript con tipado completo para eventos Socket.IO:
- `ClientToServerEvents` - eventos del cliente
- `ServerToClientEvents` - eventos del servidor
- `SocketData` - datos adjuntos a cada socket

## 📝 Notas

- Los turnos se almacenan en memoria. En producción, usa una base de datos
- El rate limiting es por socket. Para rate limiting global, implementa Redis
- Los logs son a consola. En producción, usa un sistema de logging profesional

## 📄 Licencia

MIT


```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
