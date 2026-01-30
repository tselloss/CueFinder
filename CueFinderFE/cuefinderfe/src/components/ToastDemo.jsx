import React from 'react';
import { useToast } from '../contexts/ToastContext';
import './ToastDemo.css';

/**
 * Demo component to test the toast notification system
 * This can be removed after verifying the toast system works
 */
const ToastDemo = () => {
  const { showSuccess, showError, showInfo } = useToast();

  return (
    <div className="toast-demo">
      <h2>Toast Notification System Demo</h2>
      <p>Click the buttons below to test different toast types:</p>
      
      <div className="toast-demo-buttons">
        <button
          className="btn btn-success"
          onClick={() => showSuccess('Success! Operation completed successfully.')}
        >
          Show Success Toast
        </button>

        <button
          className="btn btn-error"
          onClick={() => showError('Error! Something went wrong.')}
        >
          Show Error Toast
        </button>

        <button
          className="btn btn-info"
          onClick={() => showInfo('Info: This is an informational message.')}
        >
          Show Info Toast
        </button>

        <button
          className="btn btn-warning"
          onClick={() => {
            showError('This is a longer error message to test how the toast handles multiple lines of text. It should wrap properly and remain readable on both desktop and mobile devices.');
          }}
        >
          Show Long Message
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => {
            showSuccess('First toast');
            setTimeout(() => showInfo('Second toast'), 500);
            setTimeout(() => showError('Third toast'), 1000);
          }}
        >
          Show Multiple Toasts
        </button>

        <button
          className="btn btn-primary"
          onClick={() => showSuccess('Custom duration: 10 seconds', 10000)}
        >
          Show 10 Second Toast
        </button>
      </div>

      <div className="toast-demo-info">
        <h3>Features Tested:</h3>
        <ul>
          <li>✅ Success notifications (green)</li>
          <li>✅ Error notifications (red)</li>
          <li>✅ Info notifications (blue)</li>
          <li>✅ Long message handling</li>
          <li>✅ Multiple simultaneous toasts</li>
          <li>✅ Custom duration</li>
          <li>✅ Auto-dismiss with progress bar</li>
          <li>✅ Manual close button</li>
          <li>✅ Mobile responsiveness</li>
        </ul>
      </div>
    </div>
  );
};

export default ToastDemo;
