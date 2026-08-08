import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SchemeCard from '../components/SchemeCard';
import Maps from '../components/Maps';
import { fetchSchemesAPI } from '../services/schemeAPI';
import { fetchAdminComplaintsAPI } from '../services/complaintAPI';
import { Sparkles, Shield, AlertTriangle, Search, CheckCircle2, TrendingUp, Users, ArrowRight, Zap } from 'lucide-react';

const Home = () => {
  const [schemes, setSchemes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      try {
        const sRes = await fetchSchemesAPI();
        if (sRes.success) setSchemes(sRes.schemes);

        const cRes = await fetchAdminComplaintsAPI({});
        if (cRes.success) setComplaints(cRes.complaints);
      } catch (err) {
        console.error('Home load error', err);
      }
    };
    loadData();
  }, []);

  const categories = ['All', 'Housing', 'Health', 'Agriculture', 'Education', 'Social Security', 'Financial'];

  const filteredSchemes = schemes.filter(s => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch = s.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Badge & Logo */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider glow-emerald shadow-xl">
            <img src="/app-logo.jpg" alt="App Logo" className="w-7 h-7 rounded-lg object-cover border border-emerald-400/40" />
            <span>AI-POWERED WELFARE SCHEME & CIVIC GOVERNANCE ENGINE</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Empowering Citizens with{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Smart AI Schemes & Urgent Grievance Redressal
            </span>
          </h1>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Discover customized Government Schemes based on your income, occupation & demographic profile, or file civic complaints with instant NLP Priority Triage.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/welfare-finder"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-gray-950 font-bold text-base shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 glow-emerald"
            >
              <Sparkles className="w-5 h-5 text-gray-950" />
              Find Eligible Schemes (AI Match)
            </Link>

            <Link
              to="/complaint"
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-base hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              File Urgent Grievance
            </Link>
          </div>

          {/* Key Metrics Counter */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="block text-3xl font-black text-emerald-400 font-mono">150+</span>
              <span className="text-xs text-gray-400 font-medium">Central & State Schemes</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="block text-3xl font-black text-sky-400 font-mono">98%</span>
              <span className="text-xs text-gray-400 font-medium">AI Eligibility Match Accuracy</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="block text-3xl font-black text-amber-400 font-mono">&lt; 24 Hrs</span>
              <span className="text-xs text-gray-400 font-medium">High Priority Grievance Triage</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="block text-3xl font-black text-rose-400 font-mono">2,400+</span>
              <span className="text-xs text-gray-400 font-medium">Citizens Assisted</span>
            </div>
          </div>

        </div>
      </section>

      {/* SCHEME SEARCH & CATALOG SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="schemes">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              GOVERNMENT SCHEMES DIRECTORY
            </div>
            <h2 className="text-3xl font-bold text-white">Active Welfare Schemes Catalog</h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search scheme name or benefit..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-gray-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scheme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.slice(0, 6).map((sch) => (
            <SchemeCard key={sch._id || sch.id} scheme={sch} />
          ))}
        </div>
      </section>

      {/* CIVIC COMPLAINTS HEATMAP & LIVE FEED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="glass-panel rounded-3xl p-8 border border-gray-800">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                PUBLIC GRIEVANCE MAP & MONITORING
              </div>
              <h2 className="text-3xl font-bold text-white">Live Civic Issue Heatmap</h2>
              <p className="text-sm text-gray-400 mt-1">Real-time geographic tracking of reported public safety, electricity, and road issues.</p>
            </div>

            <Link
              to="/complaint"
              className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-gray-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20"
            >
              Report Issue in Your Area
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Interactive Map */}
            <div className="lg:col-span-2">
              <Maps complaints={complaints} height="420px" />
            </div>

            {/* Live Feed Sidebar */}
            <div className="space-y-4 flex flex-col justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Recent Grievances Logged
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono">Live</span>
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {complaints.slice(0, 4).map((c, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-200">{c.category}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        c.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {c.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium line-clamp-1">{c.title}</p>
                    <div className="text-[11px] text-gray-500 flex justify-between">
                      <span>{c.location?.address}</span>
                      <span className="text-emerald-400 font-semibold">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
