const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = RAW_API_URL.replace(/\/api\/?$/, "");

/**
 * Consume el endpoint de ML para predecir la humedad futura de un nodo.
 * @param {Object} nodeData - Datos crudos del nodo necesarios para el modelo.
 * @returns {Promise<number>} Humedad predicha en porcentaje.
 */
export async function predictNodeHumidity(nodeData) {
  try {
    const response = await fetch(`${API_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        humidity_percent: nodeData.humidity_percent,
        raw_value: nodeData.raw_value,
        rssi: nodeData.rssi,
        voltage: nodeData.voltage,
        sampling_interval: nodeData.sampling_interval,
        hour: nodeData.hour,
        day_of_week: nodeData.day_of_week
      }),
    });

    if (!response.ok) {
      throw new Error(`Error API: ${response.status}`);
    }

    const data = await response.json();
    
    // El backend devuelve { humidity_future_prediction: float, status: "success" }
    return data.humidity_future_prediction;

  } catch (error) {
    console.error("Error en servicio de predicción:", error);
    return null; // Retornamos null para manejar el error silenciosamente en UI
  }
}
