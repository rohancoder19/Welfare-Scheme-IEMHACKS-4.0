const Scheme = require('../models/Scheme');
const pythonService = require('../services/pythonService');
const { checkInMemoryMode } = require('../config/db');

const path = require('path');
const fs = require('fs');

// Load full 3,400 schemes dataset for seamless fallback
let memorySchemes = [];
const processedJsonPath = path.join(__dirname, '..', '..', 'ml_service', 'data', 'processed_welfare_schemes.json');
if (fs.existsSync(processedJsonPath)) {
  try {
    const raw = fs.readFileSync(processedJsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
    memorySchemes = parsed.map((s, idx) => ({
      _id: s.slug || `sch_${idx + 1}`,
      schemeName: s.schemeName,
      category: s.schemeCategory || 'General Welfare',
      schemeCategory: s.schemeCategory || 'General Welfare',
      description: s.details || s.schemeName,
      details: s.details || '',
      benefits: s.benefits || 'Welfare benefits',
      eligibilityText: s.eligibilityText || '',
      application: s.application || '',
      documents: s.documents || '',
      governmentLevel: s.governmentLevel || 'State',
      state: s.state || 'All India',
      tags: s.tags || [],
      eligibilityCriteria: s.eligibilityCriteria || {},
      extractionMetadata: s.extractionMetadata || {}
    }));
  } catch (err) {
    console.error('Error reading processed_welfare_schemes.json in controller:', err);
  }
}

if (memorySchemes.length === 0) {
  memorySchemes = [
    {
      _id: 'sch_1',
      schemeName: 'Pradhan Mantri Awas Yojana (PMAY-Urban/Gramin)',
      category: 'Housing',
      description: 'Provides interest subsidy and financial assistance up to ₹2.5 Lakhs to EWS and LIG families for building pucca houses.',
      eligibilityCriteria: { maxIncome: 300000, minAge: 18, maxAge: 70, gender: 'All', occupation: 'All' },
      requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Property / Land Document'],
      state: 'All India',
      benefits: 'Up to ₹2.50 Lakh financial subsidy directly transferred to bank account',
      deadline: '31 Dec 2026',
      applicationUrl: 'https://pmaymis.gov.in',
      tags: ['housing', 'subsidy', 'shelter']
    }
  ];
}

const getSchemes = async (req, res) => {
  try {
    const { category, state, search } = req.query;

    if (!checkInMemoryMode()) {
      let query = {};
      if (category) query.category = category;
      if (state && state !== 'All') query.$or = [{ state: state }, { state: 'All India' }];
      if (search) {
        query.$or = [
          { schemeName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      const schemes = await Scheme.find(query);
      if (schemes.length > 0) {
        return res.json({ success: true, count: schemes.length, schemes });
      }
    }

    // Fallback in-memory filtered return
    let filtered = [...memorySchemes];
    if (category) filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
    if (state && state !== 'All') filtered = filtered.filter(s => s.state === state || s.state === 'All India');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => s.schemeName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }

    res.json({ success: true, count: filtered.length, schemes: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSchemeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!checkInMemoryMode()) {
      const scheme = await Scheme.findById(id);
      if (scheme) return res.json({ success: true, scheme });
    }

    const memScheme = memorySchemes.find(s => s._id === id || s.id === id) || memorySchemes[0];
    res.json({ success: true, scheme: memScheme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI-powered Welfare Scheme Eligibility Recommendation Engine
 */
const recommendSchemes = async (req, res) => {
  try {
    const rawProfile = req.body.userProfile || req.body || {};
    const userProfile = {
      income: Number(rawProfile.income ?? 240000),
      age: Number(rawProfile.age ?? 25),
      gender: String(rawProfile.gender ?? 'Female'),
      occupation: String(rawProfile.occupation ?? 'Student'),
      category: String(rawProfile.category ?? 'General'),
      education: String(rawProfile.education ?? 'Graduate'),
      state: String(rawProfile.state ?? 'West Bengal'),
      student: rawProfile.student !== undefined ? Boolean(rawProfile.student) : (String(rawProfile.occupation).toLowerCase() === 'student')
    };

    let allSchemes = memorySchemes;
    if (!checkInMemoryMode()) {
      const dbSchemes = await Scheme.find({});
      if (dbSchemes.length > 0) allSchemes = dbSchemes;
    }

    // Call Python FastAPI ML Service
    const recommendations = await pythonService.predictEligibility(userProfile, allSchemes);

    res.json({
      success: true,
      userProfile,
      recommendationsCount: recommendations.length,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSchemes, getSchemeById, recommendSchemes, memorySchemes };
