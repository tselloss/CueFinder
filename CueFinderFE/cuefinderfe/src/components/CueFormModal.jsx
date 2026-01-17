import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Star, X } from 'lucide-react';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import { getErrorMessage } from '../utils/errorUtils';
import { SITE_BASE_URL } from '../config/apiConfig';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

// Helper to get full image URL
const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return url;
};

export default function CueFormModal({ cue, onClose, onSave }) {
  const [productType, setProductType] = useState('cue');
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    condition: 'Excellent',
    description: '',
    cueType: 'playing',
    weight: '',
    length: '',
    tipSize: '',
    shaftMaterial: '',
    buttMaterial: '',
    location: '',
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
      setProductType(cue.category === 'case' ? 'case' : 'cue');
      setFormData({
        title: cue.title || '',
        brand: cue.brand || '',
        price: cue.price || '',
        condition: cue.condition || 'Excellent',
        description: cue.description || '',
        cueType: cue.cueType || 'playing',
        weight: cue.weight || '',
        length: cue.length || '',
        tipSize: cue.tipSize || '',
        shaftMaterial: cue.shaftMaterial || '',
        buttMaterial: cue.buttMaterial || '',
        location: cue.location || '',
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!cue) return;
    try {
      setLoading(true);
      if (productType === 'cue') {
        await cueService.deleteImage(imageId);
      } else {
        await cueCaseService.deleteCueCaseImage(cue.id, imageId);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete image.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    if (!cue) return;
    try {
      setLoading(true);
      if (productType === 'cue') {
        await cueService.setPrimaryImage(imageId);
      } else {
        await cueCaseService.setPrimaryCueCaseImage(cue.id, imageId);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to set primary image.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim() || !formData.brand.trim() || !formData.price) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      if (!cue && images.length === 0) {
        setError(`Please upload at least one image for your ${productType} listing.`);
        setLoading(false);
        return;
      }

      let savedItem;

      if (productType === 'cue') {
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
          savedItem = await cueService.updateCue(cue.id, cueData);
        } else {
          savedItem = await cueService.createCue(cueData);
        }

        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await cueService.uploadCueImages(savedItem.id, images, setUploadProgress);
        }
      } else {
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
          savedItem = await cueCaseService.updateCueCase(cue.id, caseData);
        } else {
          savedItem = await cueCaseService.createCueCase(caseData);
        }

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
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[999]" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4">
        {/* Modal Content */}
        <div 
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md sm:max-w-2xl max-h-[98vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-md transition-colors z-10 text-foreground/60 hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-b from-card to-card/50 border-b border-border p-4 sm:p-6 pr-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {cue ? '✏️ Edit Listing' : '➕ Create New Listing'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              {productType === 'cue' 
                ? 'Share details about your billiard cue'
                : 'Share details about your cue case'}
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {error && (
              <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm sm:text-base text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Product Type Selector - Only for new listings */}
            {!cue && (
              <div className="space-y-3">
                <h3 className="font-semibold text-base sm:text-lg text-foreground">🎯 What are you listing?</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setProductType('cue')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      productType === 'cue'
                        ? 'border-primary bg-primary/15 shadow-md'
                        : 'border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl mb-2">🎱</div>
                    <div className="font-semibold text-sm sm:text-base text-foreground">Billiard Cue</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Pool & Snooker</div>
                    {productType === 'cue' && (
                      <div className="mt-2 text-xs font-bold text-primary">✓ SELECTED</div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('case')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      productType === 'case'

                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl md:text-3xl mb-0.5 sm:mb-1 md:mb-2">💼</div>
                    <div className="font-semibold text-xs sm:text-base">Cue Case</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">Protective Cases</div>
                    {productType === 'case' && (
                      <div className="mt-0.5 sm:mt-1 md:mt-2 text-xs font-bold text-primary">✓ SELECTED</div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl text-foreground">📋 Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="title" className="text-sm sm:text-base font-semibold mb-2">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Predator REVO 1"
                      required
                      className="h-10 sm:h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand" className="text-sm sm:text-base font-semibold mb-2">Brand *</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g., Predator"
                      required
                      className="h-10 sm:h-11 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="price" className="text-sm sm:text-base font-semibold mb-2">Price (€) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      className="h-10 sm:h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition" className="text-sm sm:text-base font-semibold mb-2">Condition *</Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                      <SelectTrigger id="condition" className="h-10 sm:h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['New', 'Excellent', 'Good', 'Fair', 'Poor'].map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {productType === 'cue' && (
                  <div>
                    <Label htmlFor="cueType" className="text-sm sm:text-base font-semibold mb-2">Cue Type *</Label>
                    <Select value={formData.cueType} onValueChange={(value) => setFormData(prev => ({ ...prev, cueType: value }))}>
                      <SelectTrigger id="cueType" className="h-10 sm:h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="playing">🎯 Playing Cue</SelectItem>
                        <SelectItem value="break">💥 Break Cue</SelectItem>
                        <SelectItem value="jump">🚀 Jump Cue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="location" className="text-sm sm:text-base font-semibold mb-2">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State"
                    className="h-10 sm:h-11 text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl text-foreground">📏 Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {productType === 'cue' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="weight" className="text-sm sm:text-base font-semibold mb-2">Weight (oz)</Label>
                        <Input
                          id="weight"
                          name="weight"
                          type="number"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="18.5"
                          step="0.1"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                      <div>
                        <Label htmlFor="length" className="text-sm sm:text-base font-semibold mb-2">Length (inches)</Label>
                        <Input
                          id="length"
                          name="length"
                          type="number"
                          value={formData.length}
                          onChange={handleChange}
                          placeholder="58"
                          step="0.1"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipSize" className="text-sm sm:text-base font-semibold mb-2">Tip Size (mm)</Label>
                        <Input
                          id="tipSize"
                          name="tipSize"
                          type="number"
                          value={formData.tipSize}
                          onChange={handleChange}
                          placeholder="12.9"
                          step="0.1"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="shaftMaterial" className="text-sm sm:text-base font-semibold mb-2">Shaft Material</Label>
                        <Input
                          id="shaftMaterial"
                          name="shaftMaterial"
                          value={formData.shaftMaterial}
                          onChange={handleChange}
                          placeholder="e.g., Carbon Fiber"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                      <div>
                        <Label htmlFor="buttMaterial" className="text-sm sm:text-base font-semibold mb-2">Butt Material</Label>
                        <Input
                          id="buttMaterial"
                          name="buttMaterial"
                          value={formData.buttMaterial}
                          onChange={handleChange}
                          placeholder="e.g., Maple"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="caseCapacity" className="text-sm sm:text-base font-semibold mb-2">Case Capacity</Label>
                        <Select value={formData.caseCapacity} onValueChange={(value) => setFormData(prev => ({ ...prev, caseCapacity: value }))}>
                          <SelectTrigger id="caseCapacity" className="h-10 sm:h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['1x1', '1x2', '2x4', '3x5', '4x8'].map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="caseOpening" className="text-sm sm:text-base font-semibold mb-2">Case Opening</Label>
                        <Select value={formData.caseOpening} onValueChange={(value) => setFormData(prev => ({ ...prev, caseOpening: value }))}>
                          <SelectTrigger id="caseOpening" className="h-10 sm:h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['Butterfly', 'Top Open', 'Side Open', 'Zipper'].map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="caseType" className="text-sm sm:text-base font-semibold mb-2">Case Type</Label>
                        <Select value={formData.caseType} onValueChange={(value) => setFormData(prev => ({ ...prev, caseType: value }))}>
                          <SelectTrigger id="caseType" className="h-10 sm:h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['Soft', 'Hard', 'Semi-Hard'].map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="color" className="text-sm sm:text-base font-semibold mb-2">Color</Label>
                        <Input
                          id="color"
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          placeholder="e.g., Blue, Black"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                      <div>
                        <Label htmlFor="caseMaterial" className="text-sm sm:text-base font-semibold mb-2">Material</Label>
                        <Input
                          id="caseMaterial"
                          name="caseMaterial"
                          value={formData.caseMaterial}
                          onChange={handleChange}
                          placeholder="e.g., Ultra Vinyl"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="caseWeight" className="text-sm sm:text-base font-semibold mb-2">Weight</Label>
                        <Input
                          id="caseWeight"
                          name="caseWeight"
                          value={formData.caseWeight}
                          onChange={handleChange}
                          placeholder="e.g., 3.6 lbs"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                      <div>
                        <Label htmlFor="outerDimensions" className="text-sm sm:text-base font-semibold mb-2">Dimensions</Label>
                        <Input
                          id="outerDimensions"
                          name="outerDimensions"
                          value={formData.outerDimensions}
                          onChange={handleChange}
                          placeholder="e.g., 86x14x20 cm"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="pocketSpace" className="text-sm sm:text-base font-semibold mb-2">Pocket Space</Label>
                        <Select value={formData.pocketSpace} onValueChange={(value) => setFormData(prev => ({ ...prev, pocketSpace: value }))}>
                          <SelectTrigger id="pocketSpace" className="h-10 sm:h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['None', 'Small', 'Medium', 'Large', 'Very Large'].map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="handleExtensionSpace" className="text-sm sm:text-base font-semibold mb-2">Extension Space</Label>
                        <Input
                          id="handleExtensionSpace"
                          name="handleExtensionSpace"
                          value={formData.handleExtensionSpace}
                          onChange={handleChange}
                          placeholder="e.g., Sleeves Included"
                          className="h-10 sm:h-11 text-base"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl text-foreground">📝 Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the cue's features, condition, and any special notes..."
                  rows={4}
                  className="resize-none text-base min-h-[120px] sm:min-h-[140px]"
                />
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl text-foreground">
                  📷 Images {!cue && <span className="text-destructive ml-1">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Existing Images */}
                {cue && cue.images && cue.images.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Current Images</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
                      {cue.images.map(img => (
                        <div
                          key={img.id}
                          className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 ${
                            img.isPrimary ? 'border-primary shadow-md' : 'border-border'
                          }`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt="Cue"
                            className="w-full h-full object-cover"
                          />
                          {img.isPrimary && (
                            <div className="absolute top-1.5 left-1.5 bg-primary text-white text-xs px-2 py-1 rounded-md font-bold">
                              PRIMARY
                            </div>
                          )}
                          <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                            {!img.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img.id)}
                                className="bg-primary/90 p-1.5 rounded-md hover:bg-primary transition-colors"
                              >
                                <Star className="w-4 h-4 text-white" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingImage(img.id)}
                              className="bg-destructive/90 p-1.5 rounded-md hover:bg-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                <div className="space-y-3">
                  <label className="text-sm sm:text-base font-semibold text-foreground">
                    {cue ? 'Add More Images' : 'Upload Images *'}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="block p-6 sm:p-8 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors bg-card/50"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        <span className="text-base sm:text-lg font-semibold text-foreground">Click to upload images</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">or drag and drop</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    JPG, PNG, GIF, WebP - Max 5MB each
                  </p>

                  {uploadProgress !== null && (
                    <div className="space-y-2">
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        Uploading images... {uploadProgress}%
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        {imagePreviews.length} new image(s) selected
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="w-full aspect-square rounded-lg overflow-hidden border-2 border-primary/50 shadow-sm hover:shadow-md transition-shadow"
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
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 sticky bottom-0 bg-card border-t border-border -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto h-11 sm:h-12 text-base font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 w-full sm:w-auto h-11 sm:h-12 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  cue ? 'Update Listing' : 'Create Listing'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
