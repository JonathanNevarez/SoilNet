/**
 * @file nodeLogic.js
 * @brief Lógica de negocio para la clasificación de humedad y suelos.
 */

// Umbrales de humedad (%) por tipo de suelo
const THRESHOLDS = {
  SANDY: { dry: 10, medium_max: 20, optimal_max: 30 }, // Arenoso
  LOAM:  { dry: 15, medium_max: 30, optimal_max: 40 }, // Franco (Tierra Negra)
  CLAY:  { dry: 25, medium_max: 40, optimal_max: 50 }  // Arcilloso
};

/**
 * Obtiene el estado agronómico y la configuración visual basada en la humedad y tipo de suelo.
 * 
 * @param {number|null} humidity - Porcentaje de humedad actual.
 * @param {string} soilType - Tipo de suelo ('SANDY', 'LOAM', 'CLAY').
 * @returns {object} Objeto con etiqueta, color, descripción y metadatos del estado.
 */
export function getSoilStatus(humidity, soilType = 'LOAM') {
  // Valores por defecto si no hay lectura
  if (humidity === null || humidity === undefined) {
    return {
      label: "—",
      color: "text-gray-400",
      stateCode: "UNKNOWN",
      actionColor: "bg-gray-50 border-gray-300 text-gray-700",
      title: "Sin datos",
      description: "No hay lecturas de humedad disponibles."
    };
  }

  const t = THRESHOLDS[soilType] || THRESHOLDS.LOAM;

  // --- SECO ---
  if (humidity < t.dry) {
    return {
      label: "SECO",
      color: "text-red-600",
      stateCode: "DRY",
      actionColor: "bg-red-50 border-red-300 text-red-700",
      title: "Estrés hídrico detectado",
      description: "Humedad cercana o inferior al punto de marchitez permanente. La planta comienza a sufrir estrés por falta de agua."
    };
  }

  // --- MEDIO ---
  if (humidity < t.medium_max) {
    return {
      label: "MEDIO",
      color: "text-yellow-600",
      stateCode: "MEDIUM",
      actionColor: "bg-yellow-50 border-yellow-300 text-yellow-700",
      title: "Vigilancia requerida",
      description: "Humedad dentro de la zona de agua disponible, pero aún no ideal para el cultivo. Puede mantenerse, pero requiere vigilancia."
    };
  }

  // --- ÓPTIMO ---
  if (humidity <= t.optimal_max) {
    return {
      label: "ÓPTIMO",
      color: "text-green-700",
      stateCode: "OPTIMAL",
      actionColor: "bg-green-50 border-green-300 text-green-700",
      title: "Condiciones ideales",
      description: "Humedad cercana a la capacidad de campo. Balance adecuado entre agua y oxígeno. Condición ideal para el crecimiento."
    };
  }

  // --- EXCESO ---
  return {
    label: "EXCESO",
    color: "text-blue-600",
    stateCode: "EXCESS",
    actionColor: "bg-blue-50 border-blue-300 text-blue-700",
    title: "Riesgo de saturación",
    description: "Humedad por encima de la capacidad de campo. Riesgo de saturación, falta de oxígeno en raíces y enfermedades."
  };
}

/**
 * Obtiene el estado de la señal (RSSI) con su configuración visual.
 * @param {number|null} rssi - Valor de RSSI en dBm.
 * @returns {object} Objeto con etiqueta y color.
 */
export function getSignalStatus(rssi) {
  if (rssi === null || rssi === undefined) {
    return { label: "—", color: "text-gray-400" };
  }
  if (rssi < -85) {
    return { label: "Mala", color: "text-red-600" };
  }
  if (rssi < -70) {
    return { label: "Regular", color: "text-yellow-600" };
  }
  return { label: "Buena", color: "text-green-600" };
}

/**
 * Obtiene el estado de la batería (Voltaje) con su configuración visual.
 * @param {number|null} voltage - Valor de voltaje en V.
 * @returns {object} Objeto con etiqueta y color.
 */
export function getBatteryStatus(voltage) {
  if (voltage === null || voltage === undefined) {
    return { label: "—", color: "text-gray-400" };
  }
  if (voltage < 2.5) {
    return { label: "Muy baja", color: "text-red-600" };
  }
  if (voltage < 3.3) {
    return { label: "Baja", color: "text-yellow-600" };
  }
  return { label: "Buena", color: "text-green-600" };
}

/**
 * Determina la acción recomendada priorizando problemas de conexión o batería sobre el suelo.
 * @param {boolean} online - Si el nodo está en línea.
 * @param {string} batteryLabel - Etiqueta del estado de la batería (ej. "Muy baja").
 * @param {object} soilStatus - Objeto de estado del suelo obtenido con getSoilStatus.
 * @returns {object} Objeto con título, mensaje y color de la acción.
 */
export function getRecommendedAction(online, batteryLabel, soilStatus) {
  if (!online) {
    return {
      title: "Sensor sin comunicación",
      message: "El equipo no está enviando datos. Revise el sensor.",
      color: "bg-red-50 border-red-300 text-red-700"
    };
  } 
  if (batteryLabel === "Muy baja") {
    return {
      title: "Batería baja",
      message: "Recargue el sensor para evitar pérdida de datos.",
      color: "bg-orange-50 border-orange-300 text-orange-700"
    };
  }
  // Si todo está bien técnicamente, devolvemos la recomendación agronómica
  return {
    title: soilStatus.title,
    message: soilStatus.description,
    color: soilStatus.actionColor
  };
}