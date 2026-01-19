import { useState, useEffect } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getLastReadingByNode } from "../services/readings.service";
import { useSocket } from "../services/SocketContext";
import { getCurrentUser } from "../services/authService";

/**
 * @file useNodesRealtime.js
 * @brief Hook personalizado para la gestión y sincronización de nodos en tiempo real.
 */

/**
 * Obtiene la lista de nodos del usuario y mantiene sus estados actualizados
 * mediante suscripciones a eventos de WebSockets.
 *
 * @returns {object} Objeto que contiene:
 * - nodes: Array de nodos con información enriquecida (lecturas, estado online).
 * - loading: Booleano que indica si la carga inicial está en proceso.
 */
export function useNodesRealtime() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { socket } = useSocket();

  // Inicialización del usuario actual
  useEffect(() => {
    const u = getCurrentUser();
    setUser(u || null);
  }, []);

  // Carga inicial de datos de nodos y enriquecimiento con últimas lecturas
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        const userNodes = await getUserNodes(user.uid);

        const enrichedNodes = await Promise.all(
          userNodes.map(async (node) => {
            try {
              // Intentamos obtener la última lectura
              const lastReading = await getLastReadingByNode(node.nodeId);
              if (!lastReading) return { ...node, lastReading: null, online: false };

              const lastTime = new Date(lastReading.createdAt).getTime();
              const online = Date.now() - lastTime < 35000; // 35 segundos

              return { ...node, lastReading, online };
            } catch (err) {
              return { ...node, lastReading: null, online: false };
            }
          })
        );

        setNodes(enrichedNodes);
      } catch (err) {
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(() => loadData(true), 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, [user]);

  // Suscripción a eventos de socket para actualizaciones en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleNewReading = (data) => {
      console.log("Socket: Nueva lectura recibida", data);
      
      setNodes((prev) =>
        prev.map((node) => {
          // Comparación robusta: asegurar que ambos sean strings y sin espacios
          // Usamos toLowerCase() para evitar problemas de mayúsculas/minúsculas
          if (String(node.nodeId).trim().toLowerCase() !== String(data.nodeId).trim().toLowerCase()) return node;

          const newReading = {
            humidity_percent: data.humidity,
            rssi: data.rssi,
            voltage: data.voltage,

            createdAt: new Date().toISOString(), // Usar siempre la hora del cliente al recibir por socket

            sampling_interval: data.sampling_interval || node.lastReading?.sampling_interval || 30,
          };

          // Al recibir datos en tiempo real, el nodo está DEFINITIVAMENTE online.
          // Usamos Date.now() local para evitar desincronización de relojes.
          const online = true;
          // Actualizamos createdAt al tiempo local de recepción para la lógica de timeout

          return { ...node, lastReading: newReading, online };
        })
      );
    };

    // Manejadores para eventos de estado (opcional, si el backend los envía)
    const handleNodeOnline = (data) => {
        console.log("Socket: Nodo online", data);
        setNodes(prev => prev.map(n => n.nodeId === data.nodeId ? { ...n, online: true } : n));
    };

    const handleNodeOffline = (data) => {
        console.log("Socket: Nodo offline", data);
        setNodes(prev => prev.map(n => n.nodeId === data.nodeId ? { ...n, online: false } : n));
    };

    socket.on("reading:new", handleNewReading);
    socket.on("node:online", handleNodeOnline);
    
    return () => {
        socket.off("reading:new", handleNewReading);
        socket.off("node:online", handleNodeOnline);
    };
  }, [socket]);

  // Intervalo para verificar la expiración del estado 'online' (heartbeat check)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (!node.lastReading) return node;

          // Calculamos el tiempo transcurrido desde la última lectura
          const lastTime = new Date(node.lastReading.createdAt).getTime();
          // Tolerancia: 35 segundos
          const online = Date.now() - lastTime < 35000;

          if (node.online !== online) return { ...node, online };
          return node;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { nodes, loading };
}
