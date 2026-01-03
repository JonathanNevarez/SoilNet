const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: String,

  soil_type: {
    type: String,
    enum: ['SANDY', 'LOAM', 'CLAY'],
    default: 'LOAM',
    required: true
  },
  assigned: { type: Boolean, default: false },
  ownerUid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerName: String,
  assignedAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('Node', nodeSchema);
