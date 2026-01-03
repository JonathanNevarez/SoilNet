/**
 * Servicio para interactuar con el Asistente IA de SoilNet.
 */

// Ajusta la URL base según tu configuración de Vite (normalmente en .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Envía una pregunta al asistente sobre un nodo específico.
 * @param {string} nodeId - ID del nodo.
 * @param {string} question - Pregunta del usuario.
 * @param {string} token - Token JWT de autenticación.
 * @returns {Promise<object>} Respuesta del asistente.
 */
export const askSoilNetAI = async (nodeId, question, token) => {
  try {
    const response = await fetch(`${API_URL}/api/ai/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nodeId: nodeId || null, question })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al comunicarse con SoilNet AI');
    }

    return data;
  } catch (error) {
    console.error("Error en AI Service:", error);
    throw error;
  }
};
