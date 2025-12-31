/**
 * @file readings.service.js
 * @brief Funciones para interactuar con el API de lecturas de sensores.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Helper para obtener las cabeceras de autenticación.
 * @returns {HeadersInit} Objeto de cabeceras con el token de autorización.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Obtiene la última lectura de un nodo específico desde el backend.
 * @param {string} nodeId - ID del nodo.
 * @returns {Promise<object|null>} La última lectura o null si no existe.
 * @throws {Error} Si la petición a la API falla.
 */
export async function getLastReadingByNode(nodeId) {
  const res = await fetch(`${API_URL}/api/readings/last/${nodeId}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Error al obtener la última lectura");
  }

  return await res.json();
}

/**
 * Obtiene el historial de lecturas de un nodo, con opciones de filtrado y agregación.
 * @param {string} nodeId - ID del nodo.
 * @param {Date} [from] - Fecha (objeto Date) para filtrar lecturas desde ese momento.
 * @param {string} [range] - Rango de tiempo para la agregación de datos por parte del backend ('24h', '7d', '30d').
 * @returns {Promise<Array<object>>} Un array con las lecturas históricas.
 * @throws {Error} Si la petición a la API falla.
 */
export async function getReadingsHistory(nodeId, from, range) {
  let url = `${API_URL}/api/readings/history/${nodeId}`;
  const params = new URLSearchParams();

  if (from) params.set('from', from.toISOString());
  if (range) params.set('range', range);

  const res = await fetch(`${url}?${params.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Error al obtener el historial de lecturas");
  }

  return await res.json();
}
