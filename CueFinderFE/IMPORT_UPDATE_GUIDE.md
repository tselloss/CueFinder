# Quick Import Update Guide

For developers who just need to know what to change.

---

## 🔄 Two Simple Changes Needed

### Change 1: CueList Component

**In your parent component file (likely App.js):**

#### BEFORE
```javascript
import CueList from './components/CueList';

// ... later in JSX:
<CueList
  cues={cues}
  onSelect={onSelectCue}
  query={searchQuery}
  viewMode={viewMode}
  setViewMode={setViewMode}
  category={selectedCategory}
  condition={selectedCondition}
  cueType={selectedCueType}
  sortBy={sortBy}
  priceRange={priceRange}
/>
```

#### AFTER
```javascript
import { CueListContainer } from './features/cues/components';

// ... later in JSX:
<CueListContainer
  cues={cues}
  onSelect={onSelectCue}
  query={searchQuery}
  viewMode={viewMode}
  setViewMode={setViewMode}
  category={selectedCategory}
  condition={selectedCondition}
  cueType={selectedCueType}
  sortBy={sortBy}
  priceRange={priceRange}
/>
```

**What changed:**
- ✅ Import path changed
- ✅ Component name changed (CueList → CueListContainer)
- ✅ **All props remain identical**

---

### Change 2: Forum Component

**In your parent component file (likely App.js):**

#### BEFORE
```javascript
import Forum from './components/Forum';

// ... later in JSX:
<Forum onBack={() => navigate('/')} />
```

#### AFTER
```javascript
import { ForumContainer } from './features/forum/components';

// ... later in JSX:
<ForumContainer onBack={() => navigate('/')} />
```

**What changed:**
- ✅ Import path changed
- ✅ Component name changed (Forum → ForumContainer)
- ✅ **All props remain identical**

---

## ✨ That's It!

Both components work exactly the same way. The only difference is the import path and component name.

### Before vs After Summary

| Aspect | Before | After |
|--------|--------|-------|
| **CueList import** | `./components/CueList` | `./features/cues/components` |
| **CueList name** | `<CueList>` | `<CueListContainer>` |
| **Forum import** | `./components/Forum` | `./features/forum/components` |
| **Forum name** | `<Forum>` | `<ForumContainer>` |
| **Props** | All same | All same |
| **Functionality** | Same | Same |

---

## 🧪 Testing After Update

Once you update the imports:

1. ✅ Test CueList features:
   - Load cues
   - Filter by search
   - Filter by category
   - Switch between grid/list view
   - Check image loading

2. ✅ Test Forum features:
   - Load categories
   - View discussions
   - Create discussion (if logged in)
   - View discussion detail
   - Create post (if logged in)

---

## 🚨 If Something Breaks

1. **Check the console** - Look for error messages
2. **Verify import paths** - Make sure paths are correct
3. **Check prop names** - Ensure all props are passed
4. **Review guides** - See migration guides for details

### Quick Reference Files
- `CUELIST_MIGRATION_GUIDE.md` - CueList detailed help
- `FORUM_MIGRATION_GUIDE.md` - Forum detailed help
- `COMPONENT_MIGRATION_PROGRESS.md` - Full progress overview

---

## 📍 File Locations

### Old Files (can be deleted after testing)
```
src/components/CueList.js       ← Old file, can delete after testing
src/components/Forum.js         ← Old file, can delete after testing
```

### New Files (use these)
```
src/features/cues/components/CueListContainer.jsx    ← Use this
src/features/forum/components/ForumContainer.jsx     ← Use this
```

---

## 💾 Copy-Paste Ready

Just copy these and replace your imports:

### For CueList:
```javascript
import { CueListContainer } from './features/cues/components';
```

### For Forum:
```javascript
import { ForumContainer } from './features/forum/components';
```

---

**That's all you need to do!** Everything else stays the same. 🎉
