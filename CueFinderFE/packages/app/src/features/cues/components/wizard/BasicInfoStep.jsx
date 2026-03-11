import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

export default function BasicInfoStep({ formData, onChange, productType }) {
  const { t } = useTranslation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const titlePlaceholderKey = productType === 'cue' ? 'wizard.field.title.placeholder.cue'
    : productType === 'case' ? 'wizard.field.title.placeholder.case'
    : productType === 'table' ? 'wizard.field.title.placeholder.table'
    : 'wizard.field.title.placeholder.other';

  const brandPlaceholderKey = productType === 'cue' ? 'wizard.field.brand.placeholder.cue'
    : productType === 'case' ? 'wizard.field.brand.placeholder.case'
    : productType === 'table' ? 'wizard.field.brand.placeholder.table'
    : 'wizard.field.brand.placeholder.other';

  const subtitleKey = `wizard.basicInfo.subtitle.${productType || 'item'}`;

  const conditionKeys = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          {t('wizard.basicInfo')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t(subtitleKey, t('wizard.basicInfo.subtitle.item'))}
        </p>
      </div>

      <Card className="border-border/50 shadow-none">
        <CardContent className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold mb-2 flex items-center gap-1">
              {t('wizard.field.title')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t(titlePlaceholderKey)}
              required
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('wizard.field.title.hint')}
            </p>
          </div>

          {/* Brand */}
          <div>
            <Label htmlFor="brand" className="text-sm font-semibold mb-2 flex items-center gap-1">
              {t('wizard.field.brand')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder={t(brandPlaceholderKey)}
              required
              className="h-11 text-base"
            />
          </div>

          {/* Price & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price" className="text-sm font-semibold mb-2 flex items-center gap-1">
                {t('wizard.field.price')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className="h-11 text-base"
              />
            </div>
            <div>
              <Label htmlFor="condition" className="text-sm font-semibold mb-2 flex items-center gap-1">
                {t('wizard.field.condition')} <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                <SelectTrigger id="condition" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionKeys.map((key) => (
                    <SelectItem key={key} value={key}>{t(`wizard.condition.${key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cue Type */}
          {productType === 'cue' && (
            <div>
              <Label htmlFor="cueType" className="text-sm font-semibold mb-2">
                {t('wizard.field.cueType')}
              </Label>
              <Select value={formData.cueType} onValueChange={(value) => handleSelectChange('cueType', value)}>
                <SelectTrigger id="cueType" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playing">{t('wizard.cueType.playing')}</SelectItem>
                  <SelectItem value="break">{t('wizard.cueType.break')}</SelectItem>
                  <SelectItem value="jump">{t('wizard.cueType.jump')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Accessory Type */}
          {productType === 'accessory' && (
            <div>
              <Label htmlFor="accessoryType" className="text-sm font-semibold mb-2">
                {t('wizard.field.accessoryType')}
              </Label>
              <Select value={formData.accessoryType} onValueChange={(value) => handleSelectChange('accessoryType', value)}>
                <SelectTrigger id="accessoryType" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chalk">{t('wizard.accessoryType.chalk')}</SelectItem>
                  <SelectItem value="tip">{t('wizard.accessoryType.tip')}</SelectItem>
                  <SelectItem value="glove">{t('wizard.accessoryType.glove')}</SelectItem>
                  <SelectItem value="towel">{t('wizard.accessoryType.towel')}</SelectItem>
                  <SelectItem value="other">{t('wizard.accessoryType.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-semibold mb-2">
              {t('wizard.field.location')}
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder={t('wizard.field.location.placeholder')}
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('wizard.field.location.hint')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
