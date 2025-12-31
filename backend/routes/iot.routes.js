import express from "express";
import { saveReading } from "../controllers/iot.controller.js";

const router = express.Router();

/**
 * Ruta para recibir y guardar lecturas de sensores.
 * Endpoint: POST /readings
 */
router.post("/readings", saveReading);

export default router;
