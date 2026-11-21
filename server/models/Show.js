const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    startTime: { type: Date, required: [true, 'Start time is required'] },
    price: { type: Number, required: [true, 'Ticket price is required'], min: [0, 'Price cannot be negative'] },
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true }
);

// fast lookup of upcoming shows for a movie
showSchema.index({ movie: 1, startTime: 1 });

module.exports = mongoose.model('Show', showSchema);
