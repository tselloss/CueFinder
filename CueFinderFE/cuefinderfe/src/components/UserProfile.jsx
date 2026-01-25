import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, Save, X, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import MyCues from './MyCues';
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';

const AVATAR_OPTIONS = [
  '👤', '😊', '😎', '🎱', '🎯', '⭐', '🔥', '💎', 
  '🎮', '🏆', '👑', '🚀', '💪', '🎨', '🎭', '🦁',
  '🐺', '🦅', '🐉', '🦈', '🐯', '🐻', '🦊', '🐼'
];

export default function UserProfile({ onBack }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
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

  const handleProfileChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setProfile(p => ({
        ...p,
        address: { ...p.address, [addressField]: value }
      }));
    } else {
      setProfile(p => ({ ...p, [field]: value }));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
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
      const errorMessage = getErrorMessage(err, 'Failed to update profile');
      
      if (isValidationError(err)) {
        const validationDetails = formatValidationErrors(err);
        setMessage({ 
          type: 'error', 
          text: validationDetails ? `${errorMessage}\n${validationDetails}` : errorMessage 
        });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4 pt-[7px] pb-[7px]">
          <Button
            variant="outline"
            size="default"
            onClick={onBack || (() => navigate('/'))}
            className="gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold">My Profile</h1>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('myListings')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm ${
              activeTab === 'myListings'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Listings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profile' ? (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl md:text-2xl">Account Information</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Update your profile details' : 'View your account details'}
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="gap-2 w-full sm:w-auto">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
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
                      }}
                      className="gap-2 flex-1 sm:flex-initial"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="gap-2 flex-1 sm:flex-initial"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Avatar Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Profile Avatar
                </Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-5xl md:text-6xl">{profile.avatar}</div>
                  {isEditing && (
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 w-full sm:w-auto">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleProfileChange('avatar', emoji)}
                          className={`text-xl md:text-2xl p-1.5 md:p-2 rounded-md hover:bg-accent transition-colors ${
                            profile.avatar === emoji ? 'bg-accent ring-2 ring-primary' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-base md:text-lg break-words">{profile.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                ) : (
                  <p className="text-base md:text-lg break-all">{profile.email || 'Not set'}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="+1234567890"
                    />
                    <div className="flex items-center space-x-3 mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <input
                        type="checkbox"
                        id="hidePhone"
                        checked={profile.hidePhone}
                        onChange={(e) => handleProfileChange('hidePhone', e.target.checked)}
                        className="h-5 w-5 rounded border-2 border-input checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all"
                      />
                      <label htmlFor="hidePhone" className="text-sm font-medium text-foreground cursor-pointer select-none flex-1">
                        Hide phone number from public listings
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-base md:text-lg">
                    {profile.phone || 'Not set'}
                    {profile.hidePhone && <span className="text-xs md:text-sm text-muted-foreground ml-2">(Hidden)</span>}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={profile.address.street}
                      onChange={(e) => handleProfileChange('address.street', e.target.value)}
                      placeholder="Street address"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={profile.address.city}
                        onChange={(e) => handleProfileChange('address.city', e.target.value)}
                        placeholder="City"
                      />
                      <Input
                        value={profile.address.state}
                        onChange={(e) => handleProfileChange('address.state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={profile.address.postalCode}
                        onChange={(e) => handleProfileChange('address.postalCode', e.target.value)}
                        placeholder="ZIP Code"
                      />
                      <Input
                        value={profile.address.country}
                        onChange={(e) => handleProfileChange('address.country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-base md:text-lg space-y-1">
                    <p className="break-words">{profile.address.street || 'Street not set'}</p>
                    <p>
                      {profile.address.city && profile.address.state 
                        ? `${profile.address.city}, ${profile.address.state}` 
                        : 'City/State not set'}
                    </p>
                    <p>
                      {profile.address.postalCode || ''} {profile.address.country || 'Country not set'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <MyCues />
        )}
      </div>
    </div>
  );
}
