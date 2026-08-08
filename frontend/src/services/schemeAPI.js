import axios from 'axios';

export const fetchSchemesAPI = async (filters = {}) => {
  const response = await axios.get('/api/schemes', { params: filters });
  return response.data;
};

export const getSchemeByIdAPI = async (id) => {
  const response = await axios.get(`/api/schemes/${id}`);
  return response.data;
};

export const getAIRecommendationsAPI = async (userProfile, token) => {
  const response = await axios.post('/api/schemes/recommend', { userProfile }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};
