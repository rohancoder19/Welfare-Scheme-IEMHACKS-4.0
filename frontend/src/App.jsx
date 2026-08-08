import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WelfareFinder from './pages/WelfareFinder';
import Complaint from './pages/Complaint';
import ComplaintStatus from './pages/ComplaintStatus';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated || !user) {
    return <Login message="Please sign in to access this feature." />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-3xl border border-rose-500/30 text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-400">403 Forbidden</h2>
        <p className="text-xs text-gray-300">You do not have administrative authorization to access this page.</p>
      </div>
    );
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-gray-950">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/welfare-finder" element={<ProtectedRoute><WelfareFinder /></ProtectedRoute>} />
            <Route path="/complaint" element={<ProtectedRoute><Complaint /></ProtectedRoute>} />
            <Route path="/complaint-status" element={<ProtectedRoute><ComplaintStatus /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin', 'Officer']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </main>

        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
