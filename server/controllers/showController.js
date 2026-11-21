const Show = require('../models/Show');
const Screen = require('../models/Screen');
const Theatre = require('../models/Theatre');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { assertOwner } = require('./theatreController');

const populate = (q) =>
  q.populate('movie', 'title poster duration language genre').populate('screen', 'name rows seatsPerRow').populate('theatre', 'name city');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.movie) filter.movie = req.query.movie;
  if (req.query.theatre) filter.theatre = req.query.theatre;
  if (req.query.upcoming === 'true') filter.startTime = { $gte: new Date() };
  const shows = await populate(Show.find(filter).sort({ startTime: 1 }));
  res.json({ success: true, shows });
});

// all shows (including past ones) of the admin's theatres
exports.manage = asyncHandler(async (req, res) => {
  const tFilter = req.user.role === 'superAdmin' ? {} : { admin: req.user._id };
  const ids = await Theatre.find(tFilter).distinct('_id');
  const shows = await populate(Show.find({ theatre: { $in: ids } }).sort({ startTime: -1 }));
  res.json({ success: true, shows });
});

exports.get = asyncHandler(async (req, res) => {
  const show = await populate(Show.findById(req.params.id));
  if (!show) throw new AppError('Show not found', 404);
  res.json({ success: true, show });
});

exports.create = asyncHandler(async (req, res) => {
  const { movie, screen, startTime, price } = req.body;
  const scr = await Screen.findById(screen).populate('theatre');
  if (!scr) throw new AppError('Screen not found', 404);
  assertOwner(scr.theatre, req.user);
  if (new Date(startTime) <= new Date()) throw new AppError('Show time must be in the future', 400);
  const show = await Show.create({ movie, screen, theatre: scr.theatre._id, startTime, price });
  res.status(201).json({ success: true, show });
});

exports.update = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate('theatre');
  if (!show) throw new AppError('Show not found', 404);
  assertOwner(show.theatre, req.user);
  if (req.body.startTime !== undefined) show.startTime = req.body.startTime;
  if (req.body.price !== undefined) show.price = req.body.price;
  await show.save();
  res.json({ success: true, show });
});

exports.remove = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate('theatre');
  if (!show) throw new AppError('Show not found', 404);
  assertOwner(show.theatre, req.user);
  if (await Booking.exists({ show: show._id, status: 'confirmed' })) throw new AppError('This show already has confirmed bookings', 400);
  await show.deleteOne();
  res.json({ success: true, message: 'Show deleted' });
});
