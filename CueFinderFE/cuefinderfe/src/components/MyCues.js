import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Card, CardBody, Button, Heading, Text, Image, Stack } from 'grommet';
import { Add, Edit, Trash, StatusGood, StatusCritical } from 'grommet-icons';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import CueFormModal from './CueFormModal';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '/placeholder.png';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '/placeholder.png';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // Uploaded files are served at /uploads/* on the public site (proxied to backend)
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function MyCues() {
  const [myListings, setMyListings] = useState([]); // cues + cases
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [message, setMessage] = useState(null);

  const loadMyCues = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching my listings from API...');
      const [cues, cases] = await Promise.all([
        cueService.getMyCues(),
        cueCaseService.getMyCueCases()
      ]);
      const cuesWithCategory = (cues || []).map(c => ({ ...c, category: 'cue' }));
      const casesWithCategory = (cases || []).map(cs => ({ ...cs, category: 'case' }));
      const combined = [...cuesWithCategory, ...casesWithCategory];
      console.log('Received listings:', { cues: cuesWithCategory.length, cases: casesWithCategory.length, total: combined.length });
      setMyListings(combined);
    } catch (error) {
      console.error('Error loading my cues:', error);
      showMessage('error', 'Failed to load your cue listings: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyCues();
  }, [loadMyCues]);

  // loadMyCues defined above with useCallback

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreateNew = () => {
    setEditingCue(null);
    setShowCreateModal(true);
  };

  const handleEdit = (cue) => {
    setEditingCue(cue);
    setShowCreateModal(true);
  };

  const handleDelete = async (item) => {
    const itemType = item.category === 'case' ? 'case' : 'cue';
    if (!window.confirm(`Are you sure you want to delete this ${itemType} listing?`)) {
      return;
    }

    try {
      if (item.category === 'case') {
        await cueCaseService.deleteCueCase(item.id);
      } else {
        await cueService.deleteCue(item.id);
      }
      setMyListings(myListings.filter(c => c.id !== item.id));
      showMessage('success', `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} listing deleted successfully`);
    } catch (error) {
      showMessage('error', `Failed to delete ${itemType} listing`);
    }
  };

  const handleToggleSold = async (item) => {
    try {
      let updated;
      if (item.category === 'case') {
        updated = await cueCaseService.updateCueCase(item.id, {
          isSold: !item.isSold
        });
      } else {
        updated = await cueService.updateCue(item.id, {
          isSold: !item.isSold
        });
      }
      setMyListings(myListings.map(c => c.id === item.id ? { ...updated, category: item.category } : c));
      showMessage('success', `Listing marked as ${!item.isSold ? 'sold' : 'available'}`);
    } catch (error) {
      showMessage('error', 'Failed to update listing status');
    }
  };

  const handleSaveCue = async () => {
    setShowCreateModal(false);
    setEditingCue(null);
    await loadMyCues();
    showMessage('success', editingCue ? 'Cue updated successfully' : 'New cue created successfully');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCue(null);
  };

  if (loading) {
    return (
      <Box align="center" justify="center" pad="large">
        <Text size="large" color="text-weak">Loading your listings...</Text>
      </Box>
    );
  }

  return (
    <Box gap="large">
      <Box direction="row" justify="between" align="center">
        <Heading level="3" margin="none" style={{ fontSize: '28px', fontWeight: 700 }}>
          📋 My Listings
        </Heading>
        <Button 
          primary
          icon={<Add size="18px" />}
          label={<Text weight={600}>Add New Listing</Text>}
          onClick={handleCreateNew}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '8px',
            padding: '12px 24px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            border: 'none'
          }}
        />
      </Box>

      {message && (
        <Box
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

  {myListings.length === 0 ? (
        <Box 
          align="center" 
          justify="center" 
          pad="xlarge" 
          gap="medium"
          background="background-front"
          round="medium"
          elevation="small"
        >
          <Text size="large" color="text-weak" textAlign="center">
            You haven't created any listings yet.
          </Text>
          <Button
            primary
            label={<Text weight={600}>Create Your First Listing</Text>}
            onClick={handleCreateNew}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '8px',
              padding: '12px 24px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              border: 'none'
            }}
          />
        </Box>
      ) : (
        <Grid columns="medium" gap="medium">
          {myListings.map(item => (
            <CueCard
              key={item.id}
              cue={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggleSold={() => handleToggleSold(item)}
            />
          ))}
        </Grid>
      )}

      {showCreateModal && (
        <CueFormModal
          cue={editingCue}
          onClose={handleCloseModal}
          onSave={handleSaveCue}
        />
      )}
    </Box>
  );
}

