/**
 * @file authService.js
 * @brief Funciones para la autenticación y gestión de la sesión del usuario.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Inicia sesión de un usuario con email y contraseña.
 * Realiza una petición POST al endpoint `/api/login`. Si es exitosa, guarda el token JWT
 * y los datos del usuario en `localStorage` para gestionar la sesión.
 *
 * @param {string} email - El email del usuario.
 * @param {string} password - La contraseña del usuario.
 * @returns {Promise<object>} Una promesa que resuelve al objeto del usuario autenticado.
 * @throws {Error} Si las credenciales son incorrectas o la petición a la API falla.
 */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al iniciar sesión");
  }

  const { token, user } = await res.json();

  // Normaliza el objeto de usuario para mantener compatibilidad en el frontend.
  const userSession = {
    id: user.uid, // Mantenemos 'id' por si el frontend lo usa
    uid: user.uid,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };

  // Guarda el token y los datos del usuario en el almacenamiento local.
  localStorage.setItem("token", token);
  localStorage.setItem("soilnet_user", JSON.stringify(userSession));
  
  return userSession;
}

/**
 * Cierra la sesión del usuario actual.
 * Elimina el token y los datos del usuario del `localStorage`.
 * @returns {Promise<void>}
 */
export async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("soilnet_user");
}

/**
 * Obtiene el usuario actual desde el localStorage.
 * Lee y parsea el objeto 'soilnet_user' del `localStorage`.
 * @returns {object|null} El objeto del usuario si existe, de lo contrario null.
 */
export function getCurrentUser() {
  const user = localStorage.getItem("soilnet_user");
  return user ? JSON.parse(user) : null;
}
