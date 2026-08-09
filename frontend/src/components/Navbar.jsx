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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img
                src="/app-logo.jpg"
                alt="Welfare Scheme Portal Logo"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div>
              <span className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-emerald-400 bg-clip-text text-transparent">
                WELFARE<span className="text-emerald-400"> SCHEME</span>
              </span>
              <span className="block text-[9px] sm:text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold">
                AI Welfare & Grievance Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Hidden on Login/Register pages) */}
          {!isAuthPage && (
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Home
              </Link>

              <Link
                to="/welfare-finder"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive('/welfare-finder') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                Scheme Recommender
              </Link>

              <Link
                to="/complaint"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive('/complaint') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                File Grievance
              </Link>

              <Link
                to="/complaint-status"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive('/complaint-status') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                Track Status
              </Link>

              {(user?.role === 'Admin' || user?.role === 'Officer') && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${
                    isActive('/admin') 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  Admin Dashboard
                </Link>
              )}
            </div>
          )}

          {/* User Auth Controls */}
          <div className="hidden lg:flex items-center gap-3">
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
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl text-gray-300 hover:text-white bg-gray-900/80 border border-gray-800 flex items-center justify-center transition-all active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-rose-400" /> : <Menu className="w-6 h-6 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-[#090d16]/95 backdrop-blur-2xl z-50 border-b border-gray-800 px-4 pt-3 pb-6 space-y-3 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {!isAuthPage && (
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-300 hover:bg-gray-800/60'
                }`}
              >
                Home
              </Link>
              <Link
                to="/welfare-finder"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/welfare-finder') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-emerald-400 hover:bg-gray-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                Scheme Recommender (AI)
              </Link>
              <Link
                to="/complaint"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/complaint') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'text-rose-400 hover:bg-gray-800/60'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                File Grievance
              </Link>
              <Link
                to="/complaint-status"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/complaint-status') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'text-sky-400 hover:bg-gray-800/60'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                Track Status
              </Link>
              {(user?.role === 'Admin' || user?.role === 'Officer') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive('/admin') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-amber-400 hover:bg-gray-800/60'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  Admin Dashboard
                </Link>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-gray-800/80 space-y-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name[0] : 'U'}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-gray-200">{user.name}</span>
                      <span className="block text-xs text-emerald-400 font-mono capitalize">{user.role}</span>
                    </div>
                  </div>
                  <User className="w-4 h-4 text-gray-400" />
                </Link>

                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 p-3 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl font-medium text-sm transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-center text-gray-200 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-center text-gray-950 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
