import { io } from 'socket.io-client';

let socket;

export const initiateSocketConnection = (token) => {
  // Detecta automáticamente la IP/Hostname actual o usa localhost como fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL, {
    auth: { token },

    transports: ['polling', 'websocket'],
    withCredentials: true,

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10000,

    timeout: 20000,
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      // the disconnection was initiated by the server, you need to reconnect manually
      socket.connect();
    }
    // else the socket will automatically try to reconnect
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
