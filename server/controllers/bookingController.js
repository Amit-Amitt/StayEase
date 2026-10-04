const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const { canManageHotel } = require('../middleware/authMiddleware');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public (or Private depending on frontend)
const createBooking = async (req, res) => {
    try {
        const { hotelId, roomTypeId, checkIn, checkOut, guests, fullName, email, phone } = req.body;

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
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const nights = Math.max(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 1);
        const total = room.price * nights;

        const booking = new Booking({
            userId: req.user ? req.user._id : undefined, // Optional user association
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
            status: 'Confirmed'
        });

        const createdBooking = await booking.save();
        res.status(201).json(createdBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    getUserBookings,
    getHotelBookings,
    updateBookingStatus
};
