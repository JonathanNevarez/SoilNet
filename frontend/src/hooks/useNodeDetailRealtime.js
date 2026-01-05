import { useState, useEffect } from "react";
import { getNodeById } from "../services/nodes.service";
import { getLastReadingByNode, getReadingsHistory } from "../services/readings.service";
import { useSocket } from "../services/SocketContext";

/**
 * @file useNodeDetailRealtime.js
 * @brief Hook para la gestión de datos en la vista detallada de un nodo.
 */

/**
 * Orquesta la obtención de datos estáticos (info del nodo), históricos y en tiempo real
 * para un nodo específico.
 *
 * @param {string} nodeId - Identificador único del nodo.
 * @returns {object} Datos del nodo, última lectura, historial y funciones de control.
 */
export function useNodeDetailRealtime(nodeId) {
  const { socket } = useSocket();

  const [node, setNode] = useState(null);
  const [lastReading, setLastReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("24h");
  const [loading, setLoading] = useState(true);

  // Carga inicial de metadatos y última lectura conocida
  useEffect(() => {
    if (!nodeId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        const nodeData = await getNodeById(nodeId);
        setNode(nodeData);

        const last = await getLastReadingByNode(nodeId);
        setLastReading(last);

        await loadHistory("24h");
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [nodeId]);

  // Función para obtener datos históricos según el rango de tiempo seleccionado
  const loadHistory = async (selectedRange) => {
    if (!nodeId) return;

    const now = new Date();
    let from;
    if (selectedRange === "24h") from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (selectedRange === "7d") from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (selectedRange === "30d") from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const data = await getReadingsHistory(nodeId, from, selectedRange);
      const formatted = data.map(r => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : null,
      }));

      setHistory(formatted);
      setRange(selectedRange);
    } catch (err) {
    }
  };

  // Suscripción a actualizaciones en tiempo real específicas para este nodo
  useEffect(() => {
    if (!socket || !nodeId) return;

    const handleNewReading = (data) => {
      if (data.nodeId !== nodeId) return;

      const newReading = {
        humidity_percent: data.humidity,
        rssi: data.rssi,
        voltage: data.voltage,
        createdAt: data.createdAt || new Date().toISOString(),
        sampling_interval: data.sampling_interval ?? 30,
      };

      setLastReading(newReading);
      setHistory(prev => [...prev, newReading].slice(-50));
    };

    socket.on("reading:new", handleNewReading);
    return () => socket.off("reading:new", handleNewReading);
  }, [socket, nodeId]);

  // Verificación de estado de conexión basada en el intervalo de muestreo
  useEffect(() => {
    if (!lastReading) return;

    const interval = setInterval(() => {
      const intervalMs = (lastReading.sampling_interval ?? 30) * 1000;
      const lastTime = new Date(lastReading.createdAt).getTime();
      const isOnline = Date.now() - lastTime < intervalMs * 2;

      if (lastReading.online !== isOnline) {
        setLastReading(prev => ({ ...prev, online: isOnline }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastReading]);

  return { node, lastReading, history, range, loading, loadHistory };
}
