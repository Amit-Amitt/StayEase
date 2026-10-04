const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const { canManageHotel } = require('../middleware/authMiddleware');
const {
    PaymentConfigurationError,
    getRazorpayConfig,
    verifyCheckoutSignature,
    verifyWebhookSignature
} = require('../services/razorpayService');
const {
    PaymentConfigurationError: PaypalPaymentConfigurationError,
    PaypalApiError,
    getPaypalConfig,
    createOrder: createPaypalOrder,
    getOrder: getPaypalOrder,
    captureOrder: capturePaypalOrder
} = require('../services/paypalService');

const DAY_MS = 24 * 60 * 60 * 1000;
const isCapturedPayment = (payment) => payment?.status === 'captured' || payment?.captured === true;

const confirmPaidBooking = async (booking, payment) => {
    booking.paymentStatus = 'PAID';
    if (booking.paymentProvider === 'PAYPAL') {
        booking.paypalCaptureId = payment.id;
    } else {
        booking.razorpayPaymentId = payment.id;
    }
    booking.paidAt ||= new Date();
    booking.status = 'Confirmed';
    await booking.save();
    return booking;
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public (or Private depending on frontend)
const createBooking = async (req, res) => {
    try {
        const { hotelId, roomTypeId, checkIn, checkOut, guests, fullName, email, phone } = req.body;
        const paymentProvider = req.body.paymentProvider;

        const hotel = await Hotel.findOne({ $or: [{ id: hotelId }, { _id: hotelId.match(/^[0-9a-fA-F]{24}$/) ? hotelId : null }] });
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        let room = hotel.roomTypes.find(r => r.id === roomTypeId);
        if (!room) {
            if (hotel.roomTypes.length === 0) {
                room = { price: hotel.pricePerNight || 1999 };
            } else {
                return res.status(404).json({ message: 'Room type not found' });
            }
        }

        // Calculate total
        const startDate = Date.parse(`${checkIn}T00:00:00.000Z`);
        const endDate = Date.parse(`${checkOut}T00:00:00.000Z`);
        if (!Number.isFinite(startDate) || !Number.isFinite(endDate) || endDate <= startDate) {
            return res.status(400).json({ message: 'Check-out must be after check-in' });
        }
        const nights = (endDate - startDate) / DAY_MS;
        if (!Number.isInteger(nights) || nights > 365) {
            return res.status(400).json({ message: 'Booking dates are invalid' });
        }

        const pricePerNight = Number(room.price);
        if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
            return res.status(400).json({ message: 'This room does not have a valid price' });
        }
        const subtotal = pricePerNight * nights;
        const fees = Math.round(subtotal * 0.12);
        const total = subtotal + fees;
        const paymentAmountSubunits = Math.round(total * 100);
        if (!Number.isSafeInteger(paymentAmountSubunits) || paymentAmountSubunits <= 0) {
            return res.status(400).json({ message: 'Booking total is invalid' });
        }

        let currency;
        let razorpay;
        if (paymentProvider === 'RAZORPAY') {
            razorpay = getRazorpayConfig();
            currency = razorpay.currency;
        } else if (paymentProvider === 'PAYPAL') {
            currency = getPaypalConfig().currency;
        } else {
            return res.status(400).json({ message: 'Choose a supported payment method' });
        }

        const booking = new Booking({
            userId: req.user._id,
            hotelId,
            hotelName: hotel.name,
            roomTypeId,
            checkIn,
            checkOut,
            guests,
            fullName,
            email,
            phone,
            total,
            paymentProvider,
            paymentStatus: 'PENDING',
            paymentCurrency: currency,
            paymentAmountSubunits,
            status: 'Pending Payment'
        });
        if (paymentProvider === 'RAZORPAY') {
            const order = await razorpay.client.orders.create({
                amount: paymentAmountSubunits,
                currency,
                receipt: booking.id,
                notes: { bookingId: booking.id, userId: String(req.user._id) }
            });
            booking.razorpayOrderId = order.id;
            await booking.save();
            return res.status(201).json({
                booking,
                keyId: razorpay.keyId,
                order: { id: order.id, amount: order.amount, currency: order.currency }
            });
        }

        const order = await createPaypalOrder(booking.id, (paymentAmountSubunits / 100).toFixed(2));
        if (!order.id) throw new PaypalApiError('PayPal did not return an order ID');
        booking.paypalOrderId = order.id;
        await booking.save();
        return res.status(201).json({
            booking,
            clientId: process.env.PAYPAL_CLIENT_ID,
            order: { id: order.id, amount: paymentAmountSubunits, currency }
        });
    } catch (error) {
        if (error instanceof PaymentConfigurationError || error instanceof PaypalPaymentConfigurationError) {
            const providerName = error instanceof PaypalPaymentConfigurationError ? 'PayPal' : 'Razorpay';
            return res.status(503).json({ message: `${providerName} is not configured on the server` });
        }
        if (error instanceof PaypalApiError) {
            console.error('PayPal order creation failed:', {
                status: error.status,
                issue: error.issue,
                debugId: error.debugId,
                message: error.message
            });
            if (error.status === 401) {
                return res.status(502).json({ message: 'PayPal rejected its API credentials. Confirm PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are from the same Sandbox REST app, and PAYPAL_MODE=sandbox.' });
            }
            return res.status(502).json({
                message: `PayPal could not start checkout: ${error.message}`,
                ...(error.debugId ? { reference: error.debugId } : {})
            });
        }
        if (error.cause?.code) {
            console.error('Unable to connect to PayPal:', error.cause.code);
            return res.status(502).json({ message: `StayEase could not connect to PayPal (${error.cause.code}). Check the API server's outbound network access.` });
        }
        console.error('Unable to create booking payment order:', error.message);
        return res.status(502).json({ message: 'Unable to start payment. Please try again.' });
    }
};

