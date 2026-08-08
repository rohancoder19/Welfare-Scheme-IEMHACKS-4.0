import axios from 'axios';

export const loginAPI = async (credentials) => {
  const response = await axios.post('/api/auth/login', credentials);
  return response.data;
};

export const registerAPI = async (userData) => {
  const response = await axios.post('/api/auth/register', userData);
  return response.data;
};

export const getProfileAPI = async (token) => {
  const response = await axios.get('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
