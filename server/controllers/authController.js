const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TheatreAdminApplication = require('../models/TheatreAdminApplication');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signAccess, signRefresh, hash } = require('../utils/token');

const issueTokens = async (user, res, status = 200, message) => {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  user.refreshToken = hash(refreshToken);
  await user.save();
  res.status(status).json({
    success: true,
    user,
    accessToken,
    refreshToken,
    ...(message ? { message } : {}),
  });
};

// POST /api/auth/register  (public registration always creates a normal user)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: 'user' });
  await issueTokens(user, res, 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);
  const application = await TheatreAdminApplication.findOne({ applicant: user._id }).select('status');
  if (application?.status === 'pending' || application?.status === 'approving') {
    throw new AppError('Your theatre admin application is pending super admin approval.', 403);
  }
  if (application?.status === 'rejected') {
    throw new AppError('Your theatre admin application was rejected. Contact the super admin for more information.', 403);
  }
  if (application?.status === 'approved' && user.role !== 'theatreAdmin') {
    throw new AppError('Your application is approved, but admin access is not ready yet. Please try again shortly.', 403);
  }

  const message = application?.status === 'approved'
    ? 'Your theatre admin application is approved. You can now manage your theatre.'
    : undefined;
  await issueTokens(user, res, 200, message);
});

// POST /api/auth/refresh  (rotates the refresh token)
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token is required', 400);
  const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(payload.id).select('+refreshToken');
  if (!user || user.refreshToken !== hash(refreshToken)) throw new AppError('Refresh token is not valid', 401);
  await issueTokens(user, res);
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save();
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => res.json({ success: true, user: req.user }));

// POST /api/auth/create-admin  (superAdmin only)
exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: 'theatreAdmin' });
  res.status(201).json({ success: true, user });
});
