# Forum Feature - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Forum feature frontend implementation.

## Test Environment Setup

### Prerequisites
- Backend Forum API running
- Frontend development server running
- Test database with sample forum data
- Authentication system configured

### Sample Data
```sql
-- Insert test categories
INSERT INTO ForumCategories (Name, Description, DisplayOrder, IsActive)
VALUES 
  ('General Discussion', 'General topics about billiards and cues', 1, true),
  ('Technical Help', 'Get help with technical issues', 2, true),
  ('Product Reviews', 'Share reviews of cues and equipment', 3, true);

-- Insert test discussions
INSERT INTO Discussions (Title, Content, CategoryId, CreatedByUserId, CreatedAt)
VALUES 
  ('Welcome to CueFinder Forum', 'This is our new community forum!', 1, 'admin', NOW()),
  ('My cue broke - advice needed', 'Recently had my cue break...', 2, 'testuser', NOW());

-- Insert test posts
INSERT INTO Posts (Content, DiscussionId, CreatedByUserId, CreatedAt)
VALUES 
  ('Great to have a community space!', 1, 'user1', NOW()),
  ('I had a similar issue...', 2, 'user2', NOW());
```

## Unit Tests

### Test File: `Forum.test.js`
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Forum from '../components/Forum';
import * as forumService from '../api/forumService';

jest.mock('../api/forumService');
jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', username: 'testuser' } })
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

