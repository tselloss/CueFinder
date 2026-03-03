import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, Save, X, Image, ExternalLink, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import MyCues from './MyCues';
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';

const AVATAR_OPTIONS = [
  '👤', '😊', '😎', '🎱', '🎯', '⭐', '🔥', '💎',
  '🎮', '🏆', '👑', '🚀', '💪', '🎨', '🎭', '🦁',
  '🐺', '🦅', '🐉', '🦈', '🐯', '🐻', '🦊', '🐼'
];

function formatAddress(address) {
  const parts = [
    address.street,
    [address.city, address.state].filter(Boolean).join(', '),
    [address.postalCode, address.country].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : null;
}

function InfoRow({ icon: Icon, label, value, multiline }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{label}</p>
        {value ? (
          multiline ? (
            <p className="text-sm font-medium text-foreground whitespace-pre-line break-words">{value}</p>
          ) : (
            <p className="text-sm font-medium text-foreground break-words">{value}</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground italic">Not set</p>
        )}
      </div>
    </div>
  );
}

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

  const handleCancelEdit = () => {
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
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack || (() => navigate('/'))}
            className="gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        </div>

        {/* Alert */}
        {message && (
          <div className={`p-4 rounded-lg border text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-end gap-1 border-b border-border overflow-x-auto">
          {['profile', 'myListings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-sm rounded-t-md ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary bg-muted/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'profile' ? 'Profile Settings' : 'My Listings'}
            </button>
          ))}
          {user?.id && (
            <Link
              to={`/sellers/${user.id}`}
              className="ml-auto px-4 py-2.5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Profile
            </Link>
          )}
        </div>

        {/* Content */}
        {activeTab === 'profile' ? (
          <Card className="border border-border/60 overflow-hidden">

            {/* Profile Hero */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 bg-muted/20 border-b border-border/40">
              <div className="text-6xl md:text-7xl select-none">{profile.avatar}</div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-xl md:text-2xl font-bold truncate">
                  {profile.name || <span className="text-muted-foreground italic font-normal text-base">No name set</span>}
                </h2>
                <p className="text-sm text-muted-foreground break-all">{profile.email}</p>
                {profile.location && (
                  <p className="flex items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {profile.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="gap-1.5">
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={loading} className="gap-1.5">
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <CardContent className="p-6">
              {!isEditing ? (
                /* ---- VIEW MODE ---- */
                <div>
                  <InfoRow icon={Mail} label="Email" value={profile.email} />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={
                      profile.phone
                        ? profile.hidePhone
                          ? `${profile.phone}  (hidden from public)`
                          : profile.phone
                        : null
                    }
                  />
                  <InfoRow icon={Globe} label="Location" value={profile.location} />
                  <InfoRow
                    icon={MapPin}
                    label="Address"
                    value={formatAddress(profile.address)}
                    multiline
                  />
                </div>
              ) : (
                /* ---- EDIT MODE ---- */
                <div className="space-y-5">

                  {/* Avatar picker */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Image className="h-4 w-4" />
                      Choose Avatar
                    </Label>
                    <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleProfileChange('avatar', emoji)}
                          className={`text-xl p-1.5 rounded-md hover:bg-accent transition-colors ${
                            profile.avatar === emoji ? 'bg-accent ring-2 ring-primary' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="+1234567890"
                    />
                    <div className="flex items-center gap-3 mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <input
                        type="checkbox"
                        id="hidePhone"
                        checked={profile.hidePhone}
                        onChange={(e) => handleProfileChange('hidePhone', e.target.checked)}
                        className="h-4 w-4 rounded border-2 border-input checked:bg-primary cursor-pointer"
                      />
                      <label htmlFor="hidePhone" className="text-sm text-foreground cursor-pointer select-none flex-1">
                        Hide phone number from public listings
                      </label>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      value={profile.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                      placeholder="e.g. Athens, Greece"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    <Input
                      value={profile.address.street}
                      onChange={(e) => handleProfileChange('address.street', e.target.value)}
                      placeholder="Street address"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={profile.address.city}
                        onChange={(e) => handleProfileChange('address.city', e.target.value)}
                        placeholder="City"
                      />
                      <Input
                        value={profile.address.state}
                        onChange={(e) => handleProfileChange('address.state', e.target.value)}
                        placeholder="State / Region"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={profile.address.postalCode}
                        onChange={(e) => handleProfileChange('address.postalCode', e.target.value)}
                        placeholder="ZIP / Postal Code"
                      />
                      <Input
                        value={profile.address.country}
                        onChange={(e) => handleProfileChange('address.country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>

                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <MyCues />
        )}
      </div>
    </div>
  );
}
