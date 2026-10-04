const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hotelId: {
        type: String, // String id from frontend 'azure-bay'
        required: true
    },
    hotelName: {
        type: String,
        required: true
    },
    roomTypeId: {
        type: String,
        required: true
    },
    checkIn: {
        type: String,
        required: true
    },
    checkOut: {
        type: String,
        required: true
    },
    guests: {
        type: Number,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    paymentProvider: {
        type: String,
        enum: ['RAZORPAY', 'PAYPAL'],
        required: function paymentProviderRequiredOnCreate() { return this.isNew; }
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID'],
        required: function paymentStatusRequiredOnCreate() { return this.isNew; }
    },
    paymentCurrency: {
        type: String,
        enum: ['USD', 'INR'],
        required: function paymentCurrencyRequiredOnCreate() { return this.isNew; }
    },
    paymentAmountSubunits: {
        type: Number,
        required: function paymentAmountRequiredOnCreate() { return this.isNew; }
    },
    razorpayOrderId: {
        type: String,
        unique: true,
        sparse: true
    },
    razorpayPaymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    paypalOrderId: {
        type: String,
        unique: true,
        sparse: true
    },
    paypalCaptureId: {
        type: String,
        unique: true,
        sparse: true
    },
    paidAt: Date,
    status: {
        type: String,
        default: 'Pending Payment'
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
