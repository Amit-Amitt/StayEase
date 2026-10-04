const express = require('express');
const { z } = require('zod');
const router = express.Router();
const {
    createBooking,
    verifyBookingPayment,
    razorpayWebhook,
    capturePaypalBooking,
    getUserBookings,
    getHotelBookings,
    updateBookingStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Use a valid date in YYYY-MM-DD format');
const createBookingSchema = z.object({
    hotelId: z.string().trim().min(1).max(100),
    roomTypeId: z.string().trim().min(1).max(100),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.number().int().min(1).max(30),
    fullName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(1).max(40),
    specialRequests: z.string().max(500).optional(),
    paymentProvider: z.enum(['RAZORPAY', 'PAYPAL'])
}).strict();
const verifyPaymentSchema = z.object({
    bookingId: z.string().regex(/^[a-f\d]{24}$/i),
    razorpay_order_id: z.string().min(1).max(100),
    razorpay_payment_id: z.string().min(1).max(100),
    razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i)
}).strict();
const paypalCaptureSchema = z.object({
    bookingId: z.string().regex(/^[a-f\d]{24}$/i),
    paypalOrderId: z.string().min(1).max(100)
}).strict();

router.post('/', protect, validate(createBookingSchema), createBooking);
router.post('/verify-payment', protect, validate(verifyPaymentSchema), verifyBookingPayment);
router.post('/paypal/capture', protect, validate(paypalCaptureSchema), capturePaypalBooking);
router.post('/razorpay/webhook', razorpayWebhook);
router.get('/user', protect, getUserBookings);
router.get('/hotel/:hotelId', protect, authorize('ADMIN', 'HOTEL_OWNER', 'STAFF'), getHotelBookings);
router.patch('/:id/status', protect, authorize('ADMIN', 'HOTEL_OWNER', 'STAFF'), validate(z.object({
    status: z.enum(['Confirmed', 'Cancelled', 'Completed'])
}).strict()), updateBookingStatus);

module.exports = router;
