import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function MovieShows() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api(`/movies/${id}`), api(`/shows?movie=${id}&upcoming=true`)])
      .then(([m, s]) => {
        setMovie(m.movie);
        setShows(s.shows);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!movie) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>{movie.title}</h1>
      <p className="muted">{[movie.genre, movie.language, `${movie.duration} min`].filter(Boolean).join(', ')}</p>
      {movie.description && <p className="lead">{movie.description}</p>}
      <h2>Pick a show</h2>
      {shows.length === 0 && <p className="muted">No upcoming shows for this movie yet.</p>}
      <div className="list">
        {shows.map((s) => (
          <div className="row card" key={s._id}>
            <div>
              <strong>{new Date(s.startTime).toLocaleString()}</strong>
              <p className="muted">{s.theatre.name}, {s.theatre.city} · {s.screen.name} · ₹{s.price} per seat</p>
            </div>
            <Link className="btn" to={`/book/${s._id}`}>Select seats</Link>
          </div>
        ))}
      </div>
    </>
  );
}
