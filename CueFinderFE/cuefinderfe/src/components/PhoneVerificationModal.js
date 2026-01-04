import React, { useState, useEffect } from 'react';
import './PhoneVerificationModal.css';

const PhoneVerificationModal = ({ 
  isOpen, 
  onClose, 
  onVerified,
  phoneNumber,
  userId 
}) => {
  const [step, setStep] = useState('phone'); // 'phone', 'code', 'success', 'error'
  const [phone, setPhone] = useState(phoneNumber || '');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [verificationToken, setVerificationToken] = useState('');
  const [method, setMethod] = useState('Viber');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (expiresAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = Math.floor((expires - now) / 1000);
        if (diff <= 0) {
          setError('Verification code expired. Please request a new one.');
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  const handleSendVerification = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/phone/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: phone,
          method: method
        })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationToken(data.token);
        setExpiresAt(data.expiresAt);
        setStep('code');
        setCountdown(60); // 60 seconds cooldown for resend
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error sending verification:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/phone/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: verificationToken,
          code: code
        })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setStep('success');
        setTimeout(() => {
          onVerified && onVerified();
          handleClose();
        }, 2000);
      } else {
        setAttemptCount(attemptCount + 1);
        setError(data.message || 'Invalid verification code');
        setVerificationCode(['', '', '', '']);
        
        if (attemptCount + 1 >= maxAttempts) {
          setError('Maximum attempts exceeded. Please request a new code.');
          setTimeout(() => {
            setStep('phone');
            setAttemptCount(0);
          }, 3000);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error verifying code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/phone/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: verificationToken
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(60);
        setError('');
        alert('Verification code resent successfully!');
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error resending code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`).focus();
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhone(phoneNumber || '');
    setVerificationCode(['', '', '', '']);
    setVerificationToken('');
    setError('');
    setCountdown(0);
    setAttemptCount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="phone-verification-modal-overlay" onClick={handleClose}>
      <div className="phone-verification-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>×</button>
        
        {step === 'phone' && (
          <div className="verification-step">
            <h2>📱 Verify Your Phone</h2>
            <p>We'll send you a verification code via {method}</p>
            
            <div className="method-selector">
              <button 
                className={method === 'Viber' ? 'method-btn active' : 'method-btn'}
                onClick={() => setMethod('Viber')}
              >
                Viber
              </button>
              <button 
                className={method === 'SMS' ? 'method-btn active' : 'method-btn'}
                onClick={() => setMethod('SMS')}
              >
                SMS
              </button>
            </div>

            <input
              type="tel"
              className="phone-input"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              className="primary-btn"
              onClick={handleSendVerification}
              disabled={loading || !phone}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="verification-step">
            <h2>🔐 Enter Verification Code</h2>
            <p>We sent a 4-digit code to {phone}</p>
            <p className="method-info">via {method}</p>
            
            <div className="code-inputs">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  maxLength="1"
                  className="code-input"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <div className="attempts-info">
              Attempts: {attemptCount} / {maxAttempts}
            </div>

            <button 
              className="primary-btn"
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.join('').length !== 4}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button 
              className="secondary-btn"
              onClick={handleResendCode}
              disabled={loading || countdown > 0}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>

            <button 
              className="text-btn"
              onClick={() => setStep('phone')}
              disabled={loading}
            >
              Change Phone Number
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="verification-step success">
            <div className="success-icon">✓</div>
            <h2>Phone Verified!</h2>
            <p>Your phone number has been successfully verified.</p>
          </div>
        )}

        {step === 'error' && (
          <div className="verification-step error">
            <div className="error-icon">✗</div>
            <h2>Verification Failed</h2>
            <p>{error}</p>
            <button className="primary-btn" onClick={() => setStep('phone')}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationModal;
