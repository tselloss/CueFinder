import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Alert, Button, Card, Form, ProgressBar, Spinner } from 'react-bootstrap';
import './ResetPassword.css';

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
      <div className="reset-password-container">
        <Card className="reset-password-card">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Validating your reset link...</span>
            </Spinner>
            <p className="text-muted">Validating your reset link...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="reset-password-container">
        <Card className="reset-password-card">
          <Card.Body>
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Invalid Reset Link</Alert.Heading>
              <p>{error}</p>
            </Alert>

            <Button
              variant="primary"
              onClick={() => navigate('/forgot-password')}
              className="w-100"
            >
              Request a New Reset Link
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <Card className="reset-password-card">
          <Card.Body>
            <Alert variant="success" className="mb-4">
              <Alert.Heading>Password Reset Successful!</Alert.Heading>
              <p>
                Your password has been reset securely. You'll be redirected to the login page shortly.
              </p>
            </Alert>

            <div className="text-center">
              <Spinner animation="border" role="status" size="sm" className="mb-3">
                <span className="visually-hidden">Redirecting...</span>
              </Spinner>
              <p className="text-muted">
                Redirecting to login...
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <Card className="reset-password-card">
        <Card.Header className="reset-password-header">
          <h2>Reset Your Password</h2>
          <p className="subtitle">Create a strong new password</p>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* New Password */}
            <Form.Group className="mb-4">
              <Form.Label>New Password</Form.Label>
              <div className="password-input-group">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isResetting}
                  required
                  className="form-control-lg"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isResetting}
                  tabIndex="-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Form.Group>

            {/* Password Strength */}
            {newPassword && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Password Strength</small>
                  <small className={`fw-bold text-${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </small>
                </div>
                <ProgressBar
                  now={passwordStrength}
                  variant={getPasswordStrengthColor()}
                  className="password-strength-bar"
                />
              </div>
            )}

            {/* Password Requirements */}
            <div className="password-requirements mb-4">
              <small className="text-muted d-block mb-2">Password must contain:</small>
              <ul className="requirement-list">
                <li className={newPassword.length >= 8 ? 'valid' : ''}>
                  <i className={`bi bi-${newPassword.length >= 8 ? 'check-circle-fill' : 'circle'}`}></i>
                  At least 8 characters
                </li>
                <li className={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'valid' : ''}>
                  <i className={`bi bi-${/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'check-circle-fill' : 'circle'}`}></i>
                  Both uppercase and lowercase letters
                </li>
                <li className={/\d/.test(newPassword) ? 'valid' : ''}>
                  <i className={`bi bi-${/\d/.test(newPassword) ? 'check-circle-fill' : 'circle'}`}></i>
                  At least one number
                </li>
                <li className={/[^a-zA-Z\d]/.test(newPassword) ? 'valid' : ''}>
                  <i className={`bi bi-${/[^a-zA-Z\d]/.test(newPassword) ? 'check-circle-fill' : 'circle'}`}></i>
                  Special character (optional but recommended)
                </li>
              </ul>
            </div>

            {/* Confirm Password */}
            <Form.Group className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isResetting}
                required
                isInvalid={confirmPassword && newPassword !== confirmPassword}
                className="form-control-lg"
              />
              {confirmPassword && newPassword === confirmPassword && (
                <Form.Text className="text-success d-block mt-1">
                  <i className="bi bi-check-circle"></i> Passwords match
                </Form.Text>
              )}
              {confirmPassword && newPassword !== confirmPassword && (
                <Form.Text className="text-danger d-block mt-1">
                  <i className="bi bi-x-circle"></i> Passwords don't match
                </Form.Text>
              )}
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              disabled={
                isResetting ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 8
              }
              className="w-100 mb-3"
              size="lg"
            >
              {isResetting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </Form>

          <hr className="my-4" />

          <div className="security-note">
            <Alert variant="info" className="mb-0">
              <Alert.Heading className="mb-2">
                <i className="bi bi-info-circle"></i> Security Note
              </Alert.Heading>
              <small>
                After resetting your password, you'll be logged out from all devices for security. 
                You'll need to login again with your new password on all your devices.
              </small>
            </Alert>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
