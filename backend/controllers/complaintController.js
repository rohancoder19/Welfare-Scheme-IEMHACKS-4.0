const Complaint = require('../models/Complaint');
const StatusLog = require('../models/StatusLog');
const pythonService = require('../services/pythonService');
const { checkInMemoryMode } = require('../config/db');

// Pre-populated initial mock complaints with AI intelligence for memory store mode
let memoryComplaints = [
  {
    _id: 'cmp_1001',
    userId: 'user_citizen_1',
    userName: 'Ananya Verma',
    userEmail: 'ananya@citizen.in',
    title: 'Garbage has not been collected for 7 days near the primary school.',
    category: 'Sanitation',
    description: 'Waste has piled up heavily outside St. Jude Primary School gate for over a week. Severe odor and disease vectors present.',
    location: {
      address: 'Ward 14, Near St. Jude School Gate, Pune',
      lat: 18.5204,
      lng: 73.8567
    },
    photo: '',
    status: 'Submitted',
    priority: 'HIGH',
    priorityScore: 87,
    assignedOfficer: 'Municipal Sanitation Officer',
    nlpAnalysis: 'AI Triage: Classified as Sanitation (Garbage Collection) with HIGH priority (87/100 Urgency).',
    aiAnalysis: {
      category: 'Sanitation',
      subcategory: 'Garbage Collection',
      priority: 'HIGH',
      urgencyScore: 87,
      department: 'Municipal Sanitation',
      confidence: 0.94,
      recommendedSLAHours: 48,
      recommendedAction: 'Immediate sanitation inspection and waste removal crew dispatch',
      reason: [
        'Public sanitation issue',
        'Reported for 7 days',
        'Near a primary school',
        'Potential public health impact'
      ],
      analyzedAt: new Date(Date.now() - 16 * 3600 * 1000)
    },
    finalDecision: {
      category: 'Sanitation',
      priority: 'HIGH',
      department: 'Municipal Sanitation',
      slaHours: 48,
      overridden: false,
      decidedBy: 'Civic AI Triage System',
      decidedAt: new Date(Date.now() - 16 * 3600 * 1000)
    },
    slaHours: 48,
    slaDeadline: new Date(Date.now() + 32 * 3600 * 1000), // 32 hours remaining
    createdAt: new Date(Date.now() - 16 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 16 * 3600 * 1000)
  },
  {
    _id: 'cmp_1002',
    userId: 'user_citizen_2',
    userName: 'Rohan Mehta',
    userEmail: 'rohan@citizen.in',
    title: 'Open high voltage live wire dangling near children park',
    category: 'Electricity',
    description: 'Heavy storm caused transformer cable to snap. Live high voltage wire touching metal fence near children play park.',
    location: {
      address: 'Sector 4 Public Park, Ward 22, Pune',
      lat: 18.5312,
      lng: 73.8445
    },
    photo: '',
    status: 'Under Review',
    priority: 'CRITICAL',
    priorityScore: 95,
    assignedOfficer: 'Senior Zonal Emergency Electrical Inspector',
    nlpAnalysis: 'AI Triage: Classified as Electricity (Loose / Exposed Wiring) with CRITICAL priority (95/100 Urgency).',
    aiAnalysis: {
      category: 'Electricity',
      subcategory: 'Loose / Exposed Wiring',
      priority: 'CRITICAL',
      urgencyScore: 95,
      department: 'State Electricity Distribution Board',
      confidence: 0.97,
      recommendedSLAHours: 12,
      recommendedAction: 'Immediate emergency power cutoff and site isolation team dispatch',
      reason: [
        'Critical electrocution hazard',
        'Live high voltage cable exposed',
        'Proximity to children playground',
        'Imminent threat to life'
      ],
      analyzedAt: new Date(Date.now() - 8 * 3600 * 1000)
    },
    finalDecision: {
      category: 'Electricity',
      priority: 'CRITICAL',
      department: 'State Electricity Distribution Board',
      slaHours: 12,
      overridden: false,
      decidedBy: 'Civic AI Triage System',
      decidedAt: new Date(Date.now() - 8 * 3600 * 1000)
    },
    slaHours: 12,
    slaDeadline: new Date(Date.now() + 4 * 3600 * 1000), // 4 hours remaining
    createdAt: new Date(Date.now() - 8 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000)
  },
  {
    _id: 'cmp_1003',
    userId: 'user_citizen_1',
    userName: 'Ananya Verma',
    userEmail: 'ananya@citizen.in',
    title: 'Major underground water pipeline breach flooding residential road',
    category: 'Water',
    description: 'Clean drinking water leaking heavily from ruptured main pipeline since yesterday morning. Road sub-base eroding.',
    location: {
      address: 'MG Road Junction, Ward 11, Pune',
      lat: 18.5189,
      lng: 73.8621
    },
    photo: '',
    status: 'In Progress',
    priority: 'MEDIUM',
    priorityScore: 68,
    assignedOfficer: 'Assistant Engineer Water Works',
    nlpAnalysis: 'AI Triage: Classified as Water (Pipeline Leakage) with MEDIUM priority (68/100 Urgency).',
    aiAnalysis: {
      category: 'Water',
      subcategory: 'Pipeline Leakage',
      priority: 'MEDIUM',
      urgencyScore: 68,
      department: 'City Water & Sewerage Board',
      confidence: 0.91,
      recommendedSLAHours: 24,
      recommendedAction: 'Schedule emergency valve closure and pipeline repair crew',
      reason: [
        'Essential utility disruption',
        'Road infrastructure erosion risk'
      ],
      analyzedAt: new Date(Date.now() - 30 * 3600 * 1000)
    },
    finalDecision: {
      category: 'Water',
      priority: 'HIGH',
      department: 'City Water & Sewerage Board',
      slaHours: 24,
      overridden: true,
      decidedBy: 'Admin Officer (Human Override)',
      decidedAt: new Date(Date.now() - 28 * 3600 * 1000)
    },
    slaHours: 24,
    slaDeadline: new Date(Date.now() - 4 * 3600 * 1000), // BREACHED (-4 hours)
    createdAt: new Date(Date.now() - 30 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000)
  }
];

let memoryStatusLogs = [
  {
    _id: 'log_1',
    complaintId: 'cmp_1001',
    status: 'Submitted',
    remarks: 'Grievance submitted via Citizen Web Portal.',
    updatedBy: 'Ananya Verma',
    department: 'Public Citizen Portal',
    actorType: 'Citizen',
    timestamp: new Date(Date.now() - 16 * 3600 * 1000)
  },
  {
    _id: 'log_2',
    complaintId: 'cmp_1001',
    status: 'AI Analyzed',
    remarks: 'AI Classified: Sanitation (Garbage Collection) | HIGH Priority (87/100 Urgency) | SLA: 48h.',
    updatedBy: 'Civic AI System',
    department: 'Municipal Sanitation',
    actorType: 'System',
    timestamp: new Date(Date.now() - 15.9 * 3600 * 1000)
  },
  {
    _id: 'log_3',
    complaintId: 'cmp_1002',
    status: 'Submitted',
    remarks: 'Grievance submitted via Citizen Web Portal.',
    updatedBy: 'Rohan Mehta',
    department: 'Public Citizen Portal',
    actorType: 'Citizen',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000)
  },
  {
    _id: 'log_4',
    complaintId: 'cmp_1002',
    status: 'AI Analyzed',
    remarks: 'AI Classified: Electricity (Loose Wiring) | CRITICAL Priority (95/100 Urgency) | SLA: 12h.',
    updatedBy: 'Civic AI System',
    department: 'State Electricity Board',
    actorType: 'System',
    timestamp: new Date(Date.now() - 7.9 * 3600 * 1000)
  },
  {
    _id: 'log_5',
    complaintId: 'cmp_1002',
    status: 'Under Review',
    remarks: 'Senior emergency electrical inspector dispatched to isolate power cable.',
    updatedBy: 'Officer Rajesh Sharma',
    department: 'State Electricity Board',
    actorType: 'Officer',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000)
  },
  {
    _id: 'log_6',
    complaintId: 'cmp_1003',
    status: 'Submitted',
    remarks: 'Grievance submitted via Citizen Web Portal.',
    updatedBy: 'Ananya Verma',
    department: 'Public Citizen Portal',
    actorType: 'Citizen',
    timestamp: new Date(Date.now() - 30 * 3600 * 1000)
  },
  {
    _id: 'log_7',
    complaintId: 'cmp_1003',
    status: 'AI Analyzed',
    remarks: 'AI Classified: Water (Pipeline Leakage) | MEDIUM Priority (68/100 Urgency) | SLA: 24h.',
    updatedBy: 'Civic AI System',
    department: 'City Water Board',
    actorType: 'System',
    timestamp: new Date(Date.now() - 29.9 * 3600 * 1000)
  },
  {
    _id: 'log_8',
    complaintId: 'cmp_1003',
    status: 'In Progress',
    remarks: 'Human Override: Admin escalated priority to HIGH (SLA 24h). Valve isolation ongoing.',
    updatedBy: 'Admin Officer',
    department: 'City Water Board',
    actorType: 'Admin',
    timestamp: new Date(Date.now() - 28 * 3600 * 1000)
  }
];

