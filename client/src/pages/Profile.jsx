import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../redux/authSlice';
import { User, Mail, Shield, Briefcase, IndianRupee, MapPin, CheckCircle, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: user?.name || 'Ananya Verma',
    email: user?.email || 'ananya@citizen.in',
    income: user?.income || 240000,
    occupation: user?.occupation || 'Farmer / Student',
    age: user?.age || 22,
    gender: user?.gender || 'Female',
    category: user?.category || 'OBC',
    education: user?.education || 'Undergraduate',
    state: user?.state || 'Maharashtra'
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(formData));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="glass-panel rounded-3xl p-8 border border-gray-800 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-gray-950 flex items-center justify-center font-black text-3xl shadow-xl">
          {formData.name[0]}
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400 font-bold block mb-1">
            Role: {user?.role || 'Citizen Applicant'}
          </span>
          <h1 className="text-3xl font-extrabold text-white">{formData.name}</h1>
          <p className="text-sm text-gray-400">{formData.email}</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Profile updated! AI Scheme model will adjust predictions dynamically.
        </div>
      )}

      <div className="glass-panel rounded-3xl p-8 border border-gray-800 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          Demographic & Scheme Eligibility Parameters
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Annual Household Income (₹)</label>
            <input
              type="number"
              value={formData.income}
              onChange={(e) => setFormData({ ...formData, income: Number(e.target.value) })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Occupation</label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              <option value="Farmer / Student">Farmer / Agriculture</option>
              <option value="Student">Student</option>
              <option value="Artisan">Artisan / Craftsman</option>
              <option value="Unemployed">Unemployed / EWS</option>
              <option value="Self-Employed">Self-Employed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Age & Gender</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2.5 text-xs text-white"
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
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
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
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Delhi">Delhi</option>
              <option value="All India">All India / Central</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Profile Changes
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default Profile;
