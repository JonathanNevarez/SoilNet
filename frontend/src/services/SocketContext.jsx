import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { initiateSocketConnection, disconnectSocket } from "./socket";

/**
 * @file SocketContext.jsx
 * @brief Contexto de React para la gestión global de la conexión WebSocket.
 */

const SocketContext = createContext(null);

/**
 * Hook personalizado para acceder a la instancia del socket y su estado.
 *
 * @returns {object} Contexto del socket que incluye:
 * - socket: Instancia de Socket.IO cliente.
 * - isConnected: Estado booleano de la conexión.
 * - connect: Función para iniciar la conexión manualmente.
 * - disconnect: Función para cerrar la conexión.
 */
export const useSocket = () => {
  return useContext(SocketContext);
};

/**
 * Proveedor del contexto de Socket.IO.
 * Gestiona el ciclo de vida de la conexión WebSocket y expone métodos de control.
 *
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element} El proveedor del contexto.
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Cierra la conexión WebSocket y limpia el estado
  const disconnect = useCallback(() => {
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
  }, []);

  // Inicializa la conexión WebSocket utilizando el token de autenticación almacenado
  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Aseguramos limpieza previa para evitar conexiones duplicadas
    disconnectSocket();

    const socketInstance = initiateSocketConnection(token);
    setSocket(socketInstance);

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.error("Error de conexión Socket:", err);
      setIsConnected(false);
    };

    socketInstance.off("connect");
    socketInstance.off("disconnect");
    socketInstance.off("connect_error");
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connect_error", onConnectError);
  }, []);

  useEffect(() => {
    // Intento de reconexión automática al montar el componente si existe una sesión válida
    if (localStorage.getItem("token")) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const value = useMemo(() => ({
    socket,
    isConnected,
    connect,
    disconnect
  }), [socket, isConnected, connect, disconnect]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
