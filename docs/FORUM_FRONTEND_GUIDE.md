# Forum Feature - Frontend Integration Guide

## Overview
This document describes how to integrate the Forum feature into your CueFinder frontend application.

## Files Created

### 1. **Forum Component** (`src/components/Forum.js`)
The main forum component with:
- Category browsing
- Discussion management (CRUD operations)
- Post/reply system
- Like and helpful marking functionality
- Search functionality
- Modal dialogs for creating discussions and posts
- Responsive design with Grommet UI

### 2. **Forum API Service** (`src/api/forumService.js`)
Service layer for all forum-related API calls:
- Category management
- Discussion management
- Post management
- User interactions (likes, helpful marks)
- Search functionality
- User statistics

### 3. **Forum Navigation** (`src/components/ForumNavigation.js`)
Navigation component featuring:
- Desktop and mobile responsive menu
- Forum link with "New" badge
- User profile integration
- Active page highlighting

### 4. **Styles** (`src/styles/forum.css`)
Comprehensive styling including:
- Dark theme matching CueFinder design
- Responsive grid layouts
- Hover effects and transitions
- Modal styling
- Badge and tag styling
- Loading states

## Integration Steps

### Step 1: Install Dependencies
Ensure you have Grommet and its icons installed:
```bash
npm install grommet grommet-icons react-i18next axios
```

### Step 2: Import Components
In your main App component:
```javascript
import Forum from './components/Forum';
import ForumNavigation from './components/ForumNavigation';
import './styles/forum.css';
```

### Step 3: Set Up Routing
Add forum to your routing logic:
```javascript
const [currentPage, setCurrentPage] = useState('home');

const renderPage = () => {
  switch(currentPage) {
    case 'forum':
      return <Forum onBack={() => setCurrentPage('home')} />;
    case 'home':
      return <HomePage />;
    // ... other pages
    default:
      return <HomePage />;
  }
};

return (
  <>
    <ForumNavigation 
      onNavigateTo={setCurrentPage}
      currentPage={currentPage}
      profileOpen={profileOpen}
      setProfileOpen={setProfileOpen}
    />
    {renderPage()}
  </>
);
```

### Step 4: Verify API Configuration
Ensure your `axiosConfig.js` is properly set up:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

export default api;
```

### Step 5: Authentication Integration
The Forum component uses the `useAuth` hook. Ensure your AuthContext provides:
- `user` - Current user object
- `logout` - Logout function

## Features

### User Features
- **Browse Categories**: View all forum categories and their discussion counts
- **Create Discussions**: Start new discussions in any category
- **Post Replies**: Reply to existing discussions
- **Like Posts**: Like helpful posts from other users
- **Mark as Helpful**: Mark posts that solve your problem
- **Search**: Find relevant discussions across all categories
- **View Stats**: See helpful post counts and user contributions

### Admin Features (if implemented in backend)
- **Pin Discussions**: Keep important discussions at the top
- **Lock Discussions**: Prevent further replies
- **Delete Content**: Remove inappropriate posts or discussions
- **Moderate**: Review and manage forum content

## Component Props

### Forum Component
```javascript
<Forum
  onBack={() => {}}  // Callback when user clicks back
/>
```

### ForumNavigation Component
```javascript
<ForumNavigation
  onNavigateTo={(page) => {}}  // Navigation callback
  currentPage="forum"           // Current active page
  profileOpen={false}           // Profile menu state
  setProfileOpen={() => {}}     // Set profile menu state
/>
```

## API Endpoints Expected

The forum service expects these backend endpoints:

### Categories
- `GET /api/forum/categories` - Get all categories
- `GET /api/forum/categories/{id}` - Get single category
- `GET /api/forum/categories/{id}/discussions` - Get category discussions

### Discussions
- `GET /api/forum/discussions` - Get all discussions
- `POST /api/forum/discussions` - Create discussion
- `GET /api/forum/discussions/{id}` - Get discussion detail
- `PUT /api/forum/discussions/{id}` - Update discussion
- `DELETE /api/forum/discussions/{id}` - Delete discussion
- `POST /api/forum/discussions/{id}/pin` - Pin discussion
- `POST /api/forum/discussions/{id}/unpin` - Unpin discussion
- `POST /api/forum/discussions/{id}/lock` - Lock discussion
- `POST /api/forum/discussions/{id}/unlock` - Unlock discussion

### Posts
- `GET /api/forum/discussions/{id}/posts` - Get discussion posts
- `POST /api/forum/posts` - Create post
- `GET /api/forum/posts/{id}` - Get post detail
- `PUT /api/forum/posts/{id}` - Update post
- `DELETE /api/forum/posts/{id}` - Delete post
- `POST /api/forum/posts/{id}/like` - Like post
- `POST /api/forum/posts/{id}/unlike` - Unlike post
- `POST /api/forum/posts/{id}/mark-helpful` - Mark as helpful

### Search & Stats
- `GET /api/forum/search?q=query` - Search discussions
- `GET /api/forum/user/stats` - Get user forum stats
- `GET /api/forum/user/{id}/discussions` - Get user's discussions
- `GET /api/forum/user/{id}/posts` - Get user's posts

## Styling Customization

The component uses Grommet's theming system. To customize colors:

```javascript
const theme = {
  global: {
    colors: {
      brand: '#3b82f6',
      'status-ok': '#22c55e',
      'status-critical': '#ef4444',
      background: '#0f172a',
      'background-front': '#1e293b',
      'text-weak': '#94a3b8'
    }
  }
};
```

## Responsive Behavior

The forum component is fully responsive:
- **Desktop**: Multi-column grid layout with full navigation
- **Tablet**: Adjusted grid (1-2 columns), full navigation
- **Mobile**: Single column layout with hamburger menu

## Performance Considerations

1. **Pagination**: Consider adding pagination to discussions/posts for large datasets
2. **Lazy Loading**: Images or rich content should be lazy-loaded
3. **Caching**: Implement caching for categories which change less frequently
4. **Real-time Updates**: Consider WebSocket integration for live updates

## Future Enhancements

1. **Rich Text Editor**: Replace TextArea with rich text editor for better formatting
2. **Notifications**: Notify users of replies to their discussions/posts
3. **User Mentions**: @mention functionality with notifications
4. **Attachments**: Allow image/file uploads with posts
5. **Moderation Tools**: Advanced moderation dashboard
6. **Analytics**: Discussion and post analytics
7. **Email Notifications**: Email digests of forum activity
8. **Reputation System**: User reputation based on helpful posts

## Troubleshooting

### Forum not loading
- Check API endpoint configuration
- Verify authentication token is being sent
- Check browser console for errors

### Styles not applying
- Ensure `forum.css` is imported in your main App component
- Check for CSS conflicts with other stylesheets
- Verify Grommet theme is properly configured

### Modal not closing
- Check that `onClickOutside` and `onEsc` handlers are not blocked
- Ensure no event propagation issues
- Check z-index conflicts

## Support

For issues or questions about the forum feature, refer to the backend forum API documentation or contact your development team.
