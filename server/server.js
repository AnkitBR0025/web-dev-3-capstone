require('./config/env');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/theatre-admin-applications', require('./routes/theatreAdminApplicationRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/theatres', require('./routes/theatreRoutes'));
app.use('/api/screens', require('./routes/screenRoutes'));
app.use('/api/shows', require('./routes/showRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });
app.set('io', io);
require('./sockets/seatSocket')(io);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(async () => {
    await require('./models/Movie').syncIndexes(); // drops the old text index
  })
  .then(() => server.listen(PORT, () => console.log(`MovieTime API running on port ${PORT}`)))
  .catch((e) => {
    console.error('Database connection failed:', e.message);
    process.exit(1);
  });
