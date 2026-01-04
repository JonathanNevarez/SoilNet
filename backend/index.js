/**
 * @fileoverview Servidor backend para la aplicación SoilNet.
 * Este archivo configura un servidor Express para manejar peticiones API, autenticación,
 * interacciones con la base de datos y tareas programadas.
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// =============================================================================
// DEPENDENCIAS
// =============================================================================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { execFile, exec } = require('child_process');
const cron = require('node-cron');
const path = require('path');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Reading = require('./models/Reading');
const User = require('./models/User');
const Node = require('./models/Node');
const { generateSoilAnalysis } = require('./services/aiService');

// =============================================================================
// CONFIGURACIÓN DE LA APP
// =============================================================================
const app = express();
app.use(cors());
app.use(express.json());

// Configuración del servidor HTTP y Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, restringe esto a la URL de tu frontend
    methods: ["GET", "POST"]
  }
});

/**
 * Clave secreta para JWT. Se utiliza para firmar y verificar JSON Web Tokens.
 * En un entorno de producción, debe ser una cadena compleja y privada almacenada
 * en una variable de entorno. Se proporciona un valor por defecto para desarrollo.
 * @type {string}
 */
const JWT_SECRET = process.env.JWT_SECRET || "secreto_temporal_desarrollo";

// =============================================================================
// CONEXIÓN A LA BASE DE DATOS
// =============================================================================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, { dbName: 'SoilNet' })
    .then(() => console.log("Conexión exitosa a MongoDB Atlas."))
    .catch(err => console.error("Error al conectar con MongoDB:", err));
}

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * Endpoint de verificación de estado y versión.
 * @route GET /api/health
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.1.0", deployedAt: new Date() });
});

