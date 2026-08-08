import React, { useState } from 'react';
import { X, CheckCircle, FileText, Upload, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const ApplyScheme = ({ scheme, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    applicantName: 'Ananya Verma',
    aadhaarNumber: '9876-5432-1098',
    bankAccount: '3098127391283',
    ifscCode: 'SBIN0001234',
    uploadedDocName: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, uploadedDocName: e.target.files[0].name });
    }
  };

  const handleCompleteApplication = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xl w-full glass-panel rounded-3xl p-8 border border-gray-800 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
              {scheme.category} Application Portal
            </span>
            <h3 className="text-xl font-bold text-white">{scheme.schemeName}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center glow-emerald">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-bold text-white">Application Submitted!</h4>
            <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
              Your application for <span className="text-emerald-400 font-semibold">{scheme.schemeName}</span> has been registered under Application Reference <span className="font-mono text-white">APP-2026-9812</span>.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md"
              >
                Done & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCompleteApplication} className="space-y-6">
            
            {/* Step Wizard Bar */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 text-xs font-semibold">
              <span className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-400' : 'text-gray-500'}`}>
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">1</span>
                Personal & Bank Proof
              </span>
              <span className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">2</span>
                Documents Checklist
              </span>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Applicant Name</label>
                  <input
                    type="text"
                    required
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Aadhaar Card Number</label>
                  <input
                    type="text"
                    required
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Direct Benefit Bank A/C</label>
                    <input
                      type="text"
                      required
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-gray-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    Next: Upload Documents
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Required Document Verification:</span>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {(scheme.requiredDocuments || ['Aadhaar Card', 'Income Proof']).map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Upload Digital Copy (PDF/JPG)</label>
                  <div className="border-2 border-dashed border-gray-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer relative bg-gray-950/50">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <span className="text-xs text-gray-300 block font-medium">
                      {formData.uploadedDocName ? formData.uploadedDocName : 'Click or Drag files to attach document'}
                    </span>
                    <span className="text-[10px] text-gray-500">Max size: 5MB</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Submit Scheme Application
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
};

export default ApplyScheme;
