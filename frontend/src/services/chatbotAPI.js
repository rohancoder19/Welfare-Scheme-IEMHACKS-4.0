import axios from 'axios';

export const sendChatMessageAPI = async (message, conversationHistory = [], userProfile = null) => {
  const response = await axios.post('/api/chatbot/query', {
    message,
    conversationHistory,
    userProfile
  });
  return response.data;
};
