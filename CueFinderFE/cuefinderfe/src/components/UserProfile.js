import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import MyCues from './MyCues';

export default function UserProfile({ onBack }) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'myListings'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    address: {
      street: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      postalCode: user?.zipCode || '',
      country: user?.country || '',
    },
  });

  // Sync profile state with user data when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        address: {
          street: user.address || '',
          city: user.city || '',
          state: user.state || '',
          postalCode: user.zipCode || '',
          country: user.country || '',
        },
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setProfile(p => ({
        ...p,
        address: { ...p.address, [field]: value }
      }));
    } else {
      setProfile(p => ({ ...p, [name]: value }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // Clear any previous messages
    
    try {
      // Flatten the address object to match backend expectations
      await updateUser({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        address: profile.address.street,
        city: profile.address.city,
        state: profile.address.state,
        zipCode: profile.address.postalCode,
        country: profile.address.country,
      });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  // If no user, show loading or redirect
  if (!user) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <button className="btn" onClick={onBack}>← Back</button>
          <h2>My Profile</h2>
        </div>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <button className="btn" onClick={onBack}>← Back</button>
        <h2>My Profile</h2>
        <div></div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
        <button
          className={`tab-btn ${activeTab === 'myListings' ? 'active' : ''}`}
          onClick={() => setActiveTab('myListings')}
        >
          My Listings
        </button>
      </div>

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="profile-content">
          {!isEditing ? (
            // View Mode
            <div className="profile-view">
              <div className="profile-section">
                <h3>Account Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{profile.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{profile.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{profile.phone || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <p>{profile.location || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Address</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Street</label>
                    <p>{profile.address.street || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>City</label>
                    <p>{profile.address.city || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>State/Province</label>
                    <p>{profile.address.state || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>Postal Code</label>
                    <p>{profile.address.postalCode || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>Country</label>
                    <p>{profile.address.country || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <button className="btn primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            // Edit Mode
            <form className="profile-form" onSubmit={handleSaveProfile}>
              <fieldset>
                <legend>Account Information</legend>
                
                <label>
                  Name
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </label>

                <label>
                  Location (City/General Area)
                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={handleProfileChange}
                    placeholder="e.g., New York, NY"
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>Address</legend>
                
                <label>
                  Street Address
                  <input
                    type="text"
                    name="address.street"
                    value={profile.address.street}
                    onChange={handleProfileChange}
                    placeholder="123 Main Street"
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    name="address.city"
                    value={profile.address.city}
                    onChange={handleProfileChange}
                  />
                </label>

                <label>
                  State/Province
                  <input
                    type="text"
                    name="address.state"
                    value={profile.address.state}
                    onChange={handleProfileChange}
                  />
                </label>

                <label>
                  Postal Code
                  <input
                    type="text"
                    name="address.postalCode"
                    value={profile.address.postalCode}
                    onChange={handleProfileChange}
                  />
                </label>

                <label>
                  Country
                  <input
                    type="text"
                    name="address.country"
                    value={profile.address.country}
                    onChange={handleProfileChange}
                  />
                </label>
              </fieldset>

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* My Listings Tab */}
      {activeTab === 'myListings' && (
        <div className="profile-content">
          <MyCues />
        </div>
      )}
    </div>
  );
}
