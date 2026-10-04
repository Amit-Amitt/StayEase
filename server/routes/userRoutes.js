const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { getProfile, updateProfile, toggleSaveHotel, setUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(z.object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional()
}).strict().refine((value) => Object.keys(value).length > 0)), updateProfile);
router.post('/save-hotel/:id', protect, toggleSaveHotel);
router.patch('/:id/role', protect, authorize('ADMIN'), validate(z.object({
    role: z.enum(['USER', 'HOTEL_OWNER', 'STAFF', 'ADMIN'])
}).strict()), setUserRole);

module.exports = router;
