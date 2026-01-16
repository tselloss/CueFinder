# Forum Frontend - User Interface Overview

## 🎨 Interface Layouts

### 1. Forum Home - Categories View

```
┌─────────────────────────────────────────────────────────────────┐
│  CueFinder          [Home] [Search] [Forum] [Profile]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Forum Categories                           [← Back] [+ New]     │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │ General Discussion   │  │ Technical Help       │              │
│  │                      │  │                      │              │
│  │ General topics about │  │ Get help with       │              │
│  │ billiards and cues   │  │ technical issues    │              │
│  │                      │  │                      │              │
│  │ Discussions: 45      │  │ Discussions: 12      │              │
│  └──────────────────────┘  └──────────────────────┘              │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │ Product Reviews      │  │ Announcements        │              │
│  │                      │  │                      │              │
│  │ Share reviews of     │  │ Important updates    │              │
│  │ cues and equipment   │  │ and news            │              │
│  │                      │  │                      │              │
│  │ Discussions: 28      │  │ Discussions: 8       │              │
│  └──────────────────────┘  └──────────────────────┘              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Category Discussions View

```
┌─────────────────────────────────────────────────────────────────┐
│  CueFinder          [Home] [Search] [Forum] [Profile]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  General Discussion - Discussions  [All Categories]              │
│                                                                   │
│  🔍 Search discussions...                                        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Welcome to CueFinder Forum                                │  │
│  │ This is our new community forum! Join the conversation.   │  │
│  │                                                            │  │
│  │ By: admin                    📅 2024-01-15               │  │
│  │ 💬 12 replies               👁️ 342 views                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ What's your favorite cue weight?                          │  │
│  │ I'm curious about the community's preferences...          │  │
│  │                                                            │  │
│  │ By: user1                    📅 2024-01-14               │  │
│  │ 💬 8 replies                👁️ 156 views                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Maintenance tips for cue care                             │  │
│  │ Tips for keeping your cue in excellent condition...       │  │
│  │                                                            │  │
│  │ By: expert                   📅 2024-01-13               │  │
│  │ 💬 24 replies               👁️ 589 views                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Discussion Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│  CueFinder          [Home] [Search] [Forum] [Profile]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Welcome to CueFinder Forum 📌                       [← Back]    │
│  Started by: admin  |  2024-01-15                               │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ This is our new community forum! Join the conversation    │  │
│  │ and connect with other billiards enthusiasts.             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Posts (12)                                                      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 👤 user1                     2024-01-15                   │  │
│  │ ✓ 3 helpful                                              │  │
│  │                                                            │  │
│  │ Great to have a community space! Looking forward to       │  │
│  │ participating and learning from everyone here.            │  │
│  │                                                            │  │
│  │ [❤️ 5]  [Reply]  [✓ Helpful]                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 👤 user2                     2024-01-15                   │  │
│  │ ✓ 2 helpful                                              │  │
│  │                                                            │  │
│  │ Excellent initiative! This will definitely help the       │  │
│  │ community connect and share knowledge.                    │  │
│  │                                                            │  │
│  │ [❤️ 3]  [Reply]  [✓ Helpful]                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [Reply] button (if not locked and logged in)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. New Discussion Modal

```
┌──────────────────────────────────────────────────────────────┐
│                                              [✕]               │
│  Start New Discussion                                        │
│                                                              │
│  Category:                                                 │
│  [▼ Select a category________________]                     │
│                                                              │
│  Title:                                                    │
│  [________________________________________]                │
│                                                              │
│  Content:                                                  │
│  [________________________________________]                │
│  [________________________________________]                │
│  [________________________________________]                │
│                                                              │
│                              [Cancel]  [Create Discussion] │
└──────────────────────────────────────────────────────────────┘
```

### 5. New Post/Reply Modal

