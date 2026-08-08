const express = require('express');
const router = express.Router();
const { getSchemes, getSchemeById, recommendSchemes } = require('../controllers/schemeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getSchemes);
router.post('/recommend', protect, recommendSchemes);
router.get('/:id', getSchemeById);

module.exports = router;
