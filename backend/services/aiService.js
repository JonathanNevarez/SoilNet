const Groq = require("groq-sdk");
const Node = require("../models/Node");
const Reading = require("../models/Reading");
const { SOIL_THRESHOLDS } = require("../utils/soilConstants");

// Inicializar cliente de Groq
// Asegúrate de tener GROQ_API_KEY en tu archivo .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Genera un análisis agronómico utilizando IA basado en datos reales del nodo.
 * 
 * @param {string} nodeId - ID del nodo a analizar.
 * @param {string} question - Pregunta del usuario.
 * @param {string} [userId] - ID del usuario (para contexto global).
 * @returns {Promise<string>} Respuesta generada por la IA.
 */
async function generateSoilAnalysis(nodeId, question, userId) {
  // 1. Obtener todos los nodos del usuario (Contexto Unificado)
  const nodes = await Node.find({ ownerUid: userId });

  // 2. Construir datos enriquecidos para TODOS los nodos
  // Esto permite preguntar por cualquier nodo desde cualquier lugar
  const nodesData = await Promise.all(nodes.map(async (node) => {
    const reading = await Reading.findOne({ node_id: node.nodeId }).sort({ createdAt: -1 });
    
    const soilType = node.soil_type || 'LOAM';
    const thresholds = SOIL_THRESHOLDS[soilType] || SOIL_THRESHOLDS.LOAM;
    
    let status = "Desconocido";
    let humidityVal = "N/A";
    let voltageVal = "N/A";
    let lastSeen = "Nunca";
    let historySummary = "";

    if (reading) {
      humidityVal = `${reading.humidity_percent}%`;
      voltageVal = `${reading.voltage}V`;
      lastSeen = reading.createdAt.toLocaleString("es-ES", { timeZone: "UTC" });

      const h = reading.humidity_percent;
      if (h < thresholds.dry) status = "CRÍTICO (Seco)";
      else if (h < thresholds.medium_max) status = "ALERTA (Bajo)";
      else if (h <= thresholds.optimal_max) status = "ÓPTIMO";
      else status = "EXCESO (Húmedo)";
    }

    // --- NUEVO: Cargar historial reciente (30 días) si es el nodo activo ---
    // Esto permite responder preguntas como "¿Cuál fue el promedio de ayer?"
    if (nodeId && node.nodeId === nodeId) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const history = await Reading.aggregate([
        { $match: { node_id: node.nodeId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" } },
            avgHum: { $avg: "$humidity_percent" },
            minHum: { $min: "$humidity_percent" },
            maxHum: { $max: "$humidity_percent" }
          }
        },
        { $sort: { "_id.month": 1, "_id.day": 1 } }
      ]);

      historySummary = history.map(h => `Dia ${h._id.day}/${h._id.month}: Prom:${Math.round(h.avgHum)}% (Min:${Math.round(h.minHum)}% Max:${Math.round(h.maxHum)}%)`).join(" | ");
    }

    return {
      name: node.name,
      location: node.location || 'Sin ubicación',
      soilType,
      humidity: humidityVal,
      voltage: voltageVal,
      status,
      lastSeen,
      history: historySummary, // Pasamos el historial al objeto
      isCurrent: nodeId && node.nodeId === nodeId // Marcamos si es el nodo que el usuario está viendo
    };
  }));

  // 3. Construir System Prompt Unificado
  let systemPrompt = `
Eres SoilNet AI, un asistente agrónomo experto en IoT.
Tienes acceso a los datos en tiempo real de TODOS los nodos del usuario.

RESUMEN DEL SISTEMA (${nodesData.length} nodos):
`;

  nodesData.forEach(n => {
    const marker = n.isCurrent ? ">>> NODO ACTUAL (Foco): " : "- ";
    systemPrompt += `${marker}${n.name} (${n.location}): ${n.humidity} Humedad | ${n.voltage} Batería | Estado: ${n.status} | Suelo: ${n.soilType}\n`;
    if (n.history) {
      systemPrompt += `    HISTORIAL RECIENTE (Últimos 30 días): [ ${n.history} ]\n`;
    }
  });

  systemPrompt += `
INSTRUCCIONES:
- Responde a la pregunta del usuario basándote en estos datos.
- Si preguntan por una fecha específica, busca en el HISTORIAL RECIENTE.
- Puedes comparar nodos entre sí (ej. "¿Cuál está más seco?").
- Si el usuario pregunta por un nodo específico, busca su nombre en la lista.
- Si el usuario está viendo un nodo específico (marcado con >>>), prioriza ese contexto si la pregunta es ambigua.
- Sé conciso y técnico.
`.trim();

  // 5. Llamar a Groq API
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.2, // Baja temperatura para respuestas más factuales
    max_tokens: 400,
  });

  return chatCompletion.choices[0]?.message?.content || "Lo siento, no pude analizar los datos en este momento.";
}

module.exports = { generateSoilAnalysis };
