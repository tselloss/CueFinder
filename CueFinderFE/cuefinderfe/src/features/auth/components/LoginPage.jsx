import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { getErrorMessage, isValidationError, formatValidationErrors } from '../../../utils/errorUtils';
import { BOOKING_SITE_URL } from '../../../config/apiConfig';

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
  const [wantsClubOwner, setWantsClubOwner] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (!codeSent) {
          if (!phone) throw new Error('📱 Mobile phone number is required for account verification');
          if (!acceptedTerms) throw new Error(t('registration.terms.required', '✅ You must accept the Terms and Conditions to create an account'));
          
          await register(username, password, name, phone, email, address, acceptedTerms, wantsClubOwner);
          const response = await sendSms(phone, 'SMS');
          setVerificationToken(response.token);
          setCodeSent(true);
          setLoading(false);
          return;
        }

        if (codeSent && !code) throw new Error('🔢 Please enter the 6-digit verification code sent to your phone');
        const result = await verifySms(verificationToken, code);
        
        if (result.verified) {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          throw new Error('❌ Verification code is incorrect. Please check the code and try again.');
        }
      } else {
        await login(username, password);
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Error:', err);
      if (isValidationError(err)) {
        setError(formatValidationErrors(err));
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isRegister ? t('auth.register', 'Create Account') : t('auth.login', 'Welcome Back')}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegister 
              ? t('auth.register.subtitle', 'Sign up to start selling') 
              : t('auth.login.subtitle', 'Sign in to your account')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {codeSent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-sm text-primary">
                    {t('auth.codeSent', 'Verification code sent to your phone')}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('auth.verificationCode', 'Verification Code')}
                  </label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t('auth.username', 'Username')}
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Εισάγετε όνομα χρήστη"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t('auth.password', 'Password')}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Εισάγετε κωδικό"
                    required
                  />
                </div>

                {isRegister && (
                  <>
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {t('auth.name', 'Full Name')}
                      </label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {t('auth.email', 'Email')}
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {t('auth.phone', 'Mobile Phone')} *
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1234567890"
                        required
                      />
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {t('auth.address', 'Address')}
                      </label>
                      
                      <Input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        placeholder="Διεύθυνση οδού"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="Πόλη"
                        />
                        <Input
                          type="text"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          placeholder="Περιφέρεια"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="Τ.Κ."
                        />
                        <Input
                          type="text"
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value })}
                          placeholder="Χώρα"
                        />
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label
                      htmlFor="terms"
                      className="mt-2 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 h-5 w-5 sm:h-4 sm:w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t('registration.terms.accept', 'I accept the')}{' '}
                        <a
                          href={i18n.language === 'gr' ? '/terms-gr.html' : '/terms-en.html'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          {t('registration.terms.link', 'Terms and Conditions')}
                        </a>
                      </span>
                    </label>

                    <label
                      htmlFor="clubOwner"
                      className="mt-2 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id="clubOwner"
                        checked={wantsClubOwner}
                        onChange={(e) => setWantsClubOwner(e.target.checked)}
                        className="mt-1 h-5 w-5 sm:h-4 sm:w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        Register as a billiard club owner (requires admin approval).
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  {t('auth.loading', 'Loading...')}
                </span>
              ) : codeSent ? (
                t('auth.verify', 'Verify Code')
              ) : isRegister ? (
                t('auth.register', 'Create Account')
              ) : (
                t('auth.login', 'Sign In')
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  {t('auth.hasAccount', 'Already have an account?')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('auth.login', 'Sign In')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.noAccount', "Don't have an account?")}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('auth.register', 'Sign Up')}
                  </button>
                </>
              )}
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button variant="outline" asChild>
                <a href={`${BOOKING_SITE_URL}/login`}>Go to BookBilliard Login</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`${BOOKING_SITE_URL}/register`}>Go to BookBilliard Register</a>
              </Button>
            </div>

            {!isRegister && !codeSent && (
              <div className="text-center pt-2 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
