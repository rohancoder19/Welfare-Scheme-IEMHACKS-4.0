const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Citizen User' },
  userEmail: { type: String, default: '' },
  title: { type: String, required: true },
  category: { type: String, required: true }, // Road, Water, Electricity, Crime, Women Safety, Corruption, Healthcare, Education
  description: { type: String, required: true },
  location: {
    address: { type: String, default: 'City Center' },
    lat: { type: Number, default: 22.5726 },
    lng: { type: Number, default: 88.3639 }
  },
  photo: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'], 
    default: 'Submitted' 
  },
  priority: { 
    type: String, 
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'High', 'Medium', 'Low'], 
    default: 'MEDIUM' 
  },
  priorityScore: { type: Number, default: 50 },
  assignedOfficer: { type: String, default: 'Unassigned (Automated Triage)' },
  nlpAnalysis: { type: String, default: '' },
  aiAnalysis: {
    category: { type: String },
    subcategory: { type: String },
    priority: { type: String },
    urgencyScore: { type: Number },
    department: { type: String },
    confidence: { type: Number },
    recommendedSLAHours: { type: Number },
    recommendedAction: { type: String },
    reason: [{ type: String }],
    analyzedAt: { type: Date, default: Date.now }
  },
  finalDecision: {
    category: { type: String },
    priority: { type: String },
    department: { type: String },
    slaHours: { type: Number },
    overridden: { type: Boolean, default: false },
    decidedBy: { type: String },
    decidedAt: { type: Date }
  },
  slaDeadline: { type: Date },
  slaHours: { type: Number, default: 48 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
