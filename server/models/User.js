const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const refreshTokenSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: 80
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        minlength: 8,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    role: {
        type: String,
        enum: ['USER', 'HOTEL_OWNER', 'STAFF', 'ADMIN'],
        default: 'USER'
    },
    emailVerified: { type: Boolean, default: true },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    savedHotels: [{ type: String }]
}, { timestamps: true });

userSchema.pre('validate', function normalizeLegacyRole() {
    if (typeof this.role === 'string') {
        this.role = this.role.toUpperCase();
    }
    if (this.isNew && !this.password && !this.googleId) {
        this.invalidate('password', 'Please add a password or sign in with Google');
    }
});

userSchema.pre('save', async function hashPassword() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
