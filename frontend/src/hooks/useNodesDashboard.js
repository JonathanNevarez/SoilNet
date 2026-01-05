import { useState, useEffect } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getCurrentUser } from "../services/authService";
import { getLastReadingByNode } from "../services/readings.service";
import { computeNodeAlerts } from "../utils/nodeAlerts";
import { useSocket } from "../services/SocketContext";

/**
 * @file useNodesDashboard.js
 * @brief Hook de lógica de negocio para el dashboard principal.
 */

/**
 * Gestiona la agregación de datos para el dashboard, incluyendo cálculo de alertas,
 * promedios de humedad y estado de conectividad en tiempo real.
 *
 * @returns {object} Estado de los nodos procesados y bandera de carga.
 */
export function useNodesDashboard() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Carga inicial y procesamiento de métricas derivadas (alertas, promedios)
  useEffect(() => {
    const loadNodes = async () => {
      const user = getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserNodes(user.uid);
        const enrichedNodes = await Promise.all(
          data.map(async (node) => {
            const lastReading = await getLastReadingByNode(node.nodeId);
            if (!lastReading) return node;

            const alerts = computeNodeAlerts(lastReading, node.soil_type);

            const lastTime = lastReading.createdAt
              ? new Date(lastReading.createdAt)
              : null;
            const intervalMs = (lastReading.sampling_interval ?? 5) * 1000;
            const online =
              lastTime && Date.now() - lastTime.getTime() < intervalMs * 2;

            const lecturas = [
              {
                humidity_percent: lastReading.humidity_percent,
                rssi: lastReading.rssi,
                createdAt: lastReading.createdAt,
                sampling_interval: lastReading.sampling_interval ?? 5,
              },
            ];

            const promedio =
              lecturas.reduce((sum, r) => sum + r.humidity_percent, 0) /
              lecturas.length;

            return {
              ...node,
              lecturas,
              lastHumidity: lastReading.humidity_percent,
              rssi: lastReading.rssi,
              online,
              alertsCount: alerts.length,
              promedio,
            };
          })
        );

        setNodes(enrichedNodes);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    loadNodes();
  }, []);

  // Manejo de eventos WebSocket para actualizaciones dinámicas
  useEffect(() => {
    if (!socket || loading) return;

    const handleNewReading = (data) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.nodeId !== data.nodeId) return node;

          const newReading = {
            humidity_percent: data.humidity,
            rssi: data.rssi,
            createdAt: data.createdAt || new Date().toISOString(),
            sampling_interval: data.sampling_interval ?? 5,
          };

          const lecturas = [...(node.lecturas || []), newReading].slice(-50);
          const promedio =
            lecturas.reduce((sum, r) => sum + r.humidity_percent, 0) / lecturas.length;

          const alerts = computeNodeAlerts(newReading, node.soil_type);

          return {
            ...node,
            lecturas,
            lastHumidity: data.humidity,
            rssi: data.rssi,
            online: true,
            alertsCount: alerts.length,
            promedio,
          };
        })
      );
    };

    const handleNodeOnline = ({ nodeId }) =>
      setNodes((prev) => prev.map(n => n.nodeId === nodeId ? { ...n, online: true } : n));

    const handleNodeOffline = ({ nodeId }) =>
      setNodes((prev) => prev.map(n => n.nodeId === nodeId ? { ...n, online: false } : n));

    socket.on("reading:new", handleNewReading);
    socket.on("node:online", handleNodeOnline);
    socket.on("node:offline", handleNodeOffline);

    return () => {
      socket.off("reading:new", handleNewReading);
      socket.off("node:online", handleNodeOnline);
      socket.off("node:offline", handleNodeOffline);
    };
  }, [socket, loading]);

  // Verificación periódica de inactividad de sensores
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (!node.lecturas?.length) return node;

          const lastReading = node.lecturas[node.lecturas.length - 1];
          const intervalMs = (lastReading.sampling_interval ?? 5) * 1000;
          const isOnline = Date.now() - new Date(lastReading.createdAt).getTime() < intervalMs * 2;

          if (node.online !== isOnline) return { ...node, online: isOnline };
          return node;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { nodes, loading };
}
