import { useState, useEffect, useRef } from 'react';
import { predictNodeHumidity } from '../services/predictionService';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Umbrales de humedad (%) por tipo de suelo
const SOIL_THRESHOLDS = {
  SANDY: { dry: 10, medium_max: 20, optimal_max: 30, excess: 30 }, // Arenoso
  LOAM:  { dry: 15, medium_max: 30, optimal_max: 40, excess: 40 }, // Franco
  CLAY:  { dry: 25, medium_max: 40, optimal_max: 50, excess: 50 }  // Arcilloso
};

export function usePredictions(nodes) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Cache persistente entre renderizados: { nodeId: { value, timestamp } }
  const cache = useRef({});

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const fetchPredictions = async () => {
      setLoading(true);
      const now = new Date();
      const currentHour = now.getHours();
      // Ajuste de día para modelo Python (Lunes=0...Domingo=6)
      const jsDay = now.getDay(); 
      const pyDay = jsDay === 0 ? 6 : jsDay - 1;

      const newPredictions = [];

      // Procesamos cada nodo
      for (const node of nodes) {
        // Validar que tenga lectura reciente
        if (!node.lastReading) continue;

        const nodeId = node.nodeId;
        const cached = cache.current[nodeId];

        // 1. Verificar Caché
        if (cached && (now.getTime() - cached.timestamp < CACHE_DURATION)) {
          newPredictions.push(cached.data);
          continue;
        }

        // 2. Preparar Payload
        const payload = {
          humidity_percent: node.lastReading.humidity_percent,
          raw_value: node.lastReading.raw_value,
          rssi: node.lastReading.rssi,
          voltage: node.lastReading.voltage,
          sampling_interval: node.lastReading.sampling_interval,
          hour: currentHour,
          day_of_week: pyDay
        };

        // 3. Llamar API
        const predictedValue = await predictNodeHumidity(payload);

        if (predictedValue !== null) {
          const interpretation = interpretPrediction(predictedValue, node.lastReading.humidity_percent, node.soil_type);
          
          const predictionData = {
            nodeId: node.nodeId,
            nodeName: node.name,
            currentHumidity: node.lastReading.humidity_percent,
            predictedHumidity: predictedValue,
            ...interpretation
          };

          // Guardar en caché
          cache.current[nodeId] = {
            data: predictionData,
            timestamp: now.getTime()
          };

          newPredictions.push(predictionData);
        }
      }

      // Ordenar por prioridad (Crítico primero)
      // Prioridad: danger (3) > warning (2) > success (1)
      const priorityMap = { danger: 3, warning: 2, success: 1 };
      newPredictions.sort((a, b) => priorityMap[b.type] - priorityMap[a.type]);

      setPredictions(newPredictions);
      setLoading(false);
    };

    fetchPredictions();
  }, [nodes]); // Se ejecuta cuando cambia la lista de nodos

  return { predictions, loading };
}

/**
 * Interpreta el valor numérico en mensajes agrícolas accionables.
 */
function interpretPrediction(predicted, current, soilType = 'LOAM') {
  const trend = predicted > current ? 'rising' : predicted < current ? 'falling' : 'stable';
  
  // Fallback a LOAM si el tipo de suelo no existe o es null
  const t = SOIL_THRESHOLDS[soilType] || SOIL_THRESHOLDS.LOAM;
  
  // LOG DE DEPURACIÓN: Ver en consola del navegador (F12)
  console.log(`[Predicción] Nodo Tipo: ${soilType} | Valor: ${predicted.toFixed(1)}% | Umbral Seco: ${t.dry}%`);

  if (predicted < t.dry) {
    return {
      message: "Sequía en próximas horas",
      action: "REGAR",
      type: "danger", // Rojo
      trend
    };
  } else if (predicted < t.medium_max) {
    return {
      message: "Nivel bajo proyectado",
      action: "VIGILAR",
      type: "warning", // Amarillo
      trend
    };
  } else if (predicted > t.optimal_max) {
    return {
      message: "Riesgo de exceso",
      action: "DRENAJE",
      type: "warning", // Amarillo/Azul
      trend
    };
  } else {
    return {
      message: "Humedad estable",
      action: "MANTENER",
      type: "success", // Verde
      trend
    };
  }
}
