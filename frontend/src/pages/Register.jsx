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
        navigate('/welfare-finder');
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Citizen Account</h2>
          <p className="text-xs text-gray-400">Enter your details for automated AI Scheme Eligibility matching</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ananya Verma"
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
              placeholder="ananya@citizen.in"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
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
              {loading ? 'Creating Profile...' : 'Complete Registration & Start AI Match'}
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
