import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Card, CardBody, Form, FormField, TextInput, Button, Heading, Text, CheckBox, Anchor } from 'grommet';
import { User, Lock, Mail, Phone, Location, MapLocation } from 'grommet-icons';
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { login, register, sendSms, verifySms } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
          if (!acceptedTerms) {
            throw new Error(t('registration.terms.required'));
          }
          
          // Register user account
          await register(username, password, name, phone, email, address, acceptedTerms);
          
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
          // Navigate to home after successful verification
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          throw new Error('Verification failed');
        }
      } else {
        // Login (not registration)
        await login(username, password);
        // Navigate to intended page or home after successful login
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Use error utility to extract proper message from Problem Details
      const errorMessage = getErrorMessage(err, isRegister ? 'Registration failed' : 'Login failed');
      
      // If there are validation errors, add them
      if (isValidationError(err)) {
        const validationDetails = formatValidationErrors(err);
        if (validationDetails) {
          setError(`${errorMessage}\n${validationDetails}`);
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
    }
    setLoading(false);
  };

  return (
    <Box 
      fill 
      align="center" 
      justify="start" 
      background="background"
      pad={{ vertical: 'medium', horizontal: 'large' }}
      overflow="auto"
    >
      <Card 
        width="xlarge" 
        background="background-front" 
        elevation="large"
        round="medium"
        style={{ maxWidth: '900px', border: '1px solid rgba(51, 65, 85, 0.3)', width: '100%' }}
      >
        <CardBody pad="medium">
          <Box align="center" margin={{ bottom: 'medium' }}>
            <Heading 
              level="2" 
              margin={{ bottom: 'xsmall' }} 
              color="text-strong"
              style={{ fontSize: '32px', fontWeight: 700 }}
            >
              {isRegister ? '🎱 Create Account' : '🎱 Sign In'}
            </Heading>
            <Text color="text-weak" size="medium">
              {isRegister ? 'Join the CueFinder community' : 'Welcome back to CueFinder'}
            </Text>
          </Box>
          
          {error && (
            <Box 
              background="status-error" 
              pad="medium" 
              margin={{ bottom: 'medium' }}
              round="medium"
              border={{ color: 'status-critical', size: 'small' }}
            >
              <Text color="white" weight={500}>⚠️ {error}</Text>
            </Box>
          )}

          <Form onSubmit={submit} validate="submit">
            <Box direction="row" gap="medium" wrap>
              <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '250px' }}>
                <FormField
                  label={
                    <Box direction="row" gap="xsmall" align="center">
                      <User size="16px" />
                      <Text>Username</Text>
                    </Box>
                  }
                  name="username"
                  required
                >
                  <TextInput
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </FormField>
              </Box>

              {isRegister && (
                <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '250px' }}>
                  <FormField label="Display name" name="name" required>
                    <TextInput
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </FormField>
                </Box>
              )}
            </Box>

            {isRegister && (
              <>
                <Box direction="row" gap="medium" wrap>
                  <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '250px' }}>
                    <FormField
                      label={
                        <Box direction="row" gap="xsmall" align="center">
                          <Mail size="16px" />
                          <Text>Email</Text>
                        </Box>
                      }
                      name="email"
                      required
                    >
                      <TextInput
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </FormField>
                  </Box>
                  
                  <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '250px' }}>
                    <FormField
                      label={
                        <Box direction="row" gap="xsmall" align="center">
                          <Phone size="16px" />
                          <Text>Mobile phone</Text>
                        </Box>
                      }
                      name="phone"
                      required
                    >
                      <TextInput
                        id="phone"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +15551234567"
                        required
                      />
                    </FormField>
                  </Box>
                </Box>
                
                <FormField
                  label={
                    <Box direction="row" gap="xsmall" align="center">
                      <Location size="16px" />
                      <Text>Street address</Text>
                    </Box>
                  }
                  name="street"
                >
                  <TextInput
                    id="street"
                    name="street"
                    value={address.street}
                    onChange={(e) => setAddress(a => ({ ...a, street: e.target.value }))}
                    placeholder="123 Main st"
                  />
                </FormField>
                
                <Box direction="row" gap="medium" wrap>
                  <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '200px' }}>
                    <FormField label="City" name="city">
                      <TextInput
                        id="city"
                        name="city"
                        value={address.city}
                        onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))}
                        placeholder="City"
                      />
                    </FormField>
                  </Box>
                  
                  <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '150px' }}>
                    <FormField label="State / Province" name="state">
                      <TextInput
                        id="state"
                        name="state"
                        value={address.state}
                        onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))}
                        placeholder="State"
                      />
                    </FormField>
                  </Box>
                
                  <Box flex={{ grow: 0.7, shrink: 1 }} style={{ minWidth: '120px' }}>
                    <FormField label="Postal code" name="postalCode">
                      <TextInput
                        id="postalCode"
                        name="postalCode"
                        value={address.postalCode}
                        onChange={(e) => setAddress(a => ({ ...a, postalCode: e.target.value }))}
                        placeholder="Postal code"
                      />
                    </FormField>
                  </Box>
                  
                  <Box flex={{ grow: 1, shrink: 1 }} style={{ minWidth: '150px' }}>
                    <FormField
                      label={
                        <Box direction="row" gap="xsmall" align="center">
                          <MapLocation size="16px" />
                          <Text>Country</Text>
                        </Box>
                      }
                      name="country"
                    >
                      <TextInput
                        id="country"
                        name="country"
                        value={address.country}
                        onChange={(e) => setAddress(a => ({ ...a, country: e.target.value }))}
                        placeholder="Country"
                      />
                    </FormField>
                  </Box>
                </Box>
              </>
            )}

            <FormField
              label={
                <Box direction="row" gap="xsmall" align="center">
                  <Lock size="16px" />
                  <Text>Password</Text>
                </Box>
              }
              name="password"
              required
            >
              <TextInput
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </FormField>

            {isRegister && !codeSent && (
              <Box margin={{ top: 'medium', bottom: 'medium' }}>
                <CheckBox
                  checked={acceptedTerms}
                  label={
                    <Text size="small">
                      {t('registration.terms.accept')}{' '}
                      <Anchor
                        href={i18n.language === 'gr' ? '/terms-gr.html' : '/terms-en.html'}
                        target="_blank"
                        label={t('registration.terms.link')}
                        style={{ fontWeight: 600 }}
                      />
                    </Text>
                  }
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  required
                />
              </Box>
            )}

            {isRegister && codeSent && (
              <Box 
                background="accent-1" 
                pad="medium" 
                margin={{ top: 'medium' }}
                round="small"
                gap="small"
              >
                <Text color="white" weight="bold">✓ Check your phone for a 4-digit code</Text>
                <FormField name="code">
                  <TextInput
                    id="code"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </FormField>
                <Button 
                  label="Verify Code"
                  onClick={async () => {
                    try {
                      const result = await verifySms(verificationToken, code);
                      if (result.verified) {
                        setError(null);
                      } else {
                        setError('Invalid code');
                      }
                    } catch (e) {
                      setError(getErrorMessage(e, 'Verification failed'));
                    }
                  }}
                  secondary
                />
              </Box>
            )}

            <Box 
              direction="row" 
              gap="medium" 
              margin={{ top: 'large' }}
              justify="between"
            >
              <Button
                type="submit"
                primary
                label={
                  <Text weight={600}>
                    {isRegister ? (codeSent ? 'Verify & Complete' : 'Create Account') : 'Sign In'}
                  </Text>
                }
                disabled={loading}
                fill="horizontal"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  border: 'none'
                }}
              />
            </Box>
            
            <Box 
              align="center" 
              margin={{ top: 'medium' }}
              pad={{ top: 'medium' }}
              border={{ side: 'top', color: 'border', size: 'small' }}
            >
              <Button
                plain
                label={
                  <Text size="small" color="brand" weight={500}>
                    {isRegister ? '← Back to Sign In' : "Don't have an account? Register →"}
                  </Text>
                }
                onClick={() => {
                  setIsRegister(s => !s);
                  setCodeSent(false);
                  setCode('');
                  setVerificationToken('');
                }}
              />
            </Box>
          </Form>
        </CardBody>
      </Card>
    </Box>
  );
}
