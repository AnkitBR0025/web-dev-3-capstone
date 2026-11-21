import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Reports() {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/reports/movies'), api('/reports/shows')])
      .then(([m, s]) => {
        setMovies(m.report);
        setShows(s.report);
      })
      .catch((e) => setError(e.message));
  }, []);

  const total = movies.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <>
      <h1>Collections</h1>
      {error && <p className="error">{error}</p>}
      <p className="muted">Total collection: <strong>₹{total}</strong> (confirmed bookings only)</p>

      <h2>Per movie</h2>
      <div className="scroll">
        <table>
          <thead><tr><th>Movie</th><th>Bookings</th><th>Tickets</th><th>Collection</th></tr></thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m.movieId}><td>{m.title}</td><td>{m.bookings}</td><td>{m.tickets}</td><td>₹{m.revenue}</td></tr>
            ))}
            {movies.length === 0 && <tr><td colSpan="4" className="muted">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Per show</h2>
      <div className="scroll">
        <table>
          <thead><tr><th>Movie</th><th>Theatre</th><th>Show time</th><th>Tickets</th><th>Collection</th></tr></thead>
          <tbody>
            {shows.map((s) => (
              <tr key={s.showId}>
                <td>{s.title}</td><td>{s.theatre}</td><td>{new Date(s.startTime).toLocaleString()}</td><td>{s.tickets}</td><td>₹{s.revenue}</td>
              </tr>
            ))}
            {shows.length === 0 && <tr><td colSpan="5" className="muted">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
