import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { CUEFINDER_SITE_URL } from '../config/siteConfig.js';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setStatus('');
      await login(username, password);
      setStatus('Logged in successfully.');
    } catch (error) {
      setStatus(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h1>Login</h1>
      <p className="muted">Use the same account as billiardscuefinder.com.</p>
      {status && <p className={status.includes('failed') ? 'error' : 'muted'}>{status}</p>}
      <div className="form-grid">
        <input
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="primary" disabled={loading} onClick={handleSubmit}>
          Sign in
        </button>
        <a className="secondary" href={`${CUEFINDER_SITE_URL}/login`}>
          Go to CueFinder Login
        </a>
        <a className="secondary" href={`${CUEFINDER_SITE_URL}/register`}>
          Go to CueFinder Register
        </a>
      </div>
    </section>
  );
}
