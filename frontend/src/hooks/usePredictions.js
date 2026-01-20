import { useEffect, useState, useRef } from "react";
import { predictNodeHumidity } from "../services/predictionService";
import { useSocket } from "../services/SocketContext";

// Umbrales de humedad (%) por tipo de suelo
const SOIL_THRESHOLDS = {
  SANDY: { dry: 10, medium_max: 20, optimal_max: 30, excess: 30 }, // Arenoso
  LOAM:  { dry: 15, medium_max: 30, optimal_max: 40, excess: 40 }, // Franco
  CLAY:  { dry: 25, medium_max: 40, optimal_max: 50, excess: 50 }  // Arcilloso
};

export function usePredictions(nodes) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const cacheRef = useRef({});
  const { socket } = useSocket();

  // ============================
  // FUNCIÓN CENTRAL DE PREDICCIÓN
  // ============================
  const runPredictionForNode = async (node) => {
    if (!node?.lastReading) return null;

    const reading = node.lastReading;

    const payload = {
      humidity_percent: reading.humidity_percent,
      raw_value: reading.raw_value,
      rssi: reading.rssi,
      voltage: reading.voltage,
      sampling_interval: reading.sampling_interval,
      hour: new Date(reading.createdAt).getHours(),
      day_of_week: new Date(reading.createdAt).getDay(),
    };

    const cacheKey = `${node.nodeId}-${JSON.stringify(payload)}`;

    // ✅ CACHE: evitamos repetir misma predicción
    if (cacheRef.current[cacheKey]) {
      return cacheRef.current[cacheKey];
    }

    const predicted = await predictNodeHumidity(payload);

    if (predicted == null) return null;

    // ============================
    // LÓGICA DE NEGOCIO
    // ============================
    let type = "success";
    let action = "Óptimo";
    let trend = "stable";
    let message = "Humedad dentro del rango ideal";

    const current = reading.humidity_percent;

    if (predicted < SOIL_THRESHOLDS.dry) {
      type = "danger";
      action = "Regar";
      trend = "falling";
      message = "Se prevé sequedad crítica";
    } else if (predicted > SOIL_THRESHOLDS.optimal) {
      type = "warning";
      action = "Drenar";
      trend = "rising";
      message = "Exceso de humedad previsto";
    }

    const result = {
      nodeId: node.nodeId,
      nodeName: node.name,
      currentHumidity: current,
      predictedHumidity: predicted,
      type,
      action,
      trend,
      message,
      timestamp: Date.now(),
    };

    cacheRef.current[cacheKey] = result;

    return result;
  };

  // ==========================================
  // 1. PREDICCIÓN INICIAL AL CARGAR NODOS
  // ==========================================
  useEffect(() => {
    if (!nodes?.length) return;

    const runInitial = async () => {
      setLoading(true);

      const results = await Promise.all(
        nodes.map((n) => runPredictionForNode(n))
      );

      setPredictions(results.filter(Boolean));
      setLoading(false);
    };

    runInitial();
  }, [nodes]);

  // ==========================================
  // 2. 🔥 SOCKET → SOLO PREDICE EL NODO QUE CAMBIÓ
  // ==========================================
  useEffect(() => {
    if (!socket) return;

    const handleNewReading = async (data) => {
      console.log("🤖 Disparando predicción por socket:", data.nodeId);

      const node = nodes.find((n) => n.nodeId === data.nodeId);
      if (!node) return;

      const updatedNode = {
        ...node,
        lastReading: {
          ...data,
          createdAt: data.sensor_timestamp,
        },
      };

      const prediction = await runPredictionForNode(updatedNode);

      if (!prediction) return;

      setPredictions((prev) => {
        const others = prev.filter((p) => p.nodeId !== data.nodeId);
        return [...others, prediction];
      });
    };

    socket.on("reading:new", handleNewReading);

    return () => {
      socket.off("reading:new", handleNewReading);
    };
  }, [socket, nodes]);

  return { predictions, loading };
}