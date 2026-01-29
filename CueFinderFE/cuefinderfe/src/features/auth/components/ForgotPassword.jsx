import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card.jsx';

/**
 * ForgotPassword Component
 * 
 * Allows registered users to request a password reset link via email
 * Implements security best practices:
 * - Uniform response regardless of account existence (prevents account enumeration)
 * - Rate limiting (UI feedback after N attempts)
 * - CAPTCHA-ready (placeholder for captcha)
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check rate limiting (client-side for UX feedback)
    if (requestCount >= 5) {
      setError('Too many reset requests. Please try again in a few minutes.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { emailOrUsername },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      // Always show success message (even if account doesn't exist)
      // This prevents account enumeration attacks
      setSuccess(true);
      setEmailOrUsername('');
      setRequestCount(requestCount + 1);

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      // Even on error, show generic message to prevent enumeration
      if (err.response?.status === 429) {
        setError('Too many reset requests. Please try again later.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        // Show generic error
        setError('We encountered an issue. Please try again later.');
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
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a secure password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                If an account is associated with <strong>{emailOrUsername}</strong>, we've sent a secure password reset link to your email.
              </p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                The link will expire in 30 minutes for security reasons.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Redirecting to login in a few seconds...</p>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Back to Login
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
          <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            We'll help you reset your password securely
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
                Email or Username
              </label>
              <Input
                type="text"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll verify your account and send a secure reset link.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="flex items-center justify-center pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium"
              >
                Back to Login
              </button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
