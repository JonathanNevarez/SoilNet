import { io } from "socket.io-client";

// Usa tu variable de entorno o la URL directa de tu backend
const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  "https://soilnet-backend.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ["websocket", "polling"]
});

// Solo para debug (luego lo puedes quitar)
socket.on("connect", () => {
  console.log("🟢 Socket conectado:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Socket desconectado");
});

socket.on("connect_error", (err) => {
  console.log("⚠️ Error socket:", err.message);
});
