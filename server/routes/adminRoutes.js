const express = require('express');
const router = express.Router();
const { getAllComplaints, updateComplaintStatus, getAdminAnalytics } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/complaints', protect, authorizeRoles('Admin', 'Officer'), getAllComplaints);
router.put('/complaints/:id/status', protect, authorizeRoles('Admin', 'Officer'), updateComplaintStatus);
router.get('/analytics', protect, authorizeRoles('Admin', 'Officer'), getAdminAnalytics);

module.exports = router;
