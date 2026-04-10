const express = require('express');
const path = require('node:path');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Connect to db
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set up routes (will be imported later)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to StayEase API' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../client/dist');
    app.use(express.static(distPath));

    app.get(/^(?!\/api).*/, (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
