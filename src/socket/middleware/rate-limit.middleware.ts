import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import type { TypedSocket } from '../../types/socket.types';

/**
 * Rate limiting configuration per event
 */
interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 1000,  // 1 second
  maxRequests: 10,  // 10 requests per second
};

/**
 * Per-socket rate limit tracking
 */
const rateLimitMap = new Map<string, Map<string, number[]>>();

/**
 * Rate limiting middleware for Socket.IO
 * 
 * Prevents spam and abuse by limiting event frequency per socket
 */
export const rateLimitMiddleware = (
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
) => {
  return (socket: TypedSocket, next: (err?: ExtendedError) => void) => {
    const socketId = socket.id;
    
    // Initialize rate limit tracking for this socket
    if (!rateLimitMap.has(socketId)) {
      rateLimitMap.set(socketId, new Map());
    }
    
    // Wrap each event handler with rate limiting
    const originalOnEvent = socket.on.bind(socket);
    
    socket.on = function (event: any, listener: any) {
      const wrappedListener = (...args: any[]) => {
        // Skip rate limiting for disconnect and internal events
        if (event === 'disconnect' || event === 'disconnecting') {
          return listener.apply(this, args);
        }
        
        const now = Date.now();
        const eventMap = rateLimitMap.get(socketId);
        
        // If socket was already cleaned up, just execute the listener
        if (!eventMap) {
          return listener.apply(this, args);
        }
        
        if (!eventMap.has(event)) {
          eventMap.set(event, []);
        }
        
        const timestamps = eventMap.get(event)!;
        
        // Remove old timestamps outside the window
        const validTimestamps = timestamps.filter(
          (ts) => now - ts < config.windowMs
        );
        
        // Check if rate limit exceeded
        if (validTimestamps.length >= config.maxRequests) {
          console.warn(
            `[RateLimit] Socket ${socketId} exceeded rate limit for event: ${event}`
          );
          socket.emit('error', {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Please slow down.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        
        // Add current timestamp and update
        validTimestamps.push(now);
        eventMap.set(event, validTimestamps);
        
        // Call original listener
        listener.apply(this, args);
      };
      
      return originalOnEvent(event, wrappedListener);
    };
    
    // Cleanup on disconnect
    socket.on('disconnect', () => {
      rateLimitMap.delete(socketId);
    });
    
    next();
  };
};
