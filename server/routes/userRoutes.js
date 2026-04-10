const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, toggleSaveHotel } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/save-hotel/:id', protect, toggleSaveHotel);

module.exports = router;