describe('Forum Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders forum component', async () => {
    forumService.getCategories.mockResolvedValue([
      { id: '1', name: 'General Discussion', description: 'General topics' }
    ]);

    render(<Forum onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Forum')).toBeInTheDocument();
    });
  });

  test('loads and displays categories', async () => {
    const mockCategories = [
      { id: '1', name: 'General', description: 'General Discussion' },
      { id: '2', name: 'Help', description: 'Technical Help' }
    ];
    forumService.getCategories.mockResolvedValue(mockCategories);

    render(<Forum onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
    });
  });

  test('opens new discussion modal when button clicked', async () => {
    forumService.getCategories.mockResolvedValue([]);
    
    const { getByRole } = render(<Forum onBack={() => {}} />);
    const createBtn = getByRole('button', { name: /new discussion/i });
    
    fireEvent.click(createBtn);
    await waitFor(() => {
      expect(screen.getByText('Start New Discussion')).toBeInTheDocument();
    });
  });

  test('creates new discussion with valid data', async () => {
    forumService.getCategories.mockResolvedValue([
      { id: '1', name: 'General' }
    ]);
    forumService.createDiscussion.mockResolvedValue({
      id: '1',
      title: 'Test Discussion',
      content: 'Test content'
    });

    const { getByRole, getByPlaceholderText } = render(<Forum onBack={() => {}} />);
    
    // Open modal
    fireEvent.click(getByRole('button', { name: /new discussion/i }));
    
    // Fill form
    await userEvent.type(getByPlaceholderText('Discussion title'), 'Test Discussion');
    await userEvent.type(getByPlaceholderText('What would you like to discuss?'), 'Test content');
    
    // Submit
    fireEvent.click(getByRole('button', { name: /create discussion/i }));
    
    await waitFor(() => {
      expect(forumService.createDiscussion).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Discussion',
          content: 'Test content'
        })
      );
    });
  });

  test('displays error when discussion creation fails', async () => {
    forumService.getCategories.mockResolvedValue([{ id: '1', name: 'General' }]);
    forumService.createDiscussion.mockRejectedValue(new Error('API Error'));

    const { getByRole } = render(<Forum onBack={() => {}} />);
    
    fireEvent.click(getByRole('button', { name: /new discussion/i }));
    fireEvent.click(getByRole('button', { name: /create discussion/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create discussion')).toBeInTheDocument();
    });
  });

  test('loads discussion details when discussion clicked', async () => {
    const mockDiscussions = [
      {
        id: '1',
        title: 'Test Discussion',
        content: 'Test content',
        createdByUserId: 'user1',
        createdAt: new Date(),
        replyCount: 2
      }
    ];

    forumService.getCategories.mockResolvedValue([{ id: '1', name: 'General' }]);
    forumService.getCategoryDiscussions.mockResolvedValue(mockDiscussions);
    forumService.getDiscussion.mockResolvedValue(mockDiscussions[0]);
    forumService.getDiscussionPosts.mockResolvedValue([
      {
        id: '1',
        content: 'Test post',
        createdByUserId: 'user2',
        createdAt: new Date(),
        likeCount: 1,
        helpfulCount: 0
      }
    ]);

    const { getByText } = render(<Forum onBack={() => {}} />);
    
    // Navigate to category
    fireEvent.click(getByText('General'));
    
    // Click discussion
    await waitFor(() => {
      fireEvent.click(getByText('Test Discussion'));
    });

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });
  });

  test('creates post reply', async () => {
    forumService.getCategories.mockResolvedValue([{ id: '1', name: 'General' }]);
    forumService.getCategoryDiscussions.mockResolvedValue([
      {
        id: '1',
        title: 'Test Discussion',
        content: 'Test content',
        createdByUserId: 'user1',
        createdAt: new Date()
      }
    ]);
    forumService.getDiscussion.mockResolvedValue({
      id: '1',
      title: 'Test Discussion',
      content: 'Test content',
      isLocked: false
    });
    forumService.getDiscussionPosts.mockResolvedValue([]);
    forumService.createPost.mockResolvedValue({
      id: '1',
      content: 'Test reply'
    });

    const { getByText, getByRole, getByPlaceholderText } = render(
      <Forum onBack={() => {}} />
    );

    // Navigate to discussion
    fireEvent.click(getByText('General'));
    await waitFor(() => {
      fireEvent.click(getByText('Test Discussion'));
    });

    // Create reply
    await waitFor(() => {
      fireEvent.click(getByRole('button', { name: /post reply/i }));
    });

    await userEvent.type(getByPlaceholderText('Write your reply here...'), 'Test reply');
    fireEvent.click(getByRole('button', { name: /post reply/i }));

    await waitFor(() => {
      expect(forumService.createPost).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Test reply' })
      );
    });
  });

  test('likes post', async () => {
    // Setup similar to above...
    forumService.likePost.mockResolvedValue({});
    
    // ... render and navigate to post ...
    
    const likeBtn = screen.getByRole('button', { name: /0/ });
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(forumService.likePost).toHaveBeenCalled();
    });
  });

  test('marks post as helpful', async () => {
    forumService.markPostAsHelpful.mockResolvedValue({});
    
    // ... render and navigate to post ...
    
    const helpfulBtn = screen.getByRole('button', { name: /helpful/i });
    fireEvent.click(helpfulBtn);

    await waitFor(() => {
      expect(forumService.markPostAsHelpful).toHaveBeenCalled();
    });
  });

  test('searches discussions', async () => {
    const discussions = [
      { id: '1', title: 'Test Discussion', content: 'Test content' }
    ];
    
    forumService.getCategories.mockResolvedValue([{ id: '1', name: 'General' }]);
    forumService.getCategoryDiscussions.mockResolvedValue(discussions);

    const { getByPlaceholderText, getByText } = render(<Forum onBack={() => {}} />);

    fireEvent.click(getByText('General'));

    const searchInput = getByPlaceholderText('Search discussions...');
    await userEvent.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText('Test Discussion')).toBeInTheDocument();
    });
  });
});
```

### Test File: `forumService.test.js`
```javascript
import * as forumService from '../api/forumService';
import api from '../api/axiosConfig';

jest.mock('../api/axiosConfig');

