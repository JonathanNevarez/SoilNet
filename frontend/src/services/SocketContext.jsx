import { createContext, useContext, useMemo } from "react";

/**
 * @file SocketContext.jsx
 * @brief Contexto de React para la gestion global de la conexion WebSocket.
 * Socket.IO esta deshabilitado en este proyecto.
 */

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const value = useMemo(() => ({
    socket: null,
    isConnected: false,
    connect: () => {},
    disconnect: () => {}
  }), []);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
