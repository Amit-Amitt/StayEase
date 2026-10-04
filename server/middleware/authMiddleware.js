const jwt = require('jsonwebtoken');
const User = require('../models/User');

const roleName = (role) => (role || 'USER').toUpperCase();

const protect = async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: 'Not authorized, user no longer exists' });
        const activeSession = decoded.sid && user.refreshTokens?.some((session) =>
            session.tokenHash === decoded.sid && session.expiresAt > new Date()
        );
        if (!activeSession) return res.status(401).json({ message: 'Not authorized, session is no longer active' });
        user.role = roleName(user.role);
        req.user = user;
        return next();
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...allowedRoles) => (req, res, next) => {
    const role = roleName(req.user?.role);
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (!allowedRoles.map(roleName).includes(role)) {
        return res.status(403).json({ message: 'Not authorized for this resource' });
    }
    return next();
};

const canManageHotel = (user, hotel) => {
    if (!user || !hotel) return false;
    const role = roleName(user.role);
    if (role === 'ADMIN') return true;
    const userId = String(user._id || user.id);
    if (role === 'HOTEL_OWNER' && String(hotel.ownerId || '') === userId) return true;
    return role === 'STAFF' && (hotel.staffIds || []).some((staffId) => String(staffId) === userId);
};

const admin = authorize('ADMIN');

const optionalAuth = async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme === 'Bearer' && token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (req.user) req.user.role = roleName(req.user.role);
        } catch {
            req.user = null;
        }
    }
    return next();
};

module.exports = { protect, authorize, admin, canManageHotel, optionalAuth, roleName };
