const pythonService = require('../services/pythonService');

const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const response = await pythonService.queryChatbot(message);
    res.json({
      success: true,
      reply: response.reply,
      source: response.source,
      suggestedActions: response.suggestedActions || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { handleChat };
