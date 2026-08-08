const express = require('express');
const router = express.Router();
const { createComplaint, getUserComplaints, getComplaintById, analyzeComplaintText } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/ai/analyze-complaint', analyzeComplaintText);
router.post('/analyze-complaint', analyzeComplaintText);
router.post('/', protect, upload.single('photo'), createComplaint);
router.get('/my', protect, getUserComplaints);
router.get('/:id', protect, getComplaintById);

module.exports = router;
