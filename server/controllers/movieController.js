const Movie = require('../models/Movie');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const fields = ['title', 'description', 'duration', 'language', 'genre', 'poster'];
const pick = (body) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.q ? { title: new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {};
  const movies = await Movie.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, movies });
});

exports.get = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, movie });
});

exports.create = asyncHandler(async (req, res) => {
  const movie = await Movie.create({ ...pick(req.body), createdBy: req.user._id });
  res.status(201).json({ success: true, movie });
});

exports.update = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, movie });
});

exports.remove = asyncHandler(async (req, res) => {
  const Show = require('../models/Show');
  if (await Show.exists({ movie: req.params.id })) throw new AppError('Delete the shows of this movie first', 400);
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, message: 'Movie deleted' });
});
