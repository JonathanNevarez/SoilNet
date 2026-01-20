import { useState, useEffect, useMemo } from "react";

/**
 * @file useSystemLatency.js
 * @brief Hook para el monitoreo de latencia del sistema IoT.
 */

/**
 * Calcula métricas de rendimiento de la red (latencia) basándose en datos históricos
 * y flujo de datos en tiempo real.
 *
 * @param {Array} nodes - Lista de nodos para filtrar el contexto de las métricas.
 * @returns {object} Métricas calculadas (avg, p95, max), datos crudos y estados de carga.
 */
export function useSystemLatency(nodes) {
  const [period, setPeriod] = useState(30);
  const [latencyData, setLatencyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtrado de nodos activos para contexto
  const activeNodes = nodes.filter(n => n.status === "online" || n.online);
  const activeNodesCount = activeNodes.length;

  useEffect(() => {
    const fetchLatency = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/readings/latency?period=${period}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Error al cargar datos de latencia");

        const data = await res.json();
        setLatencyData(data);
        setError(null);
      } catch (err) {
        setError("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatency();
    const interval = setInterval(fetchLatency, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, [period]);

  // Cálculo memoizado de estadísticas de latencia
  const metrics = useMemo(() => {
    if (!latencyData.length) return { avg: 0, p95: 0, max: 0 };

    const values = latencyData.map(d => d.latency_ms);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const sorted = [...values].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return { avg, p95, max };
  }, [latencyData]);

  // Estimación del intervalo promedio de envío de datos
  const avgInterval = useMemo(() => {
    if (!latencyData.length) return 0;
    return ((period * 60) / latencyData.length).toFixed(1);
  }, [latencyData, period]);

  return {
    period,
    setPeriod,
    latencyData,
    loading,
    error,
    metrics,
    avgInterval,
    activeNodesCount,
  };
}
