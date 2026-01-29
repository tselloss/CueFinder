# Multi-Step Wizard - Quick Reference

## 🚀 What Was Done

Refactored the "Add New Listing" form from a single long scrolling form into a modern 3-4 step wizard with full mobile optimization.

## 📁 New Files Created

```
src/features/cues/components/wizard/
├── CueFormWizard.jsx          # Main orchestrator (420 lines)
├── StepIndicator.jsx          # Progress bar (55 lines)
├── ProductTypeStep.jsx        # Step 1: Select type (80 lines)
├── BasicInfoStep.jsx          # Step 2: Basic info (180 lines)
├── SpecificationsStep.jsx     # Step 3: Specs (310 lines)
├── ImagesStep.jsx             # Step 4: Photos (200 lines)
└── index.js                   # Barrel exports
```

## 🎯 Steps Flow

### New Listing (4 Steps)
1. **Product Type** → Choose Cue/Case/Table/Accessory
2. **Basic Info** → Title, brand, price, condition
3. **Specifications** → Product-specific details
4. **Photos & Description** → Images and description

### Edit Listing (3 Steps)
1. **Basic Info** → Update core details
2. **Specifications** → Modify specs
3. **Photos & Description** → Manage images

## 📱 Mobile Features

✅ Touch-friendly 44px minimum height buttons
✅ Responsive layouts (single → multi column)
✅ Scaled text sizes (text-sm → text-base)
✅ Shortened labels on mobile (Type vs Product Type)
✅ Large product type cards for easy tapping
✅ Proper keyboard types (number for price/weight)
✅ Optimized modal sizing (max-h-96vh)

## 🎨 Key Design Elements

- **Step Indicator**: Visual progress with checkmarks
- **Large Cards**: Touch-friendly product selection
- **Validation**: Can't proceed without required fields
- **Back/Next**: Easy navigation between steps
- **Progress Text**: "Step X of Y" at bottom
- **Loading States**: Spinner + progress bar for uploads
- **Error Messages**: Clear, contextual feedback

## 🔧 Technical Details

**State Management**: All in CueFormWizard component
**API Integration**: Supports all 4 product types
**Image Handling**: Upload, delete, set primary
**Validation**: Required field checking per step
**Responsiveness**: Mobile-first with sm: breakpoints

## 📖 Usage

```jsx
// The original CueFormModal now uses the wizard
<CueFormModal 
  cue={null}                    // null = new, object = edit
  onClose={() => close()}       // Close handler
  onSave={() => refresh()}      // Success handler
/>
```

## ⚡ Testing

Run the app and test:

1. **Create New Listing**
   - Click "Add New Listing" button
   - Select product type
   - Fill basic info
   - Add specifications
   - Upload images
   - Submit

2. **Edit Listing**
   - Click edit on existing listing
   - Starts at Basic Info (step 2)
   - Modify any fields
   - Add/remove images
   - Update

3. **Mobile Testing**
   - Open in mobile browser/emulator
   - Test touch interactions
   - Verify responsive layout
   - Check keyboard behavior
   - Test image upload from camera

## 🐛 Debugging

Common issues:
- **Images not showing**: Check SITE_BASE_URL in apiConfig
- **Can't proceed**: Check required field validation
- **API errors**: Check network tab for endpoints
- **Mobile layout**: Verify Tailwind sm: breakpoints

## 📚 Documentation

- [WIZARD_IMPLEMENTATION.md](./WIZARD_IMPLEMENTATION.md) - Full implementation details
- [WIZARD_COMPARISON.md](./WIZARD_COMPARISON.md) - Before/after visual comparison

## 💡 Tips

- **Validation happens on "Next"** - not on field blur
- **Images upload on final submit** - not on selection
- **Edit mode skips type selection** - can't change type
- **Back button preserves data** - no data loss
- **Modal closes on overlay click** - or X button

## 🎯 Next Steps

Consider adding:
- [ ] Autosave to localStorage
- [ ] Field-level validation
- [ ] Image cropping
- [ ] Keyboard navigation
- [ ] Animation between steps
- [ ] "Save as draft" option
- [ ] Review/summary step

---

**Success!** 🎉 The listing form is now mobile-friendly and user-friendly!
