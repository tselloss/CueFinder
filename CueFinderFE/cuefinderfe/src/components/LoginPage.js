import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocation } from 'react-router-dom';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

export default function LoginPage() {
  const { login, register, sendSms, verifySms, externalLogin } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-switch to register mode if on /register route
  useEffect(() => {
    if (location.pathname === '/register') {
      setIsRegister(true);
    } else {
      setIsRegister(false);
    }
  }, [location]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        // Step 1: Register the user first
        if (!codeSent) {
          if (!phone) throw new Error('Please provide mobile phone for verification');
          
          // Register user account
          await register(username, password, name, phone, email, address);
          
          // Step 2: Now send SMS verification code
          const response = await sendSms(phone, 'SMS');
          setVerificationToken(response.token);
          setCodeSent(true);
          setLoading(false);
          return;
        }

        // Step 3: Verify the code
        if (codeSent && !code) throw new Error('Enter verification code');
        const result = await verifySms(verificationToken, code);
        
        if (result.verified) {
          // Phone verified successfully - user is fully registered and verified
          setError(null);
        } else {
          throw new Error('Verification failed');
        }
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const socialGoogle = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
        throw new Error('Google OAuth not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in .env.local');
      }

      // Open Google OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth-callback')}` +
        `&response_type=token id_token` +
        `&scope=openid email profile` +
        `&nonce=${Date.now()}`;
      
      const popup = window.open(
        googleOAuthUrl,
        'Google Sign-In',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth-success' && event.data.provider === 'google') {
          try {
            await externalLogin(
              'Google',
              event.data.idToken,
              event.data.email,
              event.data.name,
              event.data.picture
            );
            if (popup && !popup.closed) popup.close();
          } catch (error) {
            setError('Google sign-in failed: ' + (error.message || 'Unknown error'));
            setLoading(false);
          }
        }
      }, { once: true });

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const socialApple = async () => {
    setError(null);
    setLoading(true);
    try {
      // For demo purposes without Apple OAuth setup:
      // Create a mock Apple user
      const mockAppleEmail = `apple_${Date.now()}@icloud.com`;
      await externalLogin(
        'Apple',
        'mock_apple_token_' + Date.now(),
        mockAppleEmail,
        'Apple User',
        null
      );
      setLoading(false);
    } catch (err) {
      setError('Apple sign-in failed');
      setLoading(false);
    }
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
              {/* OAuth buttons hidden for now
              <div className="social-row">
                <Button className="social-btn social-apple" onClick={socialApple}><img src={process.env.PUBLIC_URL + '/apple-icon.svg'} alt="Apple"/> Continue with Apple</Button>
                <Button className="social-btn social-google" onClick={socialGoogle}><img src={process.env.PUBLIC_URL + '/google-icon.svg'} alt="Google"/> Continue with Google</Button>
              </div>
              */}

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
                    <Button variant="primary" type="submit" disabled={loading}>
                      {isRegister ? (codeSent ? 'Verify & Complete' : 'Create Account') : 'Sign in'}
                    </Button>{' '}
                    <Button variant="outline-secondary" onClick={()=>{ setIsRegister(s=>!s); setCodeSent(false); setCode(''); setVerificationToken(''); }}>
                      {isRegister ? 'Back to login' : 'Register'}
                    </Button>
                  </div>
                </div>

                {isRegister && codeSent && (
                  <div className="verify-box">
                    <p className="text-success mb-2">✓ Check your phone for a 4-digit code</p>
                    <Form.Control className="verify-input" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="1234" maxLength={4} />
                    <Button onClick={async ()=>{ try{ const result = await verifySms(verificationToken, code); if (result.verified) { setError(null); } else { setError('Invalid code'); } } catch(e){ setError(e.message) } }}>Verify</Button>
                  </div>
                )}
              </Form>
            </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
