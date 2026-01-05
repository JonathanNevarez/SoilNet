import { io } from 'socket.io-client';

/**
 * @file socket.js
 * @brief Servicio para la gestión de la conexión WebSocket.
 */

let socket;

/**
 * Inicializa la conexión WebSocket con el servidor.
 * Implementa patrón Singleton para evitar múltiples conexiones activas.
 *
 * @param {string} token - Token JWT para autenticación en el handshake.
 * @returns {object} Instancia del socket cliente.
 */
export const initiateSocketConnection = (token) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Verificación de conexión existente
  if (socket && socket.connected) return socket;

  socket = io(API_URL, {
    auth: {
      token: token
    },
    transports: ['websocket'], // Prioridad a WebSocket sobre polling
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

/**
 * Cierra la conexión WebSocket activa y limpia la instancia.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Obtiene la instancia actual del socket.
 * @returns {object|null} Instancia del socket o null si no está inicializado.
 */
export const getSocket = () => socket;