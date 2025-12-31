import { db } from "../config/firebase.js";

/**
 * Recibe y almacena una nueva lectura de los sensores.
 * Valida que el nodo exista antes de guardar la información en la base de datos.
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 */
export const saveReading = async (req, res) => {
  try {
    const {
      node_id,
      raw_value,
      voltage,
      humidity_percent,
      rssi,
      sampling_interval,
      timestamp
    } = req.body;

    if (!node_id) {
      return res.status(400).json({ error: "node_id requerido" });
    }

    const nodeRef = db.collection("nodes").doc(node_id);
    const nodeSnap = await nodeRef.get();

    if (!nodeSnap.exists) {
      return res.status(403).json({ error: "Nodo no registrado" });
    }

    await db.collection("readings").add({
      node_id,
      raw_value,
      voltage,
      humidity_percent,
      rssi,
      sampling_interval,
      timestamp,
      created_at: new Date()
    });

    res.json({ message: "Lectura guardada" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
