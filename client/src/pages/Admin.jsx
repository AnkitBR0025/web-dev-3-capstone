import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const useForm = (initial) => {
  const [form, setForm] = useState(initial);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return [form, change, () => setForm(initial), setForm];
};

// asks the browser for the current position and gives it to callback(lat, lng)
const getHere = (cb, onError) => {
  if (!navigator.geolocation) return onError('Your browser does not support location.');
  navigator.geolocation.getCurrentPosition(
    (p) => cb(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6)),
    () => onError('Could not get your location. Allow location access or type the values.'),
    { timeout: 10000 }
  );
};

function LocationEditor({ theatre, onSave, onError }) {
  const [lat, setLat] = useState(theatre.latitude ?? '');
  const [lng, setLng] = useState(theatre.longitude ?? '');
  return (
    <div className="loc-edit">
      <label>Latitude<input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} /></label>
      <label>Longitude<input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} /></label>
      <button type="button" className="btn ghost" onClick={() => getHere((a, b) => { setLat(a); setLng(b); }, onError)}>Use my location</button>
      <button type="button" className="btn" onClick={() => onSave(theatre._id, lat, lng)}>Save location</button>
    </div>
  );
}

function Msg({ error }) {
  return error ? <p className="error">{error}</p> : null;
}

function MoviesTab() {
  const [movies, setMovies] = useState([]);
  const [form, change, reset] = useForm({ title: '', duration: '', language: 'English', genre: '', poster: '', description: '' });
  const [error, setError] = useState('');
  const load = () => api('/movies').then((d) => setMovies(d.movies));
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/movies', { method: 'POST', body: { ...form, duration: Number(form.duration) } });
      reset();
      load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    setError('');
    try { await api(`/movies/${id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <form className="card form" onSubmit={add}>
        <h3>Add a movie</h3>
        <Msg error={error} />
        <div className="two">
          <label>Title<input name="title" value={form.title} onChange={change} required /></label>
          <label>Duration (minutes)<input name="duration" type="number" min="1" value={form.duration} onChange={change} required /></label>
          <label>Language<input name="language" value={form.language} onChange={change} /></label>
          <label>Genre<input name="genre" value={form.genre} onChange={change} /></label>
        </div>
        <label>Poster image URL<input name="poster" value={form.poster} onChange={change} /></label>
        <label>Description<textarea name="description" rows="2" value={form.description} onChange={change} /></label>
        <button className="btn">Add movie</button>
      </form>
      <div className="list">
        {movies.map((m) => (
          <div className="row card" key={m._id}>
            <div><strong>{m.title}</strong><p className="muted">{m.genre} · {m.language} · {m.duration} min</p></div>
            <button className="btn ghost" onClick={() => remove(m._id)}>Delete</button>
          </div>
        ))}
      </div>
    </>
  );
}

function TheatresTab() {
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [tForm, tChange, tReset, setT] = useForm({ name: '', city: '', latitude: '', longitude: '' });
  const [sForm, sChange, sReset] = useForm({ theatre: '', name: '', rows: 6, seatsPerRow: 10 });
  const [error, setError] = useState('');

  const load = async () => {
    const [t, s] = await Promise.all([api('/theatres/mine'), api('/screens/mine')]);
    setTheatres(t.theatres);
    setScreens(s.screens);
  };
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const run = async (fn) => {
    setError('');
    try { await fn(); await load(); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <Msg error={error} />
      <form className="card form" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/theatres', { method: 'POST', body: tForm }); tReset(); }); }}>
        <h3>Add a theatre</h3>
        <div className="two">
          <label>Name<input name="name" value={tForm.name} onChange={tChange} required /></label>
          <label>City<input name="city" value={tForm.city} onChange={tChange} required /></label>
          <label>Latitude (for "near me", optional)<input name="latitude" type="number" step="any" value={tForm.latitude} onChange={tChange} /></label>
          <label>Longitude (optional)<input name="longitude" type="number" step="any" value={tForm.longitude} onChange={tChange} /></label>
        </div>
        <div className="actions">
          <button className="btn">Add theatre</button>
          <button type="button" className="btn ghost" onClick={() => getHere((a, b) => setT((f) => ({ ...f, latitude: a, longitude: b })), setError)}>Use my location</button>
        </div>
      </form>

      <form className="card form" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/screens', { method: 'POST', body: { ...sForm, rows: Number(sForm.rows), seatsPerRow: Number(sForm.seatsPerRow) } }); sReset(); }); }}>
        <h3>Add a screen</h3>
        <div className="two">
          <label>Theatre
            <select name="theatre" value={sForm.theatre} onChange={sChange} required>
              <option value="">Choose a theatre</option>
              {theatres.map((t) => <option key={t._id} value={t._id}>{t.name}, {t.city}</option>)}
            </select>
          </label>
          <label>Screen name<input name="name" value={sForm.name} onChange={sChange} required /></label>
          <label>Rows (A, B, C…)<input name="rows" type="number" min="1" max="26" value={sForm.rows} onChange={sChange} required /></label>
          <label>Seats per row<input name="seatsPerRow" type="number" min="1" max="30" value={sForm.seatsPerRow} onChange={sChange} required /></label>
        </div>
        <button className="btn">Add screen</button>
      </form>

      <div className="list">
        {theatres.map((t) => (
          <div className="card" key={t._id}>
            <div className="row">
              <div><strong>{t.name}</strong><p className="muted">{t.city}</p></div>
              <button className="btn ghost" onClick={() => run(() => api(`/theatres/${t._id}`, { method: 'DELETE' }))}>Delete theatre</button>
            </div>
            <LocationEditor
              key={`${t._id}-${t.latitude}-${t.longitude}`}
              theatre={t}
              onError={setError}
              onSave={(id, latitude, longitude) => run(() => api(`/theatres/${id}`, { method: 'PUT', body: { latitude, longitude } }))}
            />
            {screens.filter((s) => s.theatre._id === t._id).map((s) => (
              <div className="row sub" key={s._id}>
                <span>{s.name} · {s.rows} rows × {s.seatsPerRow} seats ({s.rows * s.seatsPerRow} total)</span>
                <button className="btn ghost" onClick={() => run(() => api(`/screens/${s._id}`, { method: 'DELETE' }))}>Delete</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function ShowsTab() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [form, change, reset] = useForm({ movie: '', screen: '', startTime: '', price: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [s, m, sc] = await Promise.all([api('/shows/manage'), api('/movies'), api('/screens/mine')]);
    setShows(s.shows);
    setMovies(m.movies);
    setScreens(sc.screens);
  };
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/shows', { method: 'POST', body: { ...form, price: Number(form.price), startTime: new Date(form.startTime).toISOString() } });
      reset();
      load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    setError('');
    try { await api(`/shows/${id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <form className="card form" onSubmit={add}>
        <h3>Schedule a show</h3>
        <Msg error={error} />
        <div className="two">
          <label>Movie
            <select name="movie" value={form.movie} onChange={change} required>
              <option value="">Choose a movie</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
          </label>
          <label>Screen
            <select name="screen" value={form.screen} onChange={change} required>
              <option value="">Choose a screen</option>
              {screens.map((s) => <option key={s._id} value={s._id}>{s.theatre.name} – {s.name}</option>)}
            </select>
          </label>
          <label>Start time<input name="startTime" type="datetime-local" value={form.startTime} onChange={change} required /></label>
          <label>Ticket price (₹)<input name="price" type="number" min="0" value={form.price} onChange={change} required /></label>
        </div>
        <button className="btn">Schedule show</button>
      </form>
      <div className="list">
        {shows.map((s) => (
          <div className="row card" key={s._id}>
            <div>
              <strong>{s.movie.title}</strong>
              <p className="muted">{s.theatre.name} · {s.screen.name} · {new Date(s.startTime).toLocaleString()} · ₹{s.price} · {s.bookedSeats.length} seats sold</p>
            </div>
            <button className="btn ghost" onClick={() => remove(s._id)}>Delete</button>
          </div>
        ))}
      </div>
    </>
  );
}

function AdminsTab() {
  const [form, change, reset] = useForm({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api('/auth/create-admin', { method: 'POST', body: form });
      setMsg(`Theatre admin ${form.email} created.`);
      reset();
    } catch (err) { setError(err.message); }
  };

  return (
    <form className="card form narrow" onSubmit={add}>
      <h3>Create a theatre admin</h3>
      <Msg error={error} />
      {msg && <p className="ok">{msg}</p>}
      <label>Name<input name="name" value={form.name} onChange={change} required /></label>
      <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
      <label>Password<input name="password" type="password" minLength={6} value={form.password} onChange={change} required /></label>
      <button className="btn">Create admin</button>
    </form>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('movies');
  const tabs = [['movies', 'Movies'], ['theatres', 'Theatres and screens'], ['shows', 'Shows']];
  if (user.role === 'superAdmin') tabs.push(['admins', 'Theatre admins']);

  return (
    <>
      <h1>Manage</h1>
      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'tab active' : 'tab'} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === 'movies' && <MoviesTab />}
      {tab === 'theatres' && <TheatresTab />}
      {tab === 'shows' && <ShowsTab />}
      {tab === 'admins' && <AdminsTab />}
    </>
  );
}