const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { CLIENT_ORIGIN } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Shared middleware chain (SAD 3.5 / 3.9) ----
app.use(helmet()); // secure HTTP headers
app.use(cors({ origin: CLIENT_ORIGIN })); // only our front end may call the API
app.use(express.json({ limit: '100kb' })); // JSON bodies, size-limited
app.use(morgan('dev')); // request logging (never logs bodies/passwords)

// ---- Health check (NFR-04) ----
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

// ---- Module routes: each module owner registers their router here ----
app.use('/api/auth', require('./routes/authRoutes')); // FR-01, FR-02 - Sejal
app.use('/api/listings', require('./routes/listingRoutes')); // FR-07 - Sagar
app.use('/api/recruiter', require('./routes/recruiterRoutes')); // FR-07 - Sagar

// ---- Errors (must stay last) ----
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
