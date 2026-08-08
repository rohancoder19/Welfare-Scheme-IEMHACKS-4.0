import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyComplaintsAPI, fetchComplaintDetailsAPI } from '../services/complaintAPI';
import { setComplaints, setSelectedComplaint } from '../redux/complaintSlice';
import ComplaintCard from '../components/ComplaintCard';
import { FileText, CheckCircle2, Clock, ShieldAlert, UserCheck, MapPin, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

const ComplaintStatus = () => {
  const { token } = useSelector((state) => state.auth);
  const { complaints, selectedComplaint, statusLogs } = useSelector((state) => state.complaint);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetchMyComplaintsAPI(token);
      if (res.success && res.complaints) {
        dispatch(setComplaints(res.complaints));
        if (res.complaints.length > 0 && !selectedComplaint) {
          loadSingleComplaintDetails(res.complaints[0]._id || res.complaints[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching user complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSingleComplaintDetails = async (id) => {
    try {
      const res = await fetchComplaintDetailsAPI(id, token);
      if (res.success) {
        dispatch(setSelectedComplaint(res));
      }
    } catch (err) {
      console.error('Error loading complaint status logs:', err);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const timelineSteps = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

  const getStepIndex = (status) => {
    if (status === 'Resolved') return 3;
    if (status === 'In Progress') return 2;
    if (status === 'Under Review') return 1;
    return 0; // Submitted
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-8 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider border border-sky-500/20 mb-2">
            <FileText className="w-3.5 h-3.5" />
            REAL-TIME CIVIC GRIEVANCE TRACKING
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Grievance Tracking Timeline</h1>
          <p className="text-sm text-gray-400 mt-1">Track status updates, municipal officer assignments, and resolution notes.</p>
        </div>

        <button
          onClick={loadComplaints}
          className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Updates
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left List of My Complaints */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>Filed Grievances</span>
            <span className="px-2 py-0.5 rounded bg-gray-900 text-emerald-400 text-xs font-mono">
              {complaints.length}
            </span>
          </h3>

          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c._id || c.id}
                onClick={() => loadSingleComplaintDetails(c._id || c.id)}
                className={`cursor-pointer transition-all ${
                  (selectedComplaint?._id === c._id || selectedComplaint?.id === c.id)
                    ? 'ring-2 ring-emerald-500 rounded-2xl'
                    : ''
                }`}
              >
                <ComplaintCard
                  complaint={c}
                  onViewDetails={() => loadSingleComplaintDetails(c._id || c.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Timeline & Details view */}
        <div className="lg:col-span-2 space-y-6">
          {selectedComplaint ? (
            <div className="glass-panel rounded-3xl p-8 border border-gray-800 space-y-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                  <span className="text-xs font-mono uppercase text-sky-400 font-bold block mb-1">
                    Grievance Ref: #{selectedComplaint._id}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{selectedComplaint.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                    selectedComplaint.priority === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    {selectedComplaint.priority} Priority
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline Stepper */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Resolution Progress</h4>
                
                <div className="grid grid-cols-4 gap-2 text-center relative">
                  {timelineSteps.map((stepLabel, idx) => {
                    const activeIdx = getStepIndex(selectedComplaint.status);
                    const isPassed = idx <= activeIdx;

                    return (
                      <div key={stepLabel} className="space-y-2 relative z-10">
                        <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                          isPassed ? 'bg-emerald-500 text-gray-950 font-black glow-emerald' : 'bg-gray-900 border border-gray-800 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`block text-xs font-semibold ${isPassed ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {stepLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Officer & Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">Assigned Municipal Officer:</span>
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    {selectedComplaint.assignedOfficer}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">Location / Address:</span>
                  <p className="text-xs font-medium text-gray-200 flex items-center gap-1.5 truncate">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    {selectedComplaint.location?.address}
                  </p>
                </div>
              </div>

              {/* Status Audit Logs History */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
                  Officer Action Log History
                </h4>

                <div className="space-y-3">
                  {statusLogs.map((log, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-200">{log.status}</span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300">{log.remarks}</p>
                        <span className="text-[10px] text-emerald-400 block font-mono">By: {log.updatedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-16 text-center text-gray-400 space-y-3">
              <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm">Select a grievance from the left list to view status updates and timeline.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ComplaintStatus;
