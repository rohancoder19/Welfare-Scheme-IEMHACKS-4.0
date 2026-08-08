const Complaint = require('../models/Complaint');
const StatusLog = require('../models/StatusLog');
const { memoryComplaints, memoryStatusLogs } = require('./complaintController');
const { memorySchemes } = require('./schemeController');
const { checkInMemoryMode } = require('../config/db');

const sortComplaintsByPriorityQueue = (list) => {
  const priorityRank = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, High: 2, Medium: 3, Low: 4 };
  const now = Date.now();

  return [...list].sort((a, b) => {
    const rankA = priorityRank[a.priority?.toUpperCase()] || 3;
    const rankB = priorityRank[b.priority?.toUpperCase()] || 3;

    if (rankA !== rankB) return rankA - rankB;

    const urgA = a.aiAnalysis?.urgencyScore || a.priorityScore || 50;
    const urgB = b.aiAnalysis?.urgencyScore || b.priorityScore || 50;
    if (urgA !== urgB) return urgB - urgA; // Higher urgency score first

    const deadA = a.slaDeadline ? new Date(a.slaDeadline).getTime() - now : Infinity;
    const deadB = b.slaDeadline ? new Date(b.slaDeadline).getTime() - now : Infinity;
    if (deadA !== deadB) return deadA - deadB; // Expiring SLA first

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Oldest first
  });
};

