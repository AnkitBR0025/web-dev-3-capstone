const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Theatre name is required'], trim: true },
    address: { type: String, trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // optional map position, used by the "theatres near me" feature
    latitude: { type: Number, min: [-90, 'Latitude must be between -90 and 90'], max: [90, 'Latitude must be between -90 and 90'] },
    longitude: { type: Number, min: [-180, 'Longitude must be between -180 and 180'], max: [180, 'Longitude must be between -180 and 180'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);