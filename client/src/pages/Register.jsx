import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h2>Create your account</h2>
      {error && <p className="error">{error}</p>}
      <label>Name<input name="name" value={form.name} onChange={change} required minLength={2} /></label>
      <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength={6} /></label>
      <button className="btn">Sign up</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
