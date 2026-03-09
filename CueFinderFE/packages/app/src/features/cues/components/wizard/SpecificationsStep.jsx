import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

/**
 * SpecificationsStep - Step 3: Product-specific specifications
 * Different fields based on product type (cue, case, table, accessory)
 * Mobile-optimized inputs with proper keyboard types
 * Multilanguage support for English and Greek
 */
export default function SpecificationsStep({ formData, onChange, productType }) {
  const { i18n } = useTranslation();
  const isGreek = i18n.language?.startsWith('el');

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
          <Label htmlFor="weight" className="text-sm font-semibold mb-2">{isGreek ? 'Βάρος (oz)' : 'Weight (oz)'}</Label>
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
          <Label htmlFor="length" className="text-sm font-semibold mb-2">{isGreek ? 'Μήκος (in)' : 'Length (in)'}</Label>
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
          <Label htmlFor="tipSize" className="text-sm font-semibold mb-2">{isGreek ? 'Μύτη (mm)' : 'Tip (mm)'}</Label>
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
          <Label htmlFor="shaftMaterial" className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό Άξονα' : 'Shaft Material'}</Label>
          <Input
            id="shaftMaterial"
            name="shaftMaterial"
            value={formData.shaftMaterial}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., Carbon Fiber, Σφενδάμι' : 'e.g., Carbon Fiber, Maple'}
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="buttMaterial" className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό Λαβής' : 'Butt Material'}</Label>
          <Input
            id="buttMaterial"
            name="buttMaterial"
            value={formData.buttMaterial}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., Έβονο, Κοκοβόλο' : 'e.g., Ebony, Cocobolo'}
            className="h-11 text-base"
          />
        </div>
      </div>
    </>
  );

  const renderCaseSpecifications = () => {
    const caseOpeningLabels = {
      'Butterfly': isGreek ? 'Πεταλούδα' : 'Butterfly',
      'Top Open': isGreek ? 'Άνω Άνοιγμα' : 'Top Open',
      'Side Open': isGreek ? 'Πλευρικό Άνοιγμα' : 'Side Open',
      'Zipper': isGreek ? 'Φερμουάρ' : 'Zipper'
    };

    const caseTypeLabels = {
      'Soft': isGreek ? 'Μαλακή' : 'Soft',
      'Hard': isGreek ? 'Σκληρή' : 'Hard',
      'Semi-Hard': isGreek ? 'Ημι-Σκληρή' : 'Semi-Hard'
    };

    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="caseCapacity" className="text-sm font-semibold mb-2">{isGreek ? 'Χωρητικότητα Θήκης' : 'Case Capacity'}</Label>
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
            <Label htmlFor="caseOpening" className="text-sm font-semibold mb-2">{isGreek ? 'Άνοιγμα Θήκης' : 'Case Opening'}</Label>
            <Select value={formData.caseOpening} onValueChange={(value) => handleSelectChange('caseOpening', value)}>
              <SelectTrigger id="caseOpening" className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(caseOpeningLabels).map(opt => (
                  <SelectItem key={opt} value={opt}>{caseOpeningLabels[opt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="caseType" className="text-sm font-semibold mb-2">{isGreek ? 'Τύπος Θήκης' : 'Case Type'}</Label>
            <Select value={formData.caseType} onValueChange={(value) => handleSelectChange('caseType', value)}>
              <SelectTrigger id="caseType" className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(caseTypeLabels).map(opt => (
                  <SelectItem key={opt} value={opt}>{caseTypeLabels[opt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color" className="text-sm font-semibold mb-2">{isGreek ? 'Χρώμα' : 'Color'}</Label>
            <Input
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              placeholder={isGreek ? 'Μαύρο' : 'Black'}
              className="h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="caseMaterial" className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό' : 'Material'}</Label>
            <Input
              id="caseMaterial"
              name="caseMaterial"
              value={formData.caseMaterial}
              onChange={handleInputChange}
              placeholder={isGreek ? 'Δέρμα' : 'Leather'}
              className="h-11 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="outerDimensions" className="text-sm font-semibold mb-2">{isGreek ? 'Διαστάσεις' : 'Dimensions'}</Label>
            <Input
              id="outerDimensions"
              name="outerDimensions"
              value={formData.outerDimensions}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., 32x8x4 ίντσες' : 'e.g., 32x8x4 inches'}
              className="h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="caseWeight" className="text-sm font-semibold mb-2">{isGreek ? 'Βάρος' : 'Weight'}</Label>
            <Input
              id="caseWeight"
              name="caseWeight"
              value={formData.caseWeight}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., 5 λίβρες' : 'e.g., 5 lbs'}
              className="h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="pocketSpace" className="text-sm font-semibold mb-2">{isGreek ? 'Τσέπες' : 'Pockets'}</Label>
            <Input
              id="pocketSpace"
              name="pocketSpace"
              value={formData.pocketSpace}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., 2 εξωτερικές' : 'e.g., 2 external'}
              className="h-11 text-base"
            />
          </div>
        </div>
      </>
    );
  };

  const renderTableSpecifications = () => {
    const tableTypeLabels = {
      'pool': isGreek ? 'Πουλ' : 'Pool',
      'snooker': isGreek ? 'Σνούκερ' : 'Snooker',
      'billiards': isGreek ? 'Μπιλιάρδα' : 'Billiards',
      'combination': isGreek ? 'Συνδυασμός' : 'Combination'
    };

    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tableSize" className="text-sm font-semibold mb-2">{isGreek ? 'Μέγεθος Τραπεζιού' : 'Table Size'}</Label>
            <Select value={formData.tableSize} onValueChange={(value) => handleSelectChange('tableSize', value)}>
              <SelectTrigger id="tableSize" className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['6', '7', '8', '9', '10', '12'].map(size => (
                  <SelectItem key={size} value={size}>{size} {isGreek ? 'πόδια' : 'foot'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tableType" className="text-sm font-semibold mb-2">{isGreek ? 'Τύπος Τραπεζιού' : 'Table Type'}</Label>
            <Select value={formData.tableType} onValueChange={(value) => handleSelectChange('tableType', value)}>
              <SelectTrigger id="tableType" className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(tableTypeLabels).map(type => (
                  <SelectItem key={type} value={type}>{tableTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="playingSurface" className="text-sm font-semibold mb-2">{isGreek ? 'Επιφάνεια Παιχνιδιού' : 'Playing Surface'}</Label>
            <Input
              id="playingSurface"
              name="playingSurface"
              value={formData.playingSurface}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., Σχιστόλιθος 1 ίντσα' : 'e.g., 1-inch Slate'}
              className="h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="feltType" className="text-sm font-semibold mb-2">{isGreek ? 'Τύπος Τσόχας' : 'Felt Type'}</Label>
            <Input
              id="feltType"
              name="feltType"
              value={formData.feltType}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., Simonis 860' : 'e.g., Simonis 860'}
              className="h-11 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="frameMaterial" className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό Πλαισίου' : 'Frame Material'}</Label>
            <Input
              id="frameMaterial"
              name="frameMaterial"
              value={formData.frameMaterial}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., Δρυς, Μαχαγονιά' : 'e.g., Oak, Mahogany'}
              className="h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="pocketType" className="text-sm font-semibold mb-2">{isGreek ? 'Τύπος Τσέπης' : 'Pocket Type'}</Label>
            <Input
              id="pocketType"
              name="pocketType"
              value={formData.pocketType}
              onChange={handleInputChange}
              placeholder={isGreek ? 'π.χ., Πτωτικές Τσέπες' : 'e.g., Drop Pockets'}
              className="h-11 text-base"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="manufactureYear" className="text-sm font-semibold mb-2">{isGreek ? 'Έτος Κατασκευής' : 'Manufacture Year'}</Label>
          <Input
            id="manufactureYear"
            name="manufactureYear"
            type="number"
            value={formData.manufactureYear}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., 2020' : 'e.g., 2020'}
            min="1900"
            max={new Date().getFullYear()}
            className="h-11 text-base"
          />
        </div>
      </>
    );
  };

  const renderCueSpecsBlock = (prefix, label) => (
    <div className="space-y-3 pt-2">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm font-semibold mb-2">{isGreek ? 'Βάρος (oz)' : 'Weight (oz)'}</Label>
          <Input
            name={`${prefix}Weight`}
            type="number"
            value={formData[`${prefix}Weight`] || ''}
            onChange={handleInputChange}
            placeholder="18.5"
            step="0.1"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2">{isGreek ? 'Μήκος (in)' : 'Length (in)'}</Label>
          <Input
            name={`${prefix}Length`}
            type="number"
            value={formData[`${prefix}Length`] || ''}
            onChange={handleInputChange}
            placeholder="58"
            step="0.1"
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2">{isGreek ? 'Μύτη (mm)' : 'Tip (mm)'}</Label>
          <Input
            name={`${prefix}TipSize`}
            type="number"
            value={formData[`${prefix}TipSize`] || ''}
            onChange={handleInputChange}
            placeholder="12.9"
            step="0.1"
            className="h-11 text-base"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό Άξονα' : 'Shaft Material'}</Label>
          <Input
            name={`${prefix}ShaftMaterial`}
            value={formData[`${prefix}ShaftMaterial`] || ''}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., Carbon Fiber, Σφενδάμι' : 'e.g., Carbon Fiber, Maple'}
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό Λαβής' : 'Butt Material'}</Label>
          <Input
            name={`${prefix}ButtMaterial`}
            value={formData[`${prefix}ButtMaterial`] || ''}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., Έβονο, Κοκοβόλο' : 'e.g., Ebony, Cocobolo'}
            className="h-11 text-base"
          />
        </div>
      </div>
    </div>
  );

  const renderSetSpecifications = () => {
    const caseOpeningLabels = {
      'Butterfly': isGreek ? 'Πεταλούδα' : 'Butterfly',
      'Top Open': isGreek ? 'Άνω Άνοιγμα' : 'Top Open',
      'Side Open': isGreek ? 'Πλευρικό Άνοιγμα' : 'Side Open',
      'Zipper': isGreek ? 'Φερμουάρ' : 'Zipper'
    };
    const caseTypeLabels = {
      'Soft': isGreek ? 'Μαλακή' : 'Soft',
      'Hard': isGreek ? 'Σκληρή' : 'Hard',
      'Semi-Hard': isGreek ? 'Ημι-Σκληρή' : 'Semi-Hard'
    };

    const toggle = (field) => onChange({ ...formData, [field]: !formData[field] });

    return (
      <>
        {/* What's included */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {isGreek ? 'Τι περιλαμβάνεται;' : "What's included?"}
          </p>
          <p className="text-xs text-muted-foreground -mt-1">
            {isGreek ? 'Επιλέξτε τουλάχιστον ένα αντικείμενο' : 'Select at least one item'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: 'includesPlayingCue', label: isGreek ? 'Στέκα Παιχνιδιού' : 'Playing Cue' },
              { field: 'includesBreakCue',  label: isGreek ? 'Στέκα Σπασίματος' : 'Break Cue' },
              { field: 'includesJumpCue',   label: isGreek ? 'Στέκα Άλματος' : 'Jump Cue' },
              { field: 'includesCase',      label: isGreek ? 'Θήκη' : 'Case' },
            ].map(({ field, label }) => (
              <button
                key={field}
                type="button"
                onClick={() => toggle(field)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                  formData[field]
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  formData[field] ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {formData[field] && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-cue specs */}
        {formData.includesPlayingCue && renderCueSpecsBlock('playingCue', isGreek ? 'ΣΤΕΚΑ ΠΑΙΧΝΙΔΙΟΥ' : 'PLAYING CUE')}
        {formData.includesBreakCue  && renderCueSpecsBlock('breakCue',  isGreek ? 'ΣΤΕΚΑ ΣΠΑΣΙΜΑΤΟΣ' : 'BREAK CUE')}
        {formData.includesJumpCue   && renderCueSpecsBlock('jumpCue',   isGreek ? 'ΣΤΕΚΑ ΑΛΜΑΤΟΣ' : 'JUMP CUE')}

        {/* Case specs */}
        {formData.includesCase && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">{isGreek ? 'ΘΗΚΗ' : 'CASE'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-2">{isGreek ? 'Χωρητικότητα' : 'Capacity'}</Label>
                <Select value={formData.caseCapacity || '1x2'} onValueChange={(v) => handleSelectChange('caseCapacity', v)}>
                  <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1x1', '1x2', '2x4', '3x5', '4x8'].map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">{isGreek ? 'Άνοιγμα' : 'Opening'}</Label>
                <Select value={formData.caseOpening || 'Butterfly'} onValueChange={(v) => handleSelectChange('caseOpening', v)}>
                  <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(caseOpeningLabels).map(opt => (
                      <SelectItem key={opt} value={opt}>{caseOpeningLabels[opt]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-2">{isGreek ? 'Τύπος' : 'Type'}</Label>
                <Select value={formData.caseType || 'Soft'} onValueChange={(v) => handleSelectChange('caseType', v)}>
                  <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(caseTypeLabels).map(opt => (
                      <SelectItem key={opt} value={opt}>{caseTypeLabels[opt]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">{isGreek ? 'Χρώμα' : 'Color'}</Label>
                <Input
                  name="caseColor"
                  value={formData.caseColor || ''}
                  onChange={handleInputChange}
                  placeholder={isGreek ? 'Μαύρο' : 'Black'}
                  className="h-11 text-base"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό' : 'Material'}</Label>
                <Input
                  name="caseMaterial"
                  value={formData.caseMaterial || ''}
                  onChange={handleInputChange}
                  placeholder={isGreek ? 'Δέρμα' : 'Leather'}
                  className="h-11 text-base"
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderAccessorySpecifications = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="material" className="text-sm font-semibold mb-2">{isGreek ? 'Υλικό' : 'Material'}</Label>
          <Input
            id="material"
            name="material"
            value={formData.material}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., Δέρμα, Συσπέρμα' : 'e.g., Leather, Pigskin'}
            className="h-11 text-base"
          />
        </div>
        <div>
          <Label htmlFor="size" className="text-sm font-semibold mb-2">{isGreek ? 'Μέγεθος' : 'Size'}</Label>
          <Input
            id="size"
            name="size"
            value={formData.size}
            onChange={handleInputChange}
            placeholder={isGreek ? 'π.χ., Μεσαίο, Μεγάλο' : 'e.g., Medium, Large'}
            className="h-11 text-base"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="color" className="text-sm font-semibold mb-2">{isGreek ? 'Χρώμα' : 'Color'}</Label>
        <Input
          id="color"
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          placeholder={isGreek ? 'π.χ., Μαύρο, Μπλε' : 'e.g., Black, Blue'}
          className="h-11 text-base"
        />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          {isGreek ? 'Προδιαγραφές' : 'Specifications'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isGreek ? 'Προσθέστε λεπτομερείς προδιαγραφές (προαιρετικό αλλά συνιστάται)' : 'Add detailed specifications (optional but recommended)'}
        </p>
      </div>

      <Card className="border-border/50 shadow-none">
        <CardContent className="space-y-4 pt-4">
          {productType === 'cue' && renderCueSpecifications()}
          {productType === 'case' && renderCaseSpecifications()}
          {productType === 'table' && renderTableSpecifications()}
          {productType === 'accessory' && renderAccessorySpecifications()}
          {productType === 'set' && renderSetSpecifications()}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4">
          <Label htmlFor="features" className="text-sm font-semibold mb-2">
            {isGreek ? 'Πρόσθετα Χαρακτηριστικά / Σημειώσεις' : 'Additional Features / Notes'}
          </Label>
          <Input
            id="features"
            name="features"
            value={formData.features}
            onChange={handleInputChange}
            placeholder={isGreek ? 'Τυχόν ειδικά χαρακτηριστικά ή σημειώσεις σχετικά με το αντικείμενό σας' : 'Any special features or notes about your item'}
            className="h-11 text-base"
          />
        </CardContent>
      </Card>
    </div>
  );
}
