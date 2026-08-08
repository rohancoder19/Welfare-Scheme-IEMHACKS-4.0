import axios from 'axios';

export const sendChatMessageAPI = async (message) => {
  const response = await axios.post('/api/chatbot/query', { message });
  return response.data;
};
