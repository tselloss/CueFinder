import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { User, Lock, Mail, Phone, MapPin, Globe, Loader2 } from 'lucide-react';
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
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-2 sm:p-4 md:p-8 overflow-auto">
      <Card className="w-full max-w-3xl bg-card border border-border/50 shadow-lg max-h-[95vh] overflow-y-auto">
        <CardContent className="p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
              {isRegister ? '🎱 Create Account' : '🎱 Sign In'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
              {isRegister ? 'Join the CueFinder community' : 'Welcome back to CueFinder'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-red-700 font-semibold text-sm sm:text-base">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Username & Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-bold mb-2">Display name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                </div>
              )}
            </div>

            {/* Registration Additional Fields */}
            {isRegister && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +15551234567"
                      required
                      className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Street address
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={address.street}
                    onChange={(e) => setAddress(a => ({ ...a, street: e.target.value }))}
                    placeholder="123 Main st"
                    className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                </div>

                {/* City, State, Postal, Country */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={address.city}
                      onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={address.state}
                      onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))}
                      placeholder="State"
                      className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Postal code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={(e) => setAddress(a => ({ ...a, postalCode: e.target.value }))}
                      placeholder="Postal code"
                      className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={address.country}
                      onChange={(e) => setAddress(a => ({ ...a, country: e.target.value }))}
                      placeholder="Country"
                      className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>

            {/* Terms Acceptance */}
            {isRegister && !codeSent && (
              <div className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                  className="w-4 h-4 mt-1 rounded border-border focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  {t('registration.terms.accept')}{' '}
                  <a
                    href={i18n.language === 'gr' ? '/terms-gr.html' : '/terms-en.html'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:text-blue-700"
                  >
                    {t('registration.terms.link')}
                  </a>
                </label>
              </div>
            )}

            {/* Verification Code */}
            {isRegister && codeSent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-green-700 font-bold">✓ Check your phone for a 4-digit code</p>
                <div>
                  <label className="block text-sm font-bold mb-2">Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-border rounded-md font-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
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
                  className="w-full"
                >
                  Verify Code
                </Button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 sm:pt-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base font-bold shadow-md gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRegister ? (codeSent ? 'Verify & Complete' : 'Create Account') : 'Sign In'}
              </Button>
            </div>

            {/* Toggle Register/Login */}
            <div className="pt-2 sm:pt-3 border-t border-border text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(s => !s);
                  setCodeSent(false);
                  setCode('');
                  setVerificationToken('');
                }}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isRegister ? '← Back to Sign In' : "Don't have an account? Register →"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
