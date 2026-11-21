import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  const load = () => api('/bookings/my').then((d) => setBookings(d.bookings)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setError('');
    try {
      await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1>My bookings</h1>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && !error && <p className="muted">You have not booked any tickets yet.</p>}
      <div className="list">
        {bookings.map((b) => {
          const upcoming = new Date(b.show.startTime) > new Date();
          return (
            <div className={`ticket ${b.status}`} key={b._id}>
              <div className="ticket-main">
                <h3>{b.show.movie.title}</h3>
                <p>{b.show.theatre.name}, {b.show.theatre.city} · {b.show.screen.name}</p>
                <p>{new Date(b.show.startTime).toLocaleString()}</p>
                <p>Seats: <strong>{b.seats.join(', ')}</strong> · ₹{b.totalAmount}</p>
              </div>
              <div className="ticket-stub">
                <span className="muted">Ticket code</span>
                <strong className="code">{b.ticketCode}</strong>
                {b.status === 'cancelled' ? (
                  <span className="badge">Cancelled</span>
                ) : (
                  upcoming && <button className="btn ghost" onClick={() => cancel(b._id)}>Cancel booking</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
