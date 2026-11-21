const jwt = require('jsonwebtoken');
const Show = require('../models/Show');
const locks = require('./seatLocks');
const { isValidSeat } = require('../utils/seats');

const room = (id) => `show:${id}`;
const push = (io, showId) => io.to(room(showId)).emit('locks', { showId, locks: locks.list(showId) });

module.exports = (io) => {
  // only logged-in users can connect
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_ACCESS_SECRET);
      socket.data.userId = String(payload.id);
      next();
    } catch (e) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    socket.on('joinShow', (showId) => {
      socket.join(room(showId));
      socket.emit('locks', { showId, locks: locks.list(showId) });
    });

    socket.on('leaveShow', (showId) => {
      socket.leave(room(showId));
      if (locks.releaseSocket(socket.id, showId).length) push(io, showId);
    });

    socket.on('lockSeat', async ({ showId, seat } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const show = await Show.findById(showId).populate('screen');
        if (!show) return reply({ error: 'Show not found' });
        if (show.startTime <= new Date()) return reply({ error: 'This show has already started' });
        if (!isValidSeat(show.screen, seat)) return reply({ error: 'Invalid seat' });
        if (show.bookedSeats.includes(seat)) return reply({ error: 'Seat is already booked' });
        const result = locks.lock(String(showId), seat, userId, socket.id);
        if (!result.ok) return reply({ error: result.error });
        push(io, String(showId));
        reply({ ok: true });
      } catch (e) {
        reply({ error: 'Could not select this seat' });
      }
    });

    socket.on('unlockSeat', ({ showId, seat } = {}, ack) => {
      if (locks.unlock(String(showId), seat, userId)) push(io, String(showId));
      if (typeof ack === 'function') ack({ ok: true });
    });

    // closing the tab frees the seats immediately
    socket.on('disconnect', () => locks.releaseSocket(socket.id).forEach((id) => push(io, id)));
  });

  // expired holds are released and everybody is told
  setInterval(() => locks.purgeExpired().forEach((id) => push(io, id)), 15000);
};
