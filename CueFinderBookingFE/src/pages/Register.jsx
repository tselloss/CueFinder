import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { CUEFINDER_SITE_URL } from '../config/siteConfig.js';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: ''
};

export default function Register() {
  const { register, sendSms, verifySms } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: ''
  });
  const [address, setAddress] = useState(emptyAddress);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [wantsClubOwner, setWantsClubOwner] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setStatus('');

      if (!codeSent) {
        if (!form.phone) {
          throw new Error('Mobile phone number is required for account verification.');
        }
        if (!acceptedTerms) {
          throw new Error('You must accept the Terms and Conditions to create an account.');
        }

        await register(
          form.username,
          form.password,
          form.name,
          form.phone,
          form.email,
          address,
          acceptedTerms,
          wantsClubOwner
        );

        const response = await sendSms(form.phone, 'SMS');
        if (!response?.token) {
          throw new Error('Verification token missing. Please try again.');
        }
        setVerificationToken(response.token);
        setCodeSent(true);
        setStatus('Verification code sent to your phone.');
        return;
      }

      if (!code) {
        throw new Error('Please enter the verification code.');
      }

      const result = await verifySms(verificationToken, code);
      if (!result?.verified) {
        throw new Error('Verification code is incorrect. Please try again.');
      }

      setStatus('Account verified. You are now logged in.');
      navigate('/', { replace: true });
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
        {codeSent ? (
          <>
            <input
              placeholder="Verification code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </>
        ) : (
          <>
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
            <input
              placeholder="Street address"
              value={address.street}
              onChange={(event) => setAddress((prev) => ({ ...prev, street: event.target.value }))}
            />
            <input
              placeholder="City"
              value={address.city}
              onChange={(event) => setAddress((prev) => ({ ...prev, city: event.target.value }))}
            />
            <input
              placeholder="State/Region"
              value={address.state}
              onChange={(event) => setAddress((prev) => ({ ...prev, state: event.target.value }))}
            />
            <input
              placeholder="Postal code"
              value={address.postalCode}
              onChange={(event) => setAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
            />
            <input
              placeholder="Country"
              value={address.country}
              onChange={(event) => setAddress((prev) => ({ ...prev, country: event.target.value }))}
            />
            <label className="muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />{' '}
              I accept the{' '}
              <a href={`${CUEFINDER_SITE_URL}/terms-en.html`} target="_blank" rel="noreferrer">
                Terms and Conditions
              </a>
            </label>
            <label className="muted">
              <input
                type="checkbox"
                checked={wantsClubOwner}
                onChange={(event) => setWantsClubOwner(event.target.checked)}
              />{' '}
              Register as a billiard club owner (requires admin approval).
            </label>
          </>
        )}
        <button className="primary" disabled={loading} onClick={handleSubmit}>
          {codeSent ? 'Verify code' : 'Create account'}
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
