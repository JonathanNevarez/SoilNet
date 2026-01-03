import { WifiOff, DropletOff, SignalLow } from "lucide-react";

/**
 * Genera un array de alertas basado en los valores de la última lectura de un nodo.
 *
 * @param {object|null} lastReading - Objeto con la última lectura del sensor.
 * @param {string} [soilType='LOAM'] - Tipo de suelo del nodo (SANDY, LOAM, CLAY).
 * @returns {Array<{type: 'danger'|'warning', text: string, icon: React.Component}>}
 *          Un array de objetos de alerta, cada uno con tipo, texto e icono.
 */
export function computeNodeAlerts(lastReading, soilType = 'LOAM') {
  const alerts = [];

  if (!lastReading) return alerts;

  const humidity = lastReading.humidity_percent;

  // Definición de umbrales por tipo de suelo
  const thresholds = {
    SANDY: { dry: 10, optimal_min: 20, excess: 30 },
    LOAM:  { dry: 15, optimal_min: 30, excess: 40 },
    CLAY:  { dry: 25, optimal_min: 40, excess: 50 }
  };

  // Seleccionar umbrales según el tipo de suelo (default a LOAM si no coincide)
  const t = thresholds[soilType] || thresholds.LOAM;

  // --- Alerta de Humedad Crítica (SECO) ---
  if (humidity < t.dry) {
    alerts.push({
      type: "danger",
      text: `Suelo muy seco: Riego urgente`,
      icon: DropletOff
    });
  }
  // --- Alerta de Nivel Medio (Requiere vigilancia) ---
  else if (humidity >= t.dry && humidity < t.optimal_min) {
    alerts.push({
      type: "warning",
      text: `Humedad baja: Requiere vigilancia`,
      icon: DropletOff
    });
  }
  // --- Alerta de Exceso de Humedad ---
  else if (humidity > t.excess) {
    alerts.push({
      type: "danger",
      text: `Exceso de humedad: Riesgo de saturación`,
      icon: DropletOff
    });
  }

  // --- Alerta de Señal Débil (RSSI) ---
  // Un valor de RSSI inferior a -85 dBm indica una conexión deficiente.
  if (lastReading.rssi < -85) {
    alerts.push({
      type: "warning",
      text: "Señal del nodo débil",
      icon: SignalLow
    });
  }

  // --- Alerta de Inactividad del Nodo ---
  // Comprueba si el nodo ha dejado de reportar datos por más de 30 minutos.
  const lastTime = lastReading.createdAt ? new Date(lastReading.createdAt) : null;
  if (lastTime) {
    const minutes =
      (Date.now() - lastTime.getTime()) / 1000 / 60;

    // El umbral de 30 minutos es conservador; podría ajustarse según el intervalo de muestreo.
    if (minutes > 30) {
      alerts.push({
        type: "danger",
        text: "Nodo sin reportar por más de 30 minutos",
        icon: WifiOff
      });
    }
  }

  return alerts;
}
