const path = require('path');

// Load server/.env if it exists (values there override the defaults below)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'campusready-dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@campusready.edu',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@1234',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
