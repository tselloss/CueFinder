import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/button';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit2 } from 'lucide-react';
import MyCues from './MyCues';
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';

// Available avatar options
const AVATAR_OPTIONS = [
  '👤', '😊', '😎', '🎱', '🎯', '⭐', '🔥', '💎', 
  '🎮', '🏆', '👑', '🚀', '💪', '🎨', '🎭', '🦁',
  '🐺', '🦅', '🐉', '🦈', '🐯', '🐻', '🦊', '🐼'
];

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
    hidePhone: user?.hidePhone || false,
    location: user?.location || '',
    avatar: user?.avatar || '👤',
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
        hidePhone: user.hidePhone || false,
        location: user.location || '',
        avatar: user.avatar || '👤',
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

  const handleHidePhoneChange = (checked) => {
    setProfile(p => ({ ...p, hidePhone: checked }));
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
        hidePhone: profile.hidePhone,
        location: profile.location,
        avatar: profile.avatar,
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
      
      // Use error utility to extract proper message from Problem Details
      const errorMessage = getErrorMessage(err, 'Failed to update profile');
      
      // If there are validation errors, add them
      if (isValidationError(err)) {
        const validationDetails = formatValidationErrors(err);
        if (validationDetails) {
          setMessage({ type: 'error', text: `${errorMessage}\n${validationDetails}` });
        } else {
          setMessage({ type: 'error', text: errorMessage });
        }
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  // If no user, show loading or redirect
  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back
        </Button>
        <h1 className="text-3xl font-bold">👤 My Profile</h1>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-semibold">
            {message.type === 'success' ? '✅ ' : '⚠️ '}{message.text}
          </p>
        </div>
      )}

      <div>
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('profile')}
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            className="flex items-center gap-2 transition-all duration-200"
          >
            ⚙️ <span className="hidden sm:inline">Profile Settings</span><span className="sm:hidden">Profile</span>
          </Button>
          <Button
            onClick={() => setActiveTab('myListings')}
            variant={activeTab === 'myListings' ? 'default' : 'outline'}
            className="flex items-center gap-2 transition-all duration-200"
          >
            📋 <span className="hidden sm:inline">My Listings</span><span className="sm:hidden">Listings</span>
          </Button>
        </div>
        {activeTab === 'profile' && (
          <div className="p-4">
              {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold">Account Information</h3>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit2 size={18} />
                      Edit Profile
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">Avatar</p>
                      <p className="text-5xl">{profile.avatar || '👤'}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">Name</p>
                      <p className="text-gray-800 font-medium">{profile.name}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">Email</p>
                      <p className="text-gray-800 font-medium">{profile.email}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">Phone</p>
                      <div className="text-right">
                        <p className="text-gray-800 font-medium">
                          {profile.phone || 'Not provided'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {profile.hidePhone ? 'Hidden from other users' : 'Visible to other users'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <p className="font-semibold text-gray-600">Location</p>
                      <p className="text-gray-800 font-medium">
                        {profile.location || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-2xl font-semibold mb-6">📍 Address</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">Street</p>
                      <p className="text-gray-800 font-medium">
                        {profile.address.street || 'Not provided'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">City</p>
                      <p className="text-gray-800 font-medium">
                        {profile.address.city || 'Not provided'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">State/Province</p>
                      <p className="text-gray-800 font-medium">
                        {profile.address.state || 'Not provided'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <p className="font-semibold text-gray-600">Postal Code</p>
                      <p className="text-gray-800 font-medium">
                        {profile.address.postalCode || 'Not provided'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <p className="font-semibold text-gray-600">Country</p>
                      <p className="text-gray-800 font-medium">
                        {profile.address.country || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <h3 className="text-2xl font-semibold">✏️ Edit Account Information</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Choose Your Avatar</label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-7xl">{profile.avatar || '👤'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                        {AVATAR_OPTIONS.map((avatar) => (
                          <button
                            key={avatar}
                            type="button"
                            onClick={() => {
                              setProfile(p => ({ ...p, avatar }));
                            }}
                            className={`text-3xl p-2 rounded-lg transition-all border-2 ${
                              profile.avatar === avatar
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-transparent hover:bg-gray-100'
                            }`}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User size={16} />
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name || ''}
                      onChange={handleProfileChange}
                      placeholder="Your full name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email || ''}
                      onChange={handleProfileChange}
                      placeholder="your.email@example.com"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} />
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone || ''}
                      onChange={handleProfileChange}
                      placeholder="+1 (555) 123-4567"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <label className="flex items-center gap-3 mb-6">
                    <input
                      type="checkbox"
                      checked={profile.hidePhone}
                      onChange={(e) => handleHidePhoneChange(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Hide my phone from other users</span>
                  </label>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      Location (City/General Area) *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={profile.location || ''}
                      onChange={handleProfileChange}
                      placeholder="e.g., New York, NY"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <h3 className="text-2xl font-semibold mt-8 mb-6">📍 Address Details</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={profile.address.street || ''}
                      onChange={handleProfileChange}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={profile.address.city || ''}
                        onChange={handleProfileChange}
                        placeholder="City name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
                      <input
                        type="text"
                        name="address.state"
                        value={profile.address.state || ''}
                        onChange={handleProfileChange}
                        placeholder="State/Province"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="address.postalCode"
                        value={profile.address.postalCode || ''}
                        onChange={handleProfileChange}
                        placeholder="12345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin size={16} />
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={profile.address.country || ''}
                        onChange={handleProfileChange}
                        placeholder="Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          )}
        {activeTab === 'myListings' && (
          <div className="p-4">
            <MyCues />
          </div>
        )}
      </div>
    </div>
  );
}
