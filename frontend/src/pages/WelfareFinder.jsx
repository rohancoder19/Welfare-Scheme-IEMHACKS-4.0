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
    occupation: user?.occupation || 'Farmer',
    category: user?.category || 'OBC',
    education: user?.education || 'Undergraduate',
    state: user?.state || 'Maharashtra'
  });

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
    fetchRecommendations(profileInput);
  }, []);

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
            AI RANDOM FOREST RECOMMENDATION ENGINE
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Welfare Scheme Recommendation Engine
          </h1>

          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Our Python ML microservice evaluates your household income, demographic criteria, occupation, and state residency to compute real-time eligibility scores across all active government schemes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Profile Input Controls Sidebar */}
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-6 sticky top-28">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Demographic Parameters
            </h3>

            <button
              type="button"
              onClick={() => fetchRecommendations(profileInput)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-predict
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-xs font-medium text-gray-300 mb-1">Occupation Field</label>
              <select
                value={profileInput.occupation}
                onChange={(e) => setProfileInput({ ...profileInput, occupation: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Farmer">Farmer / Agriculture</option>
                <option value="Student">Student</option>
                <option value="Artisan">Artisan / Craftsman</option>
                <option value="Unemployed">Unemployed / EWS</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="General">General Worker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Age & Target Gender</label>
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
                  <option value="Transgender">Transgender</option>
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

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">State Residency</label>
              <select
                value={profileInput.state}
                onChange={(e) => setProfileInput({ ...profileInput, state: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Delhi">Delhi</option>
                <option value="West Bengal">West Bengal</option>
                <option value="All India">All India / Central</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? 'Evaluating Model...' : 'Calculate AI Matches'}
            </button>
          </form>
        </div>

        {/* Scheme Results Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Ranked Scheme Match Results
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs">
                {recommendations.length} Schemes Evaluated
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm text-gray-400">Python ML Random Forest Model scoring schemes for your profile...</p>
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