/**
 * Autentica un usuario verificando su email y contraseña.
 * Tras una autenticación exitosa, devuelve un JWT.
 * @route POST /api/login
 * @param {object} req.body - El cuerpo de la petición.
 * @param {string} req.body.email - La dirección de email del usuario.
 * @param {string} req.body.password - La contraseña del usuario.
 */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  try {
    // Buscar usuario en la base de datos por email.
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Comparar la contraseña proporcionada con la contraseña hasheada almacenada.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar Token JWT
    const token = jwt.sign(
      { uid: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // En un login exitoso, devolver los datos del usuario y el token.
    res.json({
      message: "Login exitoso",
      token,
      user: {
        uid: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Middleware para verificar el JWT en rutas protegidas. Comprueba si existe
 * un token 'Bearer' en la cabecera de autorización.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado: Token no proporcionado" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware para autorizar rutas de solo administrador. Comprueba si el
 * usuario autenticado tiene el rol 'admin'.
 */
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado: Requiere rol de administrador" });
  }
  next();
};

// =============================================================================
// RUTAS PROTEGIDAS
// =============================================================================

// Aplica el middleware de seguridad a todas las rutas administrativas y de datos de usuario.
app.use("/admin", authenticateToken, authorizeAdmin);
app.use("/api/users", authenticateToken);
app.use("/api/nodes", authenticateToken);
app.use("/api/nodes/user", authenticateToken);
app.use("/api/readings/last", authenticateToken);
app.use("/api/readings/history", authenticateToken);

/**
 * Crea un nuevo usuario en la base de datos con una contraseña encriptada.
 * Requiere privilegios de administrador.
 * @route POST /admin/create-user
 * @param {object} req.body - Los datos del usuario.
 * @param {string} req.body.email - Email del usuario.
 * @param {string} req.body.password - Contraseña del usuario.
 * @param {string} req.body.role - Rol del usuario ('admin' o 'user').
 * @param {string} req.body.fullName - Nombre completo del usuario.
 * @param {string} [req.body.phone] - Número de teléfono del usuario (opcional).
 */
app.post("/admin/create-user", async (req, res) => {
  const { email, password, role, fullName, phone } = req.body;

  if (!email || !password || !role || !fullName) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario en MongoDB.
    await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone: phone || null,
      role,
      createdAt: new Date()
    });

    res.json({ message: "Usuario agregado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Registra un nuevo nodo sensor en la base de datos.
 * Requiere privilegios de administrador.
 * @route POST /admin/create-node
 * @param {object} req.body - Los datos del nodo.
 * @param {string} req.body.nodeId - El ID único del nodo (ej. dirección MAC).
 * @param {string} req.body.name - Un nombre descriptivo para el nodo.
 * @param {string} [req.body.location] - La ubicación física del nodo (opcional).
 */
app.post("/admin/create-node", async (req, res) => {
  const { nodeId, name, location, soil_type } = req.body;

  if (!nodeId || !name) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const existingNode = await Node.findOne({ nodeId });
    if (existingNode) {
      return res.status(409).json({ error: "El nodo ya existe" });
    }

    await Node.create({
      nodeId,
      name,
      location: location || null,
      soil_type: soil_type || 'LOAM',
      assigned: false,
      ownerUid: null,
      ownerName: null,
      createdAt: new Date()
    });

    res.json({ message: "Nodo agregado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Asigna un nodo existente a un usuario específico.
 * Requiere privilegios de administrador.
 * @route POST /admin/assign-node
 * @param {object} req.body - Los datos de la asignación.
 * @param {string} req.body.nodeId - El ID del nodo a asignar.
 * @param {string} req.body.userUid - El UID del usuario al que se asignará el nodo.
 */
app.post("/admin/assign-node", async (req, res) => {
  const { nodeId, userUid } = req.body;

  if (!nodeId || !userUid) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const node = await Node.findOne({ nodeId });
    if (!node) {
      return res.status(404).json({ error: "Nodo no encontrado" });
    }

    const user = await User.findById(userUid);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Actualizar el nodo en MongoDB con la información del propietario.
    node.assigned = true;
    node.ownerUid = userUid;
    node.ownerName = user.fullName;
    node.assignedAt = new Date();
    await node.save();

    res.json({ message: "Nodo asignado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Desasigna un nodo, dejándolo disponible para ser reasignado.
 * Requiere privilegios de administrador.
 * @route POST /admin/unassign-node
 * @param {object} req.body - Los datos de la desasignación.
 * @param {string} req.body.nodeId - El ID del nodo a desasignar.
 */
app.post("/admin/unassign-node", async (req, res) => {
  const { nodeId } = req.body;

  if (!nodeId) {
    return res.status(400).json({ error: "nodeId requerido" });
  }

  try {
    const node = await Node.findOne({ nodeId });
    if (!node) {
      return res.status(404).json({ error: "Nodo no encontrado" });
    }

    node.assigned = false;
    node.ownerUid = null;
    node.ownerName = null;
    node.assignedAt = null;
    await node.save();

    res.json({ message: "Nodo desasignado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene una lista de todos los usuarios registrados.
 * Requiere privilegios de administrador.
 * @route GET /admin/users
 */
app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({});

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene una lista de todos los nodos registrados.
 * Requiere privilegios de administrador.
 * @route GET /admin/nodes
 */
app.get("/admin/nodes", async (req, res) => {
  try {
    const nodes = await Node.find({});

    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza la información de un usuario existente.
 * Requiere privilegios de administrador.
 * @route PUT /admin/update-user/:uid
 * @param {string} req.params.uid - El UID del usuario a actualizar.
 * @param {object} req.body - Los datos actualizados del usuario.
 * @param {string} req.body.fullName - El nombre completo actualizado del usuario.
 * @param {string} req.body.role - El rol actualizado del usuario.
 * @param {string} [req.body.phone] - El número de teléfono actualizado del usuario (opcional).
 */
app.put("/admin/update-user/:uid", async (req, res) => {
  const { uid } = req.params;
  const { fullName, role, phone } = req.body;

  try {
    await User.findByIdAndUpdate(uid, {
      fullName,
      role,
      phone: phone || null,
      updatedAt: new Date()
    });

    res.json({ message: "Usuario actualizado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza la información de un nodo existente.
 * Requiere privilegios de administrador.
 * @route PUT /admin/update-node/:nodeId
 * @param {string} req.params.nodeId - El ID del nodo a actualizar.
 * @param {object} req.body - Los datos actualizados del nodo.
 * @param {string} req.body.name - El nombre actualizado del nodo.
 * @param {string} [req.body.location] - La ubicación actualizada del nodo (opcional).
 */
app.put("/admin/update-node/:nodeId", async (req, res) => {
  const { nodeId } = req.params;
  const { name, location, soil_type } = req.body;

  try {
    await Node.findOneAndUpdate({ nodeId }, {
      name,
      location: location || null,
      soil_type: soil_type || 'LOAM',
      updatedAt: new Date()
    });

    res.json({ message: "Nodo actualizado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Elimina un usuario y desasigna cualquier nodo asociado a él.
 * Requiere privilegios de administrador.
 * @route DELETE /admin/delete-user/:uid
 * @param {string} req.params.uid - El UID del usuario a eliminar.
 */
app.delete("/admin/delete-user/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Desasignar nodos asociados.
    const updateResult = await Node.updateMany(
      { ownerUid: uid },
      { 
        assigned: false, 
        ownerUid: null, 
        ownerName: null, 
        assignedAt: null 
      }
    );

    // Eliminar usuario de MongoDB.
    await User.findByIdAndDelete(uid);

    res.json({
      message: "Usuario eliminado y nodos liberados correctamente",
      releasedNodes: updateResult.modifiedCount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * Elimina un nodo de la base de datos. El nodo no debe estar asignado a un usuario.
 * Requiere privilegios de administrador.
 * @route DELETE /admin/delete-node/:nodeId
 * @param {string} req.params.nodeId - El ID del nodo a eliminar.
 */
app.delete("/admin/delete-node/:nodeId", async (req, res) => {
  const { nodeId } = req.params;

  try {
    const node = await Node.findOne({ nodeId });
    if (!node) {
      return res.status(404).json({ error: "Nodo no encontrado" });
    }

    if (node.assigned) {
      return res.status(400).json({
        error: "No se puede eliminar un nodo asignado"
      });
    }

    await Node.deleteOne({ nodeId });

    res.json({ message: "Nodo eliminado correctamente" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Recibe y almacena lecturas de sensores desde dispositivos IoT.
 * @route POST /api/readings
 * @param {object} req.body - Los datos de la lectura del sensor.
 * @param {string} req.body.node_id - El ID del nodo que envía los datos.
 * @param {number} req.body.raw_value - El valor crudo del sensor.
 * @param {number} req.body.voltage - La lectura de voltaje del dispositivo.
 * @param {number} req.body.humidity_percent - El porcentaje de humedad calculado.
 * @param {number} req.body.rssi - El Indicador de Fuerza de la Señal Recibida.
 * @param {number} req.body.sampling_interval - El intervalo en el que el sensor envía datos.
 * @param {string} [req.body.timestamp] - La marca de tiempo del dispositivo (opcional).
 */
app.post("/api/readings", async (req, res) => {
  try {
    const {
      node_id,
      raw_value,
      voltage,
      humidity_percent,
      rssi,
      sampling_interval,
      sensor_timestamp
    } = req.body;

    // Validaciones 
    if (!node_id) {
      return res.status(400).json({ error: "node_id requerido" });
    }

    if (!sensor_timestamp) {
      return res.status(400).json({ error: "sensor_timestamp requerido" });
    }

    // Verificar que el nodo esté registrado
    const node = await Node.findOne({ nodeId: node_id });
    if (!node) {
      return res.status(403).json({ error: "Nodo no registrado" });
    }

    // Guardar 
    await Reading.create({
      node_id,
      raw_value,
      voltage,
      humidity_percent,
      rssi,
      sampling_interval,
      sensor_timestamp: new Date(sensor_timestamp)
    });

    // --- SOCKET.IO: EMISIÓN DE EVENTOS EN TIEMPO REAL ---
    // Si el nodo tiene un dueño asignado, notificamos a su sala privada
    if (node.ownerUid) {
      const room = node.ownerUid.toString();
      console.log(`📡 SOCKET: Emitiendo datos a sala [${room}] para nodo [${node_id}]`);
      io.to(room).emit('reading:new', {
        nodeId: node_id,
        humidity: humidity_percent,
        rssi,
        voltage,
        createdAt: new Date()
      });
      io.to(room).emit('node:online', { nodeId: node_id });
    } else {
      console.log(`⚠️ SOCKET: El nodo [${node_id}] NO tiene dueño asignado. No se emitió evento.`);
    }

    res.status(201).json({ message: "Lectura guardada correctamente" });

  } catch (error) {
    console.error("Error guardando lectura:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene todos los nodos asignados a un usuario específico.
 * Requiere autenticación.
 * @route GET /api/nodes/user/:uid
 * @param {string} req.params.uid - El UID del usuario.
 */
app.get("/api/nodes/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const nodes = await Node.find({ ownerUid: uid });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene los detalles de un nodo específico.
 * Requiere autenticación.
 * @route GET /api/nodes/:nodeId
 * @param {string} req.params.nodeId - El ID del nodo.
 */
app.get("/api/nodes/:nodeId", async (req, res) => {
  try {
    const { nodeId } = req.params;
    const node = await Node.findOne({ nodeId });
    
    if (!node) {
      return res.status(404).json({ error: "Nodo no encontrado" });
    }
    
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene métricas de latencia del sistema para análisis de rendimiento.
 * Calcula la latencia como: createdAt - sensor_timestamp.
 * Requiere autenticación.
 * @route GET /api/readings/latency
 * @param {number} [req.query.period] - Periodo en minutos (default: 15).
 */
app.get("/api/readings/latency", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const periodMinutes = parseInt(req.query.period, 10) || 15;
    const startDate = new Date(Date.now() - periodMinutes * 60 * 1000);

    // 1. Obtener los IDs de los nodos asignados al usuario actual
    const userNodes = await Node.find({ ownerUid: uid }).select('nodeId');
    
    if (!userNodes || userNodes.length === 0) {
      return res.json([]);
    }

    const nodeIds = userNodes.map(n => n.nodeId);

    // 2. Ejecutar Aggregation Pipeline para calcular latencia en la DB
    const latencyData = await Reading.aggregate([
      {
        $match: {
          node_id: { $in: nodeIds },      // Solo lecturas de mis nodos
          createdAt: { $gte: startDate }  // Solo dentro del periodo
        }
      },
      {
        $project: {
          _id: 0,
          createdAt: 1,
          latency_ms: { $subtract: ["$createdAt", "$sensor_timestamp"] }
        }
      },
      { $sort: { createdAt: 1 } }
    ]);

    res.json(latencyData);

  } catch (error) {
    console.error("Error calculando latencia:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene la lectura más reciente para un nodo específico.
 * Requiere autenticación.
 * @route GET /api/readings/last/:nodeId
 * @param {string} req.params.nodeId - El ID del nodo.
 */
app.get("/api/readings/last/:nodeId", async (req, res) => {
  try {
    const { nodeId } = req.params;
    // Buscar la lectura más reciente en MongoDB.
    const reading = await Reading.findOne({ node_id: nodeId }).sort({ createdAt: -1 });
    
    // Si no se encuentra ninguna lectura, devuelve null. El frontend manejará este caso.
    res.json(reading || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene las lecturas históricas de un nodo, agregadas según el
 * rango de tiempo especificado.
 * Requiere autenticación.
 * @route GET /api/readings/history/:nodeId
 * @param {string} req.params.nodeId - El ID del nodo.
 * @param {string} [req.query.from] - Fecha ISO para filtrar lecturas desde esa fecha.
 * @param {string} [req.query.range] - El rango de tiempo para la agregación ('24h', '7d', '30d').
 *   - '30d': Agrega datos por día.
 *   - '7d': Agrega datos por hora.
 *   - '24h': Agrega datos en intervalos de 10 minutos.
 */
app.get("/api/readings/history/:nodeId", async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { from, range } = req.query;

    const matchStage = { node_id: nodeId };
    if (from) {
      matchStage.createdAt = { $gte: new Date(from) };
    }

    // Si no se especifica un rango, devuelve datos crudos (limitado por rendimiento).
    if (!range) {
      const readings = await Reading.find(matchStage).sort({ createdAt: 1 }).limit(1000);
      return res.json(readings);
    }

    let groupBy = {};

    // Estrategia de agregación basada en el rango de tiempo.
    switch (range) {
      case '30d':
        // Agrupar por día.
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case '7d':
        // Agrupar por hora.
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          hour: { $hour: "$createdAt" },
        };
        break;
      case '24h':
      default:
        // Agrupar por intervalos de 10 minutos.
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          hour: { $hour: "$createdAt" },
          minute: { $subtract: [ { $minute: "$createdAt" }, { $mod: [{ $minute: "$createdAt" }, 10] }] }
        };
        break;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          humidity_percent: { $avg: "$humidity_percent" },
        }
      },
      {
        $addFields: {
          createdAt: {
            $dateFromParts: {
              year: "$_id.year", month: "$_id.month", day: "$_id.day",
              hour: { $ifNull: ["$_id.hour", 0] },
              minute: { $ifNull: ["$_id.minute", 0] }
            }
          }
        }
      },
      { $project: { _id: 0 } },
      { $sort: { createdAt: 1 } }
    ];

    const readings = await Reading.aggregate(pipeline);
    res.json(readings);
  } catch (error) {
    console.error("Error en agregación de historial:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene el perfil de un usuario por su UID.
 * Requiere autenticación.
 * @route GET /api/users/:uid
 * @param {string} req.params.uid - El UID del usuario.
 */
app.get("/api/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Genera una predicción de humedad futura ejecutando un modelo de machine learning en Python.
 * Este endpoint actúa como un proxy para el script de ML.
 * @route POST /api/predict
 * @param {object} req.body - Las características de entrada para el modelo.
 * @param {number} req.body.humidity_percent
 * @param {number} req.body.raw_value
 * @param {number} req.body.rssi
 * @param {number} req.body.voltage
 * @param {number} req.body.sampling_interval
 * @param {number} req.body.hour
 * @param {number} req.body.day_of_week
 */
app.post("/api/predict", (req, res) => {
  const {
    humidity_percent,
    raw_value,
    rssi,
    voltage,
    sampling_interval,
    hour,
    day_of_week
  } = req.body;

  // Validar que todos los campos requeridos estén presentes.
  if (
    humidity_percent === undefined ||
    raw_value === undefined ||
    rssi === undefined ||
    voltage === undefined ||
    sampling_interval === undefined ||
    hour === undefined ||
    day_of_week === undefined
  ) {
    return res.status(400).json({ error: "Faltan datos para realizar la predicción" });
  }

  const scriptPath = path.join(__dirname, 'ml', 'server.py');
  
  // Argumentos en el orden que espera server.py.
  const args = [
    humidity_percent,
    raw_value,
    rssi,
    voltage,
    sampling_interval,
    hour,
    day_of_week
  ];

  // Determinar el comando según el SO: 'python' en Windows, 'python3' en Linux (Render)
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

  // Ejecutar el script de Python
  execFile(pythonCommand, [scriptPath, ...args], (error, stdout, stderr) => {
    if (error) {
      console.error("Error ejecutando el modelo:", error);
      return res.status(500).json({ error: "Error al ejecutar el modelo predictivo" });
    }

    try {
      // Parsear la salida JSON del script de Python
      const response = JSON.parse(stdout);
      
      if (response.error) {
         return res.status(400).json(response);
      }

      res.json(response);
    } catch (parseError) {
      console.error("Error parseando respuesta JSON:", stdout);
      res.status(500).json({ error: "Respuesta inválida del modelo" });
    }
  });
});

/**
 * Endpoint para el Asistente IA (SoilNet AI Assistant).
 * Analiza datos del nodo y responde preguntas usando Groq.
 * Requiere autenticación.
 * @route POST /api/ai/assistant
 * @param {string} req.body.nodeId - ID del nodo sobre el que se consulta.
 * @param {string} req.body.question - Pregunta del usuario.
 */
app.post("/api/ai/assistant", authenticateToken, async (req, res) => {
  try {
    const { nodeId, question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Falta la pregunta" });
    }

    // Si se proporciona un nodeId, verificamos permisos específicos
    if (nodeId) {
      const node = await Node.findOne({ nodeId });
      if (!node) {
        return res.status(404).json({ error: "Nodo no encontrado" });
      }

      if (req.user.role !== 'admin' && String(node.ownerUid) !== String(req.user.uid)) {
        return res.status(403).json({ error: "No tienes permiso para consultar este nodo" });
      }
    }

    // Pasamos el UID del usuario para contexto global si no hay nodeId
    const answer = await generateSoilAnalysis(nodeId, question, req.user.uid);
    res.json({ answer });

  } catch (error) {
    console.error("Error en SoilNet AI:", error);
    res.status(500).json({ error: "Error al procesar la consulta con IA" });
  }
});


// =============================================================================
// TAREAS PROGRAMADAS
// =============================================================================

// =============================================================================
// SOCKET.IO CONFIGURACIÓN Y EVENTOS
// =============================================================================

// Middleware: Verificar JWT antes de permitir la conexión del socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded; // Guardamos datos del usuario en el socket
    next();
  });
});

io.on("connection", (socket) => {
  console.log(`🟢 Cliente conectado: ${socket.id}`);
  
  // Unir al usuario a una sala privada con su UID
  if (socket.user && socket.user.uid) {
    socket.join(socket.user.uid);
    console.log(`👤 Usuario unido a sala: ${socket.user.uid}`);
  } else {
    console.log('⚠️ Usuario conectado sin UID válido en el token. No se unió a ninguna sala.');
  }

  socket.on("disconnect", () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);
  });
});

/**
 * Tarea cron programada para el reentrenamiento semanal del modelo.
 * Se ejecuta cada domingo a las 2:00 AM.
 * El proceso implica:
 * 1. Exportar el conjunto de datos más reciente de MongoDB a un archivo CSV.
 * 2. Ejecutar el script de entrenamiento de Python con el nuevo conjunto de datos.
 */
cron.schedule('0 2 * * 0', () => {
  console.log('--- Iniciando tarea de reentrenamiento semanal del modelo ---');

  const exportScriptPath = path.join(__dirname, 'ml', 'export_dataset.js');
  const trainScriptPath = path.join(__dirname, 'ml', 'main.py');
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

  console.log(`[1/2] Ejecutando script de exportación de dataset: ${exportScriptPath}`);
  exec(`node ${exportScriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al exportar datos: ${error.message}`);
      return;
    }
    console.log(`Datos exportados correctamente: ${stdout}`);

    console.log(`[2/2] Ejecutando script de reentrenamiento: ${trainScriptPath}`);
    exec(`${pythonCommand} ${trainScriptPath}`, (pyError, pyStdout, pyStderr) => {
      if (pyError) {
        console.error(`Error al reentrenar el modelo: ${pyError.message}`);
        return;
      }
      console.log(`Modelo reentrenado correctamente: ${pyStdout}`);
      console.log('--- Tarea de reentrenamiento completada ---');
    });
  });
});

/**
 * Inicia el servidor backend en el puerto especificado.
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
