const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { parseAllowedOrigins } = require('../config/env');
const {
    register,
    verifyEmail,
    resendVerification,
    login,
    googleLogin,
    refresh,
    logout,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const router = express.Router();
const password = z.string().min(8).max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must not exceed 72 UTF-8 bytes'
});
const protectCookieEndpoint = (req, res, next) => {
    const origin = req.get('origin');
    if (origin && process.env.NODE_ENV === 'production' && !parseAllowedOrigins(process.env.ALLOWED_ORIGINS).includes(origin)) {
        return res.status(403).json({ message: 'Origin is not allowed' });
    }
    return next();
};
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const schemas = {
    register: z.object({
        name: z.string().trim().min(2).max(80),
        email,
        password
    }).strict(),
    login: z.object({
        email,
        password: z.string().min(1).max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
            message: 'Password must not exceed 72 UTF-8 bytes'
        })
    }).strict(),
    google: z.object({ credential: z.string().min(1).max(8192) }).strict(),
    email: z.object({ email }).strict(),
    token: z.object({ token: z.string().min(32).max(256) }).strict(),
    reset: z.object({ token: z.string().min(32).max(256), password }).strict()
};

router.post('/register', validate(schemas.register), register);
router.post('/verify-email', validate(schemas.token), verifyEmail);
router.post('/resend-verification', validate(schemas.email), resendVerification);
router.post('/login', validate(schemas.login), login);
router.post('/google', validate(schemas.google), googleLogin);
router.post('/refresh', protectCookieEndpoint, refresh);
router.post('/logout', protectCookieEndpoint, logout);
router.post('/forgot-password', validate(schemas.email), forgotPassword);
router.post('/reset-password', validate(schemas.reset), resetPassword);

module.exports = router;
