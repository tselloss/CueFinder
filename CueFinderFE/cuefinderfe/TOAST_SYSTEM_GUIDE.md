# Toast Notification System - Usage Guide

## Overview

A comprehensive toast notification system has been implemented for displaying backend error messages and user feedback across the application. The system is mobile-responsive and works seamlessly on all screen sizes.

## Features

✅ **Automatic Backend Error Handling** - All axios errors are automatically captured and displayed as toasts
✅ **Mobile Responsive** - Optimized positioning and animations for mobile devices
✅ **Multiple Toast Types** - Success, Error, and Info notifications
✅ **Auto-dismiss** - Toasts automatically close after 5 seconds (configurable)
✅ **Manual Close** - Users can dismiss toasts manually with the close button
✅ **Progress Indicator** - Visual progress bar shows time until auto-dismiss
✅ **Dark Mode Support** - Automatically adapts to system dark mode preference
✅ **Accessible** - Proper ARIA labels and roles for screen readers

## How It Works

### Automatic Error Handling

The axios interceptor automatically catches all backend errors and displays them as toasts. No manual implementation needed in your API calls!

```javascript
// Before: Manual error handling
try {
  await axios.post('/api/cues', data);
} catch (error) {
  alert('Error creating cue'); // Old way
}

// After: Automatic toast notification
try {
  await axios.post('/api/cues', data);
} catch (error) {
  // Toast automatically shown! 🎉
  // Error still available for additional handling if needed
}
```

### Manual Toast Usage

For custom notifications (success messages, info, etc.), use the `useToast` hook:

```javascript
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const { showSuccess, showError, showInfo } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      // Error toast already shown by interceptor
      // But you can add custom error if needed:
      showError('Custom error message');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## API Reference

### useToast Hook

```javascript
const {
  showSuccess,  // (message, duration?) => void
  showError,    // (message, duration?) => void
  showInfo,     // (message, duration?) => void
  addToast,     // (message, type, duration?) => void
  removeToast,  // (id) => void
  clearAll      // () => void
} = useToast();
```

### Methods

**`showSuccess(message, duration = 5000)`**
- Displays a success toast with green styling
- Parameters:
  - `message` (string): The message to display
  - `duration` (number, optional): Time in ms before auto-dismiss

**`showError(message, duration = 5000)`**
- Displays an error toast with red styling
- Parameters:
  - `message` (string): The error message to display
  - `duration` (number, optional): Time in ms before auto-dismiss

**`showInfo(message, duration = 5000)`**
- Displays an info toast with blue styling
- Parameters:
  - `message` (string): The info message to display
  - `duration` (number, optional): Time in ms before auto-dismiss

**`addToast(message, type, duration = 5000)`**
- Generic method to add any type of toast
- Parameters:
  - `message` (string): The message to display
  - `type` (string): 'success', 'error', or 'info'
  - `duration` (number, optional): Time in ms before auto-dismiss

**`clearAll()`**
- Removes all active toasts from the screen

## Examples

### Basic Usage

```javascript
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const { showSuccess, showError, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Operation completed!')}>
        Success
      </button>
      <button onClick={() => showError('Something went wrong')}>
        Error
      </button>
      <button onClick={() => showInfo('Did you know?')}>
        Info
      </button>
    </div>
  );
}
```

### Custom Duration

```javascript
// Show toast for 10 seconds instead of default 5
showSuccess('Important message!', 10000);

// Show toast for 3 seconds
showError('Quick error message', 3000);
```

### Form Submission

```javascript
const handleSubmit = async (formData) => {
  try {
    await axios.post('/api/submit', formData);
    showSuccess('Form submitted successfully!');
    navigate('/success');
  } catch (error) {
    // Backend error toast shown automatically
    // Optionally add custom handling:
    console.error('Submission failed:', error);
  }
};
```

### Multiple Toasts

```javascript
// Multiple toasts can be displayed simultaneously
showInfo('Processing your request...');
setTimeout(() => {
  showSuccess('Request completed!');
}, 2000);
```

## Mobile Responsiveness

The toast system automatically adapts to mobile devices:

### Desktop
- Toasts appear in the top-right corner
- Slide in from the right
- Max width of 400px
- Stack vertically with 12px gap

### Mobile (≤768px)
- Toasts appear at the top of the screen
- Full width (with 10px margin on sides)
- Slide in from the top
- Stack vertically with 12px gap
- Slightly smaller text and icons

## Styling Customization

To customize toast appearance, edit [Toast.css](./src/components/Toast.css):

```css
/* Change toast colors */
.toast-error {
  border-left: 4px solid #your-color;
}

/* Change animation duration */
@keyframes slideIn {
  /* Modify animation */
}

/* Change mobile breakpoint */
@media (max-width: 768px) {
  /* Your mobile styles */
}
```

## Backend Error Format

The system automatically extracts user-friendly messages from:

1. **RFC 7807 Problem Details** format
2. **Standard error responses** with `message` field
3. **Validation errors** with field-specific messages
4. **Network errors** (no response from server)

Example backend error formats that work automatically:

```json
// Problem Details format
{
  "title": "Validation Error",
  "detail": "Email is required",
  "status": 400
}

// Simple message format
{
  "message": "User not found",
  "status": 404
}

// Validation errors format
{
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

## Components Updated

The following components have been updated to use the toast system:

✅ [ModerationDashboard.jsx](./src/features/moderation/components/ModerationDashboard.jsx)
✅ [Inbox.jsx](./src/features/messaging/components/Inbox.jsx)
✅ All axios API calls (automatic via interceptor)

## Troubleshooting

**Toasts not appearing?**
- Ensure `ToastProvider` wraps your app in [App.js](./src/App.js)
- Check that axios interceptor is initialized in AppInner component
- Verify no CSS z-index conflicts (toasts use z-index: 9999)

**Multiple toasts for one error?**
- If you're calling `showError` manually AND the interceptor catches it, you'll get two toasts
- Solution: Remove manual `showError` calls for axios errors

**Toast positioning issues on mobile?**
- Check for fixed/absolute positioned elements that might overlap
- Verify viewport meta tag is set correctly in your HTML

## Future Enhancements

Potential improvements for future iterations:

- [ ] Toast queue management (limit simultaneous toasts)
- [ ] Toast sound effects (optional)
- [ ] Toast animations (fade, bounce, etc.)
- [ ] Custom toast icons
- [ ] Persistent toasts (don't auto-dismiss)
- [ ] Toast history/log
- [ ] Undo actions from toasts

## Support

For issues or questions about the toast system:
1. Check this documentation
2. Review the implementation in [ToastContext.jsx](./src/contexts/ToastContext.jsx)
3. Test in [Toast.jsx](./src/components/Toast.jsx)
4. Check axios interceptor in [axiosInterceptor.js](./src/utils/axiosInterceptor.js)
