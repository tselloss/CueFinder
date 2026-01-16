import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Box, Button, Heading, Text, Card, CardBody, Form, FormField, TextInput, Tabs, Tab, CheckBox } from 'grommet';
import { FormPrevious, User, Mail, Phone, MapLocation, Location, Edit } from 'grommet-icons';
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
      <Box fill align="center" justify="center">
        <Text>Loading profile...</Text>
      </Box>
    );
  }

  return (
    <Box fill background="background" pad={{ horizontal: 'medium', vertical: 'large' }}>
      <Box 
        direction="row" 
        align="center" 
        gap="medium" 
        margin={{ bottom: 'large' }}
      >
        <Button 
          icon={<FormPrevious size="20px" />} 
          label={<Text weight={500}>Back</Text>}
          onClick={onBack}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '10px 20px'
          }}
          hoverIndicator
        />
        <Heading level="2" margin="none" style={{ fontSize: '32px', fontWeight: 700 }}>
          👤 My Profile
        </Heading>
      </Box>

      {message && (
        <Box 
          margin={{ bottom: 'medium' }}
          background={message.type === 'success' ? 'status-ok' : 'status-error'}
          pad="medium"
          round="medium"
          elevation="small"
        >
          <Text color="white" weight={500}>
            {message.type === 'success' ? '✅ ' : '⚠️ '}{message.text}
          </Text>
        </Box>
      )}

      <Box>
        <Tabs 
          activeIndex={activeTab === 'profile' ? 0 : 1} 
          onActive={(index) => setActiveTab(index === 0 ? 'profile' : 'myListings')}
          style={{ marginBottom: '24px' }}
        >
          <Tab 
            title={
              <Text weight={600} size="medium" style={{ padding: '12px 24px' }}>
                ⚙️ Profile Settings
              </Text>
            }
          >
            <Box pad="medium">
              {!isEditing ? (
                // View Mode
                <Box gap="large">
                  <Card 
                    background="background-front" 
                    elevation="medium"
                    round="medium"
                    style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
                  >
                    <CardBody pad="large">
                      <Box direction="row" justify="between" align="center" margin={{ bottom: 'large' }}>
                        <Heading level="3" margin="none" style={{ fontSize: '24px', fontWeight: 600 }}>
                          Account Information
                        </Heading>
                        <Button 
                          icon={<Edit size="18px" />} 
                          label={<Text weight={600}>Edit Profile</Text>}
                          onClick={() => setIsEditing(true)}
                          primary
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            border: 'none'
                          }}
                        />
                      </Box>
                      <Box gap="medium">
                        <Box 
                          direction="row" 
                          justify="between" 
                          align="center"
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Avatar</Text>
                          <Text style={{ fontSize: '48px' }}>{profile.avatar || '👤'}</Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Name</Text>
                          <Text color="text-strong" size="medium" weight={500}>{profile.name}</Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Email</Text>
                          <Text color="text-strong" size="medium" weight={500}>{profile.email}</Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Phone</Text>
                          <Box align="end">
                            <Text color="text-strong" size="medium" weight={500}>
                              {profile.phone || 'Not provided'}
                            </Text>
                            <Text size="small" color="text-weak">
                              {profile.hidePhone ? 'Hidden from other users' : 'Visible to other users'}
                            </Text>
                          </Box>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Location</Text>
                          <Text color="text-strong" size="medium" weight={500}>
                            {profile.location || 'Not provided'}
                          </Text>
                        </Box>
                      </Box>
                    </CardBody>
                  </Card>

                  <Card 
                    background="background-front" 
                    elevation="medium"
                    round="medium"
                    style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
                  >
                    <CardBody pad="large">
                      <Heading level="3" margin={{ bottom: 'large' }} style={{ fontSize: '24px', fontWeight: 600 }}>
                        📍 Address
                      </Heading>
                      <Box gap="medium">
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Street</Text>
                          <Text color="text-strong" size="medium" weight={500}>
                            {profile.address.street || 'Not provided'}
                          </Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">City</Text>
                          <Text color="text-strong" size="medium" weight={500}>
                            {profile.address.city || 'Not provided'}
                          </Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">State/Province</Text>
                          <Text color="text-strong" size="medium" weight={500}>
                            {profile.address.state || 'Not provided'}
                          </Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          border={{ side: 'bottom', color: 'border' }} 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Postal Code</Text>
                          <Text color="text-strong" size="medium" weight={500}>
                            {profile.address.postalCode || 'Not provided'}
                          </Text>
                        </Box>
                        <Box 
                          direction="row" 
                          justify="between" 
                          pad={{ vertical: 'medium' }}
                        >
                          <Text weight={600} color="text-weak" size="medium">Country</Text>
                          <Text color="text-strong" size="medium" weight={500}>
                            {profile.address.country || 'Not provided'}
                          </Text>
                        </Box>
                      </Box>
                    </CardBody>
                  </Card>
                </Box>
              ) : (
                // Edit Mode
                <Card 
                  background="background-front" 
                  elevation="medium"
                  round="medium"
                  style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
                >
                  <CardBody pad="large">
                    <Form onSubmit={handleSaveProfile} validate="submit">
                      <Heading level="3" margin={{ bottom: 'large' }} style={{ fontSize: '24px', fontWeight: 600 }}>
                        ✏️ Edit Account Information
                      </Heading>
                      
                      <FormField label="Choose Your Avatar">
                        <Box gap="small">
                          <Box 
                            align="center" 
                            pad="medium" 
                            background="background-back"
                            round="medium"
                            border={{ color: 'border', size: 'small' }}
                          >
                            <Text style={{ fontSize: '64px' }}>{profile.avatar || '👤'}</Text>
                          </Box>
                          <Box 
                            direction="row" 
                            wrap 
                            gap="xsmall" 
                            pad="small"
                            background="background-back"
                            round="small"
                          >
                            {AVATAR_OPTIONS.map((avatar) => (
                              <Button
                                key={avatar}
                                plain
                                onClick={() => {
                                  setProfile(p => ({ ...p, avatar }));
                                }}
                                style={{
                                  fontSize: '32px',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  border: profile.avatar === avatar ? '3px solid #3b82f6' : '2px solid transparent',
                                  background: profile.avatar === avatar ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                  transition: 'all 0.2s ease'
                                }}
                                hoverIndicator={{ background: 'rgba(59, 130, 246, 0.1)' }}
                              >
                                {avatar}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      </FormField>

                      <FormField 
                        label={
                          <Box direction="row" gap="xsmall" align="center">
                            <User size="16px" />
                            <Text>Name</Text>
                          </Box>
                        }
                        name="name" 
                        required
                      >
                        <TextInput
                          name="name"
                          value={profile.name || ''}
                          onChange={handleProfileChange}
                          placeholder="Your full name"
                          required
                        />
                      </FormField>

                      <FormField 
                        label={
                          <Box direction="row" gap="xsmall" align="center">
                            <Mail size="16px" />
                            <Text>Email</Text>
                          </Box>
                        }
                        name="email" 
                        required
                      >
                        <TextInput
                          type="email"
                          name="email"
                          value={profile.email || ''}
                          onChange={handleProfileChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </FormField>

                      <FormField 
                        label={
                          <Box direction="row" gap="xsmall" align="center">
                            <Phone size="16px" />
                            <Text>Phone</Text>
                          </Box>
                        }
                        name="phone" 
                        required
                      >
                        <TextInput
                          name="phone"
                          value={profile.phone || ''}
                          onChange={handleProfileChange}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </FormField>

                      <CheckBox
                        label="Hide my phone from other users"
                        checked={profile.hidePhone}
                        onChange={(e) => handleHidePhoneChange(e.target.checked)}
                        toggle
                        margin={{ bottom: 'medium' }}
                      />

                      <FormField 
                        label={
                          <Box direction="row" gap="xsmall" align="center">
                            <Location size="16px" />
                            <Text>Location (City/General Area)</Text>
                          </Box>
                        }
                        name="location" 
                        required
                      >
                        <TextInput
                          name="location"
                          value={profile.location || ''}
                          onChange={handleProfileChange}
                          placeholder="e.g., New York, NY"
                          required
                        />
                      </FormField>

                      <Heading level="3" margin={{ top: 'large', bottom: 'large' }} style={{ fontSize: '24px', fontWeight: 600 }}>
                        📍 Address Details
                      </Heading>
                      
                      <FormField 
                        label={
                          <Box direction="row" gap="xsmall" align="center">
                            <Location size="16px" />
                            <Text>Street Address</Text>
                          </Box>
                        }
                        name="address.street"
                      >
                        <TextInput
                          name="address.street"
                          value={profile.address.street || ''}
                          onChange={handleProfileChange}
                          placeholder="123 Main Street"
                        />
                      </FormField>

                      <Box direction="row" gap="small">
                        <FormField label="City" name="address.city" flex>
                          <TextInput
                            name="address.city"
                            value={profile.address.city || ''}
                            onChange={handleProfileChange}
                            placeholder="City name"
                          />
                        </FormField>

                        <FormField label="State/Province" name="address.state" flex>
                          <TextInput
                            name="address.state"
                            value={profile.address.state || ''}
                            onChange={handleProfileChange}
                            placeholder="State/Province"
                          />
                        </FormField>
                      </Box>

                      <Box direction="row" gap="small">
                        <FormField label="Postal Code" name="address.postalCode" flex>
                          <TextInput
                            name="address.postalCode"
                            value={profile.address.postalCode || ''}
                            onChange={handleProfileChange}
                            placeholder="12345"
                          />
                        </FormField>

                        <FormField 
                          label={
                            <Box direction="row" gap="xsmall" align="center">
                              <MapLocation size="16px" />
                              <Text>Country</Text>
                            </Box>
                          }
                          name="address.country" 
                          flex
                        >
                          <TextInput
                            name="address.country"
                            value={profile.address.country || ''}
                            onChange={handleProfileChange}
                            placeholder="Country"
                          />
                        </FormField>
                      </Box>

                      <Box direction="row" gap="medium" margin={{ top: 'large' }}>
                        <Button 
                          label={<Text weight={500}>Cancel</Text>}
                          onClick={() => setIsEditing(false)}
                          style={{
                            background: 'transparent',
                            border: '2px solid rgba(51, 65, 85, 0.3)',
                            borderRadius: '8px',
                            padding: '12px 24px'
                          }}
                        />
                        <Button 
                          type="submit" 
                          primary 
                          label={<Text weight={600}>{loading ? 'Saving...' : 'Save Changes'}</Text>}
                          disabled={loading}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            borderRadius: '8px',
                            padding: '12px 32px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            border: 'none'
                          }}
                        />
                      </Box>
                    </Form>
                  </CardBody>
                </Card>
              )}
            </Box>
          </Tab>
          
          <Tab 
            title={
              <Text weight={600} size="medium" style={{ padding: '12px 24px' }}>
                📋 My Listings
              </Text>
            }
          >
            <Box pad="medium">
              <MyCues />
            </Box>
          </Tab>
        </Tabs>
      </Box>
    </Box>
  );
}
