const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  schemeName: { type: String, required: true },
  category: { type: String, required: true }, // Housing, Agriculture, Health, Education, Financial, Social Security
  description: { type: String, required: true },
  eligibilityCriteria: {
    maxIncome: { type: Number, default: 800000 },
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 70 },
    gender: { type: String, default: 'All' },
    occupation: { type: String, default: 'All' },
    category: { type: String, default: 'All' }
  },
  requiredDocuments: [{ type: String }],
  state: { type: String, default: 'All India' },
  benefits: { type: String, required: true },
  deadline: { type: String, default: 'Open Throughout Year' },
  applicationUrl: { type: String, default: '#' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', schemeSchema);
