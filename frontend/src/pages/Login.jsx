import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { loginAPI } from '../services/authAPI';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

const Login = ({ message }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('Citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginAPI({ email, password });
      if (data.success) {
        const returnedRole = (data.user?.role || '').toLowerCase();
        const cleanEmail = (email || '').toLowerCase();
        const isAdminOrOfficer = 
          loginRole === 'Admin' ||
          returnedRole === 'admin' || 
          returnedRole === 'officer' || 
          cleanEmail.includes('admin') || 
          cleanEmail.includes('officer') || 
          cleanEmail.endsWith('.gov.in');

        const finalUser = {
          ...data.user,
          role: isAdminOrOfficer ? 'Admin' : (data.user?.role || 'Citizen')
        };

        dispatch(loginSuccess({ token: data.token, user: finalUser }));

        if (isAdminOrOfficer) {
          navigate('/admin');
        } else {
          navigate('/welfare-finder');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-gray-800 space-y-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 p-0.5 shadow-xl shadow-indigo-500/20 mx-auto overflow-hidden">
            <img src="/app-logo.jpg" alt="Welfare Scheme Icon" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to Portal</h2>
          <p className="text-xs text-gray-400">Access personalized scheme recommendations & grievance tracking</p>
        </div>

        {/* Login Role Toggle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-300">Sign In As *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLoginRole('Citizen')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                loginRole === 'Citizen' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                  : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Citizen
            </button>

            <button
              type="button"
              onClick={() => setLoginRole('Admin')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                loginRole === 'Admin' 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                  : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Municipal Officer / Admin
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
            Register New Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
