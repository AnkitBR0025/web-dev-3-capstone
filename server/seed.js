// npm run seed  -> creates a super admin, a theatre admin and some sample data
require('./config/env');
const mongoose = require('mongoose');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const Screen = require('./models/Screen');
const Show = require('./models/Show');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const ensureUser = async (name, email, password, role) =>
    (await User.findOne({ email })) || User.create({ name, email, password, role });

  const superAdmin = await ensureUser('Super Admin', process.env.SUPERADMIN_EMAIL || 'super@movietime.com', process.env.SUPERADMIN_PASSWORD || 'Super@123', 'superAdmin');
  const admin = await ensureUser('Theatre Admin', 'admin@movietime.com', 'Admin@123', 'theatreAdmin');
  await ensureUser('Demo User', 'user@movietime.com', 'User@123', 'user');

  if (!(await Movie.countDocuments())) {
    const movies = await Movie.insertMany([
      { title: 'Midnight Express', description: 'A thriller on a night train.', duration: 128, genre: 'Thriller', language: 'English', createdBy: superAdmin._id },
      { title: 'Monsoon Melody', description: 'A musical love story set in Kerala.', duration: 142, genre: 'Romance', language: 'Hindi', createdBy: superAdmin._id },
    ]);
    const theatre = await Theatre.create({ name: 'Galaxy Cinemas', city: 'Gurugram', admin: admin._id, latitude: 28.4595, longitude: 77.0266 });
    const screen = await Screen.create({ theatre: theatre._id, name: 'Screen 1', rows: 6, seatsPerRow: 10 });
    const day = 24 * 60 * 60 * 1000;
    await Show.insertMany(
      movies.map((m, i) => ({
        movie: m._id,
        screen: screen._id,
        theatre: theatre._id,
        startTime: new Date(Date.now() + (i + 1) * day),
        price: 250 + i * 50,
      }))
    );
  }

  console.log('Seed complete.\n  superAdmin: super@movietime.com / Super@123\n  theatreAdmin: admin@movietime.com / Admin@123\n  user: user@movietime.com / User@123');
  await mongoose.disconnect();
})();
