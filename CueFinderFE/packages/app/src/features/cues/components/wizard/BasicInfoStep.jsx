import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

/**
 * BasicInfoStep - Step 2: Basic listing information
 * Title, brand, price, condition, and optional location
 * Mobile-optimized with larger touch targets
 * Multilanguage support for English and Greek
 */
export default function BasicInfoStep({ formData, onChange, productType }) {
  const { i18n } = useTranslation();
  const isGreek = i18n.language?.startsWith('el');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const getProductLabel = () => {
    if (isGreek) {
      switch (productType) {
        case 'cue': return 'στέκα';
        case 'case': return 'θήκη';
        case 'table': return 'τραπέζι';
        case 'accessory': return 'αξεσουάρ';
        default: return 'αντικείμενο';
      }
    } else {
      switch (productType) {
        case 'cue': return 'cue';
        case 'case': return 'case';
        case 'table': return 'table';
        case 'accessory': return 'accessory';
        default: return 'item';
      }
    }
  };

  const conditionOptions = isGreek 
    ? { 'New': 'Καινούργιο', 'Excellent': 'Άριστη', 'Good': 'Καλή', 'Fair': 'Μέτρια', 'Poor': 'Χαμηλή' }
    : { 'New': 'New', 'Excellent': 'Excellent', 'Good': 'Good', 'Fair': 'Fair', 'Poor': 'Poor' };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          {isGreek ? 'Βασικές Πληροφορίες' : 'Basic Information'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isGreek ? `Πείτε μας για το ${getProductLabel()} σας` : `Tell us about your ${getProductLabel()}`}
        </p>
      </div>

      <Card className="border-border/50 shadow-none">
        <CardContent className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold mb-2 flex items-center gap-1">
              {isGreek ? 'Τίτλος' : 'Title'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={
                productType === 'cue' ? (isGreek ? 'π.χ., Predator REVO 12.9mm' : 'e.g., Predator REVO 12.9mm') :
                productType === 'case' ? (isGreek ? 'π.χ., Θήκη 2x4' : 'e.g., 2x4 Hard Case') :
                productType === 'table' ? (isGreek ? 'π.χ., 8ft Brunswick Gold Crown' : 'e.g., 8ft Brunswick Gold Crown') :
                (isGreek ? 'π.χ., Kamui Black Soft Tip' : 'e.g., Kamui Black Soft Tip')
              }
              required
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isGreek ? 'Επιλέξτε περιγραφικό τίτλο που θα ψάχνουν οι αγοραστές' : 'Choose a descriptive title that buyers will search for'}
            </p>
          </div>

          {/* Brand */}
          <div>
            <Label htmlFor="brand" className="text-sm font-semibold mb-2 flex items-center gap-1">
              {isGreek ? 'Μάρκα' : 'Brand'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder={
                productType === 'cue' ? (isGreek ? 'π.χ., Predator, Cuetec, McDermott' : 'e.g., Predator, Cuetec, McDermott') :
                productType === 'case' ? (isGreek ? 'π.χ., Instroke, Predator, J&J' : 'e.g., Instroke, Predator, J&J') :
                productType === 'table' ? (isGreek ? 'π.χ., Brunswick, Diamond, Olhausen' : 'e.g., Brunswick, Diamond, Olhausen') :
                (isGreek ? 'π.χ., Kamui, Tiger, Moori' : 'e.g., Kamui, Tiger, Moori')
              }
              required
              className="h-11 text-base"
            />
          </div>

          {/* Price & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price" className="text-sm font-semibold mb-2 flex items-center gap-1">
                {isGreek ? 'Τιμή (€)' : 'Price (€)'} <span className="text-destructive">*</span>
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
                {isGreek ? 'Κατάσταση' : 'Condition'} <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                <SelectTrigger id="condition" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(conditionOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cue Type - Only for cues */}
          {productType === 'cue' && (
            <div>
              <Label htmlFor="cueType" className="text-sm font-semibold mb-2">
                {isGreek ? 'Τύπος Στέκας' : 'Cue Type'}
              </Label>
              <Select value={formData.cueType} onValueChange={(value) => handleSelectChange('cueType', value)}>
                <SelectTrigger id="cueType" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playing">Playing Cue</SelectItem>
                  <SelectItem value="break">Break Cue</SelectItem>
                  <SelectItem value="jump">Jump Cue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Accessory Type - Only for accessories */}
          {productType === 'accessory' && (
            <div>
              <Label htmlFor="accessoryType" className="text-sm font-semibold mb-2">
                Accessory Type
              </Label>
              <Select value={formData.accessoryType} onValueChange={(value) => handleSelectChange('accessoryType', value)}>
                <SelectTrigger id="accessoryType" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chalk">Chalk</SelectItem>
                  <SelectItem value="tip">Tips</SelectItem>
                  <SelectItem value="glove">Glove</SelectItem>
                  <SelectItem value="towel">Towel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-semibold mb-2">
              Location (Optional)
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Athens, Greece"
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Help buyers find local listings
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
