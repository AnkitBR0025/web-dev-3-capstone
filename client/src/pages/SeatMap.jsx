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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentSuccess, setPaymentSuccess] = useState(null);

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

  const confirm = () => {
    if (mine.length) {
      setError('');
      setPaymentOpen(true);
    }
  };

  const payAndConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const result = await api('/bookings', {
        method: 'POST',
        body: { showId, seats: mine, paymentMethod },
      });
      setPaymentOpen(false);
      setPaymentSuccess(result.booking);
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

      {error && !paymentOpen && <p className="error">{error}</p>}
      <div className="bar card">
        <div>
          <strong>{mine.length ? mine.join(', ') : 'No seats selected'}</strong>
          <p className="muted">Total ₹{mine.length * show.price}. Seats are held for a few minutes.</p>
        </div>
        <button className="btn" disabled={!mine.length || busy} onClick={confirm}>
          Confirm seats
        </button>
      </div>

      {paymentOpen && (
        <div className="payment-backdrop" onClick={() => !busy && setPaymentOpen(false)}>
          <section
            className="payment-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-heading">
              <div>
                <p className="eyebrow">COMPLETE YOUR CHECKOUT</p>
                <h2 id="payment-title">Choose a payment method</h2>
              </div>
              <button
                className="payment-close"
                type="button"
                aria-label="Close payment options"
                disabled={busy}
                onClick={() => setPaymentOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="muted payment-note">Demo checkout only — no real payment will be taken.</p>
            <div className="payment-methods" role="group" aria-label="Payment method">
              {[
                { id: 'upi', name: 'UPI', detail: 'Pay with UPI' },
                { id: 'card', name: 'Card', detail: 'Credit or debit card' },
                { id: 'netbanking', name: 'Net banking', detail: 'Pay through your bank' },
              ].map((method) => (
                <button
                  className={`payment-method${paymentMethod === method.id ? ' selected' : ''}`}
                  key={method.id}
                  type="button"
                  autoFocus={paymentMethod === method.id}
                  aria-pressed={paymentMethod === method.id}
                  disabled={busy}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <span className="payment-radio" aria-hidden="true" />
                  <span>
                    <strong>{method.name}</strong>
                    <small>{method.detail}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="payment-summary">
              <span>{mine.length} {mine.length === 1 ? 'seat' : 'seats'} · {mine.join(', ')}</span>
              <strong>₹{mine.length * show.price}</strong>
            </div>
            {error && <p className="error payment-error" role="alert">{error}</p>}
            <div className="payment-actions">
              <button
                className="btn ghost"
                type="button"
                disabled={busy}
                onClick={() => setPaymentOpen(false)}
              >
                Back to seats
              </button>
              <button className="btn" type="button" disabled={busy || !mine.length} onClick={payAndConfirm}>
                {busy ? 'Processing payment…' : `Pay ₹${mine.length * show.price}`}
              </button>
            </div>
          </section>
        </div>
      )}

      {paymentSuccess && (
        <div className="payment-backdrop">
          <section
            className="payment-dialog payment-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
          >
            <span className="payment-success-icon" aria-hidden="true">✓</span>
            <p className="eyebrow">PAYMENT SUCCESSFUL</p>
            <h2 id="payment-success-title">Your ticket is booked!</h2>
            <p className="muted">Your demo payment is confirmed and your ticket has been issued.</p>
            <div className="payment-summary confirmation-summary">
              <span>
                {paymentSuccess.seats.join(', ')}
                <small>Ticket code: {paymentSuccess.ticketCode}</small>
              </span>
              <strong>₹{paymentSuccess.totalAmount}</strong>
            </div>
            <button className="btn confirmation-action" type="button" onClick={() => navigate('/bookings')}>
              View my ticket
            </button>
          </section>
        </div>
      )}
    </>
  );
}
