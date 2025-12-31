/**
 * @file nodes.service.js
 * @brief Funciones para interactuar con el API de nodos de sensores.
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
 * Obtiene la lista de nodos asignados a un usuario desde el backend.
 * @param {string} uid - ID del usuario.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de objetos de nodo.
 * @throws {Error} Si la petición a la API falla.
 */
export async function getUserNodes(uid) {
  const res = await fetch(`${API_URL}/api/nodes/user/${uid}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) throw new Error("Error al obtener los nodos del usuario");
  return await res.json();
}

/**
 * Obtiene los detalles de un nodo específico por su ID.
 * @param {string} nodeId - ID del nodo.
 * @returns {Promise<object>} Una promesa que resuelve al objeto de detalle del nodo.
 * @throws {Error} Si la petición a la API falla.
 */
export async function getNodeById(nodeId) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) throw new Error("Error al obtener los detalles del nodo");
  return await res.json();
}