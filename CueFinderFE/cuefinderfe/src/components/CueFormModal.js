import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    cueType: 'playing',
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
        cueType: cue.cueType || 'playing',
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
          cueType: formData.cueType || 'playing',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-blue-400/30 shadow-2xl flex flex-col max-h-[90vh] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {cue ? '✏️ Edit Listing' : '➕ Create New Listing'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* DEBUG: Show cue value */}
            {console.log('CueFormModal - cue prop:', cue, 'showing selector:', !cue)}
            
            {/* Product Type Selector - Always show for new listings */}
            {!cue && (
              <div
                className="p-8 rounded-xl border-4 border-blue-500/60 bg-gradient-to-br from-blue-500/10 to-blue-600/5 shadow-lg"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-blue-400 mb-2">
                    🎯 What are you listing?
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Choose the type of product you want to sell
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Cue Button */}
                  <button
                    type="button"
                    onClick={() => setProductType('cue')}
                    className={`p-6 rounded-2xl transition-all duration-300 text-center ${
                      productType === 'cue'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-3 border-blue-400 shadow-lg shadow-blue-500/50 scale-105'
                        : 'bg-slate-700/70 border-3 border-slate-600/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-5xl mb-3">🎱</div>
                    <div className={`font-bold text-lg ${productType === 'cue' ? 'text-white' : 'text-slate-300'}`}>
                      Billiard Cue
                    </div>
                    <div className={`text-xs mt-1 ${productType === 'cue' ? 'text-white/80' : 'text-slate-400'}`}>
                      Pool & Snooker Cues
                    </div>
                    {productType === 'cue' && (
                      <div className="mt-3 inline-block bg-white/20 px-2 py-1 rounded text-xs font-semibold text-white">
                        ✓ SELECTED
                      </div>
                    )}
                  </button>
                  
                  {/* Case Button */}
                  <button
                    type="button"
                    onClick={() => setProductType('case')}
                    className={`p-6 rounded-2xl transition-all duration-300 text-center ${
                      productType === 'case'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-3 border-blue-400 shadow-lg shadow-blue-500/50 scale-105'
                        : 'bg-slate-700/70 border-3 border-slate-600/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-5xl mb-3">💼</div>
                    <div className={`font-bold text-lg ${productType === 'case' ? 'text-white' : 'text-slate-300'}`}>
                      Cue Case
                    </div>
                    <div className={`text-xs mt-1 ${productType === 'case' ? 'text-white/80' : 'text-slate-400'}`}>
                      Protective Cases
                    </div>
                    {productType === 'case' && (
                      <div className="mt-3 inline-block bg-white/20 px-2 py-1 rounded text-xs font-semibold text-white">
                        ✓ SELECTED
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-600/30 space-y-4">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                📋 Basic Information
              </div>
              
              {/* Title and Brand Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Predator REVO 12.9"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Brand <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Predator"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Price and Condition Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Price (€) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Condition <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="New">New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Cue Type */}
              {productType === 'cue' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Cue Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="cueType"
                    value={formData.cueType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="playing">🎯 Playing Cue</option>
                    <option value="break">💥 Break Cue</option>
                    <option value="jump">🚀 Jump Cue</option>
                  </select>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Specifications Section - Conditional based on product type */}
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-600/30 space-y-4">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                📏 Specifications
              </div>

              {productType === 'cue' ? (
                <>
                  {/* Cue Specifications */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Weight (oz)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="18.5"
                        step="0.1"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Length (inches)
                      </label>
                      <input
                        type="number"
                        name="length"
                        value={formData.length}
                        onChange={handleChange}
                        placeholder="58"
                        step="0.1"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Tip Size (mm)
                      </label>
                      <input
                        type="number"
                        name="tipSize"
                        value={formData.tipSize}
                        onChange={handleChange}
                        placeholder="12.9"
                        step="0.1"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Shaft Material
                      </label>
                      <input
                        type="text"
                        name="shaftMaterial"
                        value={formData.shaftMaterial}
                        onChange={handleChange}
                        placeholder="e.g., Carbon Fiber"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Butt Material
                      </label>
                      <input
                        type="text"
                        name="buttMaterial"
                        value={formData.buttMaterial}
                        onChange={handleChange}
                        placeholder="e.g., Maple"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Case Specifications */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Case Capacity
                      </label>
                      <select
                        name="caseCapacity"
                        value={formData.caseCapacity}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select capacity</option>
                        <option value="1x1">1x1</option>
                        <option value="1x2">1x2</option>
                        <option value="2x4">2x4</option>
                        <option value="3x5">3x5</option>
                        <option value="4x8">4x8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Case Opening
                      </label>
                      <select
                        name="caseOpening"
                        value={formData.caseOpening}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Butterfly">Butterfly</option>
                        <option value="Top Open">Top Open</option>
                        <option value="Side Open">Side Open</option>
                        <option value="Zipper">Zipper</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Case Type
                      </label>
                      <select
                        name="caseType"
                        value={formData.caseType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Soft">Soft</option>
                        <option value="Hard">Hard</option>
                        <option value="Semi-Hard">Semi-Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        placeholder="e.g., Blue, Black"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Case Material
                      </label>
                      <input
                        type="text"
                        name="caseMaterial"
                        value={formData.caseMaterial}
                        onChange={handleChange}
                        placeholder="e.g., Ultra Vinyl, Leather"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Case Weight
                      </label>
                      <input
                        type="text"
                        name="caseWeight"
                        value={formData.caseWeight}
                        onChange={handleChange}
                        placeholder="e.g., 3.6 lbs"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Outer Dimensions
                    </label>
                    <input
                      type="text"
                      name="outerDimensions"
                      value={formData.outerDimensions}
                      onChange={handleChange}
                      placeholder="e.g., 86.36 cm H x 13.97 cm W x 20.32 cm D"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Pocket Space
                      </label>
                      <select
                        name="pocketSpace"
                        value={formData.pocketSpace}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select option</option>
                        <option value="None">None</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="Very Large">Very Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Handle/Extension Space
                      </label>
                      <input
                        type="text"
                        name="handleExtensionSpace"
                        value={formData.handleExtensionSpace}
                        onChange={handleChange}
                        placeholder="e.g., Protection Sleeves Included"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Description Section */}
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-600/30 space-y-4">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                📝 Description
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the cue's features, condition, and any special notes..."
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Images Section */}
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-600/30 space-y-4">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                📷 Images {!cue && <span className="text-red-400">*</span>}
              </div>

              {/* Existing images */}
              {cue && cue.images && cue.images.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-300">Current Images</div>
                  <div className="flex flex-wrap gap-3">
                    {cue.images.map(img => (
                      <div
                        key={img.id}
                        className={`relative w-32 h-32 rounded-lg overflow-hidden ${
                          img.isPrimary
                            ? 'border-4 border-blue-500'
                            : 'border border-slate-600/30'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt="Cue"
                          className="w-full h-full object-cover"
                        />
                        {img.isPrimary && (
                          <div className="absolute top-0 left-0 bg-blue-500 px-2 py-1 text-xs font-bold text-white">
                            PRIMARY
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 flex gap-1">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="p-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                              title="Set as primary"
                            >
                              ⭐
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(img.id)}
                            className="p-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
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
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-300">
                  {cue ? 'Add More Images' : 'Upload Images *'}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-dashed border-blue-500/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-400 cursor-pointer hover:border-blue-500/75"
                />
                <div className="text-xs text-slate-400">
                  JPG, PNG, GIF, WebP - Max 5MB each
                </div>

                {uploadProgress !== null && (
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium text-slate-300">
                      Uploading images... {uploadProgress}%
                    </div>
                    <div className="w-full bg-slate-700/50 h-2 rounded-full border border-blue-500/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-200"
                        style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {imagePreviews.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium text-slate-300">
                      {imagePreviews.length} new image(s) selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-blue-500/50"
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-red-500/10 border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30 font-medium"
              >
                {loading ? 'Saving...' : (cue ? 'Update Listing' : 'Create Listing')}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
