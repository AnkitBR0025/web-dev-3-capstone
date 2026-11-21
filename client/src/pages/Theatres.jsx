import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

// distance between two lat/lng points in km (haversine formula)
const distanceKm = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

function TheatreCard({ t }) {
  const [open, setOpen] = useState(false);
  const [shows, setShows] = useState(null);
  const [error, setError] = useState('');

  const toggle = async () => {
    setOpen(!open);
    if (shows) return;
    try {
      const d = await api(`/shows?theatre=${t._id}&upcoming=true`);
      setShows(d.shows);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card theatre">
      <div className="row">
        <div>
          <h3>{t.name}</h3>
          <p className="muted">{t.city}</p>
        </div>
        <div className="theatre-side">
          {t.km !== undefined && <span className="dist">{t.km < 10 ? t.km.toFixed(1) : Math.round(t.km)} km away</span>}
          <button className="btn ghost" onClick={toggle}>{open ? 'Hide shows' : 'View shows'}</button>
        </div>
      </div>
      {open && (
        <div className="theatre-shows">
          {error && <p className="error">{error}</p>}
          {!error && !shows && <p className="muted">Loading…</p>}
          {shows && shows.length === 0 && <p className="muted">No upcoming shows at this theatre.</p>}
          {shows && shows.map((s) => (
            <div className="row sub" key={s._id}>
              <span><strong>{s.movie.title}</strong> · {new Date(s.startTime).toLocaleString()} · {s.screen.name} · ₹{s.price}</span>
              <Link className="btn" to={`/book/${s._id}`}>Select seats</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Theatres() {
  const [theatres, setTheatres] = useState([]);
  const [q, setQ] = useState('');
  const [here, setHere] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/theatres').then((d) => setTheatres(d.theatres)).catch((e) => setError(e.message));
  }, []);

  const nearMe = () => {
    setError('');
    if (!navigator.geolocation) return setError('Your browser does not support location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Could not get your location. Allow location access in the browser, or search by city below.');
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let items = theatres
      .filter((t) => !term || `${t.name} ${t.city}`.toLowerCase().includes(term))
      .map((t) => {
        const hasPos = typeof t.latitude === 'number' && typeof t.longitude === 'number';
        return here && hasPos ? { ...t, km: distanceKm(here, { lat: t.latitude, lng: t.longitude }) } : t;
      });
    if (here) items = items.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return items;
  }, [theatres, q, here]);

  const noPos = here && list.some((t) => t.km === undefined);

  return (
    <>
      <div className="hero">
        <div>
          <h1>Theatres</h1>
          <p className="muted">Find a cinema, see what is playing and book seats.</p>
        </div>
        <div className="actions">
          <input className="search" placeholder="Search by name or city" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" onClick={nearMe} disabled={locating}>{locating ? 'Finding you…' : here ? 'Update my location' : 'Near me'}</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {here && <p className="muted">Sorted by distance from your current location.</p>}
      {noPos && <p className="muted">Theatres without a map position are listed last.</p>}
      {list.length === 0 && !error && <p className="muted">No theatres found.</p>}
      <div className="list">
        {list.map((t) => <TheatreCard key={t._id} t={t} />)}
      </div>
    </>
  );
}