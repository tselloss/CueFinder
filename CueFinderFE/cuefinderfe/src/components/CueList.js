import React from 'react';
import { Box, Grid, Card, CardBody, CardHeader, Image, Text, Button, Stack } from 'grommet';
import { Apps, List as ListIcon, Image as ImageIcon } from 'grommet-icons';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';

// Helper to get full image URL from image object
const getImageUrl = (images) => {
  if (!images || images.length === 0) return '';
  // Find primary image first, otherwise use first image
  const primaryImg = images.find(img => {
    if (typeof img === 'object') return img.isPrimary;
    return false;
  });
  const img = primaryImg || images[0];
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // Uploaded files are served at /uploads/* on the public site (proxied to backend)
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

// Image Placeholder Component
const ImagePlaceholder = ({ height = '200px' }) => (
  <Box
    fill
    background="light-2"
    align="center"
    justify="center"
    style={{ height }}
  >
    <ImageIcon size="large" color="light-4" />
    <Text size="small" color="dark-4" margin={{ top: 'small' }}>No Image</Text>
  </Box>
);

export default function CueList({ cues, onSelect, onAdd, query, viewMode, setViewMode, category, condition, cueType, sortBy, priceRange }) {
  const currencySymbol = '€';
  
  console.log(`[CueList] Rendering with cueType prop = "${cueType}", category = "${category}"`);
  
  // Filter by search, category, condition, and cue type
  let filtered = (cues || []).filter((c) => {
    // Text search
    if (query) {
      const q = query.toLowerCase();
      const matchesSearch = (c.title || '').toLowerCase().includes(q) || 
                           (c.brand || '').toLowerCase().includes(q) || 
                           (c.location || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    
    // Category filter (uses itemType injected by App.js: 'cue' or 'case')
    if (category && category !== 'all') {
      if (category === 'cues' && c.itemType !== 'cue') return false;
      if (category === 'cases' && c.itemType !== 'case') return false;
    }
    
    // Condition filter
    if (condition && condition !== 'all' && condition !== 'All Conditions') {
      if (c.condition !== condition) return false;
    }
    
    // Cue Type filter
    // If a CueType is selected, only cues should remain visible.
    // Normalize to support different backend field casing/serialization.
    if (cueType && cueType !== 'all') {
      if (c.itemType !== 'cue') return false;
      const itemCueType = (c.cueType ?? c.cue_type ?? '').toString().toLowerCase();
      const filterCueType = cueType.toLowerCase();
      console.log(`[CueType Filter] Cue: "${c.title}", cueType field: "${c.cueType}", cue_type field: "${c.cue_type}", computed: "${itemCueType}", filter: "${filterCueType}", match: ${itemCueType === filterCueType}`);
      if (itemCueType !== filterCueType) return false;
    }
    
  // Price range filter
  const price = Number(c.price || 0);
    if (Array.isArray(priceRange) && priceRange.length === 2) {
      const [min, max] = priceRange;
      if (price < min) return false;
      if (price > max) return false;
    }

  return true;
  });

  // Sort
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else {
    // newest first (default)
    filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  return (
    <Box width="100%" pad={{ horizontal: 'medium', vertical: 'large', top: 'medium' }} style={{ marginTop: '12px' }}>
      {/* Grid or List view based on viewMode */}
      {viewMode === 'grid' ? (
        <Grid 
          columns={{
            count: 'fit',
            size: ['small', 'medium']
          }}
          gap="large" 
          pad={{ vertical: 'small' }}
        >
  {filtered.map((c) => {
            const displayPrice = Number(c.price || 0);
    return (
            <Card 
              key={c.id} 
        onClick={() => onSelect(c)}
              hoverIndicator
              background="background-front"
              elevation="medium"
              round="medium"
              style={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(51, 65, 85, 0.3)'
              }}
            >
              <CardHeader pad="none" height="200px" style={{ overflow: 'hidden' }}>
                <Stack anchor="top-right" fill>
                  <Box fill style={{ position: 'relative' }}>
                    {getImageUrl(c.images) ? (
                      <Image
                        src={getImageUrl(c.images)}
                        fit="cover"
                        style={{ 
                          width: '100%', 
                          height: '200px', 
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <ImagePlaceholder height="200px" />
                    )}
                  </Box>
                  {(c.isSold || c.is_sold) ? (
                    <Box background="status-error" pad="xsmall" margin="small" round="small">
                      <Text size="small" weight="bold" color="white">SOLD</Text>
                    </Box>
                  ) : c.condition ? (
                    <Box background="accent-1" pad="xsmall" margin="small" round="small">
                      <Text size="small" weight="bold" color="white">{c.condition}</Text>
                    </Box>
                  ) : null}
                </Stack>
              </CardHeader>
              <CardBody pad="medium">
                <Box gap="small">
                  <Text weight="bold" size="large" color="text-strong" truncate style={{ fontSize: '18px' }}>
                    {c.title || c.brand}
                  </Text>
                  <Text size="small" color="text-weak" style={{ fontSize: '14px' }}>
                    {c.brand}
                  </Text>
                  <Box direction="row" align="center" gap="xsmall">
                    <Text size="small" color="text-weak">📍</Text>
                    <Text size="small" color="text-weak">{c.location || 'Unknown'}</Text>
                  </Box>
                  <Box 
                    background="brand"
                    pad={{ horizontal: 'small', vertical: 'xsmall' }}
                    round="small"
                    width="fit-content"
                    margin={{ top: 'small' }}
                  >
                    <Text weight="bold" size="large" color="white" style={{ fontSize: '24px' }}>
                      {currencySymbol}{displayPrice.toFixed(0)}
                    </Text>
                  </Box>
                </Box>
              </CardBody>
            </Card>
          )})}
        </Grid>
      ) : (
        <Box gap="large" pad={{ vertical: 'medium' }}>
  {filtered.map((c) => {
            const displayPrice = Number(c.price || 0);
    return (
            <Card 
              key={c.id} 
              direction="row" 
        onClick={() => onSelect(c)}
              hoverIndicator
              background="background-front"
              pad="medium"
              elevation="medium"
              round="medium"
              style={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(51, 65, 85, 0.3)'
              }}
            >
              <Box 
                width="180px" 
                height="120px" 
                flex={false} 
                round="small" 
                overflow="hidden"
                style={{ position: 'relative' }}
              >
                <Stack fill>
                  <Box fill>
                    {getImageUrl(c.images) ? (
                      <Image
                        src={getImageUrl(c.images)}
                        fit="cover"
                        style={{ 
                          width: '100%', 
                          height: '120px', 
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <ImagePlaceholder height="120px" />
                    )}
                  </Box>
                  {(c.isSold || c.is_sold) ? (
                    <Box 
                      background="status-error" 
                      pad="small" 
                      align="center" 
                      justify="center"
                      style={{ position: 'absolute', top: '8px', right: '8px', borderRadius: '6px' }}
                    >
                      <Text size="small" weight="bold" color="white">SOLD</Text>
                    </Box>
                  ) : c.condition ? (
                    <Box 
                      background="accent-1" 
                      pad="small" 
                      align="center" 
                      justify="center"
                      style={{ position: 'absolute', top: '8px', right: '8px', borderRadius: '6px' }}
                    >
                      <Text size="small" weight="bold" color="white">{c.condition}</Text>
                    </Box>
                  ) : null}
                </Stack>
              </Box>
              <Box pad="small" flex gap="xsmall">
                <Text weight="bold" size="large" color="text-strong" style={{ fontSize: '20px' }}>
                  {c.title || c.brand}
                </Text>
                <Text size="medium" color="text-weak" style={{ fontSize: '14px' }}>
                  {c.brand}
                </Text>
                <Box direction="row" align="center" gap="xsmall">
                  <Text color="text-weak">📍</Text>
                  <Text size="small" color="text-weak">{c.location || 'Unknown'}</Text>
                </Box>
              </Box>
              <Box align="end" justify="center" pad="small">
                <Box 
                  background="brand"
                  pad={{ horizontal: 'medium', vertical: 'small' }}
                  round="medium"
                >
                  <Text weight="bold" size="xxlarge" color="white" style={{ fontSize: '28px' }}>
                    {currencySymbol}{displayPrice.toFixed(0)}
                  </Text>
                </Box>
              </Box>
            </Card>
          )})}
        </Box>
      )}

      {/* Footer with availability and view mode toggle */}
      <Box 
        direction="row" 
        justify="between" 
        align="center" 
        pad="medium" 
        border={{ side: 'top', color: 'border' }}
        margin={{ top: 'medium' }}
        background="background-front"
        round="small"
      >
        <Text size="small" color="text-weak">
          <Text weight="bold" color="text-strong">{filtered.length}</Text>{' '}
          {category === 'cases' ? 'cases' : category === 'cues' ? 'cues' : 'items'} available
        </Text>
        <Box direction="row" gap="xsmall" className="view-toggle-buttons">
          <Button
            icon={<Apps color={viewMode === 'grid' ? 'white' : 'text'} />}
            onClick={() => setViewMode('grid')}
            primary={viewMode === 'grid'}
            tip="Grid view"
            size="small"
          />
          <Button
            icon={<ListIcon color={viewMode === 'list' ? 'white' : 'text'} />}
            onClick={() => setViewMode('list')}
            primary={viewMode === 'list'}
            tip="List view"
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );
}
