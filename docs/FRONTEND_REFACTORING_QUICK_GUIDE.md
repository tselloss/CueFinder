# Frontend Refactoring - Quick Reference Guide

## 🎯 What Changed

Your frontend has been reorganized for **better maintainability and reusability**.

### The Four Main Changes

#### 1️⃣ Organized API Services
**Before:** `app/src/api/` (8 files, hard to navigate)  
**After:** `packages/api/src/services/` (organized by feature)

```
cue/              → cueService.js, cueCaseService.js
auth/             → authService.js
forum/            → forumService.js
admin/            → moderationService.js, adminUsersService.js
message/          → messageService.js
```

#### 2️⃣ Shared Hooks & Utilities
**Before:** Scattered logic, code duplication  
**After:** `packages/common/` (9 reusable pieces)

**Hooks:**
- `usePagination` - Pagination
- `useFilters` - Filtering with custom logic
- `useSorting` - Sorting
- `useAsync` - Async operations
- `useForm` - Form management

**Utilities:**
- `validation.js` - Email, phone, password checks
- `format.js` - Date, price, text formatting
- `array.js` - Array operations

#### 3️⃣ Reusable UI Components
**Before:** Components in app, hard to find/reuse  
**After:** `packages/ui/` (extracted components)

- Button, Card, Input, Dialog, Alert, Badge

#### 4️⃣ Feature-Based Organization
**Before:** Components mixed in one folder  
**After:** Organized by feature with hooks

```
features/
├── cues/         (CueList, CueDetail, hooks)
├── forum/        (Forum, Discussions, hooks)
├── admin/        (AdminPage, tables, hooks)
└── auth/         (LoginPage, RegisterPage, hooks)
```

---

## 🔧 How to Use

### Accessing Services
```javascript
// OLD WAY
import * as cueService from '../api/cueService';

// NEW WAY
import { cueService } from '@cuefinder/api';
// OR more specific:
import { cueService } from '@cuefinder/api/cue';
```

### Using Hooks
```javascript
// For filtering/sorting/pagination
import { useCueFiltering } from '../features/cues/hooks';
const { filters, setFilter, sortBy, setSortBy, paginated } = useCueFiltering(cues);

// For operations (CRUD)
import { useCueOperations } from '../features/cues/hooks';
const { addCue, updateCue, deleteCue, uploadImages } = useCueOperations();

// For common utilities
import { usePagination, useFilters, useSorting, useForm, useAsync } from '@cuefinder/common';
```

### Using Utilities
```javascript
// Validation
import { validateEmail, validatePassword, validateRequired } from '@cuefinder/common/utils';

// Formatting
import { formatPrice, formatDate, truncate, capitalize } from '@cuefinder/common/utils';

// Array operations
import { groupBy, unique, flatten, chunk } from '@cuefinder/common/utils';
```

### Using UI Components
```javascript
// OLD WAY
import { Button, Card } from './ui/button';

// NEW WAY
import { Button, Card, Input, Dialog, Alert, Badge, cn } from '@cuefinder/ui';
```

---

## 📝 Example: Using the New Architecture

### Before (Messy)
```javascript
// CueList.jsx - Mixing everything
import React, { useState, useMemo } from 'react';
import * as cueService from '../api/cueService';

export default function CueList({ cues, onSelect }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  
  // Manually implement filtering
  let filtered = cues.filter(c => 
    c.title.includes(search) || c.brand.includes(search)
  );
  
  // Manually implement sorting
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => a.price - b.price);
  }
  
  // Manually implement pagination
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);
  
  // Render everything in one component...
}
```

### After (Clean)
```javascript
// CueListView.jsx - Using new architecture
import React from 'react';
import { useCueFiltering } from '../hooks';
import { CueListFilters } from './CueListFilters';
import { CueListGrid } from './CueListGrid';
import { Pagination } from '@cuefinder/ui';

export function CueListView({ cues }) {
  const {
    filters,
    setFilter,
    sortBy,
    setSortBy,
    paginated,
    page,
    setPage,
    total
  } = useCueFiltering(cues);

  return (
    <>
      <CueListFilters filters={filters} onFilterChange={setFilter} />
      <CueListGrid items={paginated} />
      <Pagination page={page} total={total} onChange={setPage} />
    </>
  );
}

// Filtering: useCueFiltering hook handles it all
// Sorting: useCueFiltering hook handles it
// Pagination: useCueFiltering hook handles it
// UI: Small, focused components
```

