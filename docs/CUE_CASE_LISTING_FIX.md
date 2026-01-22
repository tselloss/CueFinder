# Cue Case Listing Bug Fixes

## Issue Summary
When saving or editing a cue case listing, the cue listings were disappearing because the code was only using `cueService` methods for all operations, not distinguishing between cues and cases.

## Root Causes

### 1. **MyCues.js - Delete Function**
**Problem:** Only called `cueService.deleteCue()` regardless of item type
```javascript
// BEFORE (WRONG)
await cueService.deleteCue(cueId);
```

**Solution:** Check item category and use appropriate service
```javascript
// AFTER (CORRECT)
if (item.category === 'case') {
  await cueCaseService.deleteCueCase(item.id);
} else {
  await cueService.deleteCue(item.id);
}
```

### 2. **MyCues.js - Toggle Sold Function**
**Problem:** Only called `cueService.updateCue()` regardless of item type
```javascript
// BEFORE (WRONG)
const updated = await cueService.updateCue(cue.id, { isSold: !cue.isSold });
```

**Solution:** Check item category and use appropriate service
```javascript
// AFTER (CORRECT)
if (item.category === 'case') {
  updated = await cueCaseService.updateCueCase(item.id, { isSold: !item.isSold });
} else {
  updated = await cueService.updateCue(item.id, { isSold: !item.isSold });
}
```

### 3. **CueFormModal.js - Product Type Detection**
**Problem:** Tried to read `cue.productType` which doesn't exist
```javascript
// BEFORE (WRONG)
setProductType(cue.productType || 'cue');
```

**Solution:** Use the `category` property set by MyCues component
```javascript
// AFTER (CORRECT)
setProductType(cue.category === 'case' ? 'case' : 'cue');
```

### 4. **CueFormModal.js - Image Delete Function**
**Problem:** Only used `cueService.deleteImage()` for all image deletions
```javascript
// BEFORE (WRONG)
await cueService.deleteImage(imageId);
```

**Solution:** Check product type and use appropriate service
```javascript
// AFTER (CORRECT)
if (productType === 'case') {
  await cueCaseService.deleteCueCaseImage(cue.id, imageId);
} else {
  await cueService.deleteImage(imageId);
}
```

### 5. **CueFormModal.js - Set Primary Image Function**
**Problem:** Only used `cueService.setPrimaryImage()` for all cases
```javascript
// BEFORE (WRONG)
await cueService.setPrimaryImage(imageId);
```

**Solution:** Check product type and use appropriate service
```javascript
// AFTER (CORRECT)
if (productType === 'case') {
  await cueCaseService.setPrimaryCueCaseImage(cue.id, imageId);
} else {
  await cueService.setPrimaryImage(imageId);
}
```

## Files Modified
1. **CueFinderFE/cuefinderfe/src/components/MyCues.js**
   - Fixed `handleDelete()` to check item category
   - Fixed `handleToggleSold()` to check item category
   - Updated function parameters to pass full item instead of just ID

2. **CueFinderFE/cuefinderfe/src/components/CueFormModal.js**
   - Fixed product type detection in `useEffect()` to use `category` property
   - Fixed `handleDeleteExistingImage()` to use appropriate service
   - Fixed `handleSetPrimaryImage()` to use appropriate service

## Testing Recommendations
1. Create a new cue listing - verify it appears in "My Listings"
2. Create a new case listing - verify it appears in "My Listings"
3. Edit a cue listing - verify changes are saved correctly
4. Edit a case listing - verify changes are saved correctly
5. Delete a cue listing - verify only the cue is deleted
6. Delete a case listing - verify only the case is deleted
7. Mark cue as sold - verify status updates correctly
8. Mark case as sold - verify status updates correctly
9. Delete images from cue - verify cue images are affected
10. Delete images from case - verify case images are affected
11. Set primary image on cue - verify cue primary changes
12. Set primary image on case - verify case primary changes

## Backend Verification
The backend controllers and services already properly handle both cues and cases separately:
- `CuesController` -> `/api/cues`
- `CueCasesController` -> `/api/cuecases`

The issue was purely in the frontend not using the correct API endpoints for case operations.

## Status
✅ **FIXED** - All operations now correctly distinguish between cues and cases
