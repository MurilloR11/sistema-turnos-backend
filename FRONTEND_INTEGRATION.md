# Frontend Integration Guide - Sistema de Turnos

Este documento contiene toda la información necesaria para conectar tu frontend al backend Socket.IO + Hono.

---

## 📋 Pre-requisitos

Asegúrate de que el backend esté corriendo:

```bash
cd sistema-turnos-backend
npm run dev
```

Deberías ver:
```
✅ HTTP Server listening on http://localhost:3000
✅ Socket.IO Server ready on ws://localhost:3000
```

---

## 🚀 Instalación en el Frontend

### Para React/Next.js/Vue/Svelte

```bash
npm install socket.io-client
```

### Para vanilla JavaScript

```html
<script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
```

---

## 🔌 Conexión Básica

### React (TypeScript)

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

interface ServerToClientEvents {
  connected: (data: { clientId: string; timestamp: string }) => void;
  'chat:message': (data: MessagePayload) => void;
  'chat:user_joined': (data: UserEvent) => void;
  'chat:user_left': (data: UserEvent) => void;
  'presence:user_online': (data: { userId: string; username: string }) => void;
  'presence:user_offline': (data: { userId: string; username: string }) => void;
  'presence:user_typing': (data: { userId: string; isTyping: boolean; room?: string }) => void;
  'turnos:created': (data: TurnoPayload) => void;
  'turnos:updated': (data: TurnoPayload) => void;
  'turnos:cancelled': (data: { turnoId: number; reason?: string }) => void;
  error: (data: ErrorPayload) => void;
}

interface ClientToServerEvents {
  'chat:message': (data: { message: string; room?: string }) => void;
  'chat:join_room': (data: { roomId: string }) => void;
  'chat:leave_room': (data: { roomId: string }) => void;
  'presence:online': () => void;
  'presence:offline': () => void;
  'presence:typing': (data: { isTyping: boolean; room?: string }) => void;
  'turnos:subscribe': (data: { doctorId?: string; date?: string }) => void;
  'turnos:unsubscribe': () => void;
}

interface MessagePayload {
  id: string;
  userId: string;
  username: string;
  message: string;
  room?: string;
  timestamp: string;
}

interface TurnoPayload {
  id: number;
  paciente: string;
  fecha: string;
  hora: string;
  doctor: string;
  especialidad: string;
  estado: 'confirmado' | 'pendiente' | 'cancelado';
  timestamp?: string;
}

interface ErrorPayload {
  code: string;
  message: string;
  timestamp: string;
}

interface UserEvent {
  userId: string;
  username: string;
  room: string;
}

// Crear conexión Socket.IO con tipo seguro
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  auth: {
    token: 'user_demo', // Reemplazar con tu token real de autenticación
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Event listeners de conexión
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connected', (data) => {
  console.log('🎉 Server confirmed connection:', data);
});

export default socket;
```

---

## 📱 Ejemplos de Uso por Funcionalidad

### 1. Sistema de Chat

```typescript
// src/hooks/useChat.ts
import { useEffect, useState } from 'react';
import socket from '../services/socket';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
}

