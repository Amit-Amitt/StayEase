const { createHash, randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasSmtpConfig, sendAuthEmail } = require('../services/emailService');
const { GoogleTokenError, verifyGoogleCredential } = require('../services/googleTokenService');

const REFRESH_COOKIE = 'stayease_refresh';
const REFRESH_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
let dummyPasswordHash;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const normalizeRole = (role) => (role || 'USER').toUpperCase();
const publicUser = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    emailVerified: user.emailVerified !== false
});

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_LIFETIME_MS
});

const getRefreshCookie = (req) => {
    const value = req.headers.cookie?.split(';').map((part) => part.trim())
        .find((part) => part.startsWith(`${REFRESH_COOKIE}=`))?.slice(REFRESH_COOKIE.length + 1);
    return value || null;
};

const createAccessToken = (user, sessionId) => jwt.sign(
    { id: user.id, role: normalizeRole(user.role), sid: sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'stayease' }
);

const setRefreshCookie = (res, token) => res.cookie(REFRESH_COOKIE, token, cookieOptions());
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth'
});

const createSession = async (user, res) => {
    const refreshToken = randomBytes(48).toString('base64url');
    const sessionId = hashToken(refreshToken);
    const now = Date.now();
    user.refreshTokens = (user.refreshTokens || []).filter((token) => token.expiresAt > now);
    user.refreshTokens.push({ tokenHash: sessionId, expiresAt: new Date(now + REFRESH_LIFETIME_MS) });
    if (user.refreshTokens.length > 10) user.refreshTokens = user.refreshTokens.slice(-10);
    await user.save();
    setRefreshCookie(res, refreshToken);
    return { token: createAccessToken(user, sessionId), user: publicUser(user) };
};

const authLink = (path, token) => {
    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    return `${baseUrl}/${path}?token=${encodeURIComponent(token)}`;
};

const sendVerification = async (user) => {
    const token = randomBytes(32).toString('hex');
    const url = authLink('verify-email', token);
    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    const sent = await sendAuthEmail({
        to: user.email,
        subject: 'Verify your StayEase email',
        text: `Verify your email within 24 hours: ${url}`,
        html: `<p>Verify your StayEase email within 24 hours.</p><p><a href="${url}">Verify email</a></p>`
    });
    return !sent && process.env.NODE_ENV !== 'production' ? url : undefined;
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.create({ name, email, password, role: 'USER', emailVerified: false });
        const verificationUrl = await sendVerification(user);
        res.status(201).json({
            message: 'Account created. Check your email to verify your account.',
            ...(verificationUrl ? { verificationUrl } : {})
        });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' });
        if (error.message === 'Email delivery is not configured') {
            return res.status(503).json({ message: 'Email delivery is not configured' });
        }
        console.error('Registration failed:', error.message);
        return res.status(500).json({ message: 'Unable to create your account' });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.body;
    const user = await User.findOne({
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: { $gt: new Date() }
    }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

    if (!user) return res.status(400).json({ message: 'Verification link is invalid or expired' });
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Email verified. You can now sign in.' });
};

const resendVerification = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    let verificationUrl;
    if (user && user.emailVerified === false) {
        verificationUrl = await sendVerification(user);
    }
    return res.json({
        message: 'If the account needs verification, a new link has been sent.',
        ...(verificationUrl ? { verificationUrl } : {})
    });
};

const login = async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    const passwordMatches = user?.password
        ? await user.matchPassword(req.body.password)
        : await bcrypt.compare(req.body.password, dummyPasswordHash || (dummyPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)));
    if (!user || !passwordMatches || user.emailVerified === false) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.json(await createSession(user, res));
};

