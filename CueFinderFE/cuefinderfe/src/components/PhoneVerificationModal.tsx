// PhoneVerificationModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import './PhoneVerificationModal.css';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  authToken: string;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  authToken
}) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [method, setMethod] = useState<'Viber' | 'SMS'>('Viber');
  const [code, setCode] = useState(['', '', '', '']);
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [status, setStatus] = useState<any>(null);

  const codeInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Fetch status when token changes
  useEffect(() => {
    if (verificationToken && step === 'code') {
      fetchStatus();
    }
  }, [verificationToken, step]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep('phone');
    setPhoneNumber('');
    setMethod('Viber');
    setCode(['', '', '', '']);
    setVerificationToken('');
    setError('');
    setResendCooldown(0);
    setStatus(null);
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/phone/status/${verificationToken}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch status', err);
    }
  };

  const handleSendVerification = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5000/api/auth/phone/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          method
        })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationToken(data.token);
        setStep('code');
        setResendCooldown(60);
        // Focus first input
        setTimeout(() => codeInputRefs[0].current?.focus(), 100);
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      codeInputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (index === 3 && value && newCode.every(d => d)) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async (codeStr?: string) => {
    const finalCode = codeStr || code.join('');

    if (finalCode.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5000/api/auth/phone/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: verificationToken,
          code: finalCode
        })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // Success!
        onSuccess();
        onClose();
        resetState();
      } else {
        setError(data.message || 'Invalid verification code');
        setCode(['', '', '', '']);
        codeInputRefs[0].current?.focus();
        fetchStatus();
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5000/api/auth/phone/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: verificationToken
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResendCooldown(60);
        setCode(['', '', '', '']);
        codeInputRefs[0].current?.focus();
        fetchStatus();
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setCode(['', '', '', '']);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="phone-verification-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} disabled={loading}>
          ×
        </button>

        {step === 'phone' ? (
          <>
            <h2>Verify Your Phone</h2>
            <p className="subtitle">Enter your phone number to receive a verification code</p>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="phone-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSendVerification()}
              />
            </div>

            <div className="form-group">
              <label>Send via:</label>
              <div className="method-selector">
                <label className={`method-option ${method === 'Viber' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="Viber"
                    checked={method === 'Viber'}
                    onChange={() => setMethod('Viber')}
                    disabled={loading}
                  />
                  <span>📱 Viber</span>
                </label>
                <label className={`method-option ${method === 'SMS' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="SMS"
                    checked={method === 'SMS'}
                    onChange={() => setMethod('SMS')}
                    disabled={loading}
                  />
                  <span>💬 SMS</span>
                </label>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="primary-button"
              onClick={handleSendVerification}
              disabled={loading || !phoneNumber.trim()}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </>
        ) : (
          <>
            <h2>Enter Verification Code</h2>
            <p className="subtitle">
              We sent a 4-digit code to <strong>{phoneNumber}</strong>
            </p>

            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={codeInputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="code-input"
                />
              ))}
            </div>

            {status && (
              <div className="status-info">
                <p>
                  Attempts: {status.attemptCount} / {status.maxAttempts}
                </p>
                <p>
                  Expires: {new Date(status.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button
              className="primary-button"
              onClick={() => handleVerifyCode()}
              disabled={loading || code.some(d => !d)}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              className="secondary-button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0 || !status?.canResend}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Code'}
            </button>

            <button
              className="text-button"
              onClick={handleBackToPhone}
              disabled={loading}
            >
              Change Phone Number
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationModal;
