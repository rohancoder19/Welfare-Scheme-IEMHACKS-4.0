const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatbotController');

router.post('/query', handleChat);

module.exports = router;
