import React, { useState, useEffect } from 'react';
import { Layer, Box, Button, Heading, Form, FormField, TextInput, TextArea, Select } from 'grommet';
import { Close } from 'grommet-icons';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import { getErrorMessage } from '../utils/errorUtils';
import { SITE_BASE_URL } from '../config/apiConfig';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend SITE_BASE_URL (not API_BASE_URL - images are served by nginx directly)
  return `${SITE_BASE_URL}${url}`;
};

export default function CueFormModal({ cue, onClose, onSave }) {
  const [productType, setProductType] = useState('cue'); // 'cue' or 'case'
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    condition: 'Excellent',
    description: '',
    // Cue-specific fields
    weight: '',
    length: '',
    tipSize: '',
    shaftMaterial: '',
    buttMaterial: '',
    location: '',
    // Case-specific fields
    caseCapacity: '1x1',
    caseOpening: 'Butterfly',
    caseType: 'Soft',
    color: '',
    caseMaterial: '',
    outerDimensions: '',
    pocketSpace: '',
    handleExtensionSpace: '',
    caseWeight: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    if (cue) {
      // Determine product type from category property (set in MyCues component)
      setProductType(cue.category === 'case' ? 'case' : 'cue');
      setFormData({
        title: cue.title || '',
        brand: cue.brand || '',
        price: cue.price || '',
        condition: cue.condition || 'Excellent',
        description: cue.description || '',
        // Cue fields
        weight: cue.weight || '',
        length: cue.length || '',
        tipSize: cue.tipSize || '',
        shaftMaterial: cue.shaftMaterial || '',
        buttMaterial: cue.buttMaterial || '',
        location: cue.location || '',
        // Case fields
        caseCapacity: cue.caseCapacity || '',
        caseOpening: cue.caseOpening || 'Butterfly',
        caseType: cue.caseType || 'Soft',
        color: cue.color || '',
        caseMaterial: cue.caseMaterial || '',
        outerDimensions: cue.outerDimensions || '',
        pocketSpace: cue.pocketSpace || '',
        handleExtensionSpace: cue.handleExtensionSpace || '',
        caseWeight: cue.caseWeight || ''
      });
    }
  }, [cue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Use the appropriate service based on product type
      if (productType === 'case') {
        await cueCaseService.deleteCueCaseImage(cue.id, imageId);
      } else {
        await cueService.deleteImage(imageId);
      }
      // Update the cue object to remove the deleted image
      if (cue && cue.images) {
        cue.images = cue.images.filter(img => img.id !== imageId);
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to delete image'));
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      // Use the appropriate service based on product type
      if (productType === 'case') {
        await cueCaseService.setPrimaryCueCaseImage(cue.id, imageId);
      } else {
        await cueService.setPrimaryImage(imageId);
      }
      // Update the cue object to set the new primary
      if (cue && cue.images) {
        cue.images = cue.images.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to set primary image'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate images are provided for new listings
      if (!cue && images.length === 0) {
        setError(`Please upload at least one image for your ${productType} listing.`);
        setLoading(false);
        return;
      }

      let savedItem;
      
      if (productType === 'cue') {
        // Handle CUE: Use cueService
        const cueData = {
          title: formData.title,
          brand: formData.brand,
          price: parseFloat(formData.price),
          condition: formData.condition,
          description: formData.description,
          location: formData.location || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          length: formData.length ? parseFloat(formData.length) : null,
          tipSize: formData.tipSize ? parseFloat(formData.tipSize) : null,
          shaftMaterial: formData.shaftMaterial || null,
          buttMaterial: formData.buttMaterial || null
        };

        if (cue) {
          // Update existing cue
          savedItem = await cueService.updateCue(cue.id, cueData);
        } else {
          // Create new cue
          savedItem = await cueService.createCue(cueData);
        }

        // Upload new images if any
        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await cueService.uploadCueImages(savedItem.id, images, setUploadProgress);
        }
      } else {
        // Handle CASE: Use cueCaseService
        const caseData = {
          title: formData.title,
          brand: formData.brand,
          price: parseFloat(formData.price),
          condition: formData.condition,
          description: formData.description,
          location: formData.location || null,
          caseCapacity: formData.caseCapacity || null,
          caseOpening: formData.caseOpening || null,
          caseType: formData.caseType || null,
          color: formData.color || null,
          caseMaterial: formData.caseMaterial || null,
          outerDimensions: formData.outerDimensions || null,
          pocketSpace: formData.pocketSpace || null,
          handleExtensionSpace: formData.handleExtensionSpace || null,
          caseWeight: formData.caseWeight || null
        };

        if (cue) {
          // Update existing case
          savedItem = await cueCaseService.updateCueCase(cue.id, caseData);
        } else {
          // Create new case
          savedItem = await cueCaseService.createCueCase(caseData);
        }

        // Upload new images if any
        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await cueCaseService.uploadCueCaseImages(savedItem.id, images, setUploadProgress);
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving listing:', error);
      setError(getErrorMessage(error, 'Failed to save listing. Please try again.'));
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <Layer
      onEsc={onClose}
      onClickOutside={onClose}
      style={{
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <Box
        width="xlarge"
        pad="medium"
        gap="small"
        background="background-front"
        style={{
          maxWidth: '1000px',
          width: '95vw',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Header */}
        <Box direction="row" justify="between" align="center" pad={{ bottom: 'small' }}>
          <Heading level="2" margin="none" style={{ fontSize: '24px', fontWeight: 700 }}>
            {cue ? '✏️ Edit Listing' : '➕ Create New Listing'}
          </Heading>
          <Button
            icon={<Close />}
            onClick={onClose}
            plain
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
            hoverIndicator={{ background: 'rgba(239, 68, 68, 0.2)' }}
          />
        </Box>

        {error && (
          <Box
            background="status-error"
            pad="small"
            round="small"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.5)'
            }}
          >
            <text size="small" color="white">{error}</text>
          </Box>
        )}

        <Form onSubmit={handleSubmit}>
          <Box gap="small">
            {/* DEBUG: Show cue value */}
            {console.log('CueFormModal - cue prop:', cue, 'showing selector:', !cue)}
            
            {/* Product Type Selector - Always show for new listings */}
            {!cue && (
              <Box
                background="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)"
                pad="large"
                round="medium"
                gap="medium"
                style={{ 
                  border: '3px solid rgba(59, 130, 246, 0.6)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)'
                }}
              >
                <Box align="center" gap="xsmall">
                  <Heading level="3" margin="none" style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                    🎯 What are you listing?
                  </Heading>
                  <text size="small" color="text-weak" textAlign="center">
                    Choose the type of product you want to sell
                  </text>
                </Box>
                
                <Box direction="row" gap="medium">
                  <Button
                    fill="horizontal"
                    onClick={() => setProductType('cue')}
                    style={{
                      background: productType === 'cue' 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                        : 'rgba(30, 41, 59, 0.7)',
                      color: productType === 'cue' ? 'white' : '#cbd5e1',
                      border: productType === 'cue' 
                        ? '3px solid #3b82f6' 
                        : '3px solid rgba(51, 65, 85, 0.8)',
                      borderRadius: '16px',
                      padding: '24px 20px',
                      transition: 'all 0.3s ease',
                      transform: productType === 'cue' ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: productType === 'cue' 
                        ? '0 12px 28px rgba(59, 130, 246, 0.5), inset 0 0 60px rgba(255, 255, 255, 0.1)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                    hoverIndicator={{
                      background: productType === 'cue' 
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : 'rgba(30, 41, 59, 0.9)'
                    }}
                  >
                    <Box align="center" gap="small">
                      <text style={{ fontSize: '48px', lineHeight: '1' }}>🎱</text>
                      <Box align="center">
                        <text weight={700} size="large" style={{ lineHeight: '1.2' }}>
                          Billiard Cue
                        </text>
                        <text size="xsmall" color={productType === 'cue' ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8'} style={{ lineHeight: '1.4' }}>
                          Pool & Snooker Cues
                        </text>
                      </Box>
                      {productType === 'cue' && (
                        <Box 
                          background="rgba(255, 255, 255, 0.2)"
                          pad="xxsmall"
                          round="small"
                          margin={{ top: 'xsmall' }}
                        >
                          <text size="xsmall" weight={600}>✓ SELECTED</text>
                        </Box>
                      )}
                    </Box>
                  </Button>
                  
                  <Button
                    fill="horizontal"
                    onClick={() => setProductType('case')}
                    style={{
                      background: productType === 'case' 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                        : 'rgba(30, 41, 59, 0.7)',
                      color: productType === 'case' ? 'white' : '#cbd5e1',
                      border: productType === 'case' 
                        ? '3px solid #3b82f6' 
                        : '3px solid rgba(51, 65, 85, 0.8)',
                      borderRadius: '16px',
                      padding: '24px 20px',
                      transition: 'all 0.3s ease',
                      transform: productType === 'case' ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: productType === 'case' 
                        ? '0 12px 28px rgba(59, 130, 246, 0.5), inset 0 0 60px rgba(255, 255, 255, 0.1)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                    hoverIndicator={{
                      background: productType === 'case' 
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : 'rgba(30, 41, 59, 0.9)'
                    }}
                  >
                    <Box align="center" gap="small">
                      <text style={{ fontSize: '48px', lineHeight: '1' }}>💼</text>
                      <Box align="center">
                        <text weight={700} size="large" style={{ lineHeight: '1.2' }}>
                          Cue Case
                        </text>
                        <text size="xsmall" color={productType === 'case' ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8'} style={{ lineHeight: '1.4' }}>
                          Protective Cases
                        </text>
                      </Box>
                      {productType === 'case' && (
                        <Box 
                          background="rgba(255, 255, 255, 0.2)"
                          pad="xxsmall"
                          round="small"
                          margin={{ top: 'xsmall' }}
                        >
                          <text size="xsmall" weight={600}>✓ SELECTED</text>
                        </Box>
                      )}
                    </Box>
                  </Button>
                </Box>
              </Box>
            )}

            {/* Basic Info Section */}
            <Box
              background="background-back"
              pad="medium"
              round="small"
              gap="small"
              style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
            >
              <text size="small" weight={600} color="brand" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📋 Basic Information
              </text>
              
              <Box direction="row" gap="small">
                <Box flex>
                  <FormField label="Title *" name="title" required>
                    <TextInput
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Predator REVO 12.9"
                    />
                  </FormField>
                </Box>
                <Box flex>
                  <FormField label="Brand *" name="brand" required>
                    <TextInput
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g., Predator"
                    />
                  </FormField>
                </Box>
              </Box>

              <Box direction="row" gap="small">
                <Box flex>
                  <FormField label="Price (€) *" name="price" required>
                    <TextInput
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </FormField>
                </Box>
                <Box flex>
                  <FormField label="Condition *" name="condition" required>
                    <Select
                      name="condition"
                      options={['New', 'Excellent', 'Good', 'Fair', 'Poor']}
                      value={formData.condition}
                      onChange={({ option }) => setFormData(prev => ({ ...prev, condition: option }))}
                    />
                  </FormField>
                </Box>
              </Box>

              <FormField label="Location" name="location">
                <TextInput
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                />
              </FormField>
            </Box>

            {/* Specifications Section - Conditional based on product type */}
            <Box
              background="background-back"
              pad="medium"
              round="small"
              gap="small"
              style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
            >
              <text size="small" weight={600} color="brand" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📏 Specifications
              </text>

              {productType === 'cue' ? (
                <>
                  {/* Cue Specifications */}
                  <Box direction="row" gap="small">
                    <Box flex>
                      <FormField label="Weight (oz)" name="weight">
                        <TextInput
                          name="weight"
                          type="number"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="18.5"
                          step="0.1"
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Length (inches)" name="length">
                        <TextInput
                          name="length"
                          type="number"
                          value={formData.length}
                          onChange={handleChange}
                          placeholder="58"
                          step="0.1"
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Tip Size (mm)" name="tipSize">
                        <TextInput
                          name="tipSize"
                          type="number"
                          value={formData.tipSize}
                          onChange={handleChange}
                          placeholder="12.9"
                          step="0.1"
                        />
                      </FormField>
                    </Box>
                  </Box>

                  <Box direction="row" gap="small">
                    <Box flex>
                      <FormField label="Shaft Material" name="shaftMaterial">
                        <TextInput
                          name="shaftMaterial"
                          value={formData.shaftMaterial}
                          onChange={handleChange}
                          placeholder="e.g., Carbon Fiber"
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Butt Material" name="buttMaterial">
                        <TextInput
                          name="buttMaterial"
                          value={formData.buttMaterial}
                          onChange={handleChange}
                          placeholder="e.g., Maple"
                        />
                      </FormField>
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  {/* Case Specifications */}
                  <Box direction="row" gap="small">
                    <Box flex>
                      <FormField label="Case Capacity" name="caseCapacity">
                        <Select
                          name="caseCapacity"
                          options={['1x1', '1x2', '2x4', '3x5', '4x8']}
                          value={formData.caseCapacity}
                          onChange={({ option }) => setFormData(prev => ({ ...prev, caseCapacity: option }))}
                          placeholder="Select capacity"
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Case Opening" name="caseOpening">
                        <Select
                          name="caseOpening"
                          options={['Butterfly', 'Top Open', 'Side Open', 'Zipper']}
                          value={formData.caseOpening}
                          onChange={({ option }) => setFormData(prev => ({ ...prev, caseOpening: option }))}
                        />
                      </FormField>
                    </Box>
                  </Box>

                  <Box direction="row" gap="small">
                    <Box flex>
                      <FormField label="Case Type" name="caseType">
                        <Select
                          name="caseType"
                          options={['Soft', 'Hard', 'Semi-Hard']}
                          value={formData.caseType}
                          onChange={({ option }) => setFormData(prev => ({ ...prev, caseType: option }))}
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Color" name="color">
                        <TextInput
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          placeholder="e.g., Blue, Black"
                        />
                      </FormField>
                    </Box>
                  </Box>

                  <Box direction="row" gap="small">
                    <Box flex>
                      <FormField label="Case Material" name="caseMaterial">
                        <TextInput
                          name="caseMaterial"
                          value={formData.caseMaterial}
                          onChange={handleChange}
                          placeholder="e.g., Ultra Vinyl, Leather"
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Case Weight" name="caseWeight">
                        <TextInput
                          name="caseWeight"
                          value={formData.caseWeight}
                          onChange={handleChange}
                          placeholder="e.g., 3.6 lbs"
                        />
                      </FormField>
                    </Box>
                  </Box>

                  <FormField label="Outer Dimensions" name="outerDimensions">
                    <TextInput
                      name="outerDimensions"
                      value={formData.outerDimensions}
                      onChange={handleChange}
                      placeholder="e.g., 86.36 cm H x 13.97 cm W x 20.32 cm D"
                    />
                  </FormField>

                  <Box direction="row" gap="small">
                    <Box flex>
                      <FormField label="Pocket Space" name="pocketSpace">
                        <Select
                          name="pocketSpace"
                          options={['None', 'Small', 'Medium', 'Large', 'Very Large']}
                          value={formData.pocketSpace}
                          onChange={({ option }) => setFormData(prev => ({ ...prev, pocketSpace: option }))}
                        />
                      </FormField>
                    </Box>
                    <Box flex>
                      <FormField label="Handle/Extension Space" name="handleExtensionSpace">
                        <TextInput
                          name="handleExtensionSpace"
                          value={formData.handleExtensionSpace}
                          onChange={handleChange}
                          placeholder="e.g., Protection Sleeves Included"
                        />
                      </FormField>
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            {/* Description Section */}
            <Box
              background="background-back"
              pad="medium"
              round="small"
              gap="small"
              style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
            >
              <text size="small" weight={600} color="brand" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📝 Description
              </text>
              
              <FormField name="description">
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the cue's features, condition, and any special notes..."
                />
              </FormField>
            </Box>

            {/* Images Section */}
            <Box
              background="background-back"
              pad="medium"
              round="small"
              gap="small"
              style={{ border: '1px solid rgba(51, 65, 85, 0.3)' }}
            >
              <text size="small" weight={600} color="brand" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📷 Images {!cue && <text size="xsmall" color="status-error">*</text>}
              </text>

              {/* Existing images */}
              {cue && cue.images && cue.images.length > 0 && (
                <Box gap="xsmall">
                  <text size="small" weight={500}>Current Images</text>
                  <Box direction="row" gap="small" wrap>
                    {cue.images.map(img => (
                      <Box
                        key={img.id}
                        width="120px"
                        height="120px"
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: img.isPrimary ? '3px solid #3b82f6' : '1px solid rgba(51, 65, 85, 0.3)'
                        }}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt="Cue"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {img.isPrimary && (
                          <Box
                            background="brand"
                            pad="xxsmall"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              fontSize: '10px',
                              fontWeight: 600
                            }}
                          >
                            <text size="xsmall" color="white">PRIMARY</text>
                          </Box>
                        )}
                        <Box
                          direction="row"
                          gap="xxsmall"
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px'
                          }}
                        >
                          {!img.isPrimary && (
                            <Button
                              icon={<text>⭐</text>}
                              onClick={() => handleSetPrimaryImage(img.id)}
                              size="small"
                              style={{
                                background: 'rgba(59, 130, 246, 0.9)',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              tip="Set as primary"
                            />
                          )}
                          <Button
                            icon={<text>🗑️</text>}
                            onClick={() => handleDeleteExistingImage(img.id)}
                            size="small"
                            style={{
                              background: 'rgba(239, 68, 68, 0.9)',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                            tip="Delete image"
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* New image upload */}
              <Box gap="xsmall">
                <text size="small" weight={500}>
                  {cue ? 'Add More Images' : 'Upload Images *'}
                </text>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px dashed rgba(59, 130, 246, 0.5)',
                    background: 'rgba(30, 41, 59, 0.5)',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                />
                <text size="xsmall" color="text-weak">
                  JPG, PNG, GIF, WebP - Max 5MB each
                </text>

                {uploadProgress !== null && (
                  <Box gap="xxsmall" margin={{ top: 'xsmall' }}>
                    <text size="small" weight={500}>
                      Uploading images... {uploadProgress}%
                    </text>
                    <Box
                      background="background-back"
                      height="8px"
                      round="small"
                      style={{ border: '1px solid rgba(59, 130, 246, 0.4)' }}
                    >
                      <Box
                        background="brand"
                        height="8px"
                        round="small"
                        width={`${Math.max(0, Math.min(100, uploadProgress))}%`}
                        style={{ transition: 'width 0.2s ease' }}
                      />
                    </Box>
                  </Box>
                )}
                
                {imagePreviews.length > 0 && (
                  <Box gap="xsmall" margin={{ top: 'small' }}>
                    <text size="small" weight={500}>
                      {imagePreviews.length} new image(s) selected
                    </text>
                    <Box direction="row" gap="small" wrap>
                      {imagePreviews.map((preview, index) => (
                        <Box
                          key={index}
                          width="80px"
                          height="80px"
                          style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(59, 130, 246, 0.5)'
                          }}
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button
                label="Cancel"
                onClick={onClose}
                disabled={loading}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  color: '#f87171'
                }}
              />
              <Button
                type="submit"
                label={
                  loading ? 'Saving...' : (cue ? 'Update Listing' : 'Create Listing')
                }
                disabled={loading}
                primary
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}
              />
            </Box>
          </Box>
        </Form>
      </Box>
    </Layer>
  );
}
