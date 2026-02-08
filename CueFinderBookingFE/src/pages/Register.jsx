import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setStatus('');
      await register(form.username, form.password, form.name, form.phone, form.email);
      setStatus('Account created. You are now logged in.');
    } catch (error) {
      setStatus(error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h1>Register</h1>
      <p className="muted">This creates a shared account used on both domains.</p>
      {status && <p className={status.includes('failed') ? 'error' : 'muted'}>{status}</p>}
      <div className="form-grid">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
        <button className="primary" disabled={loading} onClick={handleSubmit}>
          Create account
        </button>
      </div>
    </section>
  );
}
