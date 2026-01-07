import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardBody, Button, Heading, Text, Image, Stack, Notification } from 'grommet';
import { Add, Edit, Trash, StatusGood, StatusCritical } from 'grommet-icons';
import * as cueService from '../api/cueService';
import CueFormModal from './CueFormModal';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '/placeholder.png';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '/placeholder.png';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function MyCues() {
  const [myCues, setMyCues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadMyCues();
  }, []);

  const loadMyCues = async () => {
    setLoading(true);
    try {
      console.log('Fetching my cues from API...');
      const cues = await cueService.getMyCues();
      console.log('Received cues:', cues);
      setMyCues(cues);
    } catch (error) {
      console.error('Error loading my cues:', error);
      showMessage('error', 'Failed to load your cue listings: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (cueId) => {
    if (!window.confirm('Are you sure you want to delete this cue listing?')) {
      return;
    }

    try {
      await cueService.deleteCue(cueId);
      setMyCues(myCues.filter(c => c.id !== cueId));
      showMessage('success', 'Cue listing deleted successfully');
    } catch (error) {
      showMessage('error', 'Failed to delete cue listing');
    }
  };

  const handleToggleSold = async (cue) => {
    try {
      const updated = await cueService.updateCue(cue.id, {
        ...cue,
        isSold: !cue.isSold
      });
      setMyCues(myCues.map(c => c.id === cue.id ? updated : c));
      showMessage('success', `Cue marked as ${!cue.isSold ? 'sold' : 'available'}`);
    } catch (error) {
      showMessage('error', 'Failed to update cue status');
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
        <Text size="large" color="text-weak">Loading your cue listings...</Text>
      </Box>
    );
  }

  return (
    <Box gap="large">
      <Box direction="row" justify="between" align="center">
        <Heading level="3" margin="none" style={{ fontSize: '28px', fontWeight: 700 }}>
          📋 My Cue Listings
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

      {myCues.length === 0 ? (
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
            You haven't created any cue listings yet.
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
          {myCues.map(cue => (
            <CueCard
              key={cue.id}
              cue={cue}
              onEdit={() => handleEdit(cue)}
              onDelete={() => handleDelete(cue.id)}
              onToggleSold={() => handleToggleSold(cue)}
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
