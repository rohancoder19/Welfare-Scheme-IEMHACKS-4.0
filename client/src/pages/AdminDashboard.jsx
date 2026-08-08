import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchAdminComplaintsAPI, updateComplaintStatusAPI, fetchAdminAnalyticsAPI } from '../services/complaintAPI';
import Maps from '../components/Maps';
import { Shield, AlertTriangle, CheckCircle, Clock, Users, FileText, Search, UserCheck, ArrowRight, BarChart3, Filter } from 'lucide-react';

const AdminDashboard = () => {
  const { token, user } = useSelector((state) => state.auth);

  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [editingComplaint, setEditingComplaint] = useState(null);
  const [statusInput, setStatusInput] = useState('In Progress');
  const [remarksInput, setRemarksInput] = useState('');
  const [officerInput, setOfficerInput] = useState('Officer Ramesh Kumar');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (priorityFilter !== 'All') filters.priority = priorityFilter;
      if (statusFilter !== 'All') filters.status = statusFilter;

      const cRes = await fetchAdminComplaintsAPI(filters, token);
      if (cRes.success) setComplaints(cRes.complaints);

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
        { status: statusInput, remarks: remarksInput, assignedOfficer: officerInput },
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-8 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider border border-amber-500/20 mb-2">
            <Shield className="w-3.5 h-3.5" />
            ADMINISTRATIVE OFFICER COMMAND CENTER
          </div>
          <h1 className="text-3xl font-extrabold text-white">Grievance Triage & Operational Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Review AI priority ratings, assign department officers, and update resolution logs.</p>
        </div>
      </div>

      {/* Analytics KPI Row */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-1">
            <span className="text-xs text-gray-400 font-semibold block uppercase">Total Grievances</span>
            <span className="text-3xl font-black text-white font-mono">{analytics.totalComplaints}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 glow-rose space-y-1">
            <span className="text-xs text-rose-400 font-semibold block uppercase">High Priority Urgency</span>
            <span className="text-3xl font-black text-rose-400 font-mono">{analytics.highPriorityCount}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-1">
            <span className="text-xs text-amber-400 font-semibold block uppercase font-mono">Resolution Rate</span>
            <span className="text-3xl font-black text-emerald-400 font-mono">{analytics.resolutionRate}%</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-1">
            <span className="text-xs text-sky-400 font-semibold block uppercase font-mono">Assisted Citizens</span>
            <span className="text-3xl font-black text-sky-400 font-mono">{analytics.totalCitizensAssisted}</span>
          </div>
        </div>
      )}

      {/* Interactive Map of Active Complaints */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Spatial Distribution of Grievance Pins
        </h3>
        <Maps complaints={complaints} height="360px" />
      </div>

      {/* Complaints Table & Controls */}
      <div className="glass-panel rounded-3xl p-8 border border-gray-800 space-y-6">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            Grievance Dispatch Queue
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-xs text-gray-400 mr-2">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Urgency</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
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
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Officer</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {complaints.map((cmp) => (
                <tr key={cmp._id || cmp.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="p-3.5 font-semibold text-white max-w-xs truncate">{cmp.title}</td>
                  <td className="p-3.5">{cmp.category}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded font-bold font-mono ${
                      cmp.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {cmp.priority} ({cmp.priorityScore}%)
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {cmp.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-gray-200">{cmp.assignedOfficer}</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => {
                        setEditingComplaint(cmp);
                        setStatusInput(cmp.status);
                        setOfficerInput(cmp.assignedOfficer);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

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

    </div>
  );
};

export default AdminDashboard;
