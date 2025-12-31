const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  node_id: { type: String, required: true, index: true },
  raw_value: Number,
  voltage: Number,
  humidity_percent: Number,
  rssi: Number,
  sampling_interval: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reading', readingSchema);