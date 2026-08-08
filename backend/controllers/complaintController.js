const Complaint = require('../models/Complaint');
const StatusLog = require('../models/StatusLog');
const pythonService = require('../services/pythonService');
const { checkInMemoryMode } = require('../config/db');

// In-memory complaints data (starts empty for real user submissions)
let memoryComplaints = [];
let memoryStatusLogs = [];

const createComplaint = async (req, res) => {
  try {
    const { title, category, description, address, lat, lng } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide complaint title and description' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

    // Step 1: Call Python ML service to perform NLP Classification & Priority Prediction
    const aiAnalysis = await pythonService.analyzeComplaint(title, description, category || 'Other');

    const finalCategory = aiAnalysis.predictedCategory || category || 'General';
    const finalPriority = aiAnalysis.priority || 'Medium';
    const priorityScore = aiAnalysis.priorityScore || 50;

    const assignedOfficer = finalPriority === 'High' 
      ? 'Senior Zonal Emergency Officer (Auto-Escalated)'
      : 'District Ward Officer';

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
        nlpAnalysis: aiAnalysis.nlpSummary || 'AI Complaint classification complete.'
      });

      await StatusLog.create({
        complaintId: complaint._id.toString(),
        status: 'Submitted',
        remarks: `Grievance registered. AI classified category as '${finalCategory}' with '${finalPriority}' priority.`,
        updatedBy: 'Civic AI System'
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
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryComplaints.unshift(memComplaint);

    memoryStatusLogs.push({
      _id: 'log_' + Date.now(),
      complaintId: newId,
      status: 'Submitted',
      remarks: `Grievance registered. AI classified category as '${finalCategory}' with '${finalPriority}' priority.`,
      updatedBy: 'Civic AI System',
      timestamp: new Date()
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

    const filtered = memoryComplaints.filter(c => c.userId === userId || userId === 'guest_citizen_101');
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

    const complaint = memoryComplaints.find(c => c._id === id || c.id === id) || memoryComplaints[0];
    const logs = memoryStatusLogs.filter(l => l.complaintId === complaint._id);
    res.json({ success: true, complaint, statusLogs: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createComplaint, getUserComplaints, getComplaintById, memoryComplaints, memoryStatusLogs };
