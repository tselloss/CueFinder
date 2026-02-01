import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

/**
 * SpecificationsStep - Step 3: Product-specific specifications
 * Different fields based on product type (cue, case, table, accessory)
 * Mobile-optimized inputs with proper keyboard types
 */
export default function SpecificationsStep({ formData, onChange, productType }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const renderCueSpecifications = () => (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="weight" className="text-sm font-semibold mb-2">Weight (oz)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleInputChange}
            placeholder="18.5"
            step="0.1"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="length" className="text-sm font-semibold mb-2">Length (in)</Label>
          <Input
            id="length"
            name="length"
            type="number"
            value={formData.length}
            onChange={handleInputChange}
            placeholder="58"
            step="0.1"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="tipSize" className="text-sm font-semibold mb-2">Tip (mm)</Label>
          <Input
            id="tipSize"
            name="tipSize"
            type="number"
            value={formData.tipSize}
            onChange={handleInputChange}
            placeholder="12.9"
            step="0.1"
            className="h-11 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="shaftMaterial" className="text-sm font-semibold mb-2">Shaft Material</Label>
          <Input
            id="shaftMaterial"
            name="shaftMaterial"
            value={formData.shaftMaterial}
            onChange={handleInputChange}
            placeholder="e.g., Carbon Fiber, Maple"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="buttMaterial" className="text-sm font-semibold mb-2">Butt Material</Label>
          <Input
            id="buttMaterial"
            name="buttMaterial"
            value={formData.buttMaterial}
            onChange={handleInputChange}
            placeholder="e.g., Ebony, Cocobolo"
            className="h-11 text-base"
          />
        </div>
      </div>
    </>
  );

  const renderCaseSpecifications = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="caseCapacity" className="text-sm font-semibold mb-2">Case Capacity</Label>
          <Select value={formData.caseCapacity} onValueChange={(value) => handleSelectChange('caseCapacity', value)}>
            <SelectTrigger id="caseCapacity" className="h-11 text-base">
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
          <Label htmlFor="caseOpening" className="text-sm font-semibold mb-2">Case Opening</Label>
          <Select value={formData.caseOpening} onValueChange={(value) => handleSelectChange('caseOpening', value)}>
            <SelectTrigger id="caseOpening" className="h-11 text-base">
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="caseType" className="text-sm font-semibold mb-2">Case Type</Label>
          <Select value={formData.caseType} onValueChange={(value) => handleSelectChange('caseType', value)}>
            <SelectTrigger id="caseType" className="h-11 text-base">
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
          <Label htmlFor="color" className="text-sm font-semibold mb-2">Color</Label>
          <Input
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            placeholder="Black"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="caseMaterial" className="text-sm font-semibold mb-2">Material</Label>
          <Input
            id="caseMaterial"
            name="caseMaterial"
            value={formData.caseMaterial}
            onChange={handleInputChange}
            placeholder="Leather"
            className="h-11 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="outerDimensions" className="text-sm font-semibold mb-2">Dimensions</Label>
          <Input
            id="outerDimensions"
            name="outerDimensions"
            value={formData.outerDimensions}
            onChange={handleInputChange}
            placeholder="e.g., 32x8x4 inches"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="caseWeight" className="text-sm font-semibold mb-2">Weight</Label>
          <Input
            id="caseWeight"
            name="caseWeight"
            value={formData.caseWeight}
            onChange={handleInputChange}
            placeholder="e.g., 5 lbs"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="pocketSpace" className="text-sm font-semibold mb-2">Pockets</Label>
          <Input
            id="pocketSpace"
            name="pocketSpace"
            value={formData.pocketSpace}
            onChange={handleInputChange}
            placeholder="e.g., 2 external"
            className="h-11 text-base"
          />
        </div>
      </div>
    </>
  );

  const renderTableSpecifications = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="tableSize" className="text-sm font-semibold mb-2">Table Size</Label>
          <Select value={formData.tableSize} onValueChange={(value) => handleSelectChange('tableSize', value)}>
            <SelectTrigger id="tableSize" className="h-11 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['6', '7', '8', '9', '10', '12'].map(size => (
                <SelectItem key={size} value={size}>{size} foot</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tableType" className="text-sm font-semibold mb-2">Table Type</Label>
          <Select value={formData.tableType} onValueChange={(value) => handleSelectChange('tableType', value)}>
            <SelectTrigger id="tableType" className="h-11 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pool">Pool</SelectItem>
              <SelectItem value="snooker">Snooker</SelectItem>
              <SelectItem value="billiards">Billiards</SelectItem>
              <SelectItem value="combination">Combination</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="playingSurface" className="text-sm font-semibold mb-2">Playing Surface</Label>
          <Input
            id="playingSurface"
            name="playingSurface"
            value={formData.playingSurface}
            onChange={handleInputChange}
            placeholder="e.g., 1-inch Slate"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="feltType" className="text-sm font-semibold mb-2">Felt Type</Label>
          <Input
            id="feltType"
            name="feltType"
            value={formData.feltType}
            onChange={handleInputChange}
            placeholder="e.g., Simonis 860"
            className="h-11 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="frameMaterial" className="text-sm font-semibold mb-2">Frame Material</Label>
          <Input
            id="frameMaterial"
            name="frameMaterial"
            value={formData.frameMaterial}
            onChange={handleInputChange}
            placeholder="e.g., Oak, Mahogany"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="pocketType" className="text-sm font-semibold mb-2">Pocket Type</Label>
          <Input
            id="pocketType"
            name="pocketType"
            value={formData.pocketType}
            onChange={handleInputChange}
            placeholder="e.g., Drop Pockets"
            className="h-11 text-base"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="manufactureYear" className="text-sm font-semibold mb-2">Manufacture Year</Label>
        <Input
          id="manufactureYear"
          name="manufactureYear"
          type="number"
          value={formData.manufactureYear}
          onChange={handleInputChange}
          placeholder="e.g., 2020"
          min="1900"
          max={new Date().getFullYear()}
          className="h-11 text-base"
        />
      </div>
    </>
  );

  const renderAccessorySpecifications = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="material" className="text-sm font-semibold mb-2">Material</Label>
          <Input
            id="material"
            name="material"
            value={formData.material}
            onChange={handleInputChange}
            placeholder="e.g., Leather, Pigskin"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="size" className="text-sm font-semibold mb-2">Size</Label>
          <Input
            id="size"
            name="size"
            value={formData.size}
            onChange={handleInputChange}
            placeholder="e.g., Medium, Large"
            className="h-11 text-base"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="color" className="text-sm font-semibold mb-2">Color</Label>
        <Input
          id="color"
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          placeholder="e.g., Black, Blue"
          className="h-11 text-base"
        />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          Specifications
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Add detailed specifications (optional but recommended)
        </p>
      </div>

      <Card className="border-border/50 shadow-none">
        <CardContent className="space-y-4 pt-4">
          {productType === 'cue' && renderCueSpecifications()}
          {productType === 'case' && renderCaseSpecifications()}
          {productType === 'table' && renderTableSpecifications()}
          {productType === 'accessory' && renderAccessorySpecifications()}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4">
          <Label htmlFor="features" className="text-sm font-semibold mb-2">
            Additional Features / Notes
          </Label>
          <Input
            id="features"
            name="features"
            value={formData.features}
            onChange={handleInputChange}
            placeholder="Any special features or notes about your item"
            className="h-11 text-base"
          />
        </CardContent>
      </Card>
    </div>
  );
}
