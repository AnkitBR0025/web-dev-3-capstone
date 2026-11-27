const mongoose = require('mongoose');

const theatreAdminApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: { type: String, required: true, trim: true },
    theatreName: { type: String, required: true, trim: true },
    theatreAddress: { type: String, required: true, trim: true },
    theatreCity: { type: String, required: true, trim: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },
    status: {
      type: String,
      enum: ['pending', 'approving', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('TheatreAdminApplication', theatreAdminApplicationSchema);
