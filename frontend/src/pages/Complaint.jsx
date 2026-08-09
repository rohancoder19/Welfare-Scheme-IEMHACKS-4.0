import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { submitComplaintAPI } from '../services/complaintAPI';
import { addComplaint } from '../redux/complaintSlice';
import Maps from '../components/Maps';
import { AlertTriangle, MapPin, Upload, ShieldAlert, Sparkles, CheckCircle2, ArrowRight, Crosshair, Navigation } from 'lucide-react';

const Complaint = () => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electricity',
    description: '',
    address: 'Park Street, Ward 63, Pune',
    lat: 18.5204,
    lng: 73.8567
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);

  const fetchStreetAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err.message);
    }
    return `Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°), Civic Ward`;
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Temporary feedback while fetching street address
        setFormData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          address: `Fetching street address for (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)...`
        }));
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 5000);

        // Reverse geocode to proper address
        const realAddress = await fetchStreetAddress(latitude, longitude);
        setFormData((prev) => ({
          ...prev,
          address: realAddress
        }));
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        setGpsLoading(false);
        setError('Could not access live GPS. Please enable browser location permissions or click on map pin.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const categories = ['Electricity', 'Water', 'Road', 'Crime', 'Women Safety', 'Corruption', 'Healthcare', 'Education', 'Other'];

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Please provide issue title and description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('lat', formData.lat);
      data.append('lng', formData.lng);
      if (photo) data.append('photo', photo);

      const res = await submitComplaintAPI(data, token);
      if (res.success) {
        setSuccessComplaint(res.complaint);
        dispatch(addComplaint(res.complaint));
      } else {
        setError(res.message || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error filing grievance complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider border border-rose-500/20 max-w-full flex-wrap">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="break-words">NLP COMPLAINT TRIAGE & PRIORITY DETECTOR</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white break-words">
            File Civic Grievance Complaint
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            Report public infrastructure hazards, electrical faults, sewage leaks, or safety concerns. Our Python NLP classifier analyzes urgency and automatically alerts responsible municipal officers.
          </p>
        </div>
      </div>

      {successComplaint ? (
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-emerald-500/30 max-w-3xl mx-auto space-y-6 shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center glow-emerald shrink-0">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white break-words">Grievance Registered Successfully!</h2>
            <p className="text-xs text-gray-400">AI Grievance Intelligence System has categorized & prioritized your issue.</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4 text-left text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pb-3 border-b border-gray-800 font-mono">
              <span className="text-gray-400">Grievance Ref ID:</span>
              <span className="text-emerald-400 font-bold break-all">{successComplaint._id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-gray-800 font-mono">
              <div>
                <span className="text-gray-400 block mb-1">AI Detected Category:</span>
                <span className="text-white font-bold">{successComplaint.aiAnalysis?.category || successComplaint.category}</span>
                <span className="text-sky-300 block text-[11px] font-normal">Sub: {successComplaint.aiAnalysis?.subcategory || 'General'}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">AI Urgency Priority:</span>
                <span className={`px-2.5 py-0.5 rounded font-bold inline-block ${
                  (successComplaint.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  (successComplaint.priority || '').toUpperCase() === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {successComplaint.priority} Priority ({successComplaint.aiAnalysis?.urgencyScore || successComplaint.priorityScore || 85}/100 Urgency)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-gray-800">
              <div>
                <span className="text-gray-400 block mb-1">Recommended Department:</span>
                <span className="text-emerald-300 font-bold">{successComplaint.aiAnalysis?.department || successComplaint.assignedOfficer}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Target Resolution SLA:</span>
                <span className="text-sky-400 font-bold font-mono">{successComplaint.aiAnalysis?.recommendedSLAHours || successComplaint.slaHours || 48} Hours</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="font-bold text-amber-400 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                AI Priority Reasoning:
              </span>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-1 text-gray-300">
                {(successComplaint.aiAnalysis?.reason && successComplaint.aiAnalysis.reason.length > 0) ? (
                  successComplaint.aiAnalysis.reason.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-2 break-words">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))
                ) : (
                  <p className="italic text-gray-400 break-words">{successComplaint.nlpAnalysis}</p>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="font-bold text-sky-400 block">
                Why Department ({successComplaint.aiAnalysis?.department || successComplaint.assignedOfficer})?
              </span>
              <p className="text-gray-300 italic bg-gray-950 p-3 rounded-xl border border-gray-800 break-words">
                {successComplaint.aiAnalysis?.departmentReason || `Complaint concerns ${successComplaint.category} issues.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/complaint-status')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Track Live Grievance Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setSuccessComplaint(null); setFormData({ ...formData, title: '', description: '' }); }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-semibold text-xs active:scale-95"
            >
              File Another Grievance
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Complaint Form */}
          <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-800 space-y-5 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Grievance Details Form</span>
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium break-words">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Complaint Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Issue Title / Short Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Voltage Open Transformer near school"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe exact issue, severity, landmark, and potential hazard..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-1.5">
                  <label className="block text-xs font-medium text-gray-300">Location Address / Landmark</label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={gpsLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{gpsLoading ? 'Detecting GPS...' : '🎯 Auto-Detect GPS'}</span>
                  </button>
                </div>
                {gpsSuccess && (
                  <div className="text-[11px] text-emerald-400 font-mono font-bold mb-1.5 flex items-center gap-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 break-words">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Real-time GPS Location Acquired! ({formData.lat.toFixed(4)}°, {formData.lng.toFixed(4)}°)</span>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Street address, colony, ward name..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 font-mono mt-1.5 px-1 gap-1">
                  <span>GPS Lat: <strong className="text-sky-400">{formData.lat.toFixed(4)}° N</strong></span>
                  <span>GPS Lng: <strong className="text-sky-400">{formData.lng.toFixed(4)}° E</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Attach Photo Evidence (Optional)</label>
                <div className="border-2 border-dashed border-gray-800 hover:border-rose-500/50 rounded-2xl p-4 text-center cursor-pointer relative bg-gray-950/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-300 font-medium block truncate">
                    {photo ? photo.name : 'Upload Photo Proof (JPEG/PNG)'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-gray-950 font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[44px]"
              >
                <span>{loading ? 'Processing AI Priority Triage...' : 'Submit Grievance with AI Classification'}</span>
                <ArrowRight className="w-4 h-4 text-gray-950 shrink-0" />
              </button>

            </form>
          </div>

          {/* Interactive Map Selector Preview */}
          <div className="space-y-4">
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-800 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Select Geolocation Coordinates on Map</span>
              </h3>
              <p className="text-xs text-gray-400">Click anywhere on the map to pin exact grievance coordinates.</p>
              <div className="min-h-[280px] sm:min-h-[340px]">
                <Maps 
                  complaints={[]} 
                  height="100%" 
                  center={[formData.lat, formData.lng]}
                  initialSelectedPos={[formData.lat, formData.lng]}
                  onSelectLocation={async (lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      lat,
                      lng,
                      address: `Resolving street address for (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)...`
                    }));
                    const realAddress = await fetchStreetAddress(lat, lng);
                    setFormData(prev => ({
                      ...prev,
                      address: realAddress
                    }));
                  }}
                />
              </div>
            </div>

            {photoPreview && (
              <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-gray-300 block">Photo Attachment Preview:</span>
                <img src={photoPreview} alt="Evidence preview" className="w-full h-40 object-cover rounded-xl border border-gray-800" />
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Complaint;