```
┌──────────────────────────────────────────────────────────────┐
│                                              [✕]               │
│  Post Reply                                                 │
│                                                              │
│  Your Reply:                                               │
│  [________________________________________]                │
│  [________________________________________]                │
│  [________________________________________]                │
│                                                              │
│                                   [Cancel]  [Post Reply]  │
└──────────────────────────────────────────────────────────────┘
```

### 6. Mobile View - Menu Open

```
┌─────────────────────────┐
│ CueFinder      [≡]      │  ← Header
├─────────────────────────┤
│ Menu                [✕] │
│                         │
│ [🏠] Home              │
│ [🔍] Search            │
│ [💬] Forum      [NEW]  │  ← Forum highlighted
│ [👤] Profile           │
│                         │
│ ─────────────────────── │
│                         │
│ [🚪] Logout            │
└─────────────────────────┘
```

## 🎭 State Indicators

### Discussion Badges
```
📌 Pinned Discussion (stays at top)
🔒 Locked Discussion (no new replies allowed)
✓ Helpful Post (marked as helpful by user)
❤️ Liked Post (user liked this post)
[NEW] New Feature Badge
```

### Status Colors
```
Blue (#3b82f6)   - Primary actions, links, highlights
Green (#22c55e)  - Success, helpful, positive actions
Red (#ef4444)    - Destructive actions, errors
Orange (#f59e0b) - Warnings
Gray (#94a3b8)   - Disabled, secondary text
```

## 📊 Component States

### Loading State
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    Loading... ⟳                             │
│                                                              │
│              (spinner animation)                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         📭                                   │
│                  No discussions found                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Failed to load discussions                              │
│                                                              │
│  Please try again or contact support                         │
│                                                              │
│  [🔄 Retry]                                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Responsive Layouts

### Desktop (1920px+)
```
Full navigation bar with all items visible
Multi-column grid (2+ columns)
Full-width content area
Side panels available
```

### Tablet (768px - 1024px)
```
Horizontal navigation bar (may wrap)
2-column grid
Adjusted spacing
Touch-friendly buttons
```

### Mobile (375px - 767px)
```
Hamburger menu navigation
Single column layout
Vertical scrolling
Larger touch targets
Full-width content
```

## 🔄 User Workflows

### Browse & Read
```
1. View Categories
   ↓
2. Select Category
   ↓
3. View Discussions in Category
   ↓
4. View Discussion Detail
   ↓
5. Read Posts
```

### Create & Participate
```
1. Click "New Discussion" button
   ↓
2. Select category
   ↓
3. Enter title and content
   ↓
4. Click "Create Discussion"
   ↓
5. View new discussion
   ↓
6. Click "Post Reply"
   ↓
7. Enter reply content
   ↓
8. Click "Post Reply"
```

### Interact with Posts
```
Post Display
   ↓
   ├─ [❤️ Like] → Update count
   ├─ [Reply] → Open reply modal
   └─ [✓ Helpful] → Mark as helpful, update count
```

## 🎯 Visual Hierarchy

```
Level 1 (Largest)    - Page Title, Main Actions
Level 2 (Large)      - Section Titles, Card Titles
Level 3 (Medium)     - Card Content, Metadata
Level 4 (Small)      - Secondary Info, Timestamps
Level 5 (Smallest)   - Helper Text, Badges
```

## 📐 Spacing & Sizing

```
Small:   4px / 8px
Medium:  16px / 24px
Large:   32px / 48px

Button:  40px height (mobile), 36px (desktop)
Card:    100% width, padding 16px (mobile), 24px (desktop)
Modal:   90vw max width (mobile), 600px (desktop)
```

## 🎬 Animations

```
Hover Effects:      200ms ease transition
Modal Open/Close:   300ms ease animation
Page Transitions:   200ms fade
Button Interactions: 150ms color change
```

---

**Visual Design Principles:**
- Clean, minimal interface
- Dark theme for comfortable reading
- Clear information hierarchy
- Consistent spacing and alignment
- Responsive and mobile-first
- Accessibility-focused (high contrast, semantic HTML)
