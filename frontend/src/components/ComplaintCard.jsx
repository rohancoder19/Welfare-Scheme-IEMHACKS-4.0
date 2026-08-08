import React from 'react';
import { AlertTriangle, MapPin, Clock, ShieldAlert, ArrowRight, UserCheck, CheckCircle2, Flame, Timer } from 'lucide-react';

const ComplaintCard = ({ complaint, onViewDetails }) => {
  const normPriority = (complaint.priority || 'MEDIUM').toUpperCase();
  const isCritical = normPriority === 'CRITICAL';
  const isHigh = normPriority === 'HIGH' || normPriority === 'HIGH PRIORITY';
  const isResolved = complaint.status === 'Resolved';

  // Calculate SLA Remaining or Breached
  const now = Date.now();
  const deadline = complaint.slaDeadline ? new Date(complaint.slaDeadline).getTime() : null;
  const isBreached = deadline && deadline < now && !isResolved;
  
  let slaRemainingText = null;
  if (deadline && !isResolved) {
    const diffMs = deadline - now;
    if (diffMs <= 0) {
      slaRemainingText = '⚠ SLA BREACHED';
    } else {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      slaRemainingText = `⏱ ${hours}h ${mins}m remaining`;
    }
  }

  const urgencyScore = complaint.aiAnalysis?.urgencyScore || complaint.priorityScore || 50;

  return (
    <div className="glass-panel glass-card-hover rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden">
      
      {/* Priority accent border */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        isCritical
          ? 'bg-red-500 glow-rose animate-pulse'
          : isHigh
          ? 'bg-rose-500 glow-rose'
          : normPriority === 'MEDIUM'
          ? 'bg-amber-400'
          : 'bg-emerald-400'
      }`}></div>

      <div>
        {/* Header Tags & Priority */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-900 border border-gray-800 text-gray-300">
            {complaint.category}
          </span>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono border ${
              isCritical
                ? 'bg-red-500/20 text-red-400 border-red-500/40 glow-rose animate-pulse'
                : isHigh 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 glow-rose' 
                : normPriority === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isCritical && '🔴 '}
              {isHigh && '🟠 '}
              {normPriority === 'MEDIUM' && '🟡 '}
              {normPriority === 'LOW' && '🟢 '}
              {normPriority} ({urgencyScore}/100)
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isResolved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
            }`}>
              {complaint.status}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">
          {complaint.title}
        </h4>

        {/* Description */}
        <p className="text-sm text-gray-300 line-clamp-3 mb-4 leading-relaxed">
          {complaint.description}
        </p>

        {/* SLA Status Indicator */}
        {slaRemainingText && (
          <div className={`p-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between mb-3 border ${
            isBreached 
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
          }`}>
            <span className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              SLA Status:
            </span>
            <span>{slaRemainingText}</span>
          </div>
        )}

        {/* Location & Officer Badge */}
        <div className="space-y-1.5 mb-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{complaint.location?.address || 'Municipal Ward Area'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-gray-300 font-medium">{complaint.assignedOfficer}</span>
          </div>
        </div>

        {/* AI Triage Note */}
        {complaint.nlpAnalysis && (
          <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-gray-300 flex items-start gap-2 mb-4">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{complaint.nlpAnalysis}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
        </div>

        <button
          onClick={() => onViewDetails && onViewDetails(complaint)}
          className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 hover:text-white font-medium flex items-center gap-1 transition-all"
        >
          Track Live Timeline
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ComplaintCard;

