const pythonService = require('../services/pythonService');

const handleChat = async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required and cannot be empty' });
    }

    const response = await pythonService.queryChatbot(
      message.trim(),
      Array.isArray(conversationHistory) ? conversationHistory : [],
      userProfile || null
    );

    return res.json({
      success: true,
      reply: response.reply || "AI Assistant is temporarily unavailable. Please try again.",
      source: response.source || "Civic Assistant Service",
      sources: response.sources || [],
      suggestedActions: Array.isArray(response.suggestedActions) ? response.suggestedActions : []
    });
  } catch (error) {
    console.error('[CHATBOT ERROR]', error.message);
    return res.status(500).json({
      success: false,
      reply: "AI Assistant is temporarily unavailable. Please try again.",
      source: "Civic Assistant Service",
      sources: [],
      suggestedActions: ["Find Schemes", "File Complaint", "Track Grievances"]
    });
  }
};

const getChatbotHealth = async (req, res) => {
  try {
    const health = await pythonService.checkHealth();
    return res.json({
      status: health.connected ? 'healthy' : 'degraded',
      service: 'Node Express Backend -> FastAPI ML Bridge',
      mlService: health
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
};

module.exports = { handleChat, getChatbotHealth };