const verifyBookingPayment = async (req, res) => {
    const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.paymentProvider && booking.paymentProvider !== 'RAZORPAY') {
        return res.status(400).json({ message: 'This booking does not use Razorpay' });
    }

    if (booking.paymentStatus === 'PAID') {
        if (booking.razorpayPaymentId === paymentId && booking.razorpayOrderId === orderId) {
            return res.json({ booking, message: 'Payment already verified' });
        }
        return res.status(409).json({ message: 'This booking has already been paid' });
    }
    if (!booking.razorpayOrderId || booking.razorpayOrderId !== orderId) {
        return res.status(400).json({ message: 'Payment order does not match this booking' });
    }

    let config;
    try {
        config = getRazorpayConfig();
    } catch (error) {
        if (error instanceof PaymentConfigurationError) {
            return res.status(503).json({ message: 'Razorpay is not configured on the server' });
        }
        throw error;
    }
    if (!verifyCheckoutSignature({
        orderId: booking.razorpayOrderId,
        paymentId,
        signature,
        secret: process.env.RAZORPAY_KEY_SECRET
    })) {
        return res.status(400).json({ message: 'Razorpay payment signature is invalid' });
    }

    try {
        let payment = await config.client.payments.fetch(paymentId);
        if (payment.order_id !== booking.razorpayOrderId || payment.amount !== booking.paymentAmountSubunits || payment.currency !== booking.paymentCurrency) {
            return res.status(400).json({ message: 'Payment details do not match this booking' });
        }
        if (payment.status === 'authorized') {
            try {
                payment = await config.client.payments.capture(paymentId, booking.paymentAmountSubunits, booking.paymentCurrency);
            } catch {
                payment = await config.client.payments.fetch(paymentId);
            }
        }
        if (!isCapturedPayment(payment)) {
            return res.status(409).json({ message: 'Payment has not been captured yet. Please retry verification shortly.' });
        }

        const confirmedBooking = await confirmPaidBooking(booking, payment);
        return res.json({ booking: confirmedBooking, message: 'Payment verified and booking confirmed' });
    } catch (error) {
        console.error('Unable to verify Razorpay payment:', error.message);
        return res.status(502).json({ message: 'Unable to verify the payment right now. Please retry shortly.' });
    }
};

const razorpayWebhook = async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(503).json({ message: 'Razorpay webhook is not configured' });
    if (!verifyWebhookSignature({
        rawBody: req.rawBody,
        signature: req.get('x-razorpay-signature'),
        secret: webhookSecret
    })) {
        return res.status(400).json({ message: 'Invalid Razorpay webhook signature' });
    }

    const event = req.body?.event;
    if (event !== 'payment.captured' && event !== 'order.paid') return res.json({ received: true });

    const payment = req.body?.payload?.payment?.entity;
    if (!payment?.order_id || !isCapturedPayment(payment)) return res.json({ received: true });
    const booking = await Booking.findOne({
        razorpayOrderId: payment.order_id,
        $or: [{ paymentProvider: 'RAZORPAY' }, { paymentProvider: { $exists: false } }]
    });
    if (!booking || payment.amount !== booking.paymentAmountSubunits || payment.currency !== booking.paymentCurrency) {
        return res.json({ received: true });
    }

    try {
        await confirmPaidBooking(booking, payment);
        return res.json({ received: true });
    } catch (error) {
        console.error('Unable to update booking from Razorpay webhook:', error.message);
        return res.status(500).json({ message: 'Unable to process payment webhook' });
    }
};

const paypalCaptureMatchesBooking = (order, booking) => {
    const purchaseUnit = order?.purchase_units?.find((unit) => unit.custom_id === String(booking._id));
    return Boolean(
        purchaseUnit &&
        purchaseUnit.amount?.currency_code === booking.paymentCurrency &&
        purchaseUnit.amount?.value === (booking.paymentAmountSubunits / 100).toFixed(2)
    );
};

