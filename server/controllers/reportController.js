const Booking = require('../models/Booking');
const Theatre = require('../models/Theatre');
const asyncHandler = require('../utils/asyncHandler');

// theatre admin sees only his own theatres, super admin sees everything
const base = async (user) => {
  const stages = [
    { $match: { status: 'confirmed' } },
    { $lookup: { from: 'shows', localField: 'show', foreignField: '_id', as: 'show' } },
    { $unwind: '$show' },
  ];
  if (user.role !== 'superAdmin') {
    const ids = await Theatre.find({ admin: user._id }).distinct('_id');
    stages.push({ $match: { 'show.theatre': { $in: ids } } });
  }
  return stages;
};

// GET /api/reports/movies  -> collection per movie
exports.byMovie = asyncHandler(async (req, res) => {
  const report = await Booking.aggregate([
    ...(await base(req.user)),
    {
      $group: {
        _id: '$show.movie',
        bookings: { $sum: 1 },
        tickets: { $sum: { $size: '$seats' } },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
    { $unwind: '$movie' },
    { $project: { _id: 0, movieId: '$_id', title: '$movie.title', bookings: 1, tickets: 1, revenue: 1 } },
    { $sort: { revenue: -1 } },
  ]);
  res.json({ success: true, report });
});

// GET /api/reports/shows  -> collection per show
exports.byShow = asyncHandler(async (req, res) => {
  const report = await Booking.aggregate([
    ...(await base(req.user)),
    {
      $group: {
        _id: '$show._id',
        movie: { $first: '$show.movie' },
        theatre: { $first: '$show.theatre' },
        startTime: { $first: '$show.startTime' },
        bookings: { $sum: 1 },
        tickets: { $sum: { $size: '$seats' } },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $lookup: { from: 'movies', localField: 'movie', foreignField: '_id', as: 'movie' } },
    { $unwind: '$movie' },
    { $lookup: { from: 'theatres', localField: 'theatre', foreignField: '_id', as: 'theatre' } },
    { $unwind: '$theatre' },
    {
      $project: {
        _id: 0,
        showId: '$_id',
        title: '$movie.title',
        theatre: '$theatre.name',
        startTime: 1,
        bookings: 1,
        tickets: 1,
        revenue: 1,
      },
    },
    { $sort: { startTime: -1 } },
  ]);
  res.json({ success: true, report });
});
