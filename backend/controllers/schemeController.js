const Scheme = require('../models/Scheme');
const pythonService = require('../services/pythonService');
const { checkInMemoryMode } = require('../config/db');

// Seed schemes for in-memory fallback mode
let memorySchemes = [
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
  },
  {
    _id: 'sch_2',
    schemeName: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
    category: 'Health',
    description: 'World\'s largest government health assurance scheme offering cashless health cover of ₹5 Lakhs per family per year.',
    eligibilityCriteria: { maxIncome: 500000, minAge: 0, maxAge: 100, gender: 'All', occupation: 'All' },
    requiredDocuments: ['Aadhaar Card', 'Ration Card', 'SECC Data Proof'],
    state: 'All India',
    benefits: 'Cashless treatment up to ₹5,00,000 per family per year in empanelled hospitals',
    deadline: 'Active Year-round',
    applicationUrl: 'https://pmjay.gov.in',
    tags: ['health', 'insurance', 'hospital']
  },
  {
    _id: 'sch_3',
    schemeName: 'PM Kisan Samman Nidhi (PM-KISAN)',
    category: 'Agriculture',
    description: 'Direct income support of ₹6,000 per year transferred into bank accounts of landholder farmer families in 3 installments.',
    eligibilityCriteria: { maxIncome: 600000, minAge: 18, maxAge: 75, gender: 'All', occupation: 'Farmer' },
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Records (Khasra/Khatauni)', 'Bank Passbook'],
    state: 'All India',
    benefits: 'Direct financial transfer of ₹6,000 per year in 3 equal installments',
    deadline: 'Active Year-round',
    applicationUrl: 'https://pmkisan.gov.in',
    tags: ['agriculture', 'farmer', 'income']
  },
  {
    _id: 'sch_4',
    schemeName: 'Post-Matric Scholarship Scheme for SC/ST/OBC Students',
    category: 'Education',
    description: 'Financial support for post-secondary education to reduce dropout rates among marginalized community students.',
    eligibilityCriteria: { maxIncome: 250000, minAge: 15, maxAge: 30, gender: 'All', occupation: 'Student', category: 'SC, ST, OBC' },
    requiredDocuments: ['Aadhaar Card', 'Caste Certificate', 'Income Certificate', 'Previous Marksheet'],
    state: 'All India',
    benefits: 'Full tuition fee reimbursement + monthly maintenance allowance up to ₹1,200',
    deadline: '31 Oct 2026',
    applicationUrl: 'https://scholarships.gov.in',
    tags: ['education', 'student', 'scholarship']
  },
  {
    _id: 'sch_5',
    schemeName: 'Ladli Behna Yojana (State Welfare)',
    category: 'Social Security',
    description: 'Monthly direct financial support of ₹1,250 to eligible women to enhance economic self-reliance and nutrition status.',
    eligibilityCriteria: { maxIncome: 250000, minAge: 21, maxAge: 60, gender: 'Female', occupation: 'All' },
    requiredDocuments: ['Aadhaar Card', 'Samagra ID / State ID', 'Bank Account Linkage'],
    state: 'Madhya Pradesh',
    benefits: 'Monthly ₹1,250 direct cash transfer to bank account',
    deadline: 'Open Throughout Year',
    applicationUrl: 'https://cmladlibehna.mp.gov.in',
    tags: ['women', 'financial aid', 'state']
  },
  {
    _id: 'sch_6',
    schemeName: 'PM Vishwakarma Scheme',
    category: 'Financial',
    description: 'Comprehensive support for traditional artisans and craftspeople including skill training, toolkit incentive of ₹15,000, and collateral-free credit.',
    eligibilityCriteria: { maxIncome: 450000, minAge: 18, maxAge: 65, gender: 'All', occupation: 'Artisan / Craftsman' },
    requiredDocuments: ['Aadhaar Card', 'Mobile Number', 'Bank Passbook', 'Skill Certificate'],
    state: 'All India',
    benefits: '₹15,000 toolkit grant + Collateral-free loans up to ₹3 Lakhs at 5% interest',
    deadline: 'Open Throughout Year',
    applicationUrl: 'https://pmvishwakarma.gov.in',
    tags: ['artisans', 'loans', 'skill']
  }
];

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
    const userProfile = req.body.userProfile || {
      income: req.user?.income || req.body.income || 240000,
      age: req.user?.age || req.body.age || 25,
      gender: req.user?.gender || req.body.gender || 'Female',
      occupation: req.user?.occupation || req.body.occupation || 'Farmer',
      category: req.user?.category || req.body.category || 'General',
      education: req.user?.education || req.body.education || 'Graduate',
      state: req.user?.state || req.body.state || 'All India'
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
