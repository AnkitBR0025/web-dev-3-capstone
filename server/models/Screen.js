const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema(
  {
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    name: { type: String, required: [true, 'Screen name is required'], trim: true },
    rows: { type: Number, required: true, min: [1, 'At least 1 row'], max: [26, 'Max 26 rows'] },
    seatsPerRow: { type: Number, required: true, min: [1, 'At least 1 seat'], max: [30, 'Max 30 seats per row'] },
  },
  { timestamps: true }
);

screenSchema.index({ theatre: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Screen', screenSchema);
