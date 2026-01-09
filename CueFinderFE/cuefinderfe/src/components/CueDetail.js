import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Heading, Text, Image, Grid, Stack, Card, CardBody, Layer } from 'grommet';
import { Previous, Next, Close, FormPrevious } from 'grommet-icons';
import * as cueService from '../api/cueService';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function CueDetail({ onBack }) {
  const { id } = useParams();
  const [cue, setCue] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await cueService.getCueById(id);
      setCue(data);
    }
    load();
  }, [id]);

  if (!cue) return (
    <Box fill align="center" justify="center">
      <Text>Loading...</Text>
    </Box>
  );

  const images = cue.images && cue.images.length > 0 ? cue.images : [];
  const currentImage = getImageUrl(images[imageIndex]);

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

      <Box pad="large" align="center">
        <Grid
          columns={{ count: 2, size: 'auto' }}
          gap="large"
          width="xlarge"
        >
          {/* Info Section */}
          <Box gap="medium">
            {/* Title & Price */}
            <Box>
              <Box direction="row" gap="small" align="center">
                <Heading level="2" margin="none">
                  {cue.brand} {cue.title}
                </Heading>
                {(cue.isSold || cue.is_sold) && (
                  <Box background="status-error" pad="xsmall" round="xsmall">
                    <Text size="small" weight="bold" color="white">SOLD</Text>
                  </Box>
                )}
              </Box>
              <Text size="xxlarge" weight="bold" color="brand">
                ${(cue.price || 0).toFixed(2)}
              </Text>
            </Box>

            {/* Specifications */}
            <Card background="white">
              <CardBody pad="medium">
                <Heading level="4" margin={{ bottom: 'small' }}>Specifications</Heading>
                <Box gap="small">
                  <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                    <Text weight="bold">Brand</Text>
                    <Text>{cue.brand || 'Not specified'}</Text>
                  </Box>
                  <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                    <Text weight="bold">Condition</Text>
                    <Box background={cue.condition === 'New' ? 'accent-1' : 'brand'} pad="xsmall" round="xsmall">
                      <Text size="small" color="white">{cue.condition || 'Not specified'}</Text>
                    </Box>
                  </Box>
                  {(cue.material || cue.shaftMaterial) && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Material</Text>
                      <Text>{cue.material || cue.shaftMaterial}</Text>
                    </Box>
                  )}
                  {cue.weight && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Weight</Text>
                      <Text>{cue.weight}</Text>
                    </Box>
                  )}
                  {cue.length && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Length</Text>
                      <Text>{cue.length}</Text>
                    </Box>
                  )}
                  {(cue.tipSize || cue.tip_size) && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Tip Size</Text>
                      <Text>{cue.tipSize || cue.tip_size}</Text>
                    </Box>
                  )}
                  {cue.location && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Location</Text>
                      <Text>📍 {cue.location}</Text>
                    </Box>
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* Description */}
            {cue.description && (
              <Card background="white">
                <CardBody pad="medium">
                  <Heading level="4" margin={{ bottom: 'small' }}>Description</Heading>
                  <Text>{cue.description}</Text>
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
                <Box gap="small">
                  <Box direction="row" gap="small" align="center">
                    <Text>👤</Text>
                    <Text>{cue.sellerName || cue.seller_name || 'Name not provided'}</Text>
                  </Box>
                  {(cue.sellerEmail || cue.seller_email) && (
                    <Box direction="row" gap="small" align="center">
                      <Text>✉️</Text>
                      <Text>{cue.sellerEmail || cue.seller_email}</Text>
                    </Box>
                  )}
                  {(cue.sellerPhone || cue.seller_phone) && (
                    <Box direction="row" gap="small" align="center">
                      <Text>📞</Text>
                      <Text>{cue.sellerPhone || cue.seller_phone}</Text>
                    </Box>
                  )}
                </Box>
              </CardBody>
            </Card>
          </Box>

          {/* Image Section */}
          <Box margin={{ top: 'xlarge' }} pad={{ top: 'xlarge' }}>
            <Card background="white">
              <CardBody pad="none">
                <Box height="medium" position="relative">
                  {images.length > 0 ? (
                    <>
                      <Image
                        src={currentImage}
                        alt={`${cue.brand} ${cue.title}`}
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
                    <Box align="center" justify="center" fill background="light-2">
                      <Text color="dark-4">No images available</Text>
                    </Box>
                  )}
                </Box>
              </CardBody>
            </Card>
          </Box>
        </Grid>
      </Box>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && (
        <Layer onEsc={closeFullscreen} onClickOutside={closeFullscreen} full>
          <Box fill background="dark-1" align="center" justify="center">
            <Button 
              icon={<Close />} 
              onClick={closeFullscreen}
              style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
            />
            <Image
              src={currentImage}
              alt={`${cue.brand} ${cue.title}`}
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
                  <Button 
                    icon={<Previous size="large" />} 
                    onClick={prevImageFullscreen}
                    size="large"
                  />
                  <Button 
                    icon={<Next size="large" />} 
                    onClick={nextImageFullscreen}
                    size="large"
                  />
                </Box>
                <Box
                  pad="small"
                  background="dark-3"
                  round="small"
                  style={{ position: 'absolute', bottom: 20 }}
                >
                  <Text color="white">
                    {imageIndex + 1} / {images.length}
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </Layer>
      )}
    </Box>
  );
}
