const Screen = require('../models/Screen');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { assertOwner } = require('./theatreController');

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.theatre ? { theatre: req.query.theatre } : {};
  const screens = await Screen.find(filter).sort({ name: 1 });
  res.json({ success: true, screens });
});

// screens of the theatres this admin owns (all screens for super admin)
exports.mine = asyncHandler(async (req, res) => {
  const tFilter = req.user.role === 'superAdmin' ? {} : { admin: req.user._id };
  const ids = await Theatre.find(tFilter).distinct('_id');
  const screens = await Screen.find({ theatre: { $in: ids } }).populate('theatre', 'name city').sort({ name: 1 });
  res.json({ success: true, screens });
});

exports.create = asyncHandler(async (req, res) => {
  const { theatre, name, rows, seatsPerRow } = req.body;
  const t = await Theatre.findById(theatre);
  if (!t) throw new AppError('Theatre not found', 404);
  assertOwner(t, req.user);
  const screen = await Screen.create({ theatre, name, rows, seatsPerRow });
  res.status(201).json({ success: true, screen });
});

exports.remove = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.id).populate('theatre');
  if (!screen) throw new AppError('Screen not found', 404);
  assertOwner(screen.theatre, req.user);
  if (await Show.exists({ screen: screen._id })) throw new AppError('Delete the shows on this screen first', 400);
  await screen.deleteOne();
  res.json({ success: true, message: 'Screen deleted' });
});
