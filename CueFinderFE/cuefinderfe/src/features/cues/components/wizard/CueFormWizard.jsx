import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import StepIndicator from './StepIndicator';
import ProductTypeStep from './ProductTypeStep';
import BasicInfoStep from './BasicInfoStep';
import SpecificationsStep from './SpecificationsStep';
import ImagesStep from './ImagesStep';
import * as cueService from '../../../../api/cueService';
import * as cueCaseService from '../../../../api/cueCaseService';
import * as billiardTableService from '../../../../api/billiardTableService';
import * as accessoryService from '../../../../api/accessoryService';
import { getErrorMessage } from '../../../../utils/errorUtils';

/**
 * CueFormWizard - Multi-step form wizard for creating/editing listings
 * 4 Steps:
 * 1. Product Type Selection (only for new listings)
 * 2. Basic Information (title, brand, price, condition)
 * 3. Specifications (product-specific details)
 * 4. Images & Description
 * 
 * Mobile-optimized with responsive design and touch-friendly controls
 */
export default function CueFormWizard({ cue, onClose, onSave }) {
  const { t } = useTranslation();
  const isEditing = !!cue;
  
  // Determine initial product type
  const getInitialProductType = () => {
    if (cue) {
      return cue.category === 'case' ? 'case' 
           : cue.category === 'table' ? 'table' 
           : cue.category === 'accessory' ? 'accessory' 
           : 'cue';
    }
    return '';
  };

  const [currentStep, setCurrentStep] = useState(isEditing ? 1 : 0);
  const [productType, setProductType] = useState(getInitialProductType());
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
    caseWeight: '',
    tableSize: '8',
    tableType: 'pool',
    playingSurface: '',
    feltType: '',
    frameMaterial: '',
    pocketType: '',
    features: '',
    manufactureYear: '',
    accessoryType: 'chalk',
    material: '',
    size: ''
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Load existing data when editing
  useEffect(() => {
    if (cue) {
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
        caseCapacity: cue.caseCapacity || '1x1',
        caseOpening: cue.caseOpening || 'Butterfly',
        caseType: cue.caseType || 'Soft',
        color: cue.color || '',
        caseMaterial: cue.caseMaterial || '',
        outerDimensions: cue.outerDimensions || '',
        pocketSpace: cue.pocketSpace || '',
        handleExtensionSpace: cue.handleExtensionSpace || '',
        caseWeight: cue.caseWeight || '',
        tableSize: cue.tableSize || '8',
        tableType: cue.tableType || 'pool',
        playingSurface: cue.playingSurface || '',
        feltType: cue.feltType || '',
        frameMaterial: cue.frameMaterial || '',
        pocketType: cue.pocketType || '',
        features: cue.features || '',
        manufactureYear: cue.manufactureYear || '',
        accessoryType: cue.accessoryType || 'chalk',
        material: cue.material || '',
        size: cue.size || ''
      });
      
      if (cue.images && cue.images.length > 0) {
        setExistingImages(cue.images);
      }
    }
  }, [cue]);

  // Define steps
  const steps = isEditing 
    ? [
        { title: 'Basic Info', shortTitle: 'Info' },
        { title: 'Specifications', shortTitle: 'Specs' },
        { title: 'Photos & Details', shortTitle: 'Photos' }
      ]
    : [
        { title: 'Product Type', shortTitle: 'Type' },
        { title: 'Basic Info', shortTitle: 'Info' },
        { title: 'Specifications', shortTitle: 'Specs' },
        { title: 'Photos & Details', shortTitle: 'Photos' }
      ];

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

  const handleImageDelete = async (identifier, isExisting) => {
    if (isExisting) {
      // Delete existing image from server
      if (!cue) return;
      try {
        setLoading(true);
        if (productType === 'cue') {
          await cueService.deleteImage(identifier);
        } else if (productType === 'case') {
          await cueCaseService.deleteCueCaseImage(cue.id, identifier);
        } else if (productType === 'table') {
          await billiardTableService.removeImage(identifier);
        } else if (productType === 'accessory') {
          await accessoryService.removeImage(cue.id, identifier);
        }
        setExistingImages(prev => prev.filter(img => img.id !== identifier));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to delete image.'));
      } finally {
        setLoading(false);
      }
    } else {
      // Remove new image from preview
      setImages(prev => prev.filter((_, index) => index !== identifier));
      setImagePreviews(prev => prev.filter((_, index) => index !== identifier));
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    if (!cue) return;
    try {
      setLoading(true);
      if (productType === 'cue') {
        await cueService.setPrimaryImage(imageId);
      } else if (productType === 'case') {
        await cueCaseService.setPrimaryCueCaseImage(cue.id, imageId);
      } else if (productType === 'table') {
        await billiardTableService.setPrimaryImage(cue.id, imageId);
      } else if (productType === 'accessory') {
        await accessoryService.setPrimaryImage(cue.id, imageId);
      }
      
      // Update existing images to reflect new primary
      setExistingImages(prev => 
        prev.map(img => ({ ...img, isPrimary: img.id === imageId }))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to set primary image.'));
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    if (isEditing) {
      // For editing, step 0 is Basic Info (step index 1 in non-edit mode)
      if (currentStep === 0) {
        return formData.title.trim() && formData.brand.trim() && formData.price;
      }
      return true;
    } else {
      // For new listings
      if (currentStep === 0) {
        return productType !== '';
      }
      if (currentStep === 1) {
        return formData.title.trim() && formData.brand.trim() && formData.price;
      }
      return true;
    }
  };

  const handleNext = () => {
    if (!canProceedToNextStep()) {
      setError('Please fill in all required fields before continuing.');
      return;
    }
    setError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.brand.trim() || !formData.price) {
        setError('⚠️ Please fill in all required fields: Title, Brand, and Price');
        setLoading(false);
        return;
      }

      // Validate images for new listings
      if (!isEditing && images.length === 0) {
        setError(`📸 Please upload at least one photo of your ${productType}. Listings with photos get more attention!`);
        setLoading(false);
        return;
      }

      let savedItem;

      // Save based on product type
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

        if (isEditing) {
          savedItem = await cueService.updateCue(cue.id, cueData);
        } else {
          savedItem = await cueService.createCue(cueData);
        }

        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await cueService.uploadCueImages(savedItem.id, images, setUploadProgress);
        }
      } else if (productType === 'case') {
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

        if (isEditing) {
          savedItem = await cueCaseService.updateCueCase(cue.id, caseData);
        } else {
          savedItem = await cueCaseService.createCueCase(caseData);
        }

        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await cueCaseService.uploadCueCaseImages(savedItem.id, images, setUploadProgress);
        }
      } else if (productType === 'table') {
        const tableData = {
          title: formData.title,
          brand: formData.brand,
          price: parseFloat(formData.price),
          condition: formData.condition,
          description: formData.description,
          location: formData.location || null,
          tableSize: formData.tableSize || '8',
          tableType: formData.tableType || 'pool',
          playingSurface: formData.playingSurface || null,
          feltType: formData.feltType || null,
          frameMaterial: formData.frameMaterial || null,
          pocketType: formData.pocketType || null,
          features: formData.features || null,
          manufactureYear: formData.manufactureYear ? parseInt(formData.manufactureYear) : null
        };

        if (isEditing) {
          savedItem = await billiardTableService.updateTable(cue.id, tableData);
        } else {
          savedItem = await billiardTableService.createTable(tableData);
        }

        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await billiardTableService.uploadTableImages(savedItem.id, images, setUploadProgress);
        }
      } else if (productType === 'accessory') {
        const accessoryData = {
          title: formData.title,
          brand: formData.brand,
          price: parseFloat(formData.price),
          condition: formData.condition,
          description: formData.description,
          location: formData.location || null,
          accessoryType: formData.accessoryType || 'chalk',
          material: formData.material || null,
          size: formData.size || null,
          color: formData.color || null
        };

        if (isEditing) {
          savedItem = await accessoryService.updateAccessory(cue.id, accessoryData);
        } else {
          savedItem = await accessoryService.createAccessory(accessoryData);
        }

        if (images.length > 0 && savedItem && savedItem.id) {
          setUploadProgress(0);
          await accessoryService.uploadAccessoryImages(savedItem.id, images, setUploadProgress);
        }
      }

      // Success - call onSave callback
      onSave();
    } catch (error) {
      console.error('Error saving listing:', error);
      setError(getErrorMessage(error, 'Failed to save listing. Please try again.'));
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const renderStep = () => {
    const adjustedStep = isEditing ? currentStep + 1 : currentStep;

    switch (adjustedStep) {
      case 0:
        return (
          <ProductTypeStep
            productType={productType}
            onProductTypeChange={setProductType}
          />
        );
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            onChange={setFormData}
            productType={productType}
          />
        );
      case 2:
        return (
          <SpecificationsStep
            formData={formData}
            onChange={setFormData}
            productType={productType}
          />
        );
      case 3:
        return (
          <ImagesStep
            formData={formData}
            onChange={setFormData}
            images={images}
            imagePreviews={imagePreviews}
            onImageSelect={handleImageSelect}
            onImageDelete={handleImageDelete}
            onSetPrimaryImage={handleSetPrimaryImage}
            existingImages={existingImages}
            isEditing={isEditing}
            uploadProgress={uploadProgress}
            productType={productType}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[999]" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4">
        <div 
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md sm:max-w-2xl max-h-[96vh] overflow-hidden flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-accent rounded-md transition-colors z-10 text-foreground/60 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="bg-card border-b border-border p-3 sm:p-4 pr-12">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {isEditing ? t('listing.editListing') : t('listing.createNewListing')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {productType === 'cue' 
                ? t('listing.shareDetailsCue')
                : productType === 'case'
                ? t('listing.shareDetailsCase')
                : productType === 'table'
                ? t('listing.shareDetailsTable')
                : productType === 'accessory'
                ? t('listing.shareDetailsAccessory')
                : t('listing.followSteps')}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="px-3 sm:px-4 bg-card border-b border-border">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            {renderStep()}
          </div>

          {/* Footer - Navigation Buttons */}
          <div className="bg-card border-t border-border p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
                className="h-11 px-4 sm:px-6"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.back')}
              </Button>

              {/* Next/Submit Button */}
              <Button
                type="button"
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={loading || !canProceedToNextStep()}
                className="h-11 px-4 sm:px-6 flex-1 sm:flex-initial"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadProgress !== null ? `${t('common.uploading')} ${Math.round(uploadProgress)}%` : t('common.saving')}
                  </>
                ) : isLastStep ? (
                  <>
                    {isEditing ? t('listing.updateListing') : t('listing.createListing')}
                  </>
                ) : (
                  <>
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Progress Text */}
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                {t('listing.step')} {currentStep + 1} {t('listing.of')} {steps.length}
                {!isLastStep && ' - ' + steps[currentStep + 1]?.title + ' ' + t('listing.next')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
