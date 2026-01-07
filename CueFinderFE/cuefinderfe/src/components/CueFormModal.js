import React, { useState, useEffect } from 'react';
import { Layer, Box, Button, Heading, Form, FormField, TextInput, TextArea, Select } from 'grommet';
import { Close, CloudUpload, Trash, Star } from 'grommet-icons';
import * as cueService from '../api/cueService';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function CueFormModal({ cue, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    condition: 'Excellent',
    description: '',
    weight: '',
    length: '',
    tipSize: '',
    shaftMaterial: '',
    buttMaterial: '',
    location: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cue) {
      setFormData({
        title: cue.title || '',
        brand: cue.brand || '',
        price: cue.price || '',
        condition: cue.condition || 'Excellent',
        description: cue.description || '',
        weight: cue.weight || '',
        length: cue.length || '',
        tipSize: cue.tipSize || '',
        shaftMaterial: cue.shaftMaterial || '',
        buttMaterial: cue.buttMaterial || '',
        location: cue.location || ''
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
      await cueService.deleteImage(imageId);
      // Update the cue object to remove the deleted image
      if (cue && cue.images) {
        cue.images = cue.images.filter(img => img.id !== imageId);
      }
    } catch (error) {
      setError('Failed to delete image');
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      await cueService.setPrimaryImage(imageId);
      // Update the cue object to set the new primary
      if (cue && cue.images) {
        cue.images = cue.images.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
      }
    } catch (error) {
      setError('Failed to set primary image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate images are provided for new cues
      if (!cue && images.length === 0) {
        setError('Please upload at least one image for your cue listing.');
        setLoading(false);
        return;
      }

      // Prepare cue data
      const cueData = {
        title: formData.title,
        brand: formData.brand,
        price: parseFloat(formData.price),
        condition: formData.condition,
        description: formData.description,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        tipSize: formData.tipSize ? parseFloat(formData.tipSize) : null,
        shaftMaterial: formData.shaftMaterial || null,
        buttMaterial: formData.buttMaterial || null,
        location: formData.location || null
      };

      let savedCue;
      if (cue) {
        // Update existing cue
        savedCue = await cueService.updateCue(cue.id, cueData);
      } else {
        // Create new cue
        savedCue = await cueService.createCue(cueData);
      }

      // Upload new images if any
      if (images.length > 0 && savedCue && savedCue.id) {
        await cueService.uploadCueImages(savedCue.id, images);
      }

      onSave();
    } catch (error) {
      console.error('Error saving cue:', error);
      setError(error.response?.data?.message || 'Failed to save cue. Please try again.');
    } finally {
      setLoading(false);
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
        width="large"
        pad="medium"
        gap="small"
        background="background-front"
        style={{
          maxWidth: '700px',
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
                  <FormField label="Price ($) *" name="price" required>
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

            {/* Specifications Section */}
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
