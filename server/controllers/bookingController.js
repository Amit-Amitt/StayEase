const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public (or Private depending on frontend)
const createBooking = async (req, res) => {
    try {
        const { hotelId, roomTypeId, checkIn, checkOut, guests, fullName, email, phone, status } = req.body;

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
            status: status || 'Confirmed'
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

module.exports = {
    createBooking,
    getUserBookings
};
