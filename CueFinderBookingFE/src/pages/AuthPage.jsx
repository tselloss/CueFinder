import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { CUEFINDER_SITE_URL } from '../config/siteConfig.js';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: ''
};

export default function AuthPage() {
  const { login, register, sendSms, verifySms } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState(emptyAddress);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [wantsClubOwner, setWantsClubOwner] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [code, setCode] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!codeSent) {
          if (!phone) throw new Error(t('auth.error.smsRequired'));
          if (!acceptedTerms) throw new Error(t('auth.error.acceptTermsRequired'));

          await register(username, password, name, phone, email, address, acceptedTerms, wantsClubOwner);
          const response = await sendSms(phone, 'SMS');
          if (!response?.token) throw new Error(t('auth.error.verificationTokenMissing'));
          setVerificationToken(response.token);
          setCodeSent(true);
          return;
        }

        if (!code) throw new Error(t('auth.error.codeRequired'));
        const result = await verifySms(verificationToken, code);
        if (!result?.verified) throw new Error(t('auth.error.codeInvalid'));

        navigate('/', { replace: true });
      } else {
        await login(username, password);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err?.message || t('auth.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card border-2 border-primary/20 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isRegister ? t('auth.createAccount') : t('auth.welcomeBack')}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegister ? t('auth.signUpToStart') : t('auth.signInToAccount')}
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
                  <p className="text-sm text-primary">{t('auth.verificationSent')}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.verificationCode')}</label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('auth.enterVerificationCode')}
                    required
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t('auth.usernameOrEmail')}
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('auth.usernamePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t('auth.password')}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                </div>

                {isRegister && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {t('auth.fullName')}
                      </label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('auth.fullNamePlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {t('auth.email')}
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {t('auth.mobilePhone')}
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('auth.phonePlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {t('auth.address')}
                      </label>
                      <Input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                        placeholder={t('auth.streetPlaceholder')}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder={t('auth.cityPlaceholder')}
                        />
                        <Input
                          type="text"
                          value={address.state}
                          onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder={t('auth.regionPlaceholder')}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                          placeholder={t('auth.postalCodePlaceholder')}
                        />
                        <Input
                          type="text"
                          value={address.country}
                          onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                          placeholder={t('auth.countryPlaceholder')}
                        />
                      </div>
                    </div>

                    <label className="mt-2 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 h-5 w-5 sm:h-4 sm:w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t('auth.acceptTermsPrefix')}{' '}
                        <a
                          href={`${CUEFINDER_SITE_URL}/terms-en.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          {t('auth.termsLink')}
                        </a>
                      </span>
                    </label>

                    <label className="mt-2 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsClubOwner}
                        onChange={(e) => setWantsClubOwner(e.target.checked)}
                        className="mt-1 h-5 w-5 sm:h-4 sm:w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {t('auth.registerOwner')}
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  {t('common.loading')}
                </span>
              ) : codeSent ? (
                t('auth.verify')
              ) : isRegister ? (
                t('auth.submitRegister')
              ) : (
                t('auth.submitLogin')
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  {t('auth.alreadyHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('auth.submitLogin')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('auth.signUp')}
                  </button>
                </>
              )}
            </div>

            {!isRegister && !codeSent && (
              <div className="text-center pt-2 border-t">
                <a
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium"
                >
                  {t('auth.forgotPassword')}
                </a>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
