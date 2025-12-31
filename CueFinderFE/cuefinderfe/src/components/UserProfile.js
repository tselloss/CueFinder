import React, { useState, useEffect } from 'react';
import * as cueService from '../api/cueService';
import { useAuth } from '../auth/AuthContext';

export default function UserProfile({ onBack }) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'myClues'
  const [userCues, setUserCues] = useState([]);
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
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || '',
    },
  });

  // Load user's cues on mount
  useEffect(() => {
    if (activeTab === 'myClues') {
      loadUserCues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadUserCues = async () => {
    setLoading(true);
    try {
      const cues = await cueService.getCues();
      // Filter cues for current user (assuming seller_name matches user name)
      const userCuesList = cues.filter(c => c.seller_name === user?.name);
      setUserCues(userCuesList);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load your cues' });
    }
    setLoading(false);
  };

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
    try {
      // Update user in context
      await updateUser({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        address: profile.address,
      });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
    setLoading(false);
  };

  const handleDeleteCue = async (cueId) => {
    if (!window.confirm('Are you sure you want to delete this cue?')) return;
    
    setLoading(true);
    try {
      await cueService.deleteCue(cueId);
      setUserCues(userCues.filter(c => c.id !== cueId));
      setMessage({ type: 'success', text: 'Cue deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete cue' });
    }
    setLoading(false);
  };

  const handleEditCue = (cueId) => {
    // TODO: Navigate to edit cue page or open edit modal
    console.log('Edit cue:', cueId);
  };

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
          className={`tab-btn ${activeTab === 'myClues' ? 'active' : ''}`}
          onClick={() => setActiveTab('myClues')}
        >
          My Cues ({userCues.length})
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

      {/* My Cues Tab */}
      {activeTab === 'myClues' && (
        <div className="profile-content">
          {loading && <p className="loading">Loading your cues...</p>}
          
          {!loading && userCues.length === 0 ? (
            <div className="empty-state">
              <p>You haven't posted any cues yet.</p>
              <p className="muted">Start by adding your first billiard cue to the marketplace!</p>
            </div>
          ) : (
            <div className="my-cues-list">
              {userCues.map(cue => (
                <div key={cue.id} className="my-cue-item">
                  <div className="cue-thumbnail">
                    {cue.images && cue.images[0] && (
                      <img src={cue.images[0]} alt={cue.title} />
                    )}
                  </div>
                  
                  <div className="cue-info">
                    <h4>{cue.title || cue.brand}</h4>
                    <p className="cue-brand">{cue.brand}</p>
                    <div className="cue-details">
                      <span className="price">${(cue.price || 0).toFixed(2)}</span>
                      <span className={`status ${cue.is_sold ? 'sold' : 'available'}`}>
                        {cue.is_sold ? 'SOLD' : 'AVAILABLE'}
                      </span>
                      {cue.condition && <span className="condition">{cue.condition}</span>}
                    </div>
                  </div>

                  <div className="cue-actions">
                    <button
                      className="btn small"
                      onClick={() => handleEditCue(cue.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn small danger"
                      onClick={() => handleDeleteCue(cue.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
