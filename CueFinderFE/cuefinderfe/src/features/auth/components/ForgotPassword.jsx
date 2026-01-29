import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import './ForgotPassword.css';

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
      <div className="forgot-password-container">
        <Card className="forgot-password-card">
          <Card.Body>
            <Alert variant="success" className="mb-4">
              <Alert.Heading>Check Your Email</Alert.Heading>
              <p>
                If an account exists with that email or username, you'll receive a password reset link shortly.
              </p>
              <hr />
              <small>
                The reset link will expire in 30 minutes for security reasons.
                <br />
                If you don't see it, check your spam folder.
              </small>
            </Alert>

            <div className="text-center">
              <p className="text-muted mb-3">
                Redirecting to login in a few seconds...
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <Card className="forgot-password-card">
        <Card.Header className="forgot-password-header">
          <h2>Forgot Password</h2>
          <p className="subtitle">
            No worries! We'll help you reset your password securely.
          </p>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Email Address or Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
                className="form-control-lg"
              />
              <Form.Text className="text-muted d-block mt-2">
                We'll verify your account and send a secure reset link.
              </Form.Text>
            </Form.Group>

            {requestCount > 2 && (
              <Alert variant="warning" className="mb-3">
                <small>
                  We're monitoring multiple requests for security. If you didn't request these, 
                  you can secure your account by {' '}
                  <a href="/support">contacting our support team</a>.
                </small>
              </Alert>
            )}

            <Button
              variant="primary"
              type="submit"
              disabled={isLoading || !emailOrUsername.trim()}
              className="w-100 mb-3"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Form>

          <div className="text-center">
            <small className="text-muted">
              Remember your password?{' '}
              <a href="/login" className="text-decoration-none fw-bold">
                Back to Login
              </a>
            </small>
          </div>

          <hr className="my-4" />

          <div className="security-info">
            <h6 className="mb-3">
              <i className="bi bi-shield-check"></i> Security Information
            </h6>
            <ul className="security-list">
              <li>Reset links expire after 30 minutes</li>
              <li>Links can only be used once</li>
              <li>We never store plain passwords</li>
              <li>All requests are logged for security</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
