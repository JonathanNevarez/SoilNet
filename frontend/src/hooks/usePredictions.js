import { useState, useEffect, useRef } from 'react';
import { predictNodeHumidity } from '../services/predictionService';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const RETRY_COOLDOWN = 60 * 1000; // 1 minuto
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

const SOIL_THRESHOLDS = {
  SANDY: { dry: 10, medium_max: 20, optimal_max: 30, excess: 30 },
  LOAM:  { dry: 15, medium_max: 30, optimal_max: 40, excess: 40 },
  CLAY:  { dry: 25, medium_max: 40, optimal_max: 50, excess: 50 }
};

export function usePredictions(nodes) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef({});
  const inFlight = useRef({});
  const lastAttempt = useRef({});
  const lastFetch = useRef(0);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    let cancelled = false;

    const fetchPredictions = async () => {
      const now = new Date();
      if (now.getTime() - lastFetch.current < REFRESH_INTERVAL) return;
      lastFetch.current = now.getTime();

      setLoading(true);
      const currentHour = now.getHours();
      const jsDay = now.getDay();
      const pyDay = jsDay === 0 ? 6 : jsDay - 1;

      const newPredictions = [];

      for (const node of nodes) {
        try {
          if (!node.lastReading) continue;

          const nodeId = node.nodeId;
          const cached = cache.current[nodeId];
          const last = lastAttempt.current[nodeId];

          // Cache
          if (cached && (now.getTime() - cached.timestamp < CACHE_DURATION)) {
            newPredictions.push(cached.data);
            continue;
          }

          if (inFlight.current[nodeId]) {
            if (cached && cached.data) newPredictions.push(cached.data);
            continue;
          }

          if (last && (now.getTime() - last < RETRY_COOLDOWN)) {
            if (cached && cached.data) newPredictions.push(cached.data);
            continue;
          }

          inFlight.current[nodeId] = true;
          lastAttempt.current[nodeId] = now.getTime();

          const payload = {
            humidity_percent: node.lastReading.humidity_percent,
            raw_value: node.lastReading.raw_value,
            rssi: node.lastReading.rssi,
            voltage: node.lastReading.voltage,
            sampling_interval: node.lastReading.sampling_interval,
            hour: currentHour,
            day_of_week: pyDay
          };

          const predictedValue = await predictNodeHumidity(payload);

          if (typeof predictedValue !== "number" || isNaN(predictedValue)) {
            console.warn("Prediccion invalida para nodo", nodeId);
            continue;
          }

          const interpretation = interpretPrediction(
            predictedValue,
            node.lastReading.humidity_percent,
            node.soil_type
          );

          const predictionData = {
            nodeId: node.nodeId,
            nodeName: node.name,
            currentHumidity: node.lastReading.humidity_percent,
            predictedHumidity: predictedValue,
            ...interpretation
          };

          cache.current[nodeId] = {
            data: predictionData,
            timestamp: now.getTime()
          };

          newPredictions.push(predictionData);
        } catch (err) {
          console.error(`Error prediciendo nodo ${node.nodeId}:`, err);
          continue; // clave: no rompe el render
        } finally {
          inFlight.current[node.nodeId] = false;
        }
      }

      if (cancelled) return;

      const priorityMap = { danger: 3, warning: 2, success: 1 };
      newPredictions.sort((a, b) => priorityMap[b.type] - priorityMap[a.type]);

      setPredictions(newPredictions);
      setLoading(false);
    };

    fetchPredictions();
    const intervalId = setInterval(fetchPredictions, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [nodes]);

  return { predictions, loading };
}

function interpretPrediction(predicted, current, soilType = 'LOAM') {
  const trend = predicted > current ? 'rising' : predicted < current ? 'falling' : 'stable';
  const t = SOIL_THRESHOLDS[soilType] || SOIL_THRESHOLDS.LOAM;

  if (predicted < t.dry) {
    return { message: "Sequia en proximas horas", action: "REGAR", type: "danger", trend };
  } else if (predicted < t.medium_max) {
    return { message: "Nivel bajo proyectado", action: "VIGILAR", type: "warning", trend };
  } else if (predicted > t.optimal_max) {
    return { message: "Riesgo de exceso", action: "DRENAJE", type: "warning", trend };
  } else {
    return { message: "Humedad estable", action: "MANTENER", type: "success", trend };
  }
}