const getAllComplaints = async (req, res) => {
  try {
    const { priority, status, category } = req.query;

    let complaints = [];

    if (!checkInMemoryMode()) {
      let query = {};
      if (priority && priority !== 'All') query.priority = { $regex: new RegExp(`^${priority}$`, 'i') };
      if (status && status !== 'All') query.status = { $regex: new RegExp(`^${status}$`, 'i') };
      if (category && category !== 'All') query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      complaints = await Complaint.find(query);
    } else {
      complaints = [...memoryComplaints];
      if (priority && priority !== 'All') complaints = complaints.filter(c => c.priority?.toLowerCase() === priority.toLowerCase());
      if (status && status !== 'All') complaints = complaints.filter(c => c.status?.toLowerCase() === status.toLowerCase());
      if (category && category !== 'All') complaints = complaints.filter(c => c.category?.toLowerCase() === category.toLowerCase());
    }

    const sortedComplaints = sortComplaintsByPriorityQueue(complaints);
    res.json({ success: true, count: sortedComplaints.length, complaints: sortedComplaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, assignedOfficer, department } = req.body;
    let finalStatus = status || 'Under Review';
    if (finalStatus === 'Submitted') {
      finalStatus = 'Under Review';
    }

    const updater = req.user?.name || 'Officer Rajesh Sharma';
    const dept = department || assignedOfficer || 'Municipal Department';

    if (!checkInMemoryMode()) {
      const complaint = await Complaint.findById(id);
      if (complaint) {
        complaint.status = finalStatus;
        if (assignedOfficer) complaint.assignedOfficer = assignedOfficer;
        complaint.updatedAt = new Date();
        await complaint.save();

        const newLog = await StatusLog.create({
          complaintId: id,
          status: finalStatus,
          remarks: remarks || `Status updated to ${finalStatus}`,
          updatedBy: updater,
          department: dept,
          actorType: req.user?.role === 'Admin' ? 'Admin' : 'Officer'
        });

        return res.json({ success: true, message: 'Complaint status updated successfully', complaint, log: newLog });
      }
    }

    // In-memory update
    const complaint = memoryComplaints.find(c => c._id === id || c.id === id);
    if (complaint) {
      complaint.status = finalStatus;
      if (assignedOfficer) complaint.assignedOfficer = assignedOfficer;
      complaint.updatedAt = new Date();

      const newLog = {
        _id: 'log_' + Date.now(),
        complaintId: complaint._id,
        status: finalStatus,
        remarks: remarks || `Status updated to ${finalStatus}`,
        updatedBy: updater,
        department: dept,
        actorType: req.user?.role === 'Admin' ? 'Admin' : 'Officer',
        timestamp: new Date()
      };
      memoryStatusLogs.push(newLog);

      return res.json({ success: true, message: 'Complaint status updated successfully', complaint, log: newLog });
    }

    res.status(404).json({ success: false, message: 'Complaint not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Human-in-the-Loop Admin Decision Override
 * PUT /api/admin/complaints/:id/decision
 */
const overrideAIDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, priority, department, slaHours, reason } = req.body;

    const deciderName = req.user?.name || 'Admin Officer';

    let targetComplaint = null;

    if (!checkInMemoryMode()) {
      targetComplaint = await Complaint.findById(id);
    } else {
      targetComplaint = memoryComplaints.find(c => c._id === id || c.id === id);
    }

    if (!targetComplaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const normPriority = (priority || targetComplaint.priority || 'HIGH').toUpperCase();
    const createdTime = new Date(targetComplaint.createdAt || Date.now()).getTime();
    const newSLA = Number(slaHours) || targetComplaint.slaHours || 48;
    const newDeadline = new Date(createdTime + newSLA * 3600 * 1000);

    const isOverridden = Boolean(
      (category && category !== targetComplaint.aiAnalysis?.category) ||
      (normPriority !== targetComplaint.aiAnalysis?.priority) ||
      (department && department !== targetComplaint.aiAnalysis?.department) ||
      (newSLA !== targetComplaint.aiAnalysis?.recommendedSLAHours)
    );

    targetComplaint.category = category || targetComplaint.category;
    targetComplaint.priority = normPriority;
    if (department) targetComplaint.assignedOfficer = `${department} Field Unit`;
    targetComplaint.slaHours = newSLA;
    targetComplaint.slaDeadline = newDeadline;
    targetComplaint.updatedAt = new Date();

    targetComplaint.finalDecision = {
      category: category || targetComplaint.category,
      priority: normPriority,
      department: department || targetComplaint.assignedOfficer,
      slaHours: newSLA,
      overridden: isOverridden,
      decidedBy: deciderName,
      decidedAt: new Date()
    };

    const statusRemarks = isOverridden
      ? `Human-in-the-Loop Override: Category '${targetComplaint.category}', Priority '${normPriority}', Department '${department || targetComplaint.assignedOfficer}', SLA ${newSLA}h.${reason ? ' Justification: ' + reason : ''}`
      : `Admin accepted AI recommendations for ${targetComplaint.category} under ${department || targetComplaint.assignedOfficer}.`;

    if (!checkInMemoryMode()) {
      await targetComplaint.save();

      await StatusLog.create({
        complaintId: id,
        status: isOverridden ? 'Department Assigned (Overridden)' : 'Department Assigned',
        remarks: statusRemarks,
        updatedBy: deciderName,
        department: department || targetComplaint.assignedOfficer,
        actorType: 'Admin'
      });
    } else {
      memoryStatusLogs.push({
        _id: 'log_' + Date.now(),
        complaintId: targetComplaint._id || id,
        status: isOverridden ? 'Department Assigned (Overridden)' : 'Department Assigned',
        remarks: statusRemarks,
        updatedBy: deciderName,
        department: department || targetComplaint.assignedOfficer,
        actorType: 'Admin',
        timestamp: new Date()
      });
    }

    return res.json({
      success: true,
      message: isOverridden ? 'AI classification successfully overridden by Admin' : 'AI recommendation accepted',
      complaint: targetComplaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    let complaintsList = memoryComplaints;
    if (!checkInMemoryMode()) {
      const dbC = await Complaint.find({});
      if (dbC.length > 0) complaintsList = dbC;
    }

    const totalComplaints = complaintsList.length;
    const resolvedCount = complaintsList.filter(c => c.status === 'Resolved').length;

    const criticalCount = complaintsList.filter(c => c.priority?.toUpperCase() === 'CRITICAL').length;
    const highCount = complaintsList.filter(c => c.priority?.toUpperCase() === 'HIGH' || c.priority === 'High').length;
    const mediumCount = complaintsList.filter(c => c.priority?.toUpperCase() === 'MEDIUM' || c.priority === 'Medium').length;
    const lowCount = complaintsList.filter(c => c.priority?.toUpperCase() === 'LOW' || c.priority === 'Low').length;

    const inProgressCount = complaintsList.filter(c => c.status === 'In Progress' || c.status === 'Under Review').length;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 75;

    const now = Date.now();
    const breachedCount = complaintsList.filter(c => {
      if (!c.slaDeadline || c.status === 'Resolved') return false;
      return new Date(c.slaDeadline).getTime() < now;
    }).length;

    res.json({
      success: true,
      analytics: {
        totalComplaints,
        resolvedCount,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        highPriorityCount: criticalCount + highCount,
        inProgressCount,
        resolutionRate,
        breachedCount,
        totalSchemesActive: memorySchemes.length,
        totalCitizensAssisted: 1420 + totalComplaints * 12
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllComplaints,
  updateComplaintStatus,
  overrideAIDecision,
  getAdminAnalytics
};

