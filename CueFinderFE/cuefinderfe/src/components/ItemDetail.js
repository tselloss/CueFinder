import React, { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, Image, Grid, Card, CardBody, Layer, TextArea } from 'grommet';
import { Previous, Next, Close, FormPrevious, Image as ImageIcon } from 'grommet-icons';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';
import * as messageService from '../api/messageService';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMessage, setShowMessage] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (item) {
      const defaultSubject = item.title ? `Inquiry about ${item.title}` : 'Message about your listing';
      setMessageSubject(defaultSubject);
    }
  }, [item]);

  const handleSendMessage = async () => {
    if (!item || !item.sellerId) {
      setSendError('Missing seller information.');
      return;
    }
    if (!messageBody.trim()) {
      setSendError('Please enter a message.');
      return;
    }

    setSending(true);
    setSendError('');
    setSendSuccess(false);

    try {
      console.log('📤 Sending message to seller:', item.sellerId);
      const response = await messageService.sendMessage({
        recipientId: item.sellerId,
        cueId: item.id,
        subject: messageSubject || 'Message',
        content: messageBody,
        messageType: 'inquiry'
      });
      console.log('✅ Message sent successfully:', response);
      setSendSuccess(true);
      setMessageBody('');
      setMessageSubject('');
      // Close modal after showing success
      setTimeout(() => {
        setShowMessage(false);
      }, 1500);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to send message. Please try again.';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

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

      <Box pad={{ horizontal: 'small', vertical: 'medium' }} align="center" style={{ paddingTop: isMobile ? '12px' : 'medium', paddingBottom: isMobile ? '12px' : 'medium' }}>
        <Grid
          columns={{ count: 'fit', size: 'auto' }}
          gap={isMobile ? 'small' : 'medium'}
          style={{ maxWidth: '1200px', width: '100%' }}
          responsive
          rows="auto"
        >
          {/* Image Section - Shows first on mobile */}
          <Box margin={{ top: isMobile ? 'small' : 'xlarge' }} pad={{ top: isMobile ? 'none' : 'xlarge' }} style={{ order: isMobile ? -1 : 1 }}>
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
                            style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
                          >
                            <Button 
                              icon={<Previous size={isMobile ? 'medium' : 'large'} />}
                              onClick={prevImage}
                              plain
                              style={{
                                width: isMobile ? '40px' : '48px',
                                height: isMobile ? '40px' : '48px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            />
                            <Button 
                              icon={<Next size={isMobile ? 'medium' : 'large'} />}
                              onClick={nextImage}
                              plain
                              style={{
                                width: isMobile ? '40px' : '48px',
                                height: isMobile ? '40px' : '48px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
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

          {/* Info Section - Shows second on mobile */}
          <Box gap={isMobile ? 'small' : 'medium'} style={{ order: isMobile ? 1 : 0 }}>
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
              <CardBody pad={isMobile ? 'small' : 'medium'}>
                <Heading level="4" margin={{ bottom: isMobile ? 'xsmall' : 'small' }}>
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
                <CardBody pad={isMobile ? 'small' : 'medium'}>
                  <Heading level="4" margin={{ bottom: isMobile ? 'xsmall' : 'small' }}>Description</Heading>
                  <Text>{item.description}</Text>
                </CardBody>
              </Card>
            )}

            {/* Seller Info */}
            <Card background="white">
              <CardBody pad={isMobile ? 'small' : 'medium'}>
                <Box direction="row" gap="small" align="center" margin={{ bottom: isMobile ? 'xsmall' : 'small' }}>
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
                        {(item.sellerHidePhone || item.seller_hidePhone) ? (
                          <Box 
                            pad={{ horizontal: 'small', vertical: 'xsmall' }} 
                            background="background-back"
                            round="small"
                            style={{ 
                              filter: 'blur(5px)',
                              userSelect: 'none',
                              cursor: 'not-allowed'
                            }}
                          >
                            <Text>{item.sellerPhone || item.seller_phone}</Text>
                          </Box>
                        ) : (
                          <Text>{item.sellerPhone || item.seller_phone}</Text>
                        )}
                      </Box>
                    )}
                    {item.sellerId && (
                      <Box margin={{ top: 'small' }} direction="row" gap="small">
                        <Button label="Message Seller" primary onClick={() => { setSendError(''); setSendSuccess(false); setShowMessage(true); }} />
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
                  pad={isMobile ? 'medium' : 'large'}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                >
                  <Button 
                    icon={<Previous size="xlarge" />} 
                    onClick={prevImageFullscreen}
                    plain
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                  <Button 
                    icon={<Next size="xlarge" />} 
                    onClick={nextImageFullscreen}
                    plain
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </Box>
                <Box pad="small" background="dark-3" round="small" style={{ position: 'absolute', bottom: 20 }}>
                  <Text color="white">{imageIndex + 1} / {images.length}</Text>
                </Box>
              </>
            )}
          </Box>
        </Layer>
      )}

      {showMessage && (
        <Layer onEsc={() => setShowMessage(false)} onClickOutside={() => setShowMessage(false)}>
          <Box pad="medium" gap="small" width="medium">
            <Box direction="row" justify="between" align="center">
              <Heading level="4" margin="none">Message the Seller</Heading>
              <Button icon={<Close />} onClick={() => setShowMessage(false)} />
            </Box>
            {sendError && <Text color="status-critical">{sendError}</Text>}
            {sendSuccess && <Text color="status-ok">Message sent!</Text>}
            <Text weight="bold">Subject</Text>
            <TextArea
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              rows={2}
            />
            <Text weight="bold">Message</Text>
            <TextArea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={6}
            />
            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button label="Cancel" onClick={() => setShowMessage(false)} />
              <Button
                label={sending ? 'Sending...' : 'Send'}
                primary
                onClick={handleSendMessage}
                disabled={sending}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
}
