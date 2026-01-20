import { useState, useEffect } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getLastReadingByNode } from "../services/readings.service";
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
    // Restaurado el intervalo de 30s para actualización periódica (Polling)
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Intervalo local solo para actualizar el estado "online/offline" visualmente
  // (No hace peticiones a la red, solo chequea la última hora de lectura en memoria)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (!node.lastReading) return { ...node, online: false };

          // Calculamos el tiempo transcurrido desde la última lectura
          // Usamos new Date() para asegurar compatibilidad con strings ISO
          const lastTime = new Date(node.lastReading.createdAt || node.lastReading.sensor_timestamp).getTime();
          // Tolerancia: 35 segundos
          const online = Date.now() - lastTime < 35000;

          return { ...node, online };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { nodes, loading };
}
