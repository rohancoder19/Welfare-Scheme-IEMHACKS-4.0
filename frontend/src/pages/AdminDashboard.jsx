import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchAdminComplaintsAPI, updateComplaintStatusAPI, fetchAdminAnalyticsAPI, overrideAIDecisionAPI } from '../services/complaintAPI';
import Maps from '../components/Maps';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, Users, FileText, Search, UserCheck, 
  ArrowRight, BarChart3, Filter, Sparkles, CheckCircle2, AlertOctagon, SlidersHorizontal, Timer, Cpu
} from 'lucide-react';

const AdminDashboard = () => {
  const { token, user } = useSelector((state) => state.auth);

  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [aiModalComplaint, setAiModalComplaint] = useState(null);

  // Status update modal
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [statusInput, setStatusInput] = useState('In Progress');
  const [remarksInput, setRemarksInput] = useState('');
  const [officerInput, setOfficerInput] = useState('Officer Rajesh Sharma');

  // Override AI modal
  const [overrideModalComplaint, setOverrideModalComplaint] = useState(null);
  const [overrideCategory, setOverrideCategory] = useState('Sanitation');
  const [overridePriority, setOverridePriority] = useState('HIGH');
  const [overrideDepartment, setOverrideDepartment] = useState('Municipal Sanitation');
  const [overrideSLA, setOverrideSLA] = useState(48);
  const [overrideReason, setOverrideReason] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (priorityFilter !== 'All') filters.priority = priorityFilter;
      if (statusFilter !== 'All') filters.status = statusFilter;

      const cRes = await fetchAdminComplaintsAPI(filters, token);
      if (cRes.success) {
        setComplaints(cRes.complaints);
        if (cRes.complaints.length > 0 && !selectedComplaint) {
          setSelectedComplaint(cRes.complaints[0]);
        } else if (selectedComplaint) {
          const updated = cRes.complaints.find(c => (c._id || c.id) === (selectedComplaint._id || selectedComplaint.id));
          if (updated) setSelectedComplaint(updated);
        }
      }

      const aRes = await fetchAdminAnalyticsAPI(token);
      if (aRes.success) setAnalytics(aRes.analytics);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [priorityFilter, statusFilter]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingComplaint) return;

    try {
      const res = await updateComplaintStatusAPI(
        editingComplaint._id || editingComplaint.id,
        { 
          status: statusInput, 
          remarks: remarksInput, 
          assignedOfficer: officerInput,
          department: editingComplaint.finalDecision?.department || editingComplaint.aiAnalysis?.department || 'Municipal Department'
        },
        token
      );

      if (res.success) {
        setEditingComplaint(null);
        setRemarksInput('');
        loadAdminData();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleAcceptAI = async (cmp) => {
    try {
      const payload = {
        category: cmp.aiAnalysis?.category || cmp.category,
        priority: cmp.aiAnalysis?.priority || cmp.priority,
        department: cmp.aiAnalysis?.department || cmp.assignedOfficer,
        slaHours: cmp.aiAnalysis?.recommendedSLAHours || 48,
        reason: 'Accepted AI Triage Recommendation'
      };

      const res = await overrideAIDecisionAPI(cmp._id || cmp.id, payload, token);
      if (res.success) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Accept AI error:', err);
    }
  };

  const handleOpenOverrideModal = (cmp) => {
    setOverrideModalComplaint(cmp);
    setOverrideCategory(cmp.finalDecision?.category || cmp.aiAnalysis?.category || cmp.category || 'Sanitation');
    setOverridePriority((cmp.finalDecision?.priority || cmp.aiAnalysis?.priority || cmp.priority || 'HIGH').toUpperCase());
    setOverrideDepartment(cmp.finalDecision?.department || cmp.aiAnalysis?.department || cmp.assignedOfficer || 'Municipal Sanitation');
    setOverrideSLA(cmp.finalDecision?.slaHours || cmp.aiAnalysis?.recommendedSLAHours || 48);
    setOverrideReason('');
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!overrideModalComplaint) return;

    try {
      const payload = {
        category: overrideCategory,
        priority: overridePriority,
        department: overrideDepartment,
        slaHours: Number(overrideSLA),
        reason: overrideReason
      };

      const res = await overrideAIDecisionAPI(overrideModalComplaint._id || overrideModalComplaint.id, payload, token);
      if (res.success) {
        setOverrideModalComplaint(null);
        loadAdminData();
      }
    } catch (err) {
      console.error('Override decision error:', err);
    }
  };

  // Helper for SLA calculation (ACTIVE, WARNING, BREACHED, RESOLVED)
  const getSLAStatus = (cmp) => {
    if (cmp.status === 'Resolved') return { statusLabel: 'RESOLVED', text: 'RESOLVED', isBreached: false };
    if (!cmp.slaDeadline) return { statusLabel: 'ACTIVE', text: 'ACTIVE (48h)', isBreached: false };

    const now = Date.now();
    const deadline = new Date(cmp.slaDeadline).getTime();
    const diffMs = deadline - now;

    if (diffMs <= 0) {
      return { statusLabel: 'BREACHED', text: '⚠ SLA BREACHED', isBreached: true };
    }
    const totalDuration = (cmp.slaHours || 48) * 3600 * 1000;
    const isWarning = diffMs < (totalDuration * 0.25) || diffMs < (6 * 3600 * 1000);

    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

    if (isWarning) {
      return { statusLabel: 'WARNING', text: `⏱ WARNING (${hours}h ${mins}m)`, isWarning: true };
    }
    return { statusLabel: 'ACTIVE', text: `⏱ ACTIVE (${hours}h ${mins}m)`, isActive: true };
  };

  // Count Priority Queue stats
  const criticalCount = complaints.filter(c => c.priority?.toUpperCase() === 'CRITICAL').length;
  const highCount = complaints.filter(c => c.priority?.toUpperCase() === 'HIGH' || c.priority === 'High').length;
  const mediumCount = complaints.filter(c => c.priority?.toUpperCase() === 'MEDIUM' || c.priority === 'Medium').length;
  const lowCount = complaints.filter(c => c.priority?.toUpperCase() === 'LOW' || c.priority === 'Low').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider border border-amber-500/20 mb-2 max-w-full flex-wrap">
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span className="break-words">AI GRIEVANCE INTELLIGENCE SYSTEM & COMMAND CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white break-words">Smart Priority Queue & Operational Triage</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Review AI urgency scores, conduct Human-in-the-Loop overrides, track SLA countdowns, and dispatch field units.</p>
        </div>
      </div>

      {/* Smart Priority Queue Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setPriorityFilter('CRITICAL')}
          className={`glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
            priorityFilter === 'CRITICAL' ? 'ring-2 ring-red-500 bg-red-500/10 border-red-500/50' : 'border-red-500/30 hover:border-red-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-wider">🔴 CRITICAL</span>
            <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 animate-pulse shrink-0" />
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-black text-red-400 font-mono">{criticalCount}</span>
            <span className="text-[10px] sm:text-[11px] text-gray-400">Immediate Action</span>
          </div>
        </div>

        <div 
          onClick={() => setPriorityFilter('HIGH')}
          className={`glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
            priorityFilter === 'HIGH' ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500/50' : 'border-rose-500/30 hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">🟠 HIGH</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{highCount}</span>
            <span className="text-[10px] sm:text-[11px] text-gray-400">High Urgency</span>
          </div>
        </div>

        <div 
          onClick={() => setPriorityFilter('MEDIUM')}
          className={`glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
            priorityFilter === 'MEDIUM' ? 'ring-2 ring-amber-400 bg-amber-400/10 border-amber-400/50' : 'border-amber-400/30 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">🟡 MEDIUM</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{mediumCount}</span>
            <span className="text-[10px] sm:text-[11px] text-gray-400">Standard Queue</span>
          </div>
        </div>

        <div 
          onClick={() => setPriorityFilter('LOW')}
          className={`glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
            priorityFilter === 'LOW' ? 'ring-2 ring-emerald-400 bg-emerald-400/10 border-emerald-400/50' : 'border-emerald-400/30 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">🟢 LOW</span>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{lowCount}</span>
            <span className="text-[11px] text-gray-400">Routine Maintenance</span>
          </div>
        </div>
      </div>

      {/* AI GRIEVANCE INTELLIGENCE CARD SECTION */}
      {selectedComplaint && (
        <div className="glass-panel rounded-3xl p-8 border border-sky-500/30 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-sky-400 tracking-wider uppercase font-mono">AI GRIEVANCE ANALYSIS & AUDIT CENTER</h3>
                <p className="text-base font-extrabold text-white truncate max-w-xl">{selectedComplaint.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedComplaint.finalDecision?.overridden ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⚡ Human Overridden ({selectedComplaint.finalDecision.decidedBy})
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  🤖 AI Automated Triage
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left AI Detection Attributes */}
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Classification Attributes</h4>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-bold text-white">{selectedComplaint.aiAnalysis?.category || selectedComplaint.category}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">Subcategory:</span>
                  <span className="font-bold text-sky-300">{selectedComplaint.aiAnalysis?.subcategory || 'General'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">AI Priority:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    (selectedComplaint.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    (selectedComplaint.priority || '').toUpperCase() === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    🔴 {selectedComplaint.priority}
                  </span>
                </div>

                <div className="py-1 border-b border-gray-800/80 space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Urgency Score:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {selectedComplaint.aiAnalysis?.urgencyScore || selectedComplaint.priorityScore || 87}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                      style={{ width: `${selectedComplaint.aiAnalysis?.urgencyScore || selectedComplaint.priorityScore || 87}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">Confidence Score:</span>
                  <span className="font-bold font-mono text-emerald-400">
                    {Math.round((selectedComplaint.aiAnalysis?.confidence || 0.94) * 100)}%
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">Recommended SLA:</span>
                  <span className="font-bold font-mono text-sky-400">
                    {selectedComplaint.aiAnalysis?.recommendedSLAHours || selectedComplaint.slaHours || 48} hours
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Recommended Dept:</span>
                  <span className="font-bold text-gray-200 truncate max-w-[160px]">
                    {selectedComplaint.aiAnalysis?.department || selectedComplaint.assignedOfficer}
                  </span>
                </div>
              </div>
            </div>

            {/* Center AI Recommendation & Explanations */}
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4 lg:col-span-2 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-400 block mb-1">AI Recommendation:</span>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-200">
                    {selectedComplaint.aiAnalysis?.recommendedAction || 'Immediate municipal inspection and field unit dispatch'}
                  </div>
                </div>

                {/* AI Explanation List */}
                <div>
                  <span className="text-xs font-bold uppercase text-gray-400 block mb-2">
                    Why {selectedComplaint.priority} Priority? (AI Reason Breakdown)
                  </span>
                  
                  <div className="space-y-1.5 bg-gray-950 p-4 rounded-2xl border border-gray-800 text-xs text-gray-300">
                    {(selectedComplaint.aiAnalysis?.reason && selectedComplaint.aiAnalysis.reason.length > 0) ? (
                      selectedComplaint.aiAnalysis.reason.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Public sanitation and infrastructure safety issue</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Reported unresolved for multi-day period</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Department Reason */}
                <div>
                  <span className="text-xs font-bold uppercase text-sky-400 block mb-1">
                    WHY THIS DEPARTMENT?
                  </span>
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200">
                    <span className="font-bold block mb-0.5">{selectedComplaint.aiAnalysis?.department || selectedComplaint.assignedOfficer}</span>
                    <span>Reason: {selectedComplaint.aiAnalysis?.departmentReason || `Complaint concerns ${selectedComplaint.category} issues.`}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Accept AI or Human Override */}
              <div className="pt-4 border-t border-gray-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => handleAcceptAI(selectedComplaint)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept AI Triage
                </button>

                <button
                  onClick={() => handleOpenOverrideModal(selectedComplaint)}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-amber-300 hover:text-white font-bold text-xs flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Override Classification
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Interactive Map of Active Complaints */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Spatial Distribution of Grievance Pins
        </h3>
        <Maps complaints={complaints} height="320px" />
      </div>

      {/* Smart Priority Dispatch Queue Table */}
      <div className="glass-panel rounded-3xl p-8 border border-gray-800 space-y-6">
        
        {/* Table Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-400" />
              Smart Priority Dispatch Queue
            </h3>
            <p className="text-xs text-gray-400 mt-1">Sorted by Priority level ➔ Urgency score ➔ SLA deadline remaining ➔ Complaint age.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-xs text-gray-400 mr-2">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Priorities</option>
                <option value="CRITICAL">🔴 CRITICAL</option>
                <option value="HIGH">🟠 HIGH</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="LOW">🟢 LOW</option>
              </select>
            </div>

            <div>
              <span className="text-xs text-gray-400 mr-2">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950 text-gray-400 uppercase font-semibold text-[11px] border-b border-gray-800">
              <tr>
                <th className="p-3.5">Grievance Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">AI Priority</th>
                <th className="p-3.5">SLA Countdown</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Officer</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {complaints.map((cmp) => {
                const sla = getSLAStatus(cmp);
                const isSelected = selectedComplaint && (selectedComplaint._id || selectedComplaint.id) === (cmp._id || cmp.id);
                const normP = (cmp.priority || 'MEDIUM').toUpperCase();

                return (
                  <tr 
                    key={cmp._id || cmp.id} 
                    onClick={() => setSelectedComplaint(cmp)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-500/10 border-l-4 border-l-sky-400' : 'hover:bg-gray-900/50'
                    }`}
                  >
                    <td className="p-3.5 font-semibold text-white max-w-xs truncate">{cmp.title}</td>
                    <td className="p-3.5">{cmp.category}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded font-bold font-mono ${
                        normP === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
                        normP === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        normP === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {normP === 'CRITICAL' && '🔴 '}
                        {normP === 'HIGH' && '🟠 '}
                        {normP === 'MEDIUM' && '🟡 '}
                        {normP === 'LOW' && '🟢 '}
                        {normP} ({cmp.aiAnalysis?.urgencyScore || cmp.priorityScore || 50}/100)
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className={`px-2.5 py-0.5 rounded font-bold ${
                        sla.isBreached ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'text-amber-300'
                      }`}>
                        {sla.text}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {cmp.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-gray-200 max-w-[160px] truncate">{cmp.assignedOfficer}</td>
                    <td className="p-3.5 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedComplaint(cmp);
                          setAiModalComplaint(cmp);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold border border-sky-500/30 hover:border-sky-400 flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Analysis
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingComplaint(cmp);
                          const nextStatusMap = {
                            'Submitted': 'Under Review',
                            'Under Review': 'In Progress',
                            'In Progress': 'Resolved',
                            'Resolved': 'Resolved',
                            'Rejected': 'Rejected'
                          };
                          setStatusInput(nextStatusMap[cmp.status] || 'Under Review');
                          setOfficerInput(cmp.assignedOfficer || 'District Ward Officer');
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Human-in-the-Loop Override Modal */}
      {overrideModalComplaint && (
        <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-panel rounded-3xl p-6 border border-gray-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  Human-in-the-Loop AI Override
                </h3>
                <p className="text-xs text-gray-400 truncate max-w-sm">{overrideModalComplaint.title}</p>
              </div>
              <button 
                onClick={() => setOverrideModalComplaint(null)} 
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Final Category</label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Sanitation">Sanitation</option>
                  <option value="Road">Road</option>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Crime">Crime</option>
                  <option value="Women Safety">Women Safety</option>
                  <option value="Corruption">Corruption</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="General Public Service">General Public Service</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Final Priority</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                >
                  <option value="CRITICAL">🔴 CRITICAL (12h SLA)</option>
                  <option value="HIGH">🟠 HIGH (24h - 48h SLA)</option>
                  <option value="MEDIUM">🟡 MEDIUM (72h SLA)</option>
                  <option value="LOW">🟢 LOW (120h SLA)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Assign Responsible Department</label>
                <input
                  type="text"
                  required
                  value={overrideDepartment}
                  onChange={(e) => setOverrideDepartment(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Final Resolution SLA (Hours)</label>
                <input
                  type="number"
                  required
                  value={overrideSLA}
                  onChange={(e) => setOverrideSLA(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Officer Justification / Override Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Proximity to hospital mandates emergency escalation beyond initial automated score..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs"
                >
                  Save Human Override Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingComplaint && (
        <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border border-gray-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Update Grievance Status & Dispatch</h3>
            <p className="text-xs text-gray-400">{editingComplaint.title}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Update Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Assign Officer / Field Unit</label>
                <input
                  type="text"
                  value={officerInput}
                  onChange={(e) => setOfficerInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Officer Action Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Field inspection team dispatched to site. Repair initiated."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-gray-950 font-bold text-xs"
                >
                  Save Status Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Grievance Intelligence Analysis Modal */}
      {aiModalComplaint && (
        <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-panel rounded-3xl p-6 border border-sky-500/40 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-sky-400 tracking-wider uppercase font-mono">
                    🤖 AI GRIEVANCE ANALYSIS & AUDIT DETAILS
                  </h3>
                  <p className="text-base font-extrabold text-white">{aiModalComplaint.title}</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalComplaint(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Classification Attributes */}
              <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-3 text-xs">
                <h4 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Classification Attributes</h4>

                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-bold text-white">{aiModalComplaint.aiAnalysis?.category || aiModalComplaint.category}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Subcategory:</span>
                  <span className="font-bold text-sky-300">{aiModalComplaint.aiAnalysis?.subcategory || 'General'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">AI Priority:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    (aiModalComplaint.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    (aiModalComplaint.priority || '').toUpperCase() === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {aiModalComplaint.priority}
                  </span>
                </div>

                <div className="py-1 border-b border-gray-800 space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Urgency Score:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {aiModalComplaint.aiAnalysis?.urgencyScore || aiModalComplaint.priorityScore || 87}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                      style={{ width: `${aiModalComplaint.aiAnalysis?.urgencyScore || aiModalComplaint.priorityScore || 87}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Confidence Score:</span>
                  <span className="font-bold font-mono text-emerald-400">
                    {Math.round((aiModalComplaint.aiAnalysis?.confidence || 0.94) * 100)}%
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Recommended SLA:</span>
                  <span className="font-bold font-mono text-sky-400">
                    {aiModalComplaint.aiAnalysis?.recommendedSLAHours || aiModalComplaint.slaHours || 48} hours
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Assigned Department:</span>
                  <span className="font-bold text-gray-200 truncate max-w-[150px]">
                    {aiModalComplaint.aiAnalysis?.department || aiModalComplaint.assignedOfficer}
                  </span>
                </div>
              </div>

              {/* Explanations & Action Plan */}
              <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-2">AI Non-Technical Explanation</h4>
                  <ul className="space-y-1.5 text-gray-300">
                    {(aiModalComplaint.aiAnalysis?.reason || [
                      "Public interest & community impact detected",
                      "Reported active duration requiring field intervention",
                      "Standard SLA priority assigned by Civic AI model"
                    ]).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-800">
                  <h4 className="text-[11px] font-bold uppercase text-amber-400 tracking-wider mb-1">Recommended Response Action</h4>
                  <p className="text-gray-300 italic text-[11px] leading-relaxed">
                    "{aiModalComplaint.aiAnalysis?.recommendedAction || 'Immediate municipal inspection and field unit assignment.'}"
                  </p>
                </div>
              </div>

            </div>

            {/* Description & Location */}
            <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-gray-800 text-xs space-y-1">
              <span className="font-bold text-gray-400 block">Citizen Description & Location:</span>
              <p className="text-gray-200">{aiModalComplaint.description}</p>
              <p className="text-sky-400 font-mono text-[11px]">📍 {aiModalComplaint.location?.address}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <button
                onClick={() => {
                  setOverrideModalComplaint(aiModalComplaint);
                  setOverrideCategory(aiModalComplaint.category || 'Sanitation');
                  setOverridePriority(aiModalComplaint.priority || 'HIGH');
                  setOverrideDepartment(aiModalComplaint.assignedOfficer || 'Municipal Sanitation');
                  setOverrideSLA(aiModalComplaint.slaHours || 48);
                  setOverrideReason('');
                  setAiModalComplaint(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                ⚡ Override AI Decision
              </button>

              <button
                onClick={() => setAiModalComplaint(null)}
                className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs"
              >
                Close AI Audit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

