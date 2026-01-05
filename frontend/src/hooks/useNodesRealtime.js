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

    const loadData = async () => {
      try {
        setLoading(true);
        const userNodes = await getUserNodes(user.uid);

        const enrichedNodes = await Promise.all(
          userNodes.map(async (node) => {
            try {
              const lastReading = await getLastReadingByNode(node.nodeId);
              if (!lastReading) return { ...node, lastReading: null, online: false };

              const lastTime = new Date(lastReading.createdAt).getTime();
              const intervalMs = lastReading.sampling_interval * 1000;
              const online = Date.now() - lastTime < intervalMs * 2;

              return { ...node, lastReading, online };
            } catch (err) {
              return { ...node, lastReading: null, online: false };
            }
          })
        );

        setNodes(enrichedNodes);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Suscripción a eventos de socket para actualizaciones en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleNewReading = (data) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.nodeId !== data.nodeId) return node;

          const newReading = {
            humidity_percent: data.humidity,
            rssi: data.rssi,
            voltage: data.voltage,
            createdAt: data.createdAt || new Date().toISOString(),
            sampling_interval: data.sampling_interval,
          };

          const lastTime = new Date(newReading.createdAt).getTime();
          const intervalMs = newReading.sampling_interval * 1000;
          const online = Date.now() - lastTime < intervalMs * 2;

          return { ...node, lastReading: newReading, online };
        })
      );
    };

    socket.on("reading:new", handleNewReading);
    return () => socket.off("reading:new", handleNewReading);
  }, [socket]);

  // Intervalo para verificar la expiración del estado 'online' (heartbeat check)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (!node.lastReading) return node;

          const lastTime = new Date(node.lastReading.createdAt).getTime();
          const intervalMs = node.lastReading.sampling_interval * 1000;
          const online = Date.now() - lastTime < intervalMs * 2;

          if (node.online !== online) return { ...node, online };
          return node;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { nodes, loading };
}
