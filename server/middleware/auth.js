const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Protected route: needs a valid access token
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Not authenticated. Please login.', 401);
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await User.findById(payload.id);
  if (!user) throw new AppError('User no longer exists', 401);
  req.user = user;
  next();
});
