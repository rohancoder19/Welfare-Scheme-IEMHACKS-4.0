import axios from 'axios';

export const submitComplaintAPI = async (formData, token) => {
  const response = await axios.post('/api/complaints', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const fetchMyComplaintsAPI = async (token) => {
  const response = await axios.get('/api/complaints/my', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchComplaintDetailsAPI = async (id, token) => {
  const response = await axios.get(`/api/complaints/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchAdminComplaintsAPI = async (filters, token) => {
  const response = await axios.get('/api/admin/complaints', {
    params: filters,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateComplaintStatusAPI = async (id, statusData, token) => {
  const response = await axios.put(`/api/admin/complaints/${id}/status`, statusData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchAdminAnalyticsAPI = async (token) => {
  const response = await axios.get('/api/admin/analytics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const analyzeComplaintAPI = async (payload) => {
  const response = await axios.post('/api/ai/analyze-complaint', payload);
  return response.data;
};

export const overrideAIDecisionAPI = async (id, decisionData, token) => {
  const response = await axios.put(`/api/admin/complaints/${id}/decision`, decisionData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

