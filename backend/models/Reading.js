/**
 * @file backend/models/Reading.js
 * Modelo para las lecturas de sensores con control estricto de tiempo para medición de latencia.
 */
const mongoose = require("mongoose");

const ReadingSchema = new mongoose.Schema({
  node_id: {
    type: String,
    required: true,
    index: true
  },
  // 1. Tiempo generado por el ESP32 (Origen)
  sensor_timestamp: {
    type: Date,
    required: true,
    index: true
  },
  raw_value: Number,
  voltage: Number,
  humidity_percent: Number,
  rssi: Number,
  sampling_interval: Number
}, {
  timestamps: true, // Habilitamos createdAt para auditoría (no para latencia E2E)
  versionKey: false
});

module.exports = mongoose.model("Reading", ReadingSchema);
