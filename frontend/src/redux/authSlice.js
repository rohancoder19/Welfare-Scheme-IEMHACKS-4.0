import { createSlice } from '@reduxjs/toolkit';

const storedToken = localStorage.getItem('civic_token');
const storedUser = localStorage.getItem('civic_user') ? JSON.parse(localStorage.getItem('civic_user')) : null;

const initialState = {
  token: storedToken || null,
  user: storedUser || {
    id: 'user_citizen_1',
    name: 'Ananya Verma',
    email: 'ananya@citizen.in',
    role: 'Citizen',
    income: 240000,
    occupation: 'Student / Farmer',
    age: 22,
    gender: 'Female',
    category: 'OBC',
    education: 'Undergraduate',
    state: 'Maharashtra',
    district: 'Pune'
  },
  isAuthenticated: true, // Default active demo session
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('civic_token', action.payload.token);
      localStorage.setItem('civic_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_user');
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('civic_user', JSON.stringify(state.user));
    }
  }
});

export const { loginSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
