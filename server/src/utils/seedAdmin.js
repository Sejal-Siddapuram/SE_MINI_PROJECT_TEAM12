const User = require('../models/User');
const ROLES = require('./roles');
const { hashPassword } = require('../services/authService');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../config/env');

/**
 * Students register themselves (FR-01) and recruiters are onboarded by the TPO (BR-05),
 * so the very first TPO/Admin account has to be created by the system itself.
 */
async function ensureAdminExists() {
  if (await User.exists({ role: ROLES.ADMIN })) return;

  await User.create({
    name: 'TPO Admin',
    email: ADMIN_EMAIL,
    passwordHash: await hashPassword(ADMIN_PASSWORD),
    role: ROLES.ADMIN,
  });
  console.log(`[seed] Created default admin account: ${ADMIN_EMAIL}`);
}

module.exports = ensureAdminExists;
