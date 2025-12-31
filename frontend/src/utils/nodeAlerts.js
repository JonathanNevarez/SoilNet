import { WifiOff, DropletOff, SignalLow } from "lucide-react";

/**
 * Genera un array de alertas basado en los valores de la última lectura de un nodo.
 *
 * @param {object|null} lastReading - Objeto con la última lectura del sensor.
 * @returns {Array<{type: 'danger'|'warning', text: string, icon: React.Component}>}
 *          Un array de objetos de alerta, cada uno con tipo, texto e icono.
 */
export function computeNodeAlerts(lastReading) {
  const alerts = [];

  if (!lastReading) return alerts;

  // --- Alerta de Humedad Crítica (Suelo Seco) ---
  // Se activa si la humedad es inferior al 25%.
  if (lastReading.humidity_percent < 25) {
    alerts.push({
      type: "danger",
      text: "Humedad crítica: suelo muy seco",
      icon: DropletOff
    });
  }

  // --- Alerta de Exceso de Humedad ---
  // Se activa si la humedad supera el 85%, indicando posible saturación.
  if (lastReading.humidity_percent > 85) {
    alerts.push({
      type: "danger",
      text: "Exceso de humedad detectado",
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
