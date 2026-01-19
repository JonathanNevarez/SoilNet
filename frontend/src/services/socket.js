import { io } from 'socket.io-client';

let socket;

export const initiateSocketConnection = (token) => {
  // Lógica robusta: Si estamos en localhost, usa localhost.
  // Si estamos en producción (wikiclone.info), usa la URL del backend de Render explícitamente.
  let API_URL = "http://localhost:3000";
  
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    // Poner aquí TU URL EXACTA del backend en Render
    API_URL = "https://soilnet-backend.onrender.com";
  }

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
