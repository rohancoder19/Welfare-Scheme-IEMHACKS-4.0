import React from 'react';
import { X, ExternalLink, CheckCircle, FileText, Sparkles, ShieldCheck, Info, BookOpen } from 'lucide-react';

const ApplyScheme = ({ scheme, onClose }) => {
  if (!scheme) return null;

  const categoryName = scheme.category || scheme.schemeCategory || 'General Welfare';
  const govLevel = scheme.governmentLevel || (scheme.state === 'All India' ? 'Central' : 'State');
  const locationState = scheme.state || 'All India';

  // Format required documents into array if string
  let docList = [];
  if (Array.isArray(scheme.requiredDocuments) && scheme.requiredDocuments.length > 0) {
    docList = scheme.requiredDocuments;
  } else if (typeof scheme.documents === 'string' && scheme.documents.trim().length > 0) {
    docList = scheme.documents.split(',').map(d => d.trim()).filter(Boolean);
  }

  const handleContinueToMyScheme = () => {
    window.open(
      'https://www.myscheme.gov.in/',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-2xl w-full glass-panel rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-800/80 pb-4">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-800 text-emerald-400">
                {categoryName}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {govLevel}: {locationState}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white pt-1">{scheme.schemeName}</h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Sections */}
        <div className="space-y-5">
          
          {/* Scheme Overview / Details */}
          {(scheme.description || scheme.details) && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                Scheme Overview
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/40 p-3.5 rounded-2xl border border-gray-800/60">
                {scheme.description || scheme.details}
              </p>
            </div>
          )}

          {/* Scheme Benefits */}
          {scheme.benefits && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Benefits Provided
              </h4>
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200 font-medium leading-relaxed">
                {scheme.benefits}
              </div>
            </div>
          )}

          {/* Why You Qualify & Eligibility Info */}
          {((scheme.matchedReasons && scheme.matchedReasons.length > 0) || scheme.eligibilityText) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Eligibility Parameters
              </h4>
              
              {scheme.matchedReasons && scheme.matchedReasons.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-gray-900/80 border border-gray-800">
                  <span className="text-[11px] font-bold text-emerald-400 block">Why You Qualify:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {scheme.matchedReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scheme.eligibilityText && (
                <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/40 p-3 rounded-xl border border-gray-800/60">
                  {scheme.eligibilityText}
                </p>
              )}
            </div>
          )}

          {/* Required Documents List */}
          {docList.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Required Documents
              </h4>
              <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                  {docList.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Informational Application Text */}
          {typeof scheme.application === 'string' && scheme.application.trim().length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Application Instructions
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/40 p-3.5 rounded-2xl border border-gray-800/60">
                {scheme.application}
              </p>
            </div>
          )}

          {/* Official Application Portal Callout Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-emerald-500/30 space-y-4 shadow-lg relative overflow-hidden">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Official Application Portal
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                You have been identified as potentially eligible for this scheme based on the information provided.
                To continue with the official application process, you will be redirected to the Government of India's official <span className="text-emerald-400 font-semibold">myScheme</span> portal.
              </p>
            </div>

            <div className="pt-1">
              <a
                href="https://www.myscheme.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleContinueToMyScheme}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all glow-emerald"
              >
                <span>Continue to myScheme</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-snug">
              You will complete the actual application on the official government portal. This platform does not submit applications on your behalf.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ApplyScheme;
