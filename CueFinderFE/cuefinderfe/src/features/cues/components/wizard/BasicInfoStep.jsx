import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

/**
 * BasicInfoStep - Step 2: Basic listing information
 * Title, brand, price, condition, and optional location
 * Mobile-optimized with larger touch targets
 */
export default function BasicInfoStep({ formData, onChange, productType }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const getProductLabel = () => {
    switch (productType) {
      case 'cue': return 'cue';
      case 'case': return 'case';
      case 'table': return 'table';
      case 'accessory': return 'accessory';
      default: return 'item';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          Basic Information
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Tell us about your {getProductLabel()}
        </p>
      </div>

      <Card className="border-border/50 shadow-none">
        <CardContent className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold mb-2 flex items-center gap-1">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={
                productType === 'cue' ? 'e.g., Predator REVO 12.9mm' :
                productType === 'case' ? 'e.g., 2x4 Hard Case' :
                productType === 'table' ? 'e.g., 8ft Brunswick Gold Crown' :
                'e.g., Kamui Black Soft Tip'
              }
              required
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Choose a descriptive title that buyers will search for
            </p>
          </div>

          {/* Brand */}
          <div>
            <Label htmlFor="brand" className="text-sm font-semibold mb-2 flex items-center gap-1">
              Brand <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder={
                productType === 'cue' ? 'e.g., Predator, Cuetec, McDermott' :
                productType === 'case' ? 'e.g., Instroke, Predator, J&J' :
                productType === 'table' ? 'e.g., Brunswick, Diamond, Olhausen' :
                'e.g., Kamui, Tiger, Moori'
              }
              required
              className="h-11 text-base"
            />
          </div>

          {/* Price & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price" className="text-sm font-semibold mb-2 flex items-center gap-1">
                Price (€) <span className="text-destructive">*</span>
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
                Condition <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                <SelectTrigger id="condition" className="h-11 text-base">
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

          {/* Cue Type - Only for cues */}
          {productType === 'cue' && (
            <div>
              <Label htmlFor="cueType" className="text-sm font-semibold mb-2">
                Cue Type
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
