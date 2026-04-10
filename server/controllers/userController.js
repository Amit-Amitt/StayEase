const User = require('../models/User');
const Hotel = require('../models/Hotel');

// @desc    Get user profile with populated saved hotels
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch saved hotels
        let savedHotelsData = [];
        if (user.savedHotels && user.savedHotels.length > 0) {
            // Need to match $or: [{id: in}, {_id: in}] to be robust
            const objIds = user.savedHotels.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
            
            savedHotelsData = await Hotel.find({
                $or: [
                    { id: { $in: user.savedHotels } },
                    { _id: { $in: objIds } }
                ]
            });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            savedHotels: user.savedHotels,
            savedHotelsData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
            user.email = req.body.email;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            savedHotels: updatedUser.savedHotels
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle save/unsave hotel
// @route   POST /api/users/save-hotel/:id
// @access  Private
const toggleSaveHotel = async (req, res) => {
    try {
        const hotelId = req.params.id; // Could be hex _id or custom string id
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.savedHotels) {
            user.savedHotels = [];
        }

        const isSaved = user.savedHotels.includes(hotelId);

        if (isSaved) {
            user.savedHotels = user.savedHotels.filter(id => id !== hotelId);
        } else {
            user.savedHotels.push(hotelId);
        }

        await user.save();

        res.json({
            message: isSaved ? 'Hotel removed from saved list' : 'Hotel saved successfully',
            savedHotels: user.savedHotels
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    toggleSaveHotel
};
