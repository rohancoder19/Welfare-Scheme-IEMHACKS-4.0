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
            <Route path="/welfare-finder" element={<WelfareFinder />} />
            <Route path="/complaint" element={<Complaint />} />
            <Route path="/complaint-status" element={<ComplaintStatus />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
