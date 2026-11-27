import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      api(`/movies?q=${encodeURIComponent(q)}`)
        .then((d) => {
          if (active) setMovies(d.movies);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <>
      <section className="browse-hero">
        <div className="browse-copy">
          <p className="eyebrow">YOUR NEXT GREAT NIGHT OUT</p>
          <h1>Now showing</h1>
          <p className="browse-intro">Find a film, pick your seats, and make it a movie night.</p>
        </div>
        <div className="movie-search">
          <label htmlFor="movie-search">Find your movie</label>
          <div className="search-control">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              id="movie-search"
              className="search"
              type="search"
              placeholder="Search by movie title"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button className="clear-search" type="button" onClick={() => setQ('')}>
                Clear
              </button>
            )}
          </div>
        </div>
      </section>
      <div className="results-heading">
        <h2>On the big screen</h2>
        {!loading && !error && (
          <p className="muted" role="status">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
            {q.trim() ? ' found' : ' to explore'}
          </p>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {loading && !error && <p className="muted browse-message">Finding movies…</p>}
      {!loading && movies.length === 0 && !error && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h3>No movies found</h3>
          <p className="muted">{q.trim() ? 'Try another title or clear your search.' : 'There are no movies showing right now. Please check back soon.'}</p>
          {q && <button className="btn ghost" type="button" onClick={() => setQ('')}>Clear search</button>}
        </div>
      )}
      <div className="grid">
        {movies.map((m) => (
          <Link to={`/movies/${m._id}`} className="movie" key={m._id}>
            <div className={`poster${m.poster ? ' has-poster' : ''}`} style={m.poster ? { backgroundImage: `url(${m.poster})` } : undefined}>
              {!m.poster && <span>{m.title}</span>}
            </div>
            <div className="movie-info">
              <h3>{m.title}</h3>
              <p className="muted">{[m.genre, m.language, `${m.duration} min`].filter(Boolean).join(' · ')}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
