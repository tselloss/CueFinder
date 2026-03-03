import React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';

/**
 * ImagesStep - Step 4: Upload images and add description
 * Image upload with drag & drop support
 * Image preview with delete and set primary options
 * Description field
 * Multilanguage support for English and Greek
 */
export default function ImagesStep({ 
  formData, 
  onChange, 
  images,
  imagePreviews,
  onImageSelect,
  onImageDelete,
  onSetPrimaryImage,
  existingImages = [],
  isEditing = false,
  uploadProgress,
  productType
}) {
  const { i18n } = useTranslation();
  const isGreek = i18n.language?.startsWith('el');

  const handleDescriptionChange = (e) => {
    onChange({ ...formData, description: e.target.value });
  };

  const handleImageInputChange = (e) => {
    onImageSelect(e);
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    const url = typeof img === 'string' ? img : img.imageUrl;
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `${window.location.origin}${url}`;
    return url;
  };

  const totalImages = existingImages.length + imagePreviews.length;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          {isGreek ? 'Φωτογραφίες & Περιγραφή' : 'Photos & Description'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isGreek 
            ? (isEditing ? 'Ενημερώστε τις φωτογραφίες και την περιγραφή' : 'Προσθέστε φωτογραφίες για να ελκύσετε αγοραστές')
            : (isEditing ? 'Update photos and description' : 'Add photos to attract buyers')
          }
        </p>
      </div>

      {/* Description */}
      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4">
          <Label htmlFor="description" className="text-sm font-semibold mb-2">
            {isGreek ? 'Περιγραφή' : 'Description'}
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder={isGreek 
              ? `Περιγράψτε το ${productType === 'cue' ? 'στέκα' : productType === 'case' ? 'θήκη' : productType === 'table' ? 'τραπέζι' : 'αξεσουάρ'} σας... Συμπεριλάβετε λεπτομέρειες κατάστασης, ιστορικό, ειδικά χαρακτηριστικά, λόγο πώλησης κ.λπ.`
              : `Describe your ${productType}... Include condition details, history, special features, reason for selling, etc.`
            }
            rows={5}
            className="resize-none text-base"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {isGreek ? 'Μια λεπτομερής περιγραφή βοηθά τους αγοραστές να λάβουν τεκμηριωμένες αποφάσεις' : 'A detailed description helps buyers make informed decisions'}
          </p>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              {isGreek ? 'Φωτογραφίες' : 'Photos'} {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <span className="text-xs text-muted-foreground">
              {totalImages} {isGreek ? (totalImages !== 1 ? 'φωτογραφίες' : 'φωτογραφία') : (totalImages !== 1 ? 'photos' : 'photo')}
            </span>
          </div>

          {/* Upload Button */}
          <label className="block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageInputChange}
              className="hidden"
            />
            <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isGreek ? 'Κάντε κλικ για μεταφόρτωση ή σύρετε και αποθέστε' : 'Click to upload photos or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isGreek ? 'Εδώ φωτογραφίες' : 'images here'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF {isGreek ? 'έως 10MB' : 'up to 10MB'} {isGreek ? 'το καθένα' : 'each'}
              </p>
            </div>
          </label>

          {/* Upload Progress */}
          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{isGreek ? 'Μεταφόρτωση...' : 'Uploading...'}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Existing Images (for edit mode) */}
          {existingImages && existingImages.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-foreground">
                {isGreek ? 'Τρέχουσες Φωτογραφίες' : 'Current Photos'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((img, index) => (
                  <div key={img.id || index} className="relative">
                    <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-muted ${
                      img.isPrimary ? 'border-primary' : 'border-border'
                    }`}>
                      <img
                        src={getImageUrl(img)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Always-visible action buttons (works on mobile and desktop) */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => onSetPrimaryImage(img.id)}
                          className="p-1.5 bg-black/60 text-white rounded-full hover:bg-primary transition-colors"
                          title={isGreek ? 'Ορισμός ως κύρια' : 'Set as primary'}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onImageDelete(img.id, true)}
                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-destructive transition-colors"
                        title={isGreek ? 'Διαγραφή' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {isGreek ? 'Κύρια' : 'Primary'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-foreground">
                {isGreek ? 'Νέες Φωτογραφίες' : 'New Photos'} {isEditing && `(${isGreek ? 'θα μεταφορτωθούν κατά την αποθήκευση' : 'will be uploaded on save'})`}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-muted ${
                      index === 0 && !existingImages?.length ? 'border-primary' : 'border-border'
                    }`}>
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Always-visible delete button */}
                    <button
                      type="button"
                      onClick={() => onImageDelete(index, false)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full hover:bg-destructive transition-colors"
                      title={isGreek ? 'Αφαίρεση' : 'Remove'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {index === 0 && !existingImages?.length && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        {isGreek ? 'Κύρια' : 'Primary'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalImages === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isGreek ? 'Δεν υπάρχουν φωτογραφίες ακόμα' : 'No photos yet'}</p>
              <p className="text-xs mt-1">
                {isGreek ? (isEditing ? 'Προσθέστε νέες φωτογραφίες παραπάνω' : 'Μεταφορτώστε τουλάχιστον μία φωτογραφία για να συνεχίσετε') : (isEditing ? 'Add new photos above' : 'Upload at least one photo to continue')}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 {isGreek ? 'Συμβουλή: Προσθέστε πολλές γωνίες και κοντινές λήψεις. Η πρώτη φωτογραφία θα είναι η κύρια εικόνα.' : 'Tip: Add multiple angles and close-ups. The first photo will be the primary image.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
