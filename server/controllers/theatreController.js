const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Show = require('../models/Show');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// a theatre admin can only touch his own theatres; super admin can touch all
const assertOwner = (theatre, user) => {
  if (user.role !== 'superAdmin' && String(theatre.admin) !== String(user._id)) {
    throw new AppError('You can manage only your own theatres', 403);
  }
};
exports.assertOwner = assertOwner;

exports.list = asyncHandler(async (req, res) => {
  const theatres = await Theatre.find().populate('admin', 'name email').sort({ name: 1 });
  res.json({ success: true, theatres });
});

exports.mine = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'superAdmin' ? {} : { admin: req.user._id };
  const theatres = await Theatre.find(filter).sort({ name: 1 });
  res.json({ success: true, theatres });
});

// blank strings mean "no value"
const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));

exports.create = asyncHandler(async (req, res) => {
  const { name, address, city, admin, latitude, longitude } = req.body;
  const owner = req.user.role === 'superAdmin' && admin ? admin : req.user._id;
  const theatre = await Theatre.create({
    name,
    address,
    city,
    admin: owner,
    latitude: num(latitude),
    longitude: num(longitude),
  });
  res.status(201).json({ success: true, theatre });
});

exports.update = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) throw new AppError('Theatre not found', 404);
  assertOwner(theatre, req.user);
  if (req.body.name !== undefined) theatre.name = req.body.name;
  if (req.body.address !== undefined) theatre.address = req.body.address;
  if (req.body.city !== undefined) theatre.city = req.body.city;
  if (req.body.latitude !== undefined) theatre.latitude = num(req.body.latitude);
  if (req.body.longitude !== undefined) theatre.longitude = num(req.body.longitude);
  await theatre.save();
  res.json({ success: true, theatre });
});

exports.remove = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) throw new AppError('Theatre not found', 404);
  assertOwner(theatre, req.user);
  if (await Show.exists({ theatre: theatre._id })) throw new AppError('Delete the shows of this theatre first', 400);
  await Screen.deleteMany({ theatre: theatre._id });
  await theatre.deleteOne();
  res.json({ success: true, message: 'Theatre deleted' });
});