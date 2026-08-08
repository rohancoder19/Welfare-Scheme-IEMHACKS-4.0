const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  schemeName: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true, index: true },
  category: { type: String, required: true }, // Housing, Agriculture, Health, Education, Financial, Social Security
  schemeCategory: { type: String },
  description: { type: String, required: true },
  details: { type: String },
  eligibilityText: { type: String },
  eligibilityCriteria: {
    maxIncome: { type: Number, default: null },
    minIncome: { type: Number, default: null },
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    gender: { type: String, default: 'All' },
    occupation: { type: String, default: 'All' },
    student: { type: Boolean, default: null },
    category: [{ type: String }],
    additionalConditions: [{ type: String }]
  },
  requiredDocuments: [{ type: String }],
  documents: { type: String },
  application: { type: String },
  governmentLevel: { type: String, default: 'State', index: true },
  state: { type: String, default: 'All India', index: true },
  benefits: { type: String, required: true },
  deadline: { type: String, default: 'Open Throughout Year' },
  applicationUrl: { type: String, default: '#' },
  tags: [{ type: String }],
  extractionMetadata: {
    stateConfidence: { type: Number, default: 1.0 },
    eligibilityConfidence: { type: Number, default: 1.0 },
    sourceFields: [{ type: String }],
    needsReview: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', schemeSchema);
