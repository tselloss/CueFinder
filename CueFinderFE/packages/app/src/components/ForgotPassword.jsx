import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Mail, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedIdentifier, setSubmittedIdentifier] = useState('');
  const [requestCount, setRequestCount] = useState(0);
  const timeoutRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (requestCount >= 5) {
      setError(t('error.tooManyRequests'));
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { emailOrUsername },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      setSubmittedIdentifier(emailOrUsername);
      setSuccess(true);
      setEmailOrUsername('');
      setRequestCount(requestCount + 1);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(t('error.tooManyRequests'));
      } else if (err.code === 'ECONNABORTED') {
        setError(t('error.requestTimeout'));
      } else {
        setError(t('error.genericError'));
      }
      setRequestCount(requestCount + 1);
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">{t('auth.forgotPassword.checkEmail')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.forgotPassword.linkSent')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                {t('auth.forgotPassword.success', { email: submittedIdentifier })}
              </p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                {t('auth.forgotPassword.linkExpires')}
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>{t('auth.forgotPassword.redirecting')}</p>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              {t('auth.forgotPassword.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t('auth.forgotPassword.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.forgotPassword.subtitle')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {t('auth.forgotPassword.emailOrUsername')}
              </label>
              <Input
                type="text"
                placeholder={t('auth.forgotPassword.placeholder')}
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('auth.forgotPassword.helpText')}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendLink')}
            </Button>

            <div className="flex items-center justify-center pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium"
              >
                {t('auth.forgotPassword.backToLogin')}
              </button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
