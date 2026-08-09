import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyComplaintsAPI, fetchComplaintDetailsAPI } from '../services/complaintAPI';
import { setComplaints, setSelectedComplaint } from '../redux/complaintSlice';
import ComplaintCard from '../components/ComplaintCard';
import { 
  FileText, CheckCircle2, Clock, ShieldAlert, UserCheck, MapPin, ArrowRight, 
  RefreshCw, AlertTriangle, Sparkles, Building2, Timer, Bot, User, Shield
} from 'lucide-react';

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
        const activeId = selectedComplaint?._id || selectedComplaint?.id || (res.complaints.length > 0 ? (res.complaints[0]._id || res.complaints[0].id) : null);
        if (activeId) {
          await loadSingleComplaintDetails(activeId);
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

  const timelineSteps = [
    'Complaint Submitted', 
    'AI Analyzed', 
    'Department Assigned', 
    'Officer Reviewing', 
    'Action Taken', 
    'Resolved'
  ];

  const getStepIndex = (status) => {
    if (status === 'Resolved') return 5;
    if (status === 'In Progress' || status === 'Action Taken') return 4;
    if (status === 'Under Review' || status === 'Officer Reviewing') return 3;
    if (status === 'Department Assigned' || status === 'Department Assigned (Overridden)') return 2;
    if (status === 'AI Analyzed') return 1;
    return 0; // Complaint Submitted
  };

  // Helper for SLA calculation (ACTIVE, WARNING, BREACHED, RESOLVED)
  const getSLAInfo = (cmp) => {
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
      return { statusLabel: 'WARNING', text: `⏱ WARNING (${hours}h ${mins}m remaining)`, isWarning: true };
    }

    return { statusLabel: 'ACTIVE', text: `⏱ ACTIVE (${hours}h ${mins}m remaining)`, isActive: true };
  };

  const getActorBadge = (actorType) => {
    if (actorType === 'System') return <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] flex items-center gap-1"><Bot className="w-3 h-3" /> Civic AI System</span>;
    if (actorType === 'Admin') return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Officer</span>;
    if (actorType === 'Citizen') return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] flex items-center gap-1"><User className="w-3 h-3" /> Citizen</span>;
    return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] flex items-center gap-1"><Building2 className="w-3 h-3" /> Field Unit Officer</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider border border-sky-500/20 mb-2 max-w-full flex-wrap">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="break-words">TRANSPARENT CIVIC GRIEVANCE TRACKING TIMELINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white break-words">Live Grievance & AI Triage Tracker</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Track automated AI triage results, officer dispatch logs, department assignments, and resolution SLAs.</p>
        </div>

        <button
          onClick={loadComplaints}
          className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 w-full sm:w-fit active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* Left List of My Complaints */}
        <div className="space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center justify-between">
            <span>Filed Grievances</span>
            <span className="px-2.5 py-0.5 rounded bg-gray-900 text-emerald-400 text-xs font-mono">
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
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-800 space-y-6 sm:space-y-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 sm:pb-6">
                <div>
                  <span className="text-[11px] sm:text-xs font-mono uppercase text-sky-400 font-bold block mb-1 break-all">
                    Grievance Ref: #{selectedComplaint._id || selectedComplaint.id}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white break-words">{selectedComplaint.title}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                    (selectedComplaint.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' :
                    (selectedComplaint.priority || '').toUpperCase() === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    🔴 {selectedComplaint.priority} Priority
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>

              {/* SLA Live Timer Banner */}
              {(() => {
                const sla = getSLAInfo(selectedComplaint);
                return (
                  <div className={`p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border ${
                    sla.isBreached ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Timer className="w-4 h-4 shrink-0" />
                      <span>Resolution SLA Guarantee:</span>
                      <span className="font-mono">{selectedComplaint.slaHours || 48} Hours</span>
                    </div>

                    <span className="text-xs font-mono font-extrabold">{sla.text}</span>
                  </div>
                );
              })()}

              {/* Progress Timeline Stepper */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Civic Resolution Lifecycle Stepper</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center relative">
                  {timelineSteps.map((stepLabel, idx) => {
                    const activeIdx = getStepIndex(selectedComplaint.status);
                    const isPassed = idx <= activeIdx;

                    return (
                      <div key={stepLabel} className="space-y-1.5 relative z-10 p-2 rounded-xl bg-gray-900/50 border border-gray-800/80">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                          isPassed ? 'bg-emerald-500 text-gray-950 font-black glow-emerald' : 'bg-gray-900 border border-gray-800 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`block text-[10px] sm:text-[11px] font-semibold leading-tight break-words ${isPassed ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {stepLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Explanation Card */}
              <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-sky-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Grievance Triage Explanation</h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    AI Confidence: {Math.round((selectedComplaint.aiAnalysis?.confidence || 0.94) * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sky-300">
                    Why {selectedComplaint.priority} Priority?
                  </p>
                  
                  <div className="space-y-1.5 bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-300">
                    {(selectedComplaint.aiAnalysis?.reason && selectedComplaint.aiAnalysis.reason.length > 0) ? (
                      selectedComplaint.aiAnalysis.reason.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Public safety and infrastructure severity detected</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
                  <p className="text-xs font-semibold text-sky-300">
                    Why {selectedComplaint.aiAnalysis?.department || selectedComplaint.assignedOfficer}?
                  </p>
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs text-gray-300">
                    <span className="font-bold block text-white mb-0.5">{selectedComplaint.aiAnalysis?.department || selectedComplaint.assignedOfficer}</span>
                    <span className="text-gray-400">Reason: {selectedComplaint.aiAnalysis?.departmentReason || `Complaint concerns ${selectedComplaint.category} issues.`}</span>
                  </div>
                </div>
              </div>

              {/* Department & Officer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">Assigned Municipal Officer / Field Unit:</span>
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    {selectedComplaint.assignedOfficer}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">Location Landmark:</span>
                  <p className="text-xs font-medium text-gray-200 flex items-center gap-1.5 truncate">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    {selectedComplaint.location?.address}
                  </p>
                </div>
              </div>

              {/* Permanent Auditable Status Timeline Logs */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 flex items-center justify-between">
                  <span>Permanent Auditable Action Logs</span>
                  <span className="text-xs text-gray-500 font-normal">Immutable Audit Trail</span>
                </h4>

                <div className="space-y-3">
                  {statusLogs.map((log, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-white">{log.status}</span>
                          <div className="flex items-center gap-2">
                            {getActorBadge(log.actorType)}
                            <span className="text-[11px] text-gray-500 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{log.remarks}</p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-800/60 font-mono">
                          <span>Department: {log.department || 'Municipal Office'}</span>
                          <span>Actor: {log.updatedBy}</span>
                        </div>
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

