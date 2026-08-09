import React from 'react';
import { Shield, Phone, Mail, MapPin, Globe, ExternalLink, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 border-b border-gray-900">
          
          {/* Brand Info */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 p-0.5 shadow-lg overflow-hidden shrink-0">
                <img src="/app-logo.jpg" alt="App Logo" className="w-full h-full object-cover rounded-[7px]" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                WELFARE<span className="text-emerald-400"> SCHEME</span> PORTAL
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI-driven Citizen Welfare Scheme Matcher and Public Grievance Redressal Platform empowering transparent civic governance across India.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI ML Engine Connected
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4">Welfare Services</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><a href="/welfare-finder" className="hover:text-emerald-400 transition-colors">AI Scheme Recommender</a></li>
              <li><a href="/#schemes" className="hover:text-emerald-400 transition-colors">Housing & Infrastructure</a></li>
              <li><a href="/#schemes" className="hover:text-emerald-400 transition-colors">Health & Ayushman Coverage</a></li>
              <li><a href="/#schemes" className="hover:text-emerald-400 transition-colors">PM-Kisan Farmer Direct Support</a></li>
              <li><a href="/#schemes" className="hover:text-emerald-400 transition-colors">Post-Matric Scholarships</a></li>
            </ul>
          </div>

          {/* Grievance Cell */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4">Grievance Cell</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><a href="/complaint" className="hover:text-rose-400 transition-colors">Report Road Pothole / Street Light</a></li>
              <li><a href="/complaint" className="hover:text-rose-400 transition-colors">Water Pipeline Burst / Sewerage</a></li>
              <li><a href="/complaint" className="hover:text-rose-400 transition-colors">Women Safety & Urgent Harassment</a></li>
              <li><a href="/complaint-status" className="hover:text-rose-400 transition-colors">Track Real-time Resolution Status</a></li>
              <li><a href="/admin" className="hover:text-rose-400 transition-colors">Officer Triage Center</a></li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4">Helpline & Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2 text-emerald-400 font-mono font-medium text-xs sm:text-sm">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                National Portal: 1800-11-2026
              </li>
              <li className="flex items-center gap-2 text-rose-400 font-mono font-medium text-xs sm:text-sm">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                Women Safety: 1091 / 112
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                support@civicai.gov.in
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                Central Secretariat, New Delhi, India
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>© 2026 CivicAI National Governance System. Built for IEM Hacks.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400">Terms of Service</a>
            <a href="#" className="hover:text-gray-400">Government Open Data API</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
