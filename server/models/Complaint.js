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
    enum: ['High', 'Medium', 'Low'], 
    default: 'Medium' 
  },
  priorityScore: { type: Number, default: 50 },
  assignedOfficer: { type: String, default: 'Unassigned (Automated Triage)' },
  nlpAnalysis: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
