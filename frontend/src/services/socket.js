import { io } from "socket.io-client";

let socket;

export const initiateSocketConnection = (token) => {
  const API_URL = import.meta.env.VITE_API_URL || "https://soilnet-backend.onrender.com";

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"], // 🔥 IMPORTANTE
    withCredentials: true,
    timeout: 20000
  });

  socket.on("connect", () => {
    console.log("🟢 Socket conectado");
  });

  socket.on("connect_error", (err) => {
    console.warn("🔴 Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🟠 Socket desconectado:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
