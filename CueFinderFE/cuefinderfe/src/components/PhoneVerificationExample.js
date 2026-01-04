import React, { useState } from 'react';
import PhoneVerificationModal from './PhoneVerificationModal';

/**
 * Example: How to integrate Phone Verification Modal into your component
 * 
 * Usage in UserProfile.js or any other component:
 */

const ExampleUsage = () => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [user, setUser] = useState({
    id: 1,
    phone: '+1234567890',
    isPhoneVerified: false
  });

  const handlePhoneVerified = () => {
    // Update user state to reflect verification
    setUser(prev => ({ ...prev, isPhoneVerified: true }));
    console.log('Phone verified successfully!');
  };

  return (
    <div>
      {/* Button to open verification modal */}
      <div className="phone-verification-section">
        <div className="info-item">
          <label>Phone Number</label>
          <p>
            {user.phone}
            {user.isPhoneVerified ? (
              <span className="verified-badge">✓ Verified</span>
            ) : (
              <span className="unverified-badge">⚠ Not Verified</span>
            )}
          </p>
        </div>
        
        {!user.isPhoneVerified && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowVerificationModal(true)}
          >
            Verify Phone Number
          </button>
        )}
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handlePhoneVerified}
        phoneNumber={user.phone}
        userId={user.id}
      />
    </div>
  );
};

export default ExampleUsage;

/**
 * CSS Styles to add to your component's CSS file:
 * 
 * .phone-verification-section {
 *   margin: 20px 0;
 * }
 * 
 * .verified-badge {
 *   color: #4CAF50;
 *   font-weight: 600;
 *   margin-left: 8px;
 *   font-size: 14px;
 * }
 * 
 * .unverified-badge {
 *   color: #ff9800;
 *   font-weight: 600;
 *   margin-left: 8px;
 *   font-size: 14px;
 * }
 */
