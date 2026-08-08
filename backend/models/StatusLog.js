const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
  complaintId: { type: String, required: true },
  status: { type: String, required: true },
  remarks: { type: String, required: true },
  updatedBy: { type: String, default: 'System Officer' },
  department: { type: String, default: 'General Administration' },
  actorType: { type: String, enum: ['System', 'Admin', 'Officer', 'Citizen'], default: 'Officer' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StatusLog', statusLogSchema);