function CueCard({ cue, onEdit, onDelete, onToggleSold }) {
  const primaryImage = cue.images?.find(img => img.isPrimary) || cue.images?.[0];
  const imageUrl = getImageUrl(primaryImage);

  return (
    <Card
      background="background-front"
      elevation="medium"
      round="medium"
      style={{ 
        border: '1px solid rgba(51, 65, 85, 0.3)',
        opacity: cue.isSold ? 0.8 : 1
      }}
    >
      <Box height="200px" style={{ position: 'relative', overflow: 'hidden' }}>
        <Stack fill>
          <Box fill>
            <Image
              src={imageUrl}
              fit="cover"
              style={{ 
                width: '100%', 
                height: '200px', 
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => e.target.src = '/placeholder.png'}
            />
          </Box>
          {cue.category && (
            <Box 
              background="brand" 
              pad="xsmall" 
              round="small"
              style={{ position: 'absolute', top: '12px', left: '12px' }}
            >
              <Text size="small" weight="bold" color="white">{cue.category === 'case' ? 'Case' : 'Cue'}</Text>
            </Box>
          )}
          {cue.isSold && (
            <Box 
              background="status-error" 
              pad="small" 
              round="small"
              style={{ position: 'absolute', top: '12px', right: '12px' }}
            >
              <Text size="small" weight="bold" color="white">SOLD</Text>
            </Box>
          )}
          {cue.images && cue.images.length > 0 && (
            <Box 
              background={{ color: 'black', opacity: 0.7 }}
              pad="xsmall" 
              round="small"
              style={{ position: 'absolute', bottom: '12px', right: '12px' }}
            >
              <Text size="small" color="white">📷 {cue.images.length}</Text>
            </Box>
          )}
        </Stack>
      </Box>
      
      <CardBody pad="medium">
        <Box gap="small">
          <Text weight="bold" size="large" color="text-strong" truncate style={{ fontSize: '18px' }}>
            {cue.title}
          </Text>
          <Text size="small" color="text-weak" style={{ fontSize: '14px' }}>
            {cue.brand}
          </Text>
          
          <Box direction="row" justify="between" align="center" margin={{ top: 'small' }}>
            <Box 
              background="brand"
              pad={{ horizontal: 'small', vertical: 'xsmall' }}
              round="small"
            >
              <Text weight="bold" size="large" color="white" style={{ fontSize: '20px' }}>
                ${cue.price?.toFixed(2)}
              </Text>
            </Box>
            <Box 
              background="accent-1"
              pad={{ horizontal: 'small', vertical: 'xsmall' }}
              round="small"
            >
              <Text size="small" weight={500} color="white">
                {cue.condition}
              </Text>
            </Box>
          </Box>

          {cue.viewCount !== undefined && (
            <Box direction="row" align="center" gap="xsmall">
              <Text size="small" color="text-weak">👁 {cue.viewCount} views</Text>
            </Box>
          )}
          {cue.location && (
            <Box direction="row" align="center" gap="xsmall">
              <Text size="small" color="text-weak">📍 {cue.location}</Text>
            </Box>
          )}
        </Box>
      </CardBody>
      
      <Box 
        direction="row" 
        gap="small" 
        pad="medium" 
        background="background-back"
        style={{ borderTop: '1px solid rgba(51, 65, 85, 0.3)' }}
      >
        <Button
          icon={<Edit size="16px" />}
          label={<Text size="small" weight={500}>Edit</Text>}
          onClick={onEdit}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            flex: 1
          }}
        />
        <Button
          icon={cue.isSold ? <StatusGood size="16px" /> : <StatusCritical size="16px" />}
          label={<Text size="small" weight={500}>{cue.isSold ? 'Available' : 'Sold'}</Text>}
          onClick={onToggleSold}
          style={{
            background: cue.isSold ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${cue.isSold ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '6px',
            padding: '6px 12px',
            flex: 1
          }}
        />
        <Button
          icon={<Trash size="16px" />}
          onClick={onDelete}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px'
          }}
        />
      </Box>
    </Card>
  );
}
