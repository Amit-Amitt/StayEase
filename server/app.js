const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { parseAllowedOrigins } = require('./config/env');

const app = express();
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.join(__dirname, '../client/dist');

app.set('trust proxy', 1);
app.use(cors({
    origin(origin, callback) {
        if (!origin || !isProduction) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.get('/api', (req, res) => res.json({ message: 'Welcome to StayEase API' }));
app.get('/api/health', (req, res) => res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
}));

if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use('/api', (req, res) => res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`
}));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
    console.error(`[Server Error] ${new Date().toISOString()}:`, err.stack || err.message);
    if (err.message === 'CORS origin not allowed') {
        return res.status(403).json({ message: 'Access denied: CORS origin not allowed.' });
    }
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Something went wrong on the server',
        error: isProduction ? null : err.stack
    });
});

module.exports = app;
