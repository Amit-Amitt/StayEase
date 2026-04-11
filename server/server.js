const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const { parseAllowedOrigins, validateEnv } = require('./config/env');

const app = express();
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.join(__dirname, '../client/dist');

// Middleware
app.set('trust proxy', 1);
app.use(
    cors({
        origin(origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, or same-origin)
            if (!origin) return callback(null, true);

            // In development, allow all origins
            if (!isProduction) return callback(null, true);

            // In production, check against allowedOrigins
            if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('CORS origin not allowed'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
    })
);
app.use(express.json({ limit: '1mb' }));

// Set up routes (will be imported later)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to StayEase API' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Serve frontend in production
if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get(/^\/(?!api).*/, (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.use('/api', (req, res) => {
    res.status(404).json({
        message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
    // Log the error for internal debugging
    console.error(`[Server Error] ${new Date().toISOString()}:`);
    console.error(err.stack);

    // Handle specific CORS errors
    if (err.message === 'CORS origin not allowed') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied: CORS origin not allowed.',
            error: isProduction ? null : err.message
        });
    }

    // Default error response
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Something went wrong on the server',
        error: isProduction ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    validateEnv();
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
});
