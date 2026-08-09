const express = require('express');
const router = express.Router();
const { handleChat, getChatbotHealth } = require('../controllers/chatbotController');

router.post('/query', handleChat);
router.get('/health', getChatbotHealth);

module.exports = router;
