const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { createBooking, getUserBookings, getHotelBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.post('/', protect, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/hotel/:hotelId', protect, authorize('ADMIN', 'HOTEL_OWNER', 'STAFF'), getHotelBookings);
router.patch('/:id/status', protect, authorize('ADMIN', 'HOTEL_OWNER', 'STAFF'), validate(z.object({
    status: z.enum(['Confirmed', 'Cancelled', 'Completed'])
}).strict()), updateBookingStatus);

module.exports = router;
