import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Heading, Text, Image, Grid, Card, CardBody, Layer } from 'grommet';
import { Previous, Next, Close, FormPrevious } from 'grommet-icons';
import * as cueCaseService from '../api/cueCaseService';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

export default function CueCaseDetail({ onBack }) {
  const { id } = useParams();
  const [cueCase, setCueCase] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await cueCaseService.getCueCaseById(id);
      setCueCase(data);
    }
    load();
  }, [id]);

  if (!cueCase) return (
    <Box fill align="center" justify="center">
      <Text>Loading...</Text>
    </Box>
  );

  const images = cueCase.images && cueCase.images.length > 0 ? cueCase.images : [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? getImageUrl(images[imageIndex]) : '';

  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setImageIndex((i) => (i - 1 + images.length) % images.length);
  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);
  const nextImageFullscreen = () => setImageIndex((i) => (i + 1) % images.length);
  const prevImageFullscreen = () => setImageIndex((i) => (i - 1 + images.length) % images.length);

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
        <Grid columns={{ count: 2, size: 'auto' }} gap="large" width="xlarge">
          {/* Image Section */}
          <Box>
            <Card background="white">
              <CardBody pad="none">
                <Box height="medium" position="relative">
                  {hasImages ? (
                    <>
                      <Image
                        src={currentImage}
                        alt={`${cueCase.brand} ${cueCase.title}`}
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
                            <Button icon={<Previous />} onClick={prevImage} plain hoverIndicator />
                            <Button icon={<Next />} onClick={nextImage} plain hoverIndicator />
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

          {/* Info Section */}
          <Box gap="medium">
            {/* Title & Price */}
            <Box>
              <Box direction="row" gap="small" align="center">
                <Heading level="2" margin="none">
                  {cueCase.brand} {cueCase.title}
                </Heading>
                {(cueCase.isSold || cueCase.is_sold) && (
                  <Box background="status-error" pad="xsmall" round="xsmall">
                    <Text size="small" weight="bold" color="white">SOLD</Text>
                  </Box>
                )}
              </Box>
              <Text size="xxlarge" weight="bold" color="brand">
                ${(cueCase.price || 0).toFixed(2)}
              </Text>
            </Box>

            {/* Specifications */}
            <Card background="white">
              <CardBody pad="medium">
                <Heading level="4" margin={{ bottom: 'small' }}>Case Specifications</Heading>
                <Box gap="small">
                  <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                    <Text weight="bold">Brand</Text>
                    <Text>{cueCase.brand || 'Not specified'}</Text>
                  </Box>
                  <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                    <Text weight="bold">Condition</Text>
                    <Box background={cueCase.condition === 'New' ? 'accent-1' : 'brand'} pad="xsmall" round="xsmall">
                      <Text size="small" color="white">{cueCase.condition || 'Not specified'}</Text>
                    </Box>
                  </Box>
                  {cueCase.caseCapacity && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Capacity</Text>
                      <Text>{cueCase.caseCapacity}</Text>
                    </Box>
                  )}
                  {cueCase.caseOpening && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Opening</Text>
                      <Text>{cueCase.caseOpening}</Text>
                    </Box>
                  )}
                  {cueCase.caseType && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Type</Text>
                      <Text>{cueCase.caseType}</Text>
                    </Box>
                  )}
                  {cueCase.caseMaterial && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Material</Text>
                      <Text>{cueCase.caseMaterial}</Text>
                    </Box>
                  )}
                  {cueCase.color && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Color</Text>
                      <Text>{cueCase.color}</Text>
                    </Box>
                  )}
                  {cueCase.outerDimensions && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Outer Dimensions</Text>
                      <Text>{cueCase.outerDimensions}</Text>
                    </Box>
                  )}
                  {cueCase.pocketSpace && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Pocket Space</Text>
                      <Text>{cueCase.pocketSpace}</Text>
                    </Box>
                  )}
                  {cueCase.handleExtensionSpace && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Handle/Extension Space</Text>
                      <Text>{cueCase.handleExtensionSpace}</Text>
                    </Box>
                  )}
                  {cueCase.caseWeight && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Weight</Text>
                      <Text>{cueCase.caseWeight}</Text>
                    </Box>
                  )}
                  {cueCase.location && (
                    <Box direction="row" justify="between" border={{ side: 'bottom', color: 'light-4' }} pad={{ vertical: 'xsmall' }}>
                      <Text weight="bold">Location</Text>
                      <Text>📍 {cueCase.location}</Text>
                    </Box>
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* Description */}
            {cueCase.description && (
              <Card background="white">
                <CardBody pad="medium">
                  <Heading level="4" margin={{ bottom: 'small' }}>Description</Heading>
                  <Text>{cueCase.description}</Text>
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
                {!(cueCase.sellerName || cueCase.seller_name || cueCase.sellerEmail || cueCase.seller_email || cueCase.sellerPhone || cueCase.seller_phone) ? (
                  <Box pad={{ vertical: 'xsmall' }}>
                    <Text color="text-weak">Not provided</Text>
                  </Box>
                ) : (
                  <Box gap="small">
                    <Box direction="row" gap="small" align="center">
                      <Text>👤</Text>
                      <Text>{cueCase.sellerName || cueCase.seller_name || 'Name not provided'}</Text>
                    </Box>
                    {(cueCase.sellerEmail || cueCase.seller_email) && (
                      <Box direction="row" gap="small" align="center">
                        <Text>✉️</Text>
                        <Text>{cueCase.sellerEmail || cueCase.seller_email}</Text>
                      </Box>
                    )}
                    {(cueCase.sellerPhone || cueCase.seller_phone) && (
                      <Box direction="row" gap="small" align="center">
                        <Text>📞</Text>
                        <Text>{cueCase.sellerPhone || cueCase.seller_phone}</Text>
                      </Box>
                    )}
                  </Box>
                )}
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
              alt={`${cueCase.brand} ${cueCase.title}`}
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
