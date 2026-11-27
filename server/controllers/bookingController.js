const Booking = require('../models/Booking');
const Show = require('../models/Show');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const makeTicketCode = require('../utils/ticketCode');
const { isValidSeat } = require('../utils/seats');
const locks = require('../sockets/seatLocks');

const room = (id) => `show:${id}`;
const onlinePaymentMethods = new Set(['upi', 'card', 'netbanking']);

// POST /api/bookings   body: { showId, seats: ["A1","A2"] }
exports.create = asyncHandler(async (req, res) => {
  const { showId, paymentMethod } = req.body;
  const seats = Array.isArray(req.body.seats) ? [...new Set(req.body.seats)] : [];
  if (!showId || seats.length === 0) throw new AppError('showId and at least one seat are required', 400);
  if (seats.length > 10) throw new AppError('You can book at most 10 seats at once', 400);
  if (!onlinePaymentMethods.has(paymentMethod)) {
    throw new AppError('Choose a supported online demo payment method', 400);
  }

  const show = await Show.findById(showId).populate('screen');
  if (!show) throw new AppError('Show not found', 404);
  if (show.startTime <= new Date()) throw new AppError('This show has already started', 400);
  if (!seats.every((s) => isValidSeat(show.screen, s))) throw new AppError('One or more seats are invalid', 400);

  // every seat must be held by this user through the live seat lock
  const userId = String(req.user._id);
  if (!seats.every((s) => locks.isLockedBy(String(show._id), s, userId))) {
    throw new AppError('Your seat hold expired. Please select the seats again.', 409);
  }

  // atomic update: succeeds only if none of the seats is booked yet (prevents double booking)
  const updated = await Show.findOneAndUpdate(
    { _id: show._id, bookedSeats: { $nin: seats } },
    { $push: { bookedSeats: { $each: seats } } },
    { new: true }
  );
  if (!updated) throw new AppError('Some of these seats were just booked by someone else', 409);

  let booking;
  try {
    booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      seats,
      totalAmount: seats.length * show.price,
      paymentMethod,
      ticketCode: makeTicketCode(),
    });
  } catch (err) {
    await Show.updateOne({ _id: show._id }, { $pull: { bookedSeats: { $in: seats } } }); // roll back
    throw err;
  }

  const id = String(show._id);
  locks.clearSeats(id, seats);
  const io = req.app.get('io');
  io.to(room(id)).emit('seatsBooked', { showId: id, seats });
  io.to(room(id)).emit('locks', { showId: id, locks: locks.list(id) });

  res.status(201).json({ success: true, booking });
});

// GET /api/bookings/my
exports.my = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title poster' },
        { path: 'screen', select: 'name' },
        { path: 'theatre', select: 'name city' },
      ],
    });
  res.json({ success: true, bookings });
});

// PATCH /api/bookings/:id/cancel
exports.cancel = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('show');
  if (!booking) throw new AppError('Booking not found', 404);
  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'superAdmin') {
    throw new AppError('You can cancel only your own bookings', 403);
  }
  if (booking.status === 'cancelled') throw new AppError('Booking is already cancelled', 400);
  if (booking.show.startTime <= new Date()) throw new AppError('Cannot cancel after the show has started', 400);

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  await Show.updateOne({ _id: booking.show._id }, { $pull: { bookedSeats: { $in: booking.seats } } });

  req.app.get('io').to(room(booking.show._id)).emit('seatsReleased', { showId: String(booking.show._id), seats: booking.seats });
  res.json({ success: true, booking });
});
