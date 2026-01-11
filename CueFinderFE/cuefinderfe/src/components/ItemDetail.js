import React, { useState } from 'react';
import { Box, Button, Heading, Text, Image, Grid, Card, CardBody, Layer } from 'grommet';
import { Previous, Next, Close, FormPrevious, Image as ImageIcon } from 'grommet-icons';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
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

// Image placeholder component
const ImagePlaceholder = ({ height = 'medium' }) => (
  <Box fill background="light-2" align="center" justify="center" height={height}>
    <ImageIcon size="large" color="light-4" />
    <Text size="small" color="dark-4" margin={{ top: 'small' }}>No Image</Text>
  </Box>
);

export default function ItemDetail({ 
  item, 
  itemType = 'cue', // 'cue' or 'case'
  onBack,
  specifications = [] // Array of { label, value, highlight }
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!item) return (
    <Box fill align="center" justify="center">
      <Text>Loading...</Text>
    </Box>
  );

  const images = item.images && item.images.length > 0 ? item.images : [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? getImageUrl(images[imageIndex]) : '';

  const nextImage = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImage = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const nextImageFullscreen = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImageFullscreen = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <Box fill background="background">
      <Box pad="medium">
        <Button 
          icon={<FormPrevious />} 
          label="Back to Listings" 
          onClick={onBack}
          plain
        />
      </Box>

      <Box pad={{ horizontal: 'small', vertical: 'medium' }} align="center">
        <Grid
          columns={{ count: 'fit', size: 'auto' }}
          gap="medium"
          style={{ maxWidth: '1200px', width: '100%' }}
          responsive
          rows="auto"
        >
          {/* Info Section */}
          <Box gap="medium">
            {/* Title & Price */}
            <Box>
              <Box direction="row" gap="small" align="center">
                <Heading level="2" margin="none">
                  {item.brand} {item.title}
                </Heading>
                {(item.isSold || item.is_sold) && (
                  <Box background="status-error" pad="xsmall" round="xsmall">
                    <Text size="small" weight="bold" color="white">SOLD</Text>
                  </Box>
                )}
              </Box>
              <Text size="xxlarge" weight="bold" color="brand">
                €{(item.price || 0).toFixed(2)}
              </Text>
            </Box>

            {/* Specifications */}
            <Card background="white">
              <CardBody pad="medium">
                <Heading level="4" margin={{ bottom: 'small' }}>
                  {itemType === 'case' ? 'Case Specifications' : 'Specifications'}
                </Heading>
                <Box gap="small">
                  {specifications.map((spec, idx) => spec.value && (
                    <Box 
                      key={idx}
                      direction="row" 
                      justify="between" 
                      border={{ side: 'bottom', color: 'light-4' }} 
                      pad={{ vertical: 'xsmall' }}
                    >
                      <Text weight="bold">{spec.label}</Text>
                      {spec.highlight ? (
                        <Box background={spec.highlightColor || 'brand'} pad="xsmall" round="xsmall">
                          <Text size="small" color="white">{spec.value}</Text>
                        </Box>
                      ) : (
                        <Text>{spec.value}</Text>
                      )}
                    </Box>
                  ))}
                </Box>
              </CardBody>
            </Card>

            {/* Description */}
            {item.description && (
              <Card background="white">
                <CardBody pad="medium">
                  <Heading level="4" margin={{ bottom: 'small' }}>Description</Heading>
                  <Text>{item.description}</Text>
                </CardBody>
              </Card>
            )}

            {/* Seller Info */}
            <Card background="white">
              <CardBody pad="medium">
                <Box direction="row" gap="small" align="center" margin={{ bottom: 'small' }}>
                  <Text size="xlarge">👤</Text>
                  <Heading level="4" margin="none">Seller Information</Heading>
                </Box>
                {!(item.sellerName || item.seller_name || item.sellerEmail || item.seller_email || item.sellerPhone || item.seller_phone) ? (
                  <Box pad={{ vertical: 'xsmall' }}>
                    <Text color="text-weak">Not provided</Text>
                  </Box>
                ) : (
                  <Box gap="small">
                    <Box direction="row" gap="small" align="center">
                      <Text>👤</Text>
                      <Text>{item.sellerName || item.seller_name || 'Name not provided'}</Text>
                    </Box>
                    {(item.sellerEmail || item.seller_email) && (
                      <Box direction="row" gap="small" align="center">
                        <Text>✉️</Text>
                        <Text>{item.sellerEmail || item.seller_email}</Text>
                      </Box>
                    )}
                    {(item.sellerPhone || item.seller_phone) && (
                      <Box direction="row" gap="small" align="center">
                        <Text>📞</Text>
                        <Text>{item.sellerPhone || item.seller_phone}</Text>
                      </Box>
                    )}
                  </Box>
                )}
              </CardBody>
            </Card>
          </Box>

          {/* Image Section */}
          <Box margin={{ top: 'xlarge' }} pad={{ top: 'xlarge' }}>
            <Card background="white">
              <CardBody pad="none">
                <Box height="medium" position="relative">
                  {hasImages ? (
                    <>
                      <Image
                        src={currentImage}
                        alt={`${item.brand} ${item.title}`}
                        fit="contain"
                        fill
                        onClick={openFullscreen}
                        style={{ cursor: 'pointer' }}
                      />
                      {images.length > 1 && (
                        <>
                          <Box
                            direction="row"
                            justify="between"
                            align="center"
                            fill="horizontal"
                            pad="small"
                            style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}
                          >
                            <Button 
                              icon={<Previous />} 
                              onClick={prevImage}
                              plain
                              hoverIndicator
                            />
                            <Button 
                              icon={<Next />} 
                              onClick={nextImage}
                              plain
                              hoverIndicator
                            />
                          </Box>
                          <Box
                            direction="row"
                            justify="center"
                            gap="xsmall"
                            pad="small"
                            style={{ position: 'absolute', bottom: 0, width: '100%' }}
                          >
                            {images.map((_, idx) => (
                              <Box
                                key={idx}
                                width="10px"
                                height="10px"
                                round="full"
                                background={idx === imageIndex ? 'brand' : 'light-4'}
                                onClick={() => setImageIndex(idx)}
                                style={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Box>
                        </>
                      )}
                    </>
                  ) : (
                    <ImagePlaceholder height="medium" />
                  )}
                </Box>
              </CardBody>
            </Card>
          </Box>
        </Grid>
      </Box>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && hasImages && (
        <Layer onEsc={closeFullscreen} onClickOutside={closeFullscreen} full>
          <Box fill background="dark-1" align="center" justify="center">
            <Button 
              icon={<Close />} 
              onClick={closeFullscreen}
              style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
            />
            <Image
              src={currentImage}
              alt={`${item.brand} ${item.title}`}
              fit="contain"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
            />
            {images.length > 1 && (
              <>
                <Box
                  direction="row"
                  justify="between"
                  align="center"
                  fill="horizontal"
                  pad="large"
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}
                >
                  <Button icon={<Previous size="large" />} onClick={prevImageFullscreen} size="large" />
                  <Button icon={<Next size="large" />} onClick={nextImageFullscreen} size="large" />
                </Box>
                <Box pad="small" background="dark-3" round="small" style={{ position: 'absolute', bottom: 20 }}>
                  <Text color="white">{imageIndex + 1} / {images.length}</Text>
                </Box>
              </>
            )}
          </Box>
        </Layer>
      )}
    </Box>
  );
}
