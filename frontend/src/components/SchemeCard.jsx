import React from 'react';
import { Sparkles, CheckCircle, Clock, ArrowRight, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

const SchemeCard = ({ scheme, onApply }) => {
  const matchPercentage = scheme.matchPercentage || 85;
  const govLevel = scheme.governmentLevel || (scheme.state === 'All India' ? 'Central' : 'State');

  return (
    <div className="glass-panel glass-card-hover rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden group border border-gray-800">
      
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"></div>

      <div>
        {/* Header Tags & Match Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-gray-900 border border-gray-800 text-emerald-400">
              {scheme.category || 'Welfare'}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
              govLevel === 'Central' 
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {govLevel}: {scheme.state || 'All India'}
            </span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald">
            <ShieldCheck className="w-3.5 h-3.5" />
            Eligible ({matchPercentage}%)
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
          {scheme.schemeName}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-300 line-clamp-3 mb-4 leading-relaxed">
          {scheme.description}
        </p>

        {/* Benefits Highlight */}
        <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800/80 mb-4">
          <span className="text-[11px] font-semibold uppercase text-emerald-400 tracking-wider block mb-1">
            Benefits Provided:
          </span>
          <p className="text-xs text-gray-200 font-medium leading-normal">
            {scheme.benefits}
          </p>
        </div>

        {/* Qualification Reasons */}
        {scheme.matchedReasons && scheme.matchedReasons.length > 0 && (
          <div className="space-y-1 mb-4 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/30">
            <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider block mb-1">
              Why You Qualify:
            </span>
            {scheme.matchedReasons.slice(0, 3).map((reason, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-emerald-300/90">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>Deadline: {scheme.deadline || 'Open Year-round'}</span>
        </div>

        <button
          onClick={() => onApply && onApply(scheme)}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md bg-emerald-500 hover:bg-emerald-400 text-gray-950 hover:shadow-emerald-500/20"
        >
          Apply Now
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SchemeCard;
