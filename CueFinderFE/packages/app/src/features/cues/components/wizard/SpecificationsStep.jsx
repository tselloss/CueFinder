import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

export default function SpecificationsStep({ formData, onChange, productType }) {
  const { t } = useTranslation();

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
          <Label htmlFor="weight" className="text-sm font-semibold mb-2">{t('spec.weight')}</Label>
          <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleInputChange} placeholder="18.5" step="0.1" className="h-11 text-base" />
        </div>
        <div>
          <Label htmlFor="length" className="text-sm font-semibold mb-2">{t('spec.length')}</Label>
          <Input id="length" name="length" type="number" value={formData.length} onChange={handleInputChange} placeholder="58" step="0.1" className="h-11 text-base" />
        </div>
        <div>
          <Label htmlFor="tipSize" className="text-sm font-semibold mb-2">{t('spec.tip')}</Label>
          <Input id="tipSize" name="tipSize" type="number" value={formData.tipSize} onChange={handleInputChange} placeholder="12.9" step="0.1" className="h-11 text-base" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="shaftMaterial" className="text-sm font-semibold mb-2">{t('spec.shaftMaterial')}</Label>
          <Input id="shaftMaterial" name="shaftMaterial" value={formData.shaftMaterial} onChange={handleInputChange} placeholder={t('spec.shaftMaterial.placeholder')} className="h-11 text-base" />
        </div>
        <div>
          <Label htmlFor="buttMaterial" className="text-sm font-semibold mb-2">{t('spec.buttMaterial')}</Label>
          <Input id="buttMaterial" name="buttMaterial" value={formData.buttMaterial} onChange={handleInputChange} placeholder={t('spec.buttMaterial.placeholder')} className="h-11 text-base" />
        </div>
      </div>
    </>
  );

  const renderCaseSpecifications = () => {
    const caseOpeningOpts = ['Butterfly', 'Top Open', 'Side Open', 'Zipper'];
    const caseTypeOpts = ['Soft', 'Hard', 'Semi-Hard'];

    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="caseCapacity" className="text-sm font-semibold mb-2">{t('spec.caseCapacity')}</Label>
            <Select value={formData.caseCapacity} onValueChange={(v) => handleSelectChange('caseCapacity', v)}>
              <SelectTrigger id="caseCapacity" className="h-11 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['1x1', '1x2', '2x4', '3x5', '4x8'].map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="caseOpening" className="text-sm font-semibold mb-2">{t('spec.caseOpening')}</Label>
            <Select value={formData.caseOpening} onValueChange={(v) => handleSelectChange('caseOpening', v)}>
              <SelectTrigger id="caseOpening" className="h-11 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {caseOpeningOpts.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`spec.caseOpening.${opt}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="caseType" className="text-sm font-semibold mb-2">{t('spec.caseType')}</Label>
            <Select value={formData.caseType} onValueChange={(v) => handleSelectChange('caseType', v)}>
              <SelectTrigger id="caseType" className="h-11 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {caseTypeOpts.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`spec.caseType.${opt}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color" className="text-sm font-semibold mb-2">{t('spec.color')}</Label>
            <Input id="color" name="color" value={formData.color} onChange={handleInputChange} placeholder={t('spec.color.placeholder')} className="h-11 text-base" />
          </div>
          <div>
            <Label htmlFor="caseMaterial" className="text-sm font-semibold mb-2">{t('spec.material')}</Label>
            <Input id="caseMaterial" name="caseMaterial" value={formData.caseMaterial} onChange={handleInputChange} placeholder={t('spec.material.placeholder')} className="h-11 text-base" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="outerDimensions" className="text-sm font-semibold mb-2">{t('spec.dimensions')}</Label>
            <Input id="outerDimensions" name="outerDimensions" value={formData.outerDimensions} onChange={handleInputChange} placeholder={t('spec.dimensions.placeholder')} className="h-11 text-base" />
          </div>
          <div>
            <Label htmlFor="caseWeight" className="text-sm font-semibold mb-2">{t('spec.caseWeight')}</Label>
            <Input id="caseWeight" name="caseWeight" value={formData.caseWeight} onChange={handleInputChange} placeholder={t('spec.caseWeight.placeholder')} className="h-11 text-base" />
          </div>
          <div>
            <Label htmlFor="pocketSpace" className="text-sm font-semibold mb-2">{t('spec.pockets')}</Label>
            <Input id="pocketSpace" name="pocketSpace" value={formData.pocketSpace} onChange={handleInputChange} placeholder={t('spec.pockets.placeholder')} className="h-11 text-base" />
          </div>
        </div>
      </>
    );
  };

  const renderTableSpecifications = () => {
    const tableSizes = ['6', '7', '8', '9', '10', '12'];
    const tableTypeOpts = ['pool', 'snooker', 'billiards', 'combination'];

    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tableSize" className="text-sm font-semibold mb-2">{t('spec.tableSize')}</Label>
            <Select value={formData.tableSize} onValueChange={(v) => handleSelectChange('tableSize', v)}>
              <SelectTrigger id="tableSize" className="h-11 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tableSizes.map(size => (
                  <SelectItem key={size} value={size}>{size} {t('spec.tableSize.foot')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tableType" className="text-sm font-semibold mb-2">{t('spec.tableType')}</Label>
            <Select value={formData.tableType} onValueChange={(v) => handleSelectChange('tableType', v)}>
              <SelectTrigger id="tableType" className="h-11 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tableTypeOpts.map(type => (
                  <SelectItem key={type} value={type}>{t(`spec.tableType.${type}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="playingSurface" className="text-sm font-semibold mb-2">{t('spec.playingSurface')}</Label>
            <Input id="playingSurface" name="playingSurface" value={formData.playingSurface} onChange={handleInputChange} placeholder={t('spec.playingSurface.placeholder')} className="h-11 text-base" />
          </div>
          <div>
            <Label htmlFor="feltType" className="text-sm font-semibold mb-2">{t('spec.feltType')}</Label>
            <Input id="feltType" name="feltType" value={formData.feltType} onChange={handleInputChange} placeholder={t('spec.feltType.placeholder')} className="h-11 text-base" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="frameMaterial" className="text-sm font-semibold mb-2">{t('spec.frameMaterial')}</Label>
            <Input id="frameMaterial" name="frameMaterial" value={formData.frameMaterial} onChange={handleInputChange} placeholder={t('spec.frameMaterial.placeholder')} className="h-11 text-base" />
          </div>
          <div>
            <Label htmlFor="pocketType" className="text-sm font-semibold mb-2">{t('spec.pocketType')}</Label>
            <Input id="pocketType" name="pocketType" value={formData.pocketType} onChange={handleInputChange} placeholder={t('spec.pocketType.placeholder')} className="h-11 text-base" />
          </div>
        </div>

        <div>
          <Label htmlFor="manufactureYear" className="text-sm font-semibold mb-2">{t('spec.manufactureYear')}</Label>
          <Input id="manufactureYear" name="manufactureYear" type="number" value={formData.manufactureYear} onChange={handleInputChange} placeholder={t('spec.manufactureYear.placeholder')} min="1900" max={new Date().getFullYear()} className="h-11 text-base" />
        </div>
      </>
    );
  };

  const renderCueSpecsBlock = (prefix, label) => (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      <p className="text-xs font-bold text-primary uppercase tracking-widest">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm font-semibold mb-2">{t('spec.weight')}</Label>
          <Input name={`${prefix}Weight`} type="number" value={formData[`${prefix}Weight`] || ''} onChange={handleInputChange} placeholder="18.5" step="0.1" className="h-11 text-base" />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2">{t('spec.length')}</Label>
          <Input name={`${prefix}Length`} type="number" value={formData[`${prefix}Length`] || ''} onChange={handleInputChange} placeholder="58" step="0.1" className="h-11 text-base" />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2">{t('spec.tip')}</Label>
          <Input name={`${prefix}TipSize`} type="number" value={formData[`${prefix}TipSize`] || ''} onChange={handleInputChange} placeholder="12.9" step="0.1" className="h-11 text-base" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold mb-2">{t('spec.shaftMaterial')}</Label>
          <Input name={`${prefix}ShaftMaterial`} value={formData[`${prefix}ShaftMaterial`] || ''} onChange={handleInputChange} placeholder={t('spec.shaftMaterial.placeholder')} className="h-11 text-base" />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2">{t('spec.buttMaterial')}</Label>
          <Input name={`${prefix}ButtMaterial`} value={formData[`${prefix}ButtMaterial`] || ''} onChange={handleInputChange} placeholder={t('spec.buttMaterial.placeholder')} className="h-11 text-base" />
        </div>
      </div>
    </div>
  );

  const renderSetSpecifications = () => {
    const caseOpeningOpts = ['Butterfly', 'Top Open', 'Side Open', 'Zipper'];
    const caseTypeOpts = ['Soft', 'Hard', 'Semi-Hard'];
    const toggle = (field) => onChange({ ...formData, [field]: !formData[field] });

    const items = [
      { field: 'includesPlayingCue', label: t('spec.set.playingCue') },
      { field: 'includesBreakCue',  label: t('spec.set.breakCue') },
      { field: 'includesJumpCue',   label: t('spec.set.jumpCue') },
      { field: 'includesCase',      label: t('spec.set.case') },
    ];

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{t('spec.set.whatsIncluded')}</p>
          <p className="text-xs text-muted-foreground">{t('spec.set.selectAtLeastOne')}</p>
          <div className="grid grid-cols-2 gap-2">
            {items.map(({ field, label }) => (
              <button
                key={field}
                type="button"
                onClick={() => toggle(field)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                  formData[field]
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  formData[field] ? 'border-primary bg-primary' : 'border-muted-foreground/50'
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

        {formData.includesPlayingCue && renderCueSpecsBlock('playingCue', t('spec.set.playingCue'))}
        {formData.includesBreakCue  && renderCueSpecsBlock('breakCue',   t('spec.set.breakCue'))}
        {formData.includesJumpCue   && renderCueSpecsBlock('jumpCue',    t('spec.set.jumpCue'))}

        {formData.includesCase && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">{t('spec.set.case')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-2">{t('spec.case.capacity')}</Label>
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
                <Label className="text-sm font-semibold mb-2">{t('spec.case.opening')}</Label>
                <Select value={formData.caseOpening || 'Butterfly'} onValueChange={(v) => handleSelectChange('caseOpening', v)}>
                  <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {caseOpeningOpts.map(opt => (
                      <SelectItem key={opt} value={opt}>{t(`spec.caseOpening.${opt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-2">{t('spec.case.type')}</Label>
                <Select value={formData.caseType || 'Soft'} onValueChange={(v) => handleSelectChange('caseType', v)}>
                  <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {caseTypeOpts.map(opt => (
                      <SelectItem key={opt} value={opt}>{t(`spec.caseType.${opt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">{t('spec.case.color')}</Label>
                <Input name="caseColor" value={formData.caseColor || ''} onChange={handleInputChange} placeholder={t('spec.color.placeholder')} className="h-11 text-base" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">{t('spec.case.material')}</Label>
                <Input name="caseMaterial" value={formData.caseMaterial || ''} onChange={handleInputChange} placeholder={t('spec.material.placeholder')} className="h-11 text-base" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAccessorySpecifications = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="material" className="text-sm font-semibold mb-2">{t('spec.accessoryMaterial')}</Label>
          <Input id="material" name="material" value={formData.material} onChange={handleInputChange} placeholder={t('spec.accessoryMaterial.placeholder')} className="h-11 text-base" />
        </div>
        <div>
          <Label htmlFor="size" className="text-sm font-semibold mb-2">{t('spec.size')}</Label>
          <Input id="size" name="size" value={formData.size} onChange={handleInputChange} placeholder={t('spec.size.placeholder')} className="h-11 text-base" />
        </div>
      </div>
      <div>
        <Label htmlFor="color" className="text-sm font-semibold mb-2">{t('spec.color')}</Label>
        <Input id="color" name="color" value={formData.color} onChange={handleInputChange} placeholder={t('spec.accessoryColor.placeholder')} className="h-11 text-base" />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          {t('wizard.specifications')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t('wizard.specifications.hint')}
        </p>
      </div>

      {productType === 'set' ? (
        renderSetSpecifications()
      ) : (
        <Card className="border-border/50 shadow-none">
          <CardContent className="space-y-4 pt-4">
            {productType === 'cue' && renderCueSpecifications()}
            {productType === 'case' && renderCaseSpecifications()}
            {productType === 'table' && renderTableSpecifications()}
            {productType === 'accessory' && renderAccessorySpecifications()}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-none">
        <CardContent className="pt-4">
          <Label htmlFor="features" className="text-sm font-semibold mb-2">
            {t('spec.additionalFeatures')}
          </Label>
          <Input
            id="features"
            name="features"
            value={formData.features}
            onChange={handleInputChange}
            placeholder={t('spec.additionalFeatures.placeholder')}
            className="h-11 text-base"
          />
        </CardContent>
      </Card>
    </div>
  );
}
