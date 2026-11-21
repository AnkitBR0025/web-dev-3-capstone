import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function SeatMap() {
  const { showId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [booked, setBooked] = useState([]);
  const [locks, setLocks] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/shows/${showId}`)
      .then((d) => {
        setShow(d.show);
        setBooked(d.show.bookedSeats);
      })
      .catch((e) => setError(e.message));
  }, [showId]);

  // live updates through Socket.IO
  useEffect(() => {
    if (!socket) return undefined;
    const onLocks = (d) => d.showId === showId && setLocks(d.locks);
    const onBooked = (d) => d.showId === showId && setBooked((b) => [...new Set([...b, ...d.seats])]);
    const onReleased = (d) => d.showId === showId && setBooked((b) => b.filter((s) => !d.seats.includes(s)));
    const join = () => socket.emit('joinShow', showId);

    socket.on('locks', onLocks);
    socket.on('seatsBooked', onBooked);
    socket.on('seatsReleased', onReleased);
    socket.on('connect', join);
    if (socket.connected) join();

    return () => {
      socket.emit('leaveShow', showId);
      socket.off('locks', onLocks);
      socket.off('seatsBooked', onBooked);
      socket.off('seatsReleased', onReleased);
      socket.off('connect', join);
    };
  }, [socket, showId]);

  if (error && !show) return <p className="error">{error}</p>;
  if (!show) return <p className="muted">Loading…</p>;

  const mine = locks.filter((l) => l.userId === user.id).map((l) => l.seat);
  const others = locks.filter((l) => l.userId !== user.id).map((l) => l.seat);
  const rows = Array.from({ length: show.screen.rows }, (_, r) => String.fromCharCode(65 + r));
  const cols = Array.from({ length: show.screen.seatsPerRow }, (_, c) => c + 1);

  const toggle = (seat) => {
    if (!socket || booked.includes(seat) || others.includes(seat)) return;
    setError('');
    socket.emit(mine.includes(seat) ? 'unlockSeat' : 'lockSeat', { showId, seat }, (res) => {
      if (res && res.error) setError(res.error);
    });
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/bookings', { method: 'POST', body: { showId, seats: mine } });
      navigate('/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const status = (seat) => (booked.includes(seat) ? 'booked' : mine.includes(seat) ? 'mine' : others.includes(seat) ? 'taken' : 'free');

  return (
    <>
      <h1>{show.movie.title}</h1>
      <p className="muted">
        {show.theatre.name}, {show.theatre.city} · {show.screen.name} · {new Date(show.startTime).toLocaleString()}
      </p>

      <div className="screen-glow">Screen this way</div>
      <div className="seatmap">
        {rows.map((r) => (
          <div className="seat-row" key={r}>
            <span className="row-label">{r}</span>
            {cols.map((c) => {
              const seat = `${r}${c}`;
              const st = status(seat);
              return (
                <button
                  key={seat}
                  className={`seat ${st}`}
                  disabled={st === 'booked' || st === 'taken'}
                  onClick={() => toggle(seat)}
                  title={`${seat} (${st})`}
                  aria-label={`Seat ${seat}, ${st}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <span><i className="seat free" /> Available</span>
        <span><i className="seat mine" /> Yours</span>
        <span><i className="seat taken" /> Held by someone</span>
        <span><i className="seat booked" /> Booked</span>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="bar card">
        <div>
          <strong>{mine.length ? mine.join(', ') : 'No seats selected'}</strong>
          <p className="muted">Total ₹{mine.length * show.price}. Seats you pick are held for a few minutes.</p>
        </div>
        <button className="btn" disabled={!mine.length || busy} onClick={confirm}>
          {busy ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </>
  );
}
