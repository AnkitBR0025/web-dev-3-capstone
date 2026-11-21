const AppError = require('../utils/AppError');

// RBAC: authorize('superAdmin', 'theatreAdmin')
exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('Forbidden: you do not have permission', 403));
