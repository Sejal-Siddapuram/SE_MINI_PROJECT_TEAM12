
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { CLIENT_ORIGIN } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Shared middleware
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    },
  });
});

// Module routes
app.use('/api/auth', require('./routes/authRoutes')); // FR-01, FR-02 - Sejal
app.use('/api/listings', require('./routes/listingRoutes')); // FR-07 - Sagar
app.use('/api/listings', require('./routes/searchRoutes')); // FR-04 - Sampath
app.use('/api/recruiter', require('./routes/recruiterRoutes')); // FR-07 - Sagar
app.use('/api/admin', require('./routes/adminRoutes')); // FR-10 - Saiesh

// Error handling (must stay last)
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
