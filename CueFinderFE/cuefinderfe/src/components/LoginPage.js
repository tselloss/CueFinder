import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

export default function LoginPage() {
  const { login, register, sendSms, verifySms } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        // start SMS flow: send code first if not sent
        if (!codeSent) {
          if (!phone) throw new Error('Please provide mobile phone for verification');
          await sendSms(phone);
          setCodeSent(true);
          setLoading(false);
          return;
        }

        // verify code
        if (codeSent && !code) throw new Error('Enter verification code');
        await verifySms(phone, code);

  // finally register the user with phone/address saved in this demo
  await register(username, password, name, phone, email, address);
        // attach phone/address to the user in-memory (demo)
        // note: in a real backend you'd include phone/address in registration request
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const socialApple = async () => {
    setError(null);
    setLoading(true);
    try { await register('admin','admin','Administrator'); } catch(err) { /* ignore if exists */ }
    try { await login('admin','admin'); } catch(e) { setError('Social sign-in failed'); }
    setLoading(false);
  };

  const socialGoogle = async () => {
    setError(null);
    setLoading(true);
    try { await register('google_user','googlepass','Google User'); } catch(err) { /* ignore */ }
    try { await login('google_user','googlepass'); } catch(e) { setError('Social sign-in failed'); }
    setLoading(false);
  };

  const bg = process.env.PUBLIC_URL + '/BilliardCueBackground.png';
  const fallback = process.env.PUBLIC_URL + '/login-bg-fallback.svg';

  return (
    <div className="auth-hero" style={{backgroundImage: `linear-gradient(180deg, rgba(5,10,20,0.45), rgba(5,10,20,0.25)), url(${bg}), url(${fallback})`}}>
      <Container style={{maxWidth:480}}>
        <Row className="justify-content-center">
          <Col>
            <Card className="auth-card">
              <Card.Body>
              <h3 className="mb-3">{isRegister ? 'Create account' : 'Sign in'}</h3>
              {error && <Alert variant="danger">{error}</Alert>}
              <div className="social-row">
                <Button className="social-btn social-apple" onClick={socialApple}><img src={process.env.PUBLIC_URL + '/apple-icon.svg'} alt="Apple"/> Continue with Apple</Button>
                <Button className="social-btn social-google" onClick={socialGoogle}><img src={process.env.PUBLIC_URL + '/google-icon.svg'} alt="Google"/> Continue with Google</Button>
              </div>

              <Form onSubmit={submit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Enter username" />
                </Form.Group>

                {isRegister && (
                  <>
                    <Form.Group className="mb-3" controlId="name">
                      <Form.Label>Display name</Form.Label>
                      <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="phone">
                      <Form.Label>Mobile phone</Form.Label>
                      <Form.Control value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="e.g. +15551234567" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="street">
                      <Form.Label>Street address</Form.Label>
                      <Form.Control value={address.street} onChange={(e)=>setAddress(a=>({...a, street: e.target.value}))} placeholder="123 Main st" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control value={address.city} onChange={(e)=>setAddress(a=>({...a, city: e.target.value}))} placeholder="City" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="state">
                      <Form.Label>State / Province</Form.Label>
                      <Form.Control value={address.state} onChange={(e)=>setAddress(a=>({...a, state: e.target.value}))} placeholder="State / Province" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="postal">
                      <Form.Label>Postal code</Form.Label>
                      <Form.Control value={address.postalCode} onChange={(e)=>setAddress(a=>({...a, postalCode: e.target.value}))} placeholder="Postal code" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="country">
                      <Form.Label>Country</Form.Label>
                      <Form.Control value={address.country} onChange={(e)=>setAddress(a=>({...a, country: e.target.value}))} placeholder="Country" />
                    </Form.Group>
                  </>
                )}

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Button variant="primary" type="submit" disabled={loading}>{isRegister ? (codeSent ? 'Verify & Create' : 'Register') : 'Sign in'}</Button>{' '}
                    <Button variant="outline-secondary" onClick={()=>{ setIsRegister(s=>!s); setCodeSent(false); setCode(''); }}>{isRegister ? 'Back to login' : 'Register'}</Button>
                  </div>
                </div>

                {isRegister && codeSent && (
                  <div className="verify-box">
                    <Form.Control className="verify-input" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="1234" />
                    <Button onClick={async ()=>{ try{ await verifySms(phone, code); setError(null); } catch(e){ setError(e.message) } }}>Verify</Button>
                  </div>
                )}
              </Form>

              <hr />
              <div className="text-muted small">Try <strong>admin/admin</strong> to auto-create an admin account, or create a new user.</div>
            </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