export function useChat(roomId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Escuchar estado de conexión
    setIsConnected(socket.connected);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Unirse a una sala si se proporciona roomId
    if (roomId) {
      socket.emit('chat:join_room', { roomId });
      console.log(`Joined room: ${roomId}`);
    }

    // Escuchar mensajes nuevos
    socket.on('chat:message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Escuchar usuarios que se unen
    socket.on('chat:user_joined', (data) => {
      console.log(`${data.username} joined ${data.room}`);
    });

    // Escuchar usuarios que se van
    socket.on('chat:user_left', (data) => {
      console.log(`${data.username} left ${data.room}`);
    });

    // Cleanup
    return () => {
      if (roomId) {
        socket.emit('chat:leave_room', { roomId });
      }
      socket.off('chat:message');
      socket.off('chat:user_joined');
      socket.off('chat:user_left');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [roomId]);

  const sendMessage = (message: string) => {
    if (!message.trim()) return;
    
    socket.emit('chat:message', { 
      message: message.trim(), 
      room: roomId 
    });
  };

  return { messages, sendMessage, isConnected };
}
```

**Componente de Chat:**

```tsx
// src/components/Chat.tsx
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';

export function Chat({ roomId }: { roomId?: string }) {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, sendMessage, isConnected } = useChat(roomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="chat-container">
      <div className="status">
        {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        {roomId && ` | Sala: ${roomId}`}
      </div>
      
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.username}:</strong> {msg.message}
            <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected || !inputMessage.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
```

---

### 2. Indicadores de Presencia (Online/Offline)

```typescript
// src/hooks/usePresence.ts
import { useEffect, useState } from 'react';
import socket from '../services/socket';

interface User {
  userId: string;
  username: string;
}

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Marcar como online al conectar
    socket.emit('presence:online');

    // Escuchar usuarios online
    socket.on('presence:user_online', (data) => {
      setOnlineUsers((prev) => {
        if (prev.some(u => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    });

    // Escuchar usuarios offline
    socket.on('presence:user_offline', (data) => {
      setOnlineUsers((prev) => prev.filter(u => u.userId !== data.userId));
    });

    // Escuchar indicadores de escritura
    socket.on('presence:user_typing', (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    // Marcar como offline al desmontar
    return () => {
      socket.emit('presence:offline');
      socket.off('presence:user_online');
      socket.off('presence:user_offline');
      socket.off('presence:user_typing');
    };
  }, []);

  const setTyping = (isTyping: boolean, room?: string) => {
    socket.emit('presence:typing', { isTyping, room });
  };

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    typingUsers: Array.from(typingUsers),
    setTyping,
  };
}
```

**Componente de Indicador de Escritura:**

```tsx
// src/components/TypingIndicator.tsx
import React, { useEffect, useState } from 'react';
import { usePresence } from '../hooks/usePresence';

export function ChatWithTyping({ roomId }: { roomId?: string }) {
  const [inputValue, setInputValue] = useState('');
  const { typingUsers, setTyping } = usePresence();
  
  // Debounce del indicador de escritura
  useEffect(() => {
    if (inputValue.length > 0) {
      setTyping(true, roomId);
      
      const timeout = setTimeout(() => {
        setTyping(false, roomId);
      }, 2000);
      
      return () => clearTimeout(timeout);
    } else {
      setTyping(false, roomId);
    }
  }, [inputValue, roomId]);

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Escribe..."
      />
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.length === 1 
            ? 'Alguien está escribiendo...' 
            : `${typingUsers.length} personas están escribiendo...`}
        </div>
      )}
    </div>
  );
}
```

---

### 3. Gestión de Turnos en Tiempo Real

```typescript
// src/hooks/useTurnos.ts
import { useEffect, useState } from 'react';
import socket from '../services/socket';

interface Turno {
  id: number;
  paciente: string;
  fecha: string;
  hora: string;
  doctor: string;
  especialidad: string;
  estado: 'confirmado' | 'pendiente' | 'cancelado';
}