/**
 * Standalone API Endpoint for AI Complaint Analysis
 * POST /api/ai/analyze-complaint
 */
const analyzeComplaintText = async (req, res) => {
  try {
    const { complaintText, location, existingCategory, title, description, category } = req.body;
    const inputTitle = title || (complaintText ? complaintText.substring(0, 50) : '');
    const inputDesc = description || complaintText || '';
    const inputCat = existingCategory || category || 'Other';

    if (!inputTitle && !inputDesc) {
      return res.status(400).json({ success: false, message: 'Please provide complaintText or title/description for analysis' });
    }

    const aiResult = await pythonService.analyzeComplaint(inputTitle, inputDesc, inputCat, location);

    return res.json({
      success: true,
      category: aiResult.category || aiResult.predictedCategory,
      subcategory: aiResult.subcategory || 'General Services',
      priority: aiResult.priority || 'HIGH',
      urgencyScore: aiResult.urgencyScore || aiResult.priorityScore || 85,
      department: aiResult.department || 'Municipal Department',
      confidence: aiResult.confidence || 0.94,
      recommendedSLAHours: aiResult.recommendedSLAHours || 48,
      recommendedAction: aiResult.recommendedAction || 'Immediate municipal inspection',
      reason: aiResult.reason || ['Public hazard detected'],
      nlpSummary: aiResult.nlpSummary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { title, category, description, address, lat, lng } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide complaint title and description' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

    // Step 1: Call Python ML service with non-failing try-catch fallback
    let aiAnalysis = null;
    try {
      aiAnalysis = await pythonService.analyzeComplaint(title, description, category || 'Other', address);
    } catch (aiErr) {
      console.warn('[AI Service Error] Fallback triggered during complaint submission:', aiErr.message);
      aiAnalysis = {
        category: category || 'General Public Service',
        subcategory: 'General Services',
        priority: 'MEDIUM',
        urgencyScore: 50,
        department: 'Civic Grievance Cell',
        departmentReason: 'Assigned to general civic cell pending manual officer review',
        confidence: 0.50,
        recommendedSLAHours: 48,
        recommendedAction: 'Manual administrative officer classification required',
        reason: ['AI Analysis Unavailable - Manual classification pending'],
        nlpSummary: 'AI Analysis: Unavailable. Pending manual officer review.'
      };
    }

    const finalCategory = aiAnalysis.category || aiAnalysis.predictedCategory || category || 'General';
    const finalPriority = aiAnalysis.priority || 'HIGH';
    const priorityScore = aiAnalysis.urgencyScore || aiAnalysis.priorityScore || 85;
    const department = aiAnalysis.department || 'Municipal Civic Department';
    const slaHours = aiAnalysis.recommendedSLAHours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    const assignedOfficer = `${department} Field Unit`;

    const aiPayload = {
      category: finalCategory,
      subcategory: aiAnalysis.subcategory || 'General Services',
      priority: finalPriority,
      urgencyScore: priorityScore,
      department,
      confidence: aiAnalysis.confidence || 0.94,
      recommendedSLAHours: slaHours,
      recommendedAction: aiAnalysis.recommendedAction || 'Immediate inspection',
      reason: aiAnalysis.reason || ['Grievance logged by citizen'],
      analyzedAt: new Date()
    };

    const initialDecision = {
      category: finalCategory,
      priority: finalPriority,
      department,
      slaHours,
      overridden: false,
      decidedBy: 'Civic AI Triage System',
      decidedAt: new Date()
    };

    if (!checkInMemoryMode()) {
      const complaint = await Complaint.create({
        userId: req.user?.id || 'user_guest',
        userName: req.user?.name || 'Citizen User',
        userEmail: req.user?.email || 'citizen@gov.in',
        title,
        category: finalCategory,
        description,
        location: {
          address: address || 'City Ward Area',
          lat: Number(lat) || 22.5726,
          lng: Number(lng) || 88.3639
        },
        photo: photoUrl,
        status: 'Submitted',
        priority: finalPriority,
        priorityScore,
        assignedOfficer,
        nlpAnalysis: aiAnalysis.nlpSummary || 'AI Complaint classification complete.',
        aiAnalysis: aiPayload,
        finalDecision: initialDecision,
        slaHours,
        slaDeadline
      });

      await StatusLog.create({
        complaintId: complaint._id.toString(),
        status: 'Submitted',
        remarks: 'Grievance submitted via Citizen Web Portal.',
        updatedBy: req.user?.name || 'Citizen User',
        department: 'Public Citizen Portal',
        actorType: 'Citizen'
      });

      await StatusLog.create({
        complaintId: complaint._id.toString(),
        status: 'AI Analyzed',
        remarks: `AI Classified: ${finalCategory} (${aiPayload.subcategory}) | Priority: ${finalPriority} (${priorityScore}/100 Urgency) | SLA: ${slaHours}h.`,
        updatedBy: 'Civic AI System',
        department,
        actorType: 'System'
      });

      return res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully with AI classification',
        complaint
      });
    }

    // In-Memory Mode
    const newId = 'cmp_' + (1000 + memoryComplaints.length + 1);
    const memComplaint = {
      _id: newId,
      userId: req.user?.id || 'user_citizen_1',
      userName: req.user?.name || 'Ananya Verma',
      userEmail: req.user?.email || 'ananya@citizen.in',
      title,
      category: finalCategory,
      description,
      location: {
        address: address || 'City Ward Area',
        lat: Number(lat) || 18.5204,
        lng: Number(lng) || 73.8567
      },
      photo: photoUrl,
      status: 'Submitted',
      priority: finalPriority,
      priorityScore,
      assignedOfficer,
      nlpAnalysis: aiAnalysis.nlpSummary || 'AI Complaint classification complete.',
      aiAnalysis: aiPayload,
      finalDecision: initialDecision,
      slaHours,
      slaDeadline,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryComplaints.unshift(memComplaint);

    memoryStatusLogs.push({
      _id: 'log_' + Date.now() + '_1',
      complaintId: newId,
      status: 'Submitted',
      remarks: 'Grievance submitted via Citizen Web Portal.',
      updatedBy: req.user?.name || 'Ananya Verma',
      department: 'Public Citizen Portal',
      actorType: 'Citizen',
      timestamp: new Date()
    });

    memoryStatusLogs.push({
      _id: 'log_' + Date.now() + '_2',
      complaintId: newId,
      status: 'AI Analyzed',
      remarks: `AI Classified: ${finalCategory} (${aiPayload.subcategory}) | Priority: ${finalPriority} (${priorityScore}/100 Urgency) | SLA: ${slaHours}h.`,
      updatedBy: 'Civic AI System',
      department,
      actorType: 'System',
      timestamp: new Date(Date.now() + 100)
    });

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully with AI classification',
      complaint: memComplaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserComplaints = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!checkInMemoryMode()) {
      const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 });
      if (complaints.length > 0) return res.json({ success: true, count: complaints.length, complaints });
    }

    const filtered = memoryComplaints.filter(c => c.userId === userId || c.userEmail === req.user?.email);
    res.json({ success: true, count: filtered.length, complaints: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!checkInMemoryMode()) {
      const complaint = await Complaint.findById(id);
      const logs = await StatusLog.find({ complaintId: id }).sort({ timestamp: 1 });
      if (complaint) {
        return res.json({ success: true, complaint, statusLogs: logs });
      }
    }

    const complaint = memoryComplaints.find(c => c._id === id || c.id === id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    const logs = memoryStatusLogs.filter(l => l.complaintId === complaint._id || l.complaintId === id);
    res.json({ success: true, complaint, statusLogs: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaintById,
  analyzeComplaintText,
  memoryComplaints,
  memoryStatusLogs
};

