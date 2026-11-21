import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h2>Welcome back</h2>
      {error && <p className="error">{error}</p>}
      <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} required /></label>
      <button className="btn">Log in</button>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </form>
  );
}