describe('Forum Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCategories calls correct endpoint', async () => {
    const mockCategories = [{ id: '1', name: 'General' }];
    api.get.mockResolvedValue({ data: mockCategories });

    const result = await forumService.getCategories();

    expect(api.get).toHaveBeenCalledWith('/api/forum/categories');
    expect(result).toEqual(mockCategories);
  });

  test('createDiscussion sends correct data', async () => {
    const discussionData = {
      title: 'Test',
      content: 'Content',
      categoryId: '1'
    };
    api.post.mockResolvedValue({ data: { id: '1', ...discussionData } });

    const result = await forumService.createDiscussion(discussionData);

    expect(api.post).toHaveBeenCalledWith('/api/forum/discussions', discussionData);
    expect(result.id).toBe('1');
  });

  test('createPost sends correct data', async () => {
    const postData = {
      discussionId: '1',
      content: 'Test post'
    };
    api.post.mockResolvedValue({ data: { id: '1', ...postData } });

    const result = await forumService.createPost(postData);

    expect(api.post).toHaveBeenCalledWith('/api/forum/posts', postData);
    expect(result.id).toBe('1');
  });

  test('likePost calls correct endpoint', async () => {
    api.post.mockResolvedValue({ data: { likeCount: 5 } });

    const result = await forumService.likePost('1');

    expect(api.post).toHaveBeenCalledWith('/api/forum/posts/1/like');
    expect(result.likeCount).toBe(5);
  });

  test('error handling in API calls', async () => {
    const error = new Error('API Error');
    api.get.mockRejectedValue(error);

    await expect(forumService.getCategories()).rejects.toThrow('API Error');
  });
});
```

## Integration Tests

### Test Scenarios

#### 1. Complete Forum Workflow
```javascript
describe('Complete Forum Workflow', () => {
  test('user can browse, create, and reply in forum', async () => {
    // 1. Load forum
    // 2. View categories
    // 3. Select category
    // 4. View discussions
    // 5. Create new discussion
    // 6. View discussion detail
    // 7. Create reply
    // 8. Like reply
    // 9. Mark as helpful
  });
});
```

#### 2. Error Handling
```javascript
describe('Error Handling', () => {
  test('shows error when API fails', async () => {
    // Mock API failure
    // Verify error message displayed
    // Verify user can retry
  });

  test('handles network timeout', async () => {
    // Mock timeout
    // Verify graceful error handling
  });
});
```

## Manual Testing Checklist

### Category View
- [ ] Categories load and display correctly
- [ ] Category cards show correct information
- [ ] Clicking category navigates to discussions
- [ ] Discussion count is accurate
- [ ] Images load properly

### Discussion View
- [ ] Discussions list displays for selected category
- [ ] Search filters discussions correctly
- [ ] Clicking discussion shows detail view
- [ ] Reply count and view count accurate
- [ ] Date formatting is correct
- [ ] Pagination works if implemented

### Discussion Detail View
- [ ] Original post displays correctly
- [ ] All replies load and display
- [ ] Reply count matches actual replies
- [ ] User can post reply if logged in
- [ ] Post actions (like, helpful) work
- [ ] Like count updates after clicking
- [ ] Helpful count updates after marking

### Create Discussion
- [ ] Modal opens when button clicked
- [ ] Category dropdown populated
- [ ] Form validation works
- [ ] Required fields enforced
- [ ] Success message after creation
- [ ] New discussion appears in list

### Create Post
- [ ] Modal opens when reply button clicked
- [ ] Form validation works
- [ ] Required fields enforced
- [ ] Success message after creation
- [ ] New post appears in list

### Navigation
- [ ] Forum link in navigation
- [ ] Back button returns to previous view
- [ ] Category navigation works
- [ ] Mobile menu works properly
- [ ] Active page highlighting works

### Responsive Design
- [ ] Desktop layout displays correctly
- [ ] Tablet layout responsive
- [ ] Mobile layout responsive
- [ ] Touch interactions work on mobile
- [ ] No horizontal scroll on any device

### Authentication
- [ ] Non-authenticated users can view forum
- [ ] Create buttons disabled for non-authenticated
- [ ] Authenticated users can create
- [ ] User info displays correctly
- [ ] Logout works properly

## Performance Testing

### Load Testing
```javascript
// Test with large datasets
- 1000+ categories
- 10,000+ discussions
- 100,000+ posts

// Measure:
- Initial load time
- Search performance
- Pagination speed
```

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] ARIA labels present
- [ ] Focus indicators visible

## Bug Report Template

```
**Title:** [Component] Description

**Environment:**
- Browser: 
- OS: 
- Screen size: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots/Videos:**

**Logs:**
```

## Test Coverage Goals

- Unit Tests: 80%+ coverage
- Integration Tests: 70%+ coverage
- E2E Tests: Critical paths covered
- Overall: 75%+ code coverage

## Continuous Testing

### Pre-commit Hooks
```bash
npm run test:unit
npm run test:lint
npm run test:accessibility
```

### CI/CD Pipeline
```yaml
- Unit Tests
- Integration Tests
- E2E Tests
- Performance Tests
- Accessibility Tests
- Browser Compatibility Tests
```
