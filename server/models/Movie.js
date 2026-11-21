const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    duration: { type: Number, required: [true, 'Duration (minutes) is required'], min: [1, 'Duration must be positive'] },
    language: { type: String, trim: true, default: 'English' },
    genre: { type: String, trim: true },
    poster: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);



module.exports = mongoose.model('Movie', movieSchema);
