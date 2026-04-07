import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';

export default function LoginPage() {
  const { login, register, sendSms, verifySms, externalLogin } = useAuth();
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
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location]);

  // Handle Google OAuth callback
  useEffect(() => {
    // Check for OAuth data in sessionStorage (when redirect happened in main window)
    const oauthData = sessionStorage.getItem('oauth_success');
    
    if (oauthData) {
      sessionStorage.removeItem('oauth_success');
      const data = JSON.parse(oauthData);
      
      const processOAuth = async () => {
        try {
          setGoogleLoading(true);
          await externalLogin(
            data.provider || 'Google',
            data.idToken,
            data.email,
            data.name,
            data.picture || ''
          );
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } catch (err) {
          console.error('Google login error:', err);
          setError(getErrorMessage(err));
        } finally {
          setGoogleLoading(false);
        }
      };
      
      processOAuth();
    }
    
    // Check for OAuth error in sessionStorage
    const oauthError = sessionStorage.getItem('oauth_error');
    if (oauthError) {
      sessionStorage.removeItem('oauth_error');
      setError(t('auth.googleLoginError', 'Google sign-in failed. Please try again.'));
    }
    
    const handleOAuthMessage = async (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth-success' && event.data.provider === 'google') {
        try {
          setGoogleLoading(true);
          await externalLogin(
            'Google',
            event.data.idToken,
            event.data.email,
            event.data.name,
            event.data.picture || ''
          );
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } catch (err) {
          console.error('Google login error:', err);
          setError(getErrorMessage(err));
        } finally {
          setGoogleLoading(false);
        }
      } else if (event.data.type === 'oauth-error') {
        setError(t('auth.googleLoginError', 'Google sign-in failed. Please try again.'));
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [externalLogin, navigate, location, t]);

  const handleGoogleLogin = () => {
    setError(null);
    setGoogleLoading(true);
    
    // Google OAuth configuration
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '390019490259-o1bkohlkn9endfcomlk7t5ao0car57uh.apps.googleusercontent.com';
    const REDIRECT_URI = `${window.location.origin}/oauth-callback`;
    const SCOPE = 'openid email profile';
    
    // Build Google OAuth URL with prompt=consent to force popup
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=id_token token` +
      `&response_mode=fragment` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&nonce=${Date.now()}` +
      `&prompt=select_account`;
    
    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      googleAuthUrl,
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup || popup.closed || typeof popup.closed == 'undefined') {
      setError(t('auth.popupBlocked', 'Popup blocked. Please allow popups for this site.'));
      setGoogleLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (!codeSent) {
          if (!phone) throw new Error('📱 Mobile phone number is required for account verification');
          if (!acceptedTerms) throw new Error(t('registration.terms.required', '✅ You must accept the Terms and Conditions to create an account'));
          
          await register(username, password, name, phone, email, address, acceptedTerms);
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
                    placeholder="Enter username"
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
                    placeholder="Enter password"
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
                        placeholder="Street address"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="City"
                        />
                        <Input
                          type="text"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          placeholder="State"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="ZIP Code"
                        />
                        <Input
                          type="text"
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value })}
                          placeholder="Country"
                        />
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                        {t('registration.terms.accept', 'I accept the')}{' '}
                        <a
                          href={i18n.language === 'gr' ? '/terms-gr.html' : '/terms-en.html'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          {t('registration.terms.link', 'Terms and Conditions')}
                        </a>
                      </label>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || googleLoading}
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

            {!codeSent && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t('auth.orContinueWith', 'Or continue with')}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      {t('auth.loading', 'Loading...')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t('auth.googleLogin', 'Continue with Google')}
                    </span>
                  )}
                </Button>
                
                {/* Google Sign-In Terms Disclaimer */}
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {t('auth.googleTermsDisclaimer', 'By signing in with Google, you agree to our Terms and Conditions')}
                </p>
              </>
            )}

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

            {!isRegister && !codeSent && (
              <div className="text-center pt-2 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium"
                >
                  {t('auth.forgotPassword', 'Forgot your password?')}
                </button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
