const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  aadhaar: { type: String, default: '' },
  income: { type: Number, default: 250000 },
  occupation: { type: String, default: 'General' },
  age: { type: Number, default: 28 },
  gender: { type: String, default: 'All' },
  category: { type: String, default: 'General' },
  education: { type: String, default: 'Graduate' },
  state: { type: String, default: 'All India' },
  district: { type: String, default: 'Central' },
  role: { type: String, enum: ['Citizen', 'Admin', 'Officer'], default: 'Citizen' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
