// In-memory live seat locks: showId -> Map(seat -> { userId, socketId, expires })
const TTL = (Number(process.env.SEAT_LOCK_MINUTES) || 5) * 60 * 1000;
const MAX_SEATS = 10;
const store = new Map();

const dropExpired = (m) => {
  const now = Date.now();
  for (const [seat, v] of m) if (v.expires <= now) m.delete(seat);
};

exports.list = (showId) => {
  const m = store.get(showId);
  if (!m) return [];
  dropExpired(m);
  return [...m].map(([seat, v]) => ({ seat, userId: v.userId, expires: v.expires }));
};

exports.lock = (showId, seat, userId, socketId) => {
  let m = store.get(showId);
  if (!m) store.set(showId, (m = new Map()));
  dropExpired(m);
  const current = m.get(seat);
  if (current && current.userId !== userId) return { ok: false, error: 'Someone else is selecting this seat' };
  const mine = [...m.values()].filter((v) => v.userId === userId).length;
  if (!current && mine >= MAX_SEATS) return { ok: false, error: `You can select at most ${MAX_SEATS} seats` };
  m.set(seat, { userId, socketId, expires: Date.now() + TTL });
  return { ok: true };
};

exports.unlock = (showId, seat, userId) => {
  const m = store.get(showId);
  const cur = m && m.get(seat);
  if (cur && cur.userId === userId) {
    m.delete(seat);
    return true;
  }
  return false;
};

exports.isLockedBy = (showId, seat, userId) => {
  const m = store.get(showId);
  const cur = m && m.get(seat);
  return !!cur && cur.userId === userId && cur.expires > Date.now();
};

// release all locks of one socket (optionally only inside one show); returns the touched show ids
exports.releaseSocket = (socketId, onlyShowId) => {
  const touched = [];
  for (const [id, m] of store) {
    if (onlyShowId && id !== onlyShowId) continue;
    let changed = false;
    for (const [seat, v] of m) {
      if (v.socketId === socketId) {
        m.delete(seat);
        changed = true;
      }
    }
    if (changed) touched.push(id);
  }
  return touched;
};

exports.clearSeats = (showId, seats) => {
  const m = store.get(showId);
  if (m) seats.forEach((s) => m.delete(s));
};

exports.purgeExpired = () => {
  const touched = [];
  for (const [id, m] of store) {
    const before = m.size;
    dropExpired(m);
    if (m.size !== before) touched.push(id);
  }
  return touched;
};
