import React from 'react';
import { AlertTriangle, MapPin, Clock, ShieldAlert, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

const ComplaintCard = ({ complaint, onViewDetails }) => {
  const isHigh = complaint.priority === 'High';
  const isResolved = complaint.status === 'Resolved';

  return (
    <div className="glass-panel glass-card-hover rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden">
      
      {/* Priority accent border */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isHigh ? 'bg-rose-500 glow-rose' : complaint.priority === 'Medium' ? 'bg-amber-400' : 'bg-sky-400'
      }`}></div>

      <div>
        {/* Header Tags & Priority */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-900 border border-gray-800 text-gray-300">
            {complaint.category}
          </span>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
              isHigh 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 glow-rose' 
                : complaint.priority === 'Medium'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
            }`}>
              {complaint.priority} Priority
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

        {/* Location & Officer Badge */}
        <div className="space-y-2 mb-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{complaint.location?.address || 'Municipal Ward Area'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-gray-300 font-medium">{complaint.assignedOfficer}</span>
          </div>
        </div>

        {/* AI NLP Triage Note */}
        {complaint.nlpAnalysis && (
          <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] text-gray-300 flex items-start gap-2 mb-4">
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
          Track Timeline
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ComplaintCard;
