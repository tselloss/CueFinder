import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';

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
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const handleDescriptionChange = (e) => {
    onChange({ ...formData, description: e.target.value });
  };

  const handleImageInputChange = (e) => {
    onImageSelect(e);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
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
  const descPlaceholderKey = `wizard.description.placeholder.${productType}`;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          {t('wizard.photos')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t(isEditing ? 'wizard.photos.subtitle.edit' : 'wizard.photos.subtitle.new')}
        </p>
      </div>

      {/* Description */}
      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4">
          <Label htmlFor="description" className="text-sm font-semibold mb-2">
            {t('wizard.field.description')}
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder={t(descPlaceholderKey, t('wizard.description.placeholder.cue'))}
            rows={5}
            className="resize-none text-base"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t('wizard.description.hint')}
          </p>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              {t('wizard.photos.label')} {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <span className="text-xs text-muted-foreground">
              {totalImages} {t(totalImages !== 1 ? 'wizard.photos.count.other' : 'wizard.photos.count.one')}
            </span>
          </div>

          {/* Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageInputChange}
              className="hidden"
            />
            <div
              role="button"
              tabIndex={0}
              onClick={handleUploadAreaClick}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleUploadAreaClick()}
              className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center"
            >
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                {t('wizard.photos.uploadClick')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('wizard.photos.uploadHere')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('wizard.photos.uploadSize')}
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('wizard.photos.uploading')}</span>
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

          {/* Existing Images */}
          {existingImages && existingImages.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-foreground">
                {t('wizard.photos.current')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((img, index) => (
                  <div key={img.id || index} className="relative">
                    <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-muted ${
                      img.isPrimary ? 'border-primary' : 'border-border'
                    }`}>
                      <img src={getImageUrl(img)} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => onSetPrimaryImage(img.id)}
                          className="p-1.5 bg-black/60 text-white rounded-full hover:bg-primary transition-colors"
                          title={t('wizard.photos.setPrimary')}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onImageDelete(img.id, true)}
                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-destructive transition-colors"
                        title={t('wizard.photos.delete')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {t('wizard.photos.primary')}
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
                {t('wizard.photos.new')} {isEditing && `(${t('wizard.photos.willUpload')})`}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-muted ${
                      index === 0 && !existingImages?.length ? 'border-primary' : 'border-border'
                    }`}>
                      <img src={preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => onImageDelete(index, false)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full hover:bg-destructive transition-colors"
                      title={t('wizard.photos.remove')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {index === 0 && !existingImages?.length && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        {t('wizard.photos.primary')}
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
              <p className="text-sm">{t('wizard.photos.none')}</p>
              <p className="text-xs mt-1">
                {t(isEditing ? 'wizard.photos.none.hint.edit' : 'wizard.photos.none.hint.new')}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 {t('wizard.photos.tip')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