export function useTurnos(doctorId?: string, date?: string) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar turnos iniciales vía HTTP
    fetchTurnos();

    // Suscribirse a actualizaciones en tiempo real
    socket.emit('turnos:subscribe', { doctorId, date });

    // Escuchar nuevo turno
    socket.on('turnos:created', (turno) => {
      setTurnos((prev) => [...prev, turno]);
      // Notificación opcional
      showNotification(`Nuevo turno: ${turno.paciente}`);
    });

    // Escuchar actualización de turno
    socket.on('turnos:updated', (turno) => {
      setTurnos((prev) =>
        prev.map((t) => (t.id === turno.id ? turno : t))
      );
      showNotification(`Turno actualizado: ${turno.paciente}`);
    });

    // Escuchar cancelación de turno
    socket.on('turnos:cancelled', ({ turnoId, reason }) => {
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === turnoId ? { ...t, estado: 'cancelado' as const } : t
        )
      );
      showNotification(`Turno cancelado: ${reason || 'Sin razón'}`);
    });

    return () => {
      socket.emit('turnos:unsubscribe');
      socket.off('turnos:created');
      socket.off('turnos:updated');
      socket.off('turnos:cancelled');
    };
  }, [doctorId, date]);

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/turnos');
      const data = await response.json();
      setTurnos(data.turnos || []);
    } catch (error) {
      console.error('Error fetching turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTurno = async (turnoData: Omit<Turno, 'id'>) => {
    try {
      const response = await fetch('http://localhost:3000/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turnoData),
      });
      return await response.json();
      // No necesitas actualizar el estado, Socket.IO lo hará automáticamente
    } catch (error) {
      console.error('Error creating turno:', error);
      throw error;
    }
  };

  const updateTurno = async (id: number, updates: Partial<Turno>) => {
    try {
      const response = await fetch(`http://localhost:3000/api/turnos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return await response.json();
      // Socket.IO actualizará el estado automáticamente
    } catch (error) {
      console.error('Error updating turno:', error);
      throw error;
    }
  };

  const cancelTurno = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/turnos/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
      // Socket.IO actualizará el estado automáticamente
    } catch (error) {
      console.error('Error cancelling turno:', error);
      throw error;
    }
  };

  return {
    turnos,
    loading,
    createTurno,
    updateTurno,
    cancelTurno,
    refetch: fetchTurnos,
  };
}

function showNotification(message: string) {
  // Implementar con tu sistema de notificaciones preferido
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Sistema de Turnos', { body: message });
  }
}
```

**Componente de Lista de Turnos:**

```tsx
// src/components/TurnosList.tsx
import React from 'react';
import { useTurnos } from '../hooks/useTurnos';

export function TurnosList({ doctorId, date }: { doctorId?: string; date?: string }) {
  const { turnos, loading, updateTurno, cancelTurno } = useTurnos(doctorId, date);

  if (loading) return <div>Cargando turnos...</div>;

  return (
    <div className="turnos-list">
      <h2>Turnos Programados ({turnos.length})</h2>
      {turnos.map((turno) => (
        <div key={turno.id} className={`turno-card ${turno.estado}`}>
          <div className="turno-info">
            <h3>{turno.paciente}</h3>
            <p>📅 {turno.fecha} a las {turno.hora}</p>
            <p>👨‍⚕️ {turno.doctor} - {turno.especialidad}</p>
            <span className={`badge ${turno.estado}`}>
              {turno.estado.toUpperCase()}
            </span>
          </div>
          
          {turno.estado !== 'cancelado' && (
            <div className="turno-actions">
              {turno.estado === 'pendiente' && (
                <button onClick={() => updateTurno(turno.id, { estado: 'confirmado' })}>
                  ✅ Confirmar
                </button>
              )}
              <button onClick={() => cancelTurno(turno.id)}>
                ❌ Cancelar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Ejemplo Completo - App.tsx

```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import socket from './services/socket';
import { Chat } from './components/Chat';
import { TurnosList } from './components/TurnosList';
import { usePresence } from './hooks/usePresence';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const { onlineUsers, onlineCount } = usePresence();

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Sistema de Turnos Médicos</h1>
        <div className="status-bar">
          <span className={isConnected ? 'online' : 'offline'}>
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
          <span>👥 {onlineCount} usuarios online</span>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <h3>Usuarios Online</h3>
          <ul>
            {onlineUsers.map((user) => (
              <li key={user.userId}>
                🟢 {user.username}
              </li>
            ))}
          </ul>
        </aside>

        <main>
          <section className="turnos-section">
            <TurnosList />
          </section>

          <section className="chat-section">
            <div className="room-selector">
              <button onClick={() => setCurrentRoom('general')}>
                General
              </button>
              <button onClick={() => setCurrentRoom('urgencias')}>
                Urgencias
              </button>
              <button onClick={() => setCurrentRoom('consultas')}>
                Consultas
              </button>
            </div>
            <Chat roomId={currentRoom} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
```

---

## 🌐 Ejemplo con Vanilla JavaScript

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema de Turnos - Frontend</title>
  <script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .status { padding: 10px; margin-bottom: 20px; border-radius: 5px; }
    .status.connected { background: #d4edda; color: #155724; }
    .status.disconnected { background: #f8d7da; color: #721c24; }
    .messages { height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
    .message { margin: 5px 0; padding: 8px; background: #f0f0f0; border-radius: 5px; }
    input[type="text"] { width: 70%; padding: 10px; }
    button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
    button:disabled { background: #ccc; cursor: not-allowed; }
  </style>
</head>
<body>
  <h1>Sistema de Turnos - Chat en Tiempo Real</h1>
  
  <div id="status" class="status disconnected">
    🔴 Desconectado
  </div>

  <div id="messages" class="messages"></div>

  <form id="chatForm">
    <input type="text" id="messageInput" placeholder="Escribe un mensaje..." disabled>
    <button type="submit" id="sendBtn" disabled>Enviar</button>
  </form>

  <script>
    // Conectar al servidor Socket.IO
    const socket = io('http://localhost:3000', {
      auth: {
        token: 'usuario_demo'
      }
    });

    const statusDiv = document.getElementById('status');
    const messagesDiv = document.getElementById('messages');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // Manejar conexión
    socket.on('connect', () => {
      console.log('Conectado:', socket.id);
      statusDiv.className = 'status connected';
      statusDiv.textContent = '🟢 Conectado';
      messageInput.disabled = false;
      sendBtn.disabled = false;
      
      // Marcar como online
      socket.emit('presence:online');
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('Desconectado');
      statusDiv.className = 'status disconnected';
      statusDiv.textContent = '🔴 Desconectado';
      messageInput.disabled = true;
      sendBtn.disabled = true;
    });

    // Confirmar conexión del servidor
    socket.on('connected', (data) => {
      console.log('Servidor confirmó conexión:', data);
    });

    // Escuchar mensajes de chat
    socket.on('chat:message', (data) => {
      const messageEl = document.createElement('div');
      messageEl.className = 'message';
      const time = new Date(data.timestamp).toLocaleTimeString();
      messageEl.innerHTML = `<strong>${data.username}</strong> (${time}): ${data.message}`;
      messagesDiv.appendChild(messageEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // Escuchar eventos de turnos
    socket.on('turnos:created', (turno) => {
      console.log('Nuevo turno creado:', turno);
      alert(`Nuevo turno: ${turno.paciente} - ${turno.fecha} ${turno.hora}`);
    });

    socket.on('turnos:updated', (turno) => {
      console.log('Turno actualizado:', turno);
    });

    socket.on('turnos:cancelled', (data) => {
      console.log('Turno cancelado:', data);
      alert(`Turno #${data.turnoId} cancelado`);
    });

    // Manejar errores
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message}`);
    });

    // Enviar mensaje
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = messageInput.value.trim();
      
      if (message) {
        socket.emit('chat:message', { message });
        messageInput.value = '';
      }
    });

    // Suscribirse a actualizaciones de turnos
    socket.emit('turnos:subscribe', {});
  </script>
</body>
</html>
```

