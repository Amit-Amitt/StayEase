const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
    id: String, // e.g. deluxe-suite
    name: String,
    description: String,
    beds: String,
    capacity: Number,
    price: Number
});

const reviewSchema = new mongoose.Schema({
    id: String,
    user: String,
    comment: String,
    rating: Number,
    date: String // using string as per mock data "2026-02-14"
});

const hotelSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // The string ID from frontend e.g., 'azure-bay'
    name: String,
    location: String,
    city: String,
    rating: Number,
    reviewsCount: Number,
    pricePerNight: Number,
    description: String,
    longDescription: String,
    amenities: [String],
    images: [String],
    featured: Boolean,
    stars: Number,
    roomTypes: [roomTypeSchema],
    reviews: [reviewSchema]
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
