import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/movies?q=${encodeURIComponent(q)}`).then((d) => setMovies(d.movies)).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="hero">
        <h1>Now showing</h1>
        <input className="search" placeholder="Search movies" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      {movies.length === 0 && !error && <p className="muted">No movies found.</p>}
      <div className="grid">
        {movies.map((m) => (
          <Link to={`/movies/${m._id}`} className="movie" key={m._id}>
            <div className="poster" style={m.poster ? { backgroundImage: `url(${m.poster})` } : undefined}>
              {!m.poster && <span>{m.title}</span>}
            </div>
            <h3>{m.title}</h3>
            <p className="muted">{[m.genre, m.language, `${m.duration} min`].filter(Boolean).join(', ')}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
