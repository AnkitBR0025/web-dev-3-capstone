import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  theatreName: '',
  theatreAddress: '',
  theatreCity: '',
};

export default function TheatreAdminRegister() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api('/theatre-admin-applications', { method: 'POST', body: form });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (submitted) {
    return (
      <section className="card form narrow application-form">
        <p className="eyebrow">APPLICATION SUBMITTED</p>
        <h1>Thanks for applying</h1>
        <p className="muted">
          A super admin will review your theatre details. Once approved, log in with the email and password
          you provided to manage your theatre.
        </p>
        <Link className="btn" to="/login">Go to log in</Link>
      </section>
    );
  }

  return (
    <form className="card form narrow application-form" onSubmit={submit}>
      <p className="eyebrow">PARTNER WITH CINEGO</p>
      <h1>Apply as a theatre admin</h1>
      <p className="muted">Create your account and send your theatre details to the super admin for approval.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="two">
        <label>Full name<input name="name" value={form.name} onChange={change} required minLength={2} maxLength={60} autoComplete="name" /></label>
        <label>Mobile number<input name="phone" type="tel" value={form.phone} onChange={change} required autoComplete="tel" /></label>
      </div>
      <label>Email<input name="email" type="email" value={form.email} onChange={change} required autoComplete="email" /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength={6} autoComplete="new-password" /></label>
      <h2 className="application-section-title">Your theatre</h2>
      <label>Theatre name<input name="theatreName" value={form.theatreName} onChange={change} required /></label>
      <label>Street address<input name="theatreAddress" value={form.theatreAddress} onChange={change} required autoComplete="street-address" /></label>
      <label>City<input name="theatreCity" value={form.theatreCity} onChange={change} required autoComplete="address-level2" /></label>
      <button className="btn" type="submit">Submit application</button>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  );
}