const getCompletedPaypalCapture = (order) => {
    if (order?.status !== 'COMPLETED') return null;
    for (const purchaseUnit of order.purchase_units || []) {
        const capture = purchaseUnit.payments?.captures?.find((item) => item.status === 'COMPLETED');
        if (capture) return capture;
    }
    return null;
};

const capturePaypalBooking = async (req, res) => {
    const { bookingId, paypalOrderId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.paymentProvider !== 'PAYPAL') {
        return res.status(400).json({ message: 'This booking does not use PayPal' });
    }
    if (booking.paymentStatus === 'PAID') {
        if (booking.paypalOrderId === paypalOrderId) {
            return res.json({ booking, message: 'Payment already verified' });
        }
        return res.status(409).json({ message: 'This booking has already been paid' });
    }
    if (!booking.paypalOrderId || booking.paypalOrderId !== paypalOrderId) {
        return res.status(400).json({ message: 'Payment order does not match this booking' });
    }

    try {
        getPaypalConfig();
        let order = await getPaypalOrder(paypalOrderId);
        if (!paypalCaptureMatchesBooking(order, booking)) {
            return res.status(400).json({ message: 'Payment details do not match this booking' });
        }

        let capture = getCompletedPaypalCapture(order);
        if (!capture && order.status === 'APPROVED') {
            order = await capturePaypalOrder(paypalOrderId, booking.id);
            if (!paypalCaptureMatchesBooking(order, booking)) {
                return res.status(400).json({ message: 'Captured payment details do not match this booking' });
            }
            capture = getCompletedPaypalCapture(order);
        }
        if (!capture || capture.amount?.currency_code !== booking.paymentCurrency ||
            capture.amount?.value !== (booking.paymentAmountSubunits / 100).toFixed(2)) {
            return res.status(409).json({ message: 'PayPal payment has not completed. Please retry shortly.' });
        }

        const confirmedBooking = await confirmPaidBooking(booking, capture);
        return res.json({ booking: confirmedBooking, message: 'Payment verified and booking confirmed' });
    } catch (error) {
        if (error instanceof PaypalPaymentConfigurationError) {
            return res.status(503).json({ message: 'PayPal is not configured on the server' });
        }
        if (error instanceof PaypalApiError) {
            console.error('PayPal capture failed:', {
                status: error.status,
                issue: error.issue,
                debugId: error.debugId,
                message: error.message
            });
            if (error.status === 401) {
                return res.status(502).json({ message: 'PayPal rejected its API credentials. Confirm PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are from the same Sandbox REST app, and PAYPAL_MODE=sandbox.' });
            }
            return res.status(502).json({
                message: `PayPal could not verify or capture this payment: ${error.message}`,
                ...(error.debugId ? { reference: error.debugId } : {})
            });
        }
        if (error.cause?.code) {
            console.error('Unable to connect to PayPal for capture:', error.cause.code);
            return res.status(502).json({ message: `StayEase could not connect to PayPal (${error.cause.code}). Check the API server's outbound network access.` });
        }
        console.error('Unable to capture PayPal payment:', error.message);
        return res.status(502).json({ message: 'Unable to verify the payment right now. Please retry shortly.' });
    }
};

// @desc    Get user bookings
// @route   GET /api/bookings/user
// @access  Private
const getUserBookings = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getHotelBookings = async (req, res) => {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findOne({
        $or: [
            { id: hotelId },
            { _id: /^[0-9a-fA-F]{24}$/.test(hotelId) ? hotelId : null }
        ]
    });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    if (!canManageHotel(req.user, hotel)) {
        return res.status(403).json({ message: 'You do not manage this hotel' });
    }
    const ids = [hotel.id, String(hotel._id)].filter(Boolean);
    const bookings = await Booking.find({ hotelId: { $in: ids } }).sort({ createdAt: -1 });
    return res.json(bookings);
};

const updateBookingStatus = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.body.status !== 'Cancelled' && booking.paymentStatus !== 'PAID') {
        return res.status(409).json({ message: 'Booking cannot be confirmed until payment is captured' });
    }
    const hotel = await Hotel.findOne({
        $or: [
            { id: booking.hotelId },
            { _id: /^[0-9a-fA-F]{24}$/.test(booking.hotelId) ? booking.hotelId : null }
        ]
    });
    if (!canManageHotel(req.user, hotel)) {
        return res.status(403).json({ message: 'You do not manage this hotel' });
    }
    booking.status = req.body.status;
    await booking.save();
    return res.json(booking);
};

module.exports = {
    createBooking,
    verifyBookingPayment,
    razorpayWebhook,
    capturePaypalBooking,
    getUserBookings,
    getHotelBookings,
    updateBookingStatus
};
