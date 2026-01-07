import React, { useState, useEffect } from 'react';
import * as cueService from '../api/cueService';
import './CueFormModal.css';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cue ? 'Edit Listing' : 'Create New Listing'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Predator REVO 12.9"
              />
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder="e.g., Predator"
              />
            </div>

            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Condition *</label>
              <select name="condition" value={formData.condition} onChange={handleChange}>
                <option value="New">New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Weight (oz)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
                placeholder="18.5"
              />
            </div>

            <div className="form-group">
              <label>Length (inches)</label>
              <input
                type="number"
                name="length"
                value={formData.length}
                onChange={handleChange}
                step="0.1"
                placeholder="58"
              />
            </div>

            <div className="form-group">
              <label>Tip Size (mm)</label>
              <input
                type="number"
                name="tipSize"
                value={formData.tipSize}
                onChange={handleChange}
                step="0.1"
                placeholder="12.9"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State"
              />
            </div>

            <div className="form-group">
              <label>Shaft Material</label>
              <input
                type="text"
                name="shaftMaterial"
                value={formData.shaftMaterial}
                onChange={handleChange}
                placeholder="e.g., Carbon Fiber"
              />
            </div>

            <div className="form-group">
              <label>Butt Material</label>
              <input
                type="text"
                name="buttMaterial"
                value={formData.buttMaterial}
                onChange={handleChange}
                placeholder="e.g., Maple"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the cue's features, condition, and any special notes..."
            />
          </div>

          {/* Existing images (if editing) */}
          {cue && cue.images && cue.images.length > 0 && (
            <div className="form-group full-width">
              <label>Current Images</label>
              <div className="existing-images-grid">
                {cue.images.map(img => (
                  <div key={img.id} className={`image-thumbnail ${img.isPrimary ? 'primary' : ''}`}>
                    <img src={getImageUrl(img)} alt="Cue" />
                    {img.isPrimary && <span className="primary-badge">Primary</span>}
                    <div className="image-actions">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleSetPrimaryImage(img.id)}
                          title="Set as primary"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        title="Delete image"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New image upload */}
          <div className="form-group full-width">
            <label>
              {cue ? 'Add More Images' : 'Upload Images'}
              <span className="hint"> (JPG, PNG, GIF, WebP - Max 5MB each)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageSelect}
            />
            {imagePreviews.length > 0 && (
              <div className="image-previews">
                <p>{imagePreviews.length} new image(s) selected</p>
                <div className="previews-grid">
                  {imagePreviews.map((preview, index) => (
                    <img key={index} src={preview} alt={`Preview ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (cue ? 'Update Listing' : 'Create Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
