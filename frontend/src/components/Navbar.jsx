import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { Shield, Sparkles, FileText, AlertTriangle, User, LogOut, Menu, X, CheckCircle2, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-emerald-400 bg-clip-text text-transparent">
                CIVIC<span className="text-emerald-400">AI</span>
              </span>
              <span className="block text-[10px] text-emerald-400/80 uppercase tracking-widest font-semibold">
                Welfare & Grievance Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/welfare-finder"
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                isActive('/welfare-finder') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Scheme Recommender
            </Link>

            <Link
              to="/complaint"
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                isActive('/complaint') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              File Grievance
            </Link>

            <Link
              to="/complaint-status"
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                isActive('/complaint-status') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-400" />
              Track Status
            </Link>

            {user?.role === 'Admin' || user?.role === 'Officer' ? (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-all ${
                  isActive('/admin') 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Officer Portal
              </Link>
            ) : null}
          </div>

          {/* User Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-gray-200">{user.name}</span>
                    <span className="block text-[10px] text-emerald-400 font-mono capitalize">{user.role}</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 rounded-lg font-semibold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-gray-800 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-800"
          >
            Home
          </Link>
          <Link
            to="/welfare-finder"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-emerald-400 hover:bg-gray-800"
          >
            Scheme Recommender (AI)
          </Link>
          <Link
            to="/complaint"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-gray-800"
          >
            File Grievance
          </Link>
          <Link
            to="/complaint-status"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-sky-400 hover:bg-gray-800"
          >
            Track Status
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-gray-800"
          >
            Officer Admin Portal
          </Link>
          <div className="pt-4 border-t border-gray-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2 text-rose-400 hover:bg-gray-800 rounded-md"
              >
                Logout ({user?.name})
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-gray-300">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 bg-emerald-500 text-gray-950 font-bold rounded-md text-center">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
