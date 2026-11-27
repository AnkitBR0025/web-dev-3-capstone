const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seats: { type: [String], validate: [(v) => v.length > 0, 'Select at least one seat'] },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking'] },
    ticketCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    cancelledAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
