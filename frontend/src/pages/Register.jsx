import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { registerAPI } from '../services/authAPI';
import { User, Mail, Lock, Shield, IndianRupee, Briefcase, MapPin, ArrowRight, GraduationCap } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    aadhaar: '',
    income: 240000,
    occupation: 'Farmer / Student',
    age: 24,
    gender: 'Female',
    category: 'OBC',
    education: 'Graduate',
    state: 'Maharashtra',
    role: 'Citizen'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await registerAPI(formData);
      if (data.success) {
        dispatch(loginSuccess(data));
        navigate(data.user?.role === 'Admin' || data.user?.role === 'Officer' ? '/admin' : '/welfare-finder');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full glass-panel rounded-3xl p-8 border border-gray-800 space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 p-0.5 shadow-xl shadow-indigo-500/20 mx-auto overflow-hidden">
            <img src="/app-logo.jpg" alt="Welfare Scheme Icon" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {formData.role === 'Citizen' ? 'Create Citizen Account' : 'Create Municipal Officer / Admin Account'}
          </h2>
          <p className="text-xs text-gray-400">
            {formData.role === 'Citizen'
              ? 'Register to access AI welfare scheme recommendations & grievance tracking'
              : 'Register to manage smart grievance priority queue, SLA tracking & officer dispatch'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Account Type Role Selection */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">Register Account As *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Citizen' })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'Citizen' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Citizen Applicant
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Admin' })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'Admin' || formData.role === 'Officer'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Municipal Officer / Admin
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder={formData.role === 'Citizen' ? "e.g. Ananya Verma" : "e.g. Officer Rajesh Sharma"}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder={formData.role === 'Citizen' ? "ananya@citizen.in" : "officer@gov.in"}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className={formData.role === 'Admin' ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Citizen-Only Demographic Parameters */}
          {formData.role === 'Citizen' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Annual Household Income (₹)</label>
                <input
                  type="number"
                  name="income"
                  value={formData.income}
                  onChange={handleChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Occupation</label>
                <select
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Farmer">Farmer / Agriculture</option>
                  <option value="Student">Student</option>
                  <option value="Artisan">Artisan / Craftsman</option>
                  <option value="Unemployed">Unemployed / EWS</option>
                  <option value="Self-Employed">Self-Employed / Small Business</option>
                  <option value="Private Service">Private Service</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Age & Gender</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>
          </div>

          {formData.role === 'Citizen' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Social Category & Education</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="Minority">Minority</option>
                </select>

                <select
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="12th Pass">12th Pass</option>
                  <option value="10th Pass">10th Pass</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">State Residency</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Delhi">Delhi</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="All India">Other / Central</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading 
                ? 'Creating Account...' 
                : (formData.role === 'Citizen' ? 'Complete Registration & Start AI Match' : 'Register Officer Account & Access Command Center')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

        <p className="text-center text-xs text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
            Sign In Here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
