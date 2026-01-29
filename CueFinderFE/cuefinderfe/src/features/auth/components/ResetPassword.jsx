import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card.jsx';

/**
 * ResetPassword Component
 * 
 * Handles secure password reset using a token from email
 * Implements security features:
 * - Token validation before showing form
 * - Password policy enforcement (length, complexity hints)
 * - One-time token usage (prevents replay attacks)
 * - Session invalidation after reset (user must re-login)
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No reset token provided. Please check your email link.');
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        const response = await axios.post(
          `${API_BASE_URL}/auth/validate-reset-token`,
          { token },
          { timeout: 10000 }
        );

        if (response.data?.isValid) {
          setIsValidToken(true);
          setError('');
        } else {
          setError('This reset link is invalid or has expired.');
          setIsValidToken(false);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setError('This reset link has expired or is invalid. Please request a new one.');
        } else {
          setError('Unable to validate your reset link. Please try again.');
        }
        setIsValidToken(false);
        console.error('Token validation error:', err);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, API_BASE_URL]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;

    if (newPassword.length >= 8) strength += 20;
    if (newPassword.length >= 12) strength += 10;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 20;
    if (/\d/.test(newPassword)) strength += 20;
    if (/[^a-zA-Z\d]/.test(newPassword)) strength += 20;
    if (newPassword.length > 0 && newPassword === confirmPassword) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword, confirmPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'danger';
    if (passwordStrength < 60) return 'warning';
    if (passwordStrength < 80) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsResetting(true);

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsResetting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsResetting(false);
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must contain both letters and numbers.');
      setIsResetting(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        {
          token,
          newPassword,
          confirmPassword,
        },
        {
          timeout: 10000
        }
      );

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful. Please login with your new password.' }
        });
      }, 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('This reset link has expired. Please request a new one.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid password. Please check the requirements.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else {
        setError('Unable to reset your password. Please try again later.');
      }
      console.error('Password reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg mb-4 animate-pulse">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="text-center text-muted-foreground">Verifying your reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md border-2 border-destructive/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center shadow-lg">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Link Invalid or Expired</CardTitle>
            <CardDescription className="text-center text-destructive/80">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Lock className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Password Reset Successful</CardTitle>
            <CardDescription className="text-center">
              Your password has been reset. Please log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to Login
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
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Create a strong password to secure your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isResetting}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Password Strength</label>
                  <span className="text-xs font-medium" style={{
                    color: passwordStrength < 30 ? '#ef4444' : passwordStrength < 60 ? '#f59e0b' : passwordStrength < 80 ? '#3b82f6' : '#22c55e'
                  }}>
                    {passwordStrength < 30 ? 'Weak' : passwordStrength < 60 ? 'Fair' : passwordStrength < 80 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300" 
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: passwordStrength < 30 ? '#ef4444' : passwordStrength < 60 ? '#f59e0b' : passwordStrength < 80 ? '#3b82f6' : '#22c55e'
                    }}
                  />
                </div>
                {/* Requirements */}
                <div className="space-y-1 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={newPassword.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>
                      {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-muted-foreground'}>
                      {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? '✓' : '○'} Mix of uppercase & lowercase
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={/\d/.test(newPassword) ? 'text-green-500' : 'text-muted-foreground'}>
                      {/\d/.test(newPassword) ? '✓' : '○'} At least one number
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isResetting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && confirmPassword && (
                <p className={`text-xs font-medium ${newPassword === confirmPassword ? 'text-green-500' : 'text-destructive'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isResetting || !newPassword || newPassword !== confirmPassword || passwordStrength < 60}
            >
              {isResetting ? 'Resetting...' : 'Reset Password'}
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
