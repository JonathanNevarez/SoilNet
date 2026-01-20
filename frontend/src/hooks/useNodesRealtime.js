import { useState, useEffect } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getLastReadingByNode } from "../services/readings.service";
import { getCurrentUser } from "../services/authService";
import { useSocket } from "../services/SocketContext";

/**
 * @file useNodesRealtime.js
 * @brief Hook personalizado para la gestión y sincronización de nodos en tiempo real.
 *
 * AHORA:
 * - Carga inicial por REST
 * - Actualización en tiempo real SOLO por SOCKET
 * - Cero polling pesado
 */
export function useNodesRealtime() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const { socket } = useSocket();

  // ===========================
  // 1. Obtener usuario actual
  // ===========================
  useEffect(() => {
    const u = getCurrentUser();
    setUser(u || null);
  }, []);

  // ===========================
  // 2. Carga inicial por REST
  // ===========================
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

              if (!lastReading) {
                return { ...node, lastReading: null, online: false };
              }

              const lastTime = new Date(lastReading.createdAt).getTime();
              const online = Date.now() - lastTime < 35000;

              return { ...node, lastReading, online };

            } catch (err) {
              console.error("Error cargando última lectura:", err);
              return { ...node, lastReading: null, online: false };
            }
          })
        );

        setNodes(enrichedNodes);

      } catch (err) {
        console.error("Error cargando nodos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // =====================================
  // 3. SOCKET → ACTUALIZACIÓN EN TIEMPO REAL
  // =====================================
  useEffect(() => {
    if (!socket) return;

    const handleNewReading = (data) => {
      console.log("📡 Nueva lectura por socket:", data);

      setNodes((prev) =>
        prev.map((node) => {
          if (node.nodeId !== data.nodeId) return node;

          const lastReading = {
            humidity_percent: data.humidity_percent,
            raw_value: data.raw_value,
            voltage: data.voltage,
            rssi: data.rssi,
            sampling_interval: data.sampling_interval,
            createdAt: data.sensor_timestamp,
          };

          return {
            ...node,
            lastReading,
            online: true,
          };
        })
      );
    };

    socket.on("reading:new", handleNewReading);

    return () => {
      socket.off("reading:new", handleNewReading);
    };
  }, [socket]);

  // =====================================
  // 4. SOLO CÁLCULO LOCAL DE ONLINE/OFFLINE
  // (Sin peticiones a red)
  // =====================================
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (!node.lastReading) return { ...node, online: false };

          const lastTime = new Date(
            node.lastReading.createdAt ||
            node.lastReading.sensor_timestamp
          ).getTime();

          const online = Date.now() - lastTime < 35000;

          return { ...node, online };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { nodes, loading };
}