const googleLogin = async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ message: 'Google sign-in is not configured' });
    }

    try {
        const { googleId, email, name } = await verifyGoogleCredential(req.body.credential, process.env.GOOGLE_CLIENT_ID);
        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.findOne({ email }).select('+googleId');
            if (user) {
                if (user.googleId && user.googleId !== googleId) {
                    return res.status(409).json({ message: 'This email is connected to a different Google account' });
                }
                user.googleId = googleId;
                user.emailVerified = true;
                await user.save();
            } else {
                user = await User.create({ name, email, googleId, role: 'USER', emailVerified: true });
            }
        }

        return res.json(await createSession(user, res));
    } catch (error) {
        if (error instanceof GoogleTokenError) {
            const status = error.code === 'unavailable' ? 503 : 401;
            return res.status(status).json({
                message: status === 503 ? 'Google sign-in is temporarily unavailable' : 'Google credential is invalid or expired'
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This Google account is already connected to another StayEase account' });
        }
        console.error('Google sign-in failed:', error.message);
        return res.status(500).json({ message: 'Unable to sign in with Google right now' });
    }
};

const refresh = async (req, res) => {
    const token = getRefreshCookie(req);
    if (!token) return res.status(401).json({ message: 'Refresh session is missing' });

    const tokenHash = hashToken(token);
    const now = new Date();
    const user = await User.findOne({
        refreshTokens: { $elemMatch: { tokenHash, expiresAt: { $gt: now } } }
    });
    if (!user) {
        return res.status(401).json({ message: 'Refresh session is invalid or expired' });
    }

    const refreshToken = randomBytes(48).toString('base64url');
    const nextExpiresAt = new Date(Date.now() + REFRESH_LIFETIME_MS);
    const rotation = await User.updateOne({
        _id: user._id,
        refreshTokens: { $elemMatch: { tokenHash, expiresAt: { $gt: now } } }
    }, {
        $set: {
            'refreshTokens.$.tokenHash': hashToken(refreshToken),
            'refreshTokens.$.expiresAt': nextExpiresAt
        }
    });
    if (rotation.modifiedCount !== 1) {
        return res.status(401).json({ message: 'Refresh session is invalid or expired' });
    }

    setRefreshCookie(res, refreshToken);
    return res.json({ token: createAccessToken(user, hashToken(refreshToken)), user: publicUser(user) });
};

const logout = async (req, res) => {
    const token = getRefreshCookie(req);
    if (token) {
        const user = await User.findOne({ 'refreshTokens.tokenHash': hashToken(token) });
        if (user) {
            user.refreshTokens = user.refreshTokens.filter((item) => item.tokenHash !== hashToken(token));
            await user.save();
        }
    }
    clearRefreshCookie(res);
    return res.status(204).end();
};

const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    let resetUrl;
    if (user) {
        const token = randomBytes(32).toString('hex');
        resetUrl = authLink('reset-password', token);
        user.passwordResetTokenHash = hashToken(token);
        user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        const sent = await sendAuthEmail({
            to: user.email,
            subject: 'Reset your StayEase password',
            text: `Reset your password within one hour: ${resetUrl}`,
            html: `<p>Reset your StayEase password within one hour.</p><p><a href="${resetUrl}">Reset password</a></p>`
        });
        if (sent || process.env.NODE_ENV === 'production') resetUrl = undefined;
    }
    return res.json({
        message: 'If an account exists for this email, password reset instructions have been sent.',
        ...(resetUrl && process.env.NODE_ENV !== 'production' && !hasSmtpConfig() ? { resetUrl } : {})
    });
};

const resetPassword = async (req, res) => {
    const user = await User.findOne({
        passwordResetTokenHash: hashToken(req.body.token),
        passwordResetExpiresAt: { $gt: new Date() }
    }).select('+password +passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) return res.status(400).json({ message: 'Password reset link is invalid or expired' });
    user.password = req.body.password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokens = [];
    await user.save();
    return res.json({ message: 'Password updated. Sign in with your new password.' });
};

module.exports = {
    register,
    verifyEmail,
    resendVerification,
    login,
    googleLogin,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    sendVerification
};
