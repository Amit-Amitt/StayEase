const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { getHotels, getHotelById, createHotel, updateHotel, deleteHotel, setHotelStaff } = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.get('/', getHotels);
router.get('/search', getHotels);
router.get('/:id', getHotelById);

// Admin Routes
router.post('/', protect, authorize('ADMIN', 'HOTEL_OWNER'), createHotel);
router.patch('/:id/staff', protect, authorize('ADMIN', 'HOTEL_OWNER'), validate(z.object({
    userId: z.string().min(1),
    action: z.enum(['add', 'remove'])
}).strict()), setHotelStaff);
router.put('/:id', protect, authorize('ADMIN', 'HOTEL_OWNER', 'STAFF'), updateHotel);
router.delete('/:id', protect, authorize('ADMIN', 'HOTEL_OWNER', 'STAFF'), deleteHotel);

module.exports = router;
