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

  // Keep the original demo data for a completely empty database.
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

  // Recent Indian films selected from 2026 India box-office charts (28 Nov 2026).
  // Durations are practical sample values; update them if you verify official runtimes.
  // Poster is left blank so the UI uses its built-in title fallback until an image URL is added.
  const indianMovies = [
    { title: 'Dhurandhar 2: The Revenge', description: 'A high-stakes Hindi action thriller packed with espionage, conflict and revenge.', duration: 165, genre: 'Action, Thriller', language: 'Hindi' },
    { title: 'Ramayana', description: 'A grand Indian mythological epic inspired by the timeless Ramayana.', duration: 180, genre: 'Mythological, Drama', language: 'Hindi' },
    { title: 'Jailer 2', description: 'A Tamil action entertainer featuring crime, family and larger-than-life confrontations.', duration: 165, genre: 'Action, Crime', language: 'Tamil' },
    { title: 'Drishyam 3: The Conclusion', description: 'A suspenseful family crime drama where secrets and clever plans collide.', duration: 155, genre: 'Mystery, Thriller', language: 'Hindi' },
    { title: 'Hanuman Ansh', description: 'A devotional action-fantasy inspired by Indian mythology and heroism.', duration: 145, genre: 'Action, Fantasy', language: 'Hindi' },
    { title: 'Border 2', description: 'A patriotic Indian war drama about courage, duty and sacrifice.', duration: 170, genre: 'War, Action, Drama', language: 'Hindi' },
    { title: 'Toxic', description: 'A gritty Kannada crime-action drama set in a dangerous underworld.', duration: 160, genre: 'Crime, Action', language: 'Kannada' },
    { title: 'Peddi', description: 'A Telugu action drama rooted in local rivalries, ambition and determination.', duration: 155, genre: 'Action, Drama', language: 'Telugu' },
    { title: 'Mirzapur The Movie', description: 'A crime drama bringing the power struggles of Mirzapur to the big screen.', duration: 155, genre: 'Crime, Thriller', language: 'Hindi' },
    { title: 'Mana ShankaraVaraprasad Garu', description: 'A Telugu family entertainer blending comedy, action and emotion.', duration: 150, genre: 'Comedy, Drama', language: 'Telugu' },
    { title: 'Jana Nayagan', description: 'A Tamil action drama centred on leadership, courage and public life.', duration: 160, genre: 'Action, Drama', language: 'Tamil' },
    { title: 'Karuppu', description: 'A Tamil action-fantasy with an intense hero, conflict and supernatural elements.', duration: 150, genre: 'Action, Fantasy', language: 'Tamil' },
    { title: 'Irumudi', description: 'A Telugu action drama drawing on faith, personal struggle and determination.', duration: 145, genre: 'Drama, Action', language: 'Telugu' },
    { title: 'Bhooth Bangla', description: 'A Hindi horror-comedy built around a mysterious house and unexpected laughs.', duration: 145, genre: 'Horror, Comedy', language: 'Hindi' },
    { title: 'Dhamaal 4', description: 'A Hindi comedy adventure full of chaos, friendship and comic misadventures.', duration: 140, genre: 'Comedy, Adventure', language: 'Hindi' },
    { title: 'Bethlehem Kudumba Unit', description: 'A Malayalam family entertainer exploring relationships and everyday humour.', duration: 140, genre: 'Family, Comedy', language: 'Malayalam' },
    { title: 'Scene', description: 'A Tamil thriller built around a tense mystery and unexpected turns.', duration: 135, genre: 'Thriller, Drama', language: 'Tamil' },
    { title: 'Awarapan 2', description: 'A Hindi romantic action drama about love, sacrifice and redemption.', duration: 150, genre: 'Romance, Action', language: 'Hindi' },
    { title: 'The Raja Saab', description: 'A Telugu horror-comedy mixing supernatural mystery with humour.', duration: 155, genre: 'Horror, Comedy', language: 'Telugu' },
    { title: 'Welcome To The Jungle', description: 'A Hindi ensemble comedy adventure with an action-packed jungle setting.', duration: 145, genre: 'Comedy, Adventure', language: 'Hindi' },
  ];

  let addedMovies = 0;
  for (const movie of indianMovies) {
    const existing = await Movie.findOne({ title: movie.title });
    if (!existing) {
      await Movie.create({ ...movie, createdBy: superAdmin._id });
      addedMovies += 1;
    }
  }
  console.log(`Added ${addedMovies} new Indian movies (duplicates skipped).`);

  console.log('Seed complete.\n  superAdmin: super@movietime.com / Super@123\n  theatreAdmin: admin@movietime.com / Admin@123\n  user: user@movietime.com / User@123');
  await mongoose.disconnect();
})();
