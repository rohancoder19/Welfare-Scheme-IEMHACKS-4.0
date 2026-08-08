import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAIRecommendationsAPI } from '../services/schemeAPI';
import { setRecommendations } from '../redux/schemeSlice';
import SchemeCard from '../components/SchemeCard';
import ApplyScheme from './ApplyScheme';
import { Sparkles, Sliders, RefreshCw, CheckCircle2, User, Filter, AlertCircle } from 'lucide-react';

const WelfareFinder = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [profileInput, setProfileInput] = useState({
    income: user?.income || 240000,
    age: user?.age || 22,
    gender: user?.gender || 'Female',
    occupation: user?.occupation || 'Student',
    student: true,
    category: user?.category || 'General',
    education: user?.education || 'Undergraduate',
    state: user?.state || 'West Bengal'
  });

  const allStatesAndUTs = [
    "West Bengal", "Maharashtra", "Tamil Nadu", "Uttar Pradesh", "Gujarat",
    "Puducherry", "Haryana", "Madhya Pradesh", "Goa", "Rajasthan",
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Sikkim",
    "Telangana", "Tripura", "Uttarakhand", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Chandigarh", "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "All India"
  ];

  const [recommendations, setLocalRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState(null);

  const fetchRecommendations = async (profile) => {
    setLoading(true);
    try {
      const res = await getAIRecommendationsAPI(profile, token);
      if (res.success) {
        setLocalRecommendations(res.recommendations);
        dispatch(setRecommendations(res.recommendations));
      }
    } catch (err) {
      console.error('Recommendation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const updatedProfile = {
        income: user.income || 250000,
        age: user.age || 25,
        gender: user.gender || 'All',
        occupation: user.occupation || 'General',
        student: (user.occupation || '').toLowerCase().includes('student'),
        category: user.category || 'General',
        education: user.education || 'Graduate',
        state: user.state || 'Maharashtra'
      };
      setProfileInput(updatedProfile);
      fetchRecommendations(updatedProfile);
    } else {
      fetchRecommendations(profileInput);
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRecommendations(profileInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            HARD ELIGIBILITY ENGINE (3,400 DATASET)
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Welfare Scheme Eligibility Portal
          </h1>

          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Evaluates your state residency, gender, age window, household income ceiling, student status, and category quota across 3,400 Central & State schemes to return only 100% eligible results.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Profile Input Controls Sidebar */}
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-6 sticky top-28">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Profile Parameters
            </h3>

            <button
              type="button"
              onClick={() => fetchRecommendations(profileInput)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-filter
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">State Residency</label>
              <select
                value={profileInput.state}
                onChange={(e) => setProfileInput({ ...profileInput, state: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {allStatesAndUTs.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Annual Household Income (₹)</label>
              <input
                type="number"
                value={profileInput.income}
                onChange={(e) => setProfileInput({ ...profileInput, income: Number(e.target.value) })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Occupation & Student Status</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={profileInput.occupation}
                  onChange={(e) => setProfileInput({
                    ...profileInput,
                    occupation: e.target.value,
                    student: e.target.value === 'Student' ? true : profileInput.student
                  })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2 text-xs text-white"
                >
                  <option value="Student">Student</option>
                  <option value="Farmer">Farmer</option>
                  <option value="Artisan">Artisan</option>
                  <option value="Fisherman">Fisherman</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="General">General</option>
                </select>

                <select
                  value={profileInput.student ? 'yes' : 'no'}
                  onChange={(e) => setProfileInput({ ...profileInput, student: e.target.value === 'yes' })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2 text-xs text-white"
                >
                  <option value="yes">Is Student: Yes</option>
                  <option value="no">Is Student: No</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Age & Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={profileInput.age}
                  onChange={(e) => setProfileInput({ ...profileInput, age: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <select
                  value={profileInput.gender}
                  onChange={(e) => setProfileInput({ ...profileInput, gender: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2 text-xs text-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Social Category</label>
              <select
                value={profileInput.category}
                onChange={(e) => setProfileInput({ ...profileInput, category: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="Minority">Minority</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? 'Running Hard Filters...' : 'Find Eligible Schemes'}
            </button>
          </form>
        </div>

        {/* Scheme Results Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Eligible Scheme Results (Sorted Ascending by Match %)
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs">
                {recommendations.length} Eligible
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm text-gray-400">Evaluating 3,400 schemes against hard demographic rules...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-gray-800 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-lg font-bold text-white">No Eligible Schemes Found</h4>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                No eligible schemes were found for the provided profile. Try adjusting your demographic parameters or state selection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((scheme) => (
                <SchemeCard
                  key={scheme.schemeId}
                  scheme={scheme}
                  onApply={(sch) => setSelectedSchemeForApply(sch)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Apply Drawer Modal */}
      {selectedSchemeForApply && (
        <ApplyScheme
          scheme={selectedSchemeForApply}
          onClose={() => setSelectedSchemeForApply(null)}
        />
      )}

    </div>
  );
};

export default WelfareFinder;
