const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.signAccess = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_EXPIRES || '30m' });

exports.signRefresh = (u) =>
  jwt.sign({ id: u._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES || '7d' });

// we store only a hash of the refresh token in the database
exports.hash = (t) => crypto.createHash('sha256').update(t).digest('hex');
