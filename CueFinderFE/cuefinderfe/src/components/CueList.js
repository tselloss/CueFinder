import React from 'react';
import { Box, Grid, Card, CardBody, CardHeader, Image, Text, Button, Stack } from 'grommet';
import { Apps, List as ListIcon } from 'grommet-icons';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (images) => {
  if (!images || images.length === 0) return '';
  const img = images[0];
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function CueList({ cues, onSelect, onAdd, query, viewMode, setViewMode, category, condition, sortBy }) {
  // Filter by search, category, and condition
  let filtered = (cues || []).filter((c) => {
    // Text search
    if (query) {
      const q = query.toLowerCase();
      const matchesSearch = (c.title || '').toLowerCase().includes(q) || 
                           (c.brand || '').toLowerCase().includes(q) || 
                           (c.location || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (category && category !== 'all') {
      if (category === 'cues' && c.category !== 'cue') return false;
      if (category === 'cases' && c.category !== 'case') return false;
    }
    
    // Condition filter
    if (condition && condition !== 'all' && condition !== 'All Conditions') {
      if (c.condition !== condition) return false;
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
    <Box width="100%" pad={{ horizontal: 'medium', vertical: 'large', top: 'large' }}>
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
          {filtered.map((c) => (
            <Card 
              key={c.id} 
              onClick={() => onSelect(c.id)}
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
                    <Image
                      src={getImageUrl(c.images) || 'https://via.placeholder.com/300x200?text=No+Image'}
                      fit="cover"
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
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
                      ${(c.price||0).toFixed(0)}
                    </Text>
                  </Box>
                </Box>
              </CardBody>
            </Card>
          ))}
        </Grid>
      ) : (
        <Box gap="large" pad={{ vertical: 'medium' }}>
          {filtered.map((c) => (
            <Card 
              key={c.id} 
              direction="row" 
              onClick={() => onSelect(c.id)}
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
                    <Image
                      src={getImageUrl(c.images) || 'https://via.placeholder.com/180x120?text=No+Image'}
                      fit="cover"
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
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
                    ${(c.price||0).toFixed(0)}
                  </Text>
                </Box>
              </Box>
            </Card>
          ))}
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
          <Text weight="bold" color="text-strong">{filtered.length}</Text> cues available
        </Text>
        <Box direction="row" gap="xsmall">
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
