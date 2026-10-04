const Hotel = require('../models/Hotel');
const User = require('../models/User');
const mongoose = require('mongoose');
const { canManageHotel } = require('../middleware/authMiddleware');

const findHotel = (id) => Hotel.findOne({
    $or: [
        { id },
        { _id: /^[0-9a-fA-F]{24}$/.test(id) ? id : null }
    ]
});

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
const getHotels = async (req, res) => {
    try {
        const { location, featured, minPrice, maxPrice, stars, amenities } = req.query;
        let query = {};

        if (location) {
            query.$or = [
                { location: { $regex: location, $options: 'i' } },
                { city: { $regex: location, $options: 'i' } },
                { name: { $regex: location, $options: 'i' } }
            ];
        }

        if (featured === 'true') {
            query.featured = true;
        }

        if (minPrice || maxPrice) {
            query.pricePerNight = {};
            if (minPrice) query.pricePerNight.$gte = Number(minPrice);
            if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
        }

        if (stars) {
            const starsArray = stars.split(',').map(Number);
            query.stars = { $in: starsArray };
        }

        if (amenities) {
            const amenitiesArray = amenities.split(',');
            query.amenities = { $all: amenitiesArray };
        }

        const hotels = await Hotel.find(query);
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = async (req, res) => {
    try {
        // Find by custom 'id' mapped from frontend strings, or _id
        const hotel = await findHotel(req.params.id);
        if (hotel) {
            res.json(hotel);
        } else {
            res.status(404).json({ message: 'Hotel not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private/Admin
const createHotel = async (req, res) => {
    try {
        const hotel = new Hotel({
            id: req.body.id || req.body.name.toLowerCase().replace(/ /g, '-'),
            name: req.body.name,
            location: req.body.location,
            city: req.body.city,
            rating: req.body.rating || 0,
            reviewsCount: 0,
            pricePerNight: req.body.pricePerNight,
            description: req.body.description,
            longDescription: req.body.longDescription || req.body.description,
            amenities: req.body.amenities || [],
            images: req.body.images || [],
            featured: req.body.featured || false,
            stars: req.body.stars || 1,
            roomTypes: req.body.roomTypes || []
        });

        if (req.user.role === 'HOTEL_OWNER') hotel.ownerId = req.user._id;

        const createdHotel = await hotel.save();
        res.status(201).json(createdHotel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
const updateHotel = async (req, res) => {
    try {
        const hotel = await findHotel(req.params.id);

        if (hotel) {
            if (!canManageHotel(req.user, hotel)) {
                return res.status(403).json({ message: 'You do not manage this hotel' });
            }
            const editableFields = [
                'id', 'name', 'location', 'city', 'rating', 'pricePerNight',
                'description', 'longDescription', 'amenities', 'images',
                'featured', 'stars', 'roomTypes', 'reviews'
            ];
            for (const field of editableFields) {
                if (Object.hasOwn(req.body, field)) hotel[field] = req.body[field];
            }
            const updatedHotel = await hotel.save();
            res.json(updatedHotel);
        } else {
            res.status(404).json({ message: 'Hotel not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
const deleteHotel = async (req, res) => {
    try {
        const hotel = await findHotel(req.params.id);

        if (hotel) {
            if (!canManageHotel(req.user, hotel)) {
                return res.status(403).json({ message: 'You do not manage this hotel' });
            }
            await hotel.deleteOne();
            res.json({ message: 'Hotel removed' });
        } else {
            res.status(404).json({ message: 'Hotel not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const setHotelStaff = async (req, res) => {
    if (!mongoose.isValidObjectId(req.body.userId)) {
        return res.status(400).json({ message: 'Invalid staff user id' });
    }
    const hotel = await findHotel(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    if (!canManageHotel(req.user, hotel) || req.user.role === 'STAFF') {
        return res.status(403).json({ message: 'You cannot manage staff for this hotel' });
    }

    const staffUser = await User.findById(req.body.userId);
    if (!staffUser || staffUser.role?.toUpperCase() !== 'STAFF') {
        return res.status(400).json({ message: 'The selected account must have the STAFF role' });
    }
    const staffIds = (hotel.staffIds || []).map(String);
    if (req.body.action === 'add' && !staffIds.includes(String(staffUser._id))) {
        hotel.staffIds.push(staffUser._id);
    } else if (req.body.action === 'remove') {
        hotel.staffIds = hotel.staffIds.filter((staffId) => String(staffId) !== String(staffUser._id));
    }
    await hotel.save();
    return res.json({ staffIds: hotel.staffIds });
};

module.exports = {
    getHotels,
    getHotelById,
    createHotel,
    updateHotel,
    deleteHotel,
    setHotelStaff
};