---

## 🚀 Adding New Features

Follow this pattern when adding new features:

```javascript
// 1. Create folder structure
src/features/myfeature/
├── components/
│   ├── MyFeatureView.jsx
│   ├── MyFeatureForm.jsx
│   └── index.js
├── hooks/
│   ├── useMyFeatureState.js
│   └── index.js
└── index.js

// 2. Create hook for business logic
// features/myfeature/hooks/useMyFeatureState.js
import { useState, useCallback } from 'react';
import * as myService from '../../api/myService';

export function useMyFeatureState() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myService.getItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (itemData) => {
    const newItem = await myService.createItem(itemData);
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  return { items, loading, loadItems, addItem };
}

// 3. Create view component using hook
// features/myfeature/components/MyFeatureView.jsx
import React, { useEffect } from 'react';
import { useMyFeatureState } from '../hooks';
import { Button, Card } from '@cuefinder/ui';

export function MyFeatureView() {
  const { items, loading, loadItems, addItem } = useMyFeatureState();

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <Card>
      <h1>My Feature</h1>
      {loading && <p>Loading...</p>}
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </Card>
  );
}

// 4. Export from index
// features/myfeature/index.js
export { MyFeatureView } from './components';
export * from './hooks';
```

---

## ✨ Best Practices Now Available

### ✅ DO
```javascript
// Use feature-specific hooks
import { useCueOperations } from '../features/cues/hooks';

// Use common utilities
import { formatPrice, validateEmail } from '@cuefinder/common/utils';

// Use UI components from package
import { Button, Card } from '@cuefinder/ui';

// Keep components small and focused
// Put business logic in hooks
// Keep data fetching in hooks
```

### ❌ DON'T
```javascript
// Don't import services directly in components
import * as cueService from '../api/cueService';
// Use hooks instead!

// Don't duplicate validation/formatting logic
// Use @cuefinder/common utilities

// Don't create one-off UI components
// Use @cuefinder/ui

// Don't mix business logic with JSX
// Move it to hooks
```

---

## 📂 File Navigation

**Need to find API service?**  
→ `packages/api/src/services/[feature]/[service].js`

**Need to use common hook?**  
→ Import from `@cuefinder/common`

**Need to use UI component?**  
→ Import from `@cuefinder/ui`

**Need feature-specific hook?**  
→ `features/[feature]/hooks/`

**Need feature component?**  
→ `features/[feature]/components/`

---

## 🔄 Migration in Progress

Old code in `app/src/api/` and `app/src/components/` will be gradually:
1. ✅ Migrated to use new packages
2. ✅ Components split into smaller pieces
3. ✅ Old files cleaned up

No rush - can be done incrementally!

---

## ❓ Common Questions

**Q: Where do I put my new component?**  
A: In `features/[feature]/components/` if it's feature-specific, or `components/` if it's shared

**Q: Where do I put my business logic?**  
A: In a hook in `features/[feature]/hooks/`

**Q: Can I still use the old imports?**  
A: Temporarily yes, but migrate to new imports when possible

**Q: How do I test a hook?**  
A: Import the hook and test its return values with different inputs

**Q: What if I need a utility that doesn't exist?**  
A: Add it to `packages/common/src/utils/` so it can be reused

---

## 🎓 Learning Path

1. **Understand the structure** (this document)
2. **Look at existing hooks** (`features/cues/hooks/`)
3. **Use a hook in a component** (import it, use the return values)
4. **Create a simple hook** (start with useMyFeatureState pattern)
5. **Migrate an old component** (follow Before/After examples)
6. **Mentor others** (share the pattern!)

---

## 📞 Need Help?

- Check `FRONTEND_REFACTORING_COMPLETE.md` for detailed implementation
- Look at existing hooks for examples
- Review new hook imports in your IDE
- All hooks and utilities are documented inline

---

**Happy refactoring! 🚀**

