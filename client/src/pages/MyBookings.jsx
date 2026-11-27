import { useEffect, useState } from 'react';
import { api } from '../api.js';

function paymentMethodLabel(method) {
  return ({ upi: 'UPI', card: 'Card', netbanking: 'Net banking' })[method] || '';
}

async function downloadTicket(booking) {
  const { jsPDF } = await import('jspdf');
  const { default: QRCode } = await import('qrcode');
  const qrCode = await QRCode.toDataURL(booking.ticketCode, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
  });
  const details = [
    ['Theatre', `${booking.show.theatre.name}, ${booking.show.theatre.city}`],
    ['Screen', booking.show.screen.name],
    ['Show time', new Date(booking.show.startTime).toLocaleString()],
    ['Seats', booking.seats.join(', ')],
    ['Total paid', `INR ${Number(booking.totalAmount).toFixed(2)}`],
    ...(booking.paymentMethod ? [['Payment', `${paymentMethodLabel(booking.paymentMethod)} (demo)`]] : []),
  ];
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 10, pageWidth - 20, 190, 4, 4, 'F');
  doc.setFillColor(46, 26, 61);
  doc.roundedRect(10, 10, pageWidth - 20, 38, 4, 4, 'F');
  doc.setFillColor(46, 26, 61);
  doc.rect(10, 42, pageWidth - 20, 6, 'F');
  doc.setDrawColor(78, 51, 103);
  doc.roundedRect(10, 10, pageWidth - 20, 190, 4, 4, 'S');

  doc.setTextColor(245, 184, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CINEGO TICKET', 17, 21);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  const movieLines = doc.splitTextToSize(booking.show.movie.title, pageWidth - 34);
  doc.text(movieLines, 17, 32);

  let y = 60;
  doc.setTextColor(46, 26, 61);
  doc.setFontSize(10);
  for (const [label, value] of details) {
    const valueLines = doc.splitTextToSize(String(value), pageWidth - 82);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 17, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valueLines, 70, y);
    y += Math.max(12, valueLines.length * 5 + 5);
  }

  y += 3;
  doc.setDrawColor(190, 175, 202);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(17, y, pageWidth - 17, y);
  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TICKET CODE', 17, y + 11);
  doc.setTextColor(111, 74, 142);
  doc.setFontSize(15);
  doc.text(booking.ticketCode, 17, y + 21);
  const qrSize = 27;
  const qrX = pageWidth - 17 - qrSize;
  doc.addImage(qrCode, 'PNG', qrX, y + 1, qrSize, qrSize);
  doc.setTextColor(111, 74, 142);
  doc.setFontSize(7);
  doc.text('SCAN TICKET CODE', qrX + qrSize / 2, y + 31, { align: 'center' });

  const filename = booking.ticketCode.replace(/[^a-zA-Z0-9-]/g, '') || 'booking';
  doc.save(`ticket-${filename}.pdf`);
}

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

  const download = async (booking) => {
    setError('');
    try {
      await downloadTicket(booking);
    } catch (err) {
      setError(`Could not download ticket: ${err.message}`);
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
                {b.paymentMethod && <p className="muted">Demo payment · {paymentMethodLabel(b.paymentMethod)}</p>}
              </div>
              <div className="ticket-stub">
                <span className="muted">Ticket code</span>
                <strong className="code">{b.ticketCode}</strong>
                {b.status === 'cancelled' ? (
                  <span className="badge">Cancelled</span>
                ) : (
                  <>
                    <button className="btn ghost" onClick={() => download(b)}>Download PDF ticket</button>
                    {upcoming && <button className="btn ghost" onClick={() => cancel(b._id)}>Cancel booking</button>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
