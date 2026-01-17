import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Star, ArrowLeft } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg overflow-hidden flex flex-col p-3 sm:p-4 md:p-6 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-md hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl leading-tight">
            {cue ? '✏️ Edit Listing' : '➕ Create New Listing'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {productType === 'cue' 
              ? 'Provide details about your billiard cue'
              : 'Provide details about your cue case'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2 sm:p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs sm:text-sm text-destructive flex-shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Product Type Selector - Only for new listings */}
          {!cue && (
            <div className="space-y-2">
              <h3 className="font-semibold text-xs sm:text-base md:text-lg">🎯 What are you listing?</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => setProductType('cue')}
                  className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                    productType === 'cue'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="text-lg sm:text-2xl md:text-3xl mb-0.5 sm:mb-1 md:mb-2">🎱</div>
                  <div className="font-semibold text-xs sm:text-base">Billiard Cue</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Pool & Snooker Cues</div>
                  {productType === 'cue' && (
                    <div className="mt-0.5 sm:mt-1 md:mt-2 text-xs font-bold text-primary">✓ SELECTED</div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('case')}
                  className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all text-xs sm:text-sm ${
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
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm md:text-base">📋 Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Predator REVO 12.9"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Predator"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (€) *</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger id="condition">
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
                  <Label htmlFor="cueType">Cue Type *</Label>
                  <Select value={formData.cueType} onValueChange={(value) => setFormData(prev => ({ ...prev, cueType: value }))}>
                    <SelectTrigger id="cueType">
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                />
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm md:text-base">📏 Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 md:space-y-4">
              {productType === 'cue' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (oz)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="18.5"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Length (inches)</Label>
                      <Input
                        id="length"
                        name="length"
                        type="number"
                        value={formData.length}
                        onChange={handleChange}
                        placeholder="58"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipSize">Tip Size (mm)</Label>
                      <Input
                        id="tipSize"
                        name="tipSize"
                        type="number"
                        value={formData.tipSize}
                        onChange={handleChange}
                        placeholder="12.9"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="shaftMaterial">Shaft Material</Label>
                      <Input
                        id="shaftMaterial"
                        name="shaftMaterial"
                        value={formData.shaftMaterial}
                        onChange={handleChange}
                        placeholder="e.g., Carbon Fiber"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buttMaterial">Butt Material</Label>
                      <Input
                        id="buttMaterial"
                        name="buttMaterial"
                        value={formData.buttMaterial}
                        onChange={handleChange}
                        placeholder="e.g., Maple"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="caseCapacity">Case Capacity</Label>
                      <Select value={formData.caseCapacity} onValueChange={(value) => setFormData(prev => ({ ...prev, caseCapacity: value }))}>
                        <SelectTrigger id="caseCapacity">
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
                      <Label htmlFor="caseOpening">Case Opening</Label>
                      <Select value={formData.caseOpening} onValueChange={(value) => setFormData(prev => ({ ...prev, caseOpening: value }))}>
                        <SelectTrigger id="caseOpening">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="caseType">Case Type</Label>
                      <Select value={formData.caseType} onValueChange={(value) => setFormData(prev => ({ ...prev, caseType: value }))}>
                        <SelectTrigger id="caseType">
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
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        placeholder="e.g., Blue, Black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="caseMaterial">Case Material</Label>
                      <Input
                        id="caseMaterial"
                        name="caseMaterial"
                        value={formData.caseMaterial}
                        onChange={handleChange}
                        placeholder="e.g., Ultra Vinyl, Leather"
                      />
                    </div>
                    <div>
                      <Label htmlFor="caseWeight">Case Weight</Label>
                      <Input
                        id="caseWeight"
                        name="caseWeight"
                        value={formData.caseWeight}
                        onChange={handleChange}
                        placeholder="e.g., 3.6 lbs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="outerDimensions">Outer Dimensions</Label>
                    <Input
                      id="outerDimensions"
                      name="outerDimensions"
                      value={formData.outerDimensions}
                      onChange={handleChange}
                      placeholder="e.g., 86.36 cm H x 13.97 cm W x 20.32 cm D"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pocketSpace">Pocket Space</Label>
                      <Select value={formData.pocketSpace} onValueChange={(value) => setFormData(prev => ({ ...prev, pocketSpace: value }))}>
                        <SelectTrigger id="pocketSpace">
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
                      <Label htmlFor="handleExtensionSpace">Handle/Extension Space</Label>
                      <Input
                        id="handleExtensionSpace"
                        name="handleExtensionSpace"
                        value={formData.handleExtensionSpace}
                        onChange={handleChange}
                        placeholder="e.g., Protection Sleeves Included"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm md:text-base">📝 Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the cue's features, condition, and any special notes..."
                rows={2}
                className="resize-none text-xs sm:text-sm"
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm md:text-base">
                📷 Images {!cue && <span className="text-destructive">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {/* Existing Images */}
              {cue && cue.images && cue.images.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-medium">Current Images</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                    {cue.images.map(img => (
                      <div
                        key={img.id}
                        className={`relative w-full aspect-square rounded-md overflow-hidden border-2 ${
                          img.isPrimary ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt="Cue"
                          className="w-full h-full object-cover"
                        />
                        {img.isPrimary && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded font-bold">
                            PRIMARY
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 flex gap-1">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="bg-primary/90 p-1 rounded hover:bg-primary"
                            >
                              <Star className="w-3 h-3 text-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(img.id)}
                            className="bg-destructive/90 p-1 rounded hover:bg-destructive"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
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
                    className="block p-4 border-2 border-dashed border-primary/50 rounded-md cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Click to upload images</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, WebP - Max 5MB each
                </p>

                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      Uploading images... {uploadProgress}%
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                      />
                    </div>
                  </div>
                )}

                {imagePreviews.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {imagePreviews.length} new image(s) selected
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="w-full aspect-square rounded-md overflow-hidden border border-primary/50"
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
          <DialogFooter className="flex-shrink-0 flex flex-col-reverse sm:flex-row gap-1.5 sm:gap-2 pt-2 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 w-full sm:w-auto text-xs sm:text-sm py-1.5 sm:py-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                cue ? 'Update Listing' : 'Create Listing'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
