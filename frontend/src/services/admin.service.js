/**
 * @file admin.service.js
 * @brief Funciones para interactuar con los endpoints de administración de la API.
 * Proporciona métodos para gestionar usuarios y nodos (CRUD, asignación, etc.).
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Helper para obtener las cabeceras de autenticación.
 * @returns {HeadersInit} Objeto de cabeceras con el token de autorización.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Obtiene la lista completa de usuarios.
 * @returns {Promise<Array<object>>} Un array con todos los usuarios.
 * @throws {Error} Si la petición a la API falla.
 */
export async function getAllUsers() {
  const res = await fetch(`${API_URL}/admin/users`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al obtener usuarios");
  }
  return await res.json();
}

/**
 * Obtiene la lista completa de nodos.
 * @returns {Promise<Array<object>>} Un array con todos los nodos.
 * @throws {Error} Si la petición a la API falla.
 */
export async function getAllNodes() {
  const res = await fetch(`${API_URL}/admin/nodes`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al obtener nodos");
  }
  return await res.json();
}

/**
 * Crea un nuevo usuario.
 * @param {object} userData - Datos del nuevo usuario (fullName, email, password, role, phone).
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function createUser(userData) {
  const res = await fetch(`${API_URL}/admin/create-user`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al crear usuario");
  }
  return await res.json();
}

/**
 * Crea un nuevo nodo sensor.
 * @param {object} nodeData - Datos del nuevo nodo (nodeId, name, location).
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function createNode(nodeData) {
  const res = await fetch(`${API_URL}/admin/create-node`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(nodeData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al crear nodo");
  }
  return await res.json();
}

/**
 * Asigna un nodo a un usuario.
 * @param {string} nodeId - ID del nodo a asignar.
 * @param {string} userUid - UID del usuario al que se asignará el nodo.
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function assignNode(nodeId, userUid) {
  const res = await fetch(`${API_URL}/admin/assign-node`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ nodeId, userUid })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al asignar nodo");
  }
  return await res.json();
}

/**
 * Desasigna un nodo de un usuario.
 * @param {string} nodeId - ID del nodo a desasignar.
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function unassignNode(nodeId) {
  const res = await fetch(`${API_URL}/admin/unassign-node`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ nodeId })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al desasignar nodo");
  }
  return await res.json();
}

/**
 * Elimina un usuario por su UID.
 * @param {string} uid - UID del usuario a eliminar.
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function deleteUser(uid) {
  const res = await fetch(`${API_URL}/admin/delete-user/${uid}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al eliminar usuario");
  }
  return await res.json();
}

/**
 * Elimina un nodo por su ID.
 * @param {string} nodeId - ID del nodo a eliminar.
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function deleteNode(nodeId) {
  const res = await fetch(`${API_URL}/admin/delete-node/${nodeId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al eliminar nodo");
  }
  return await res.json();
}

/**
 * Actualiza los datos de un usuario.
 * @param {string} uid - UID del usuario a actualizar.
 * @param {object} userData - Datos a actualizar (fullName, role, phone).
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function updateUser(uid, userData) {
  const res = await fetch(`${API_URL}/admin/update-user/${uid}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al actualizar usuario");
  }
  return await res.json();
}

/**
 * Actualiza los datos de un nodo.
 * @param {string} nodeId - ID del nodo a actualizar.
 * @param {object} nodeData - Datos a actualizar (name, location).
 * @returns {Promise<object>} El objeto de respuesta de la API.
 * @throws {Error} Si la petición a la API falla.
 */
export async function updateNode(nodeId, nodeData) {
  const res = await fetch(`${API_URL}/admin/update-node/${nodeId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(nodeData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al actualizar nodo");
  }
  return await res.json();
}