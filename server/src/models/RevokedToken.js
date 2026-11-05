const mongoose = require('mongoose');

/**
 * RevokedToken (SAD 4.1, SR-04)
 * Tokens that were logged out before their expiry. MongoDB deletes each entry
 * automatically once the token would have expired anyway (TTL index).
 */
const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);