---

## 🔒 Autenticación Avanzada

Para implementar autenticación JWT real:

```typescript
// src/services/auth.ts
export async function login(username: string, password: string) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const { token } = await response.json();
  localStorage.setItem('auth_token', token);
  return token;
}

// src/services/socket.ts (modificado)
import { io } from 'socket.io-client';

function getAuthToken() {
  return localStorage.getItem('auth_token') || '';
}

export const socket = io('http://localhost:3000', {
  auth: {
    token: getAuthToken(),
  },
  // Reconectar con nuevo token si cambia
  autoConnect: false,
});

// Conectar manualmente después del login
export function connectSocket() {
  socket.auth = { token: getAuthToken() };
  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}
```

---

## 🧪 Testing de Conexión

Script rápido para probar la conexión:

```javascript
// test-connection.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: { token: 'test_user' }
});

socket.on('connect', () => {
  console.log('✅ Conectado:', socket.id);
  
  // Probar chat
  socket.emit('chat:message', { message: 'Hola desde el test!' });
  
  // Probar presencia
  socket.emit('presence:online');
  
  // Suscribirse a turnos
  socket.emit('turnos:subscribe', {});
});

socket.on('chat:message', (data) => {
  console.log('📨 Mensaje recibido:', data);
});

socket.on('turnos:created', (turno) => {
  console.log('🆕 Turno creado:', turno);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado');
});

socket.on('error', (error) => {
  console.error('⚠️ Error:', error);
});
```

Ejecutar con:
```bash
node test-connection.js
```

---

## 📊 Monitoreo y Debugging

### Ver conexiones activas:

```bash
curl http://localhost:3000/api/health
```

### Consola del navegador:

```javascript
// En las DevTools del navegador
console.log('Socket ID:', socket.id);
console.log('Connected:', socket.connected);
console.log('Transport:', socket.io.engine.transport.name); // websocket o polling
```

---

## 🚨 Manejo de Errores

```typescript
// src/hooks/useSocketError.ts
import { useEffect, useState } from 'react';
import socket from '../services/socket';

export function useSocketError() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    socket.on('error', (error) => {
      setErrors((prev) => [...prev, error.message]);
      
      // Auto-limpiar después de 5 segundos
      setTimeout(() => {
        setErrors((prev) => prev.slice(1));
      }, 5000);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setErrors((prev) => [...prev, 'Error de conexión. Reintentando...']);
    });

    return () => {
      socket.off('error');
      socket.off('connect_error');
    };
  }, []);

  return errors;
}
```

---

## 📚 Recursos Adicionales

- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [TypeScript Support](https://socket.io/docs/v4/typescript/)
- [Best Practices](https://socket.io/docs/v4/client-socket-instance/)

---

## ✅ Checklist de Integración

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] `socket.io-client` instalado en el frontend
- [ ] Servicio de socket creado con tipos TypeScript
- [ ] Manejo de conexión/desconexión implementado
- [ ] Eventos de chat funcionando
- [ ] Eventos de presencia funcionando
- [ ] Eventos de turnos funcionando
- [ ] Manejo de errores implementado
- [ ] UI actualizada en tiempo real
- [ ] Autenticación configurada (opcional)

---

**¡Listo! Tu frontend ahora puede conectarse completamente al backend Socket.IO + Hono.**
