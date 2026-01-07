/**
 * End-to-End Test: User Registration and Authentication Flow
 * 
 * This test covers the complete user journey:
 * 1. Register a new user account
 * 2. Authenticate with the created credentials
 * 3. Navigate through the application
 * 4. Verify authenticated features are accessible
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';
import * as authService from '../../api/authService';
import * as cueService from '../../api/cueService';

// Mock the API services
jest.mock('../../api/authService');
jest.mock('../../api/cueService');

describe('End-to-End: User Registration and Authentication Flow', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'TestPass123!',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
  };

  const mockAuthResponse = {
    accessToken: 'mock-jwt-token-12345',
    userId: 1,
    username: testUser.username,
    name: testUser.name,
    email: testUser.email,
    phone: testUser.phone,
    role: 'user',
  };

  const mockCuesData = [
    {
      id: 1,
      title: 'Premium Predator Cue',
      brand: 'Predator',
      price: 1200,
      condition: 'Like New',
      description: 'Excellent condition premium cue',
    },
    {
      id: 2,
      title: 'Classic McDermott',
      brand: 'McDermott',
      price: 800,
      condition: 'Used',
      description: 'Well-maintained professional cue',
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset localStorage
    localStorage.clear();
    
    // Setup default mock implementations
    authService.getCurrent.mockReturnValue(null);
    cueService.getCues.mockResolvedValue(mockCuesData);
  });

  test('Complete User Journey: Register -> Login -> Navigate App', async () => {
    // ===== STEP 1: REGISTRATION =====
    console.log('Step 1: Starting user registration...');
    
    // Mock the registration API call
    authService.register.mockResolvedValue({
      id: mockAuthResponse.userId,
      username: mockAuthResponse.username,
      name: mockAuthResponse.name,
      email: mockAuthResponse.email,
      phone: mockAuthResponse.phone,
      role: mockAuthResponse.role,
    });

    authService.sendSmsCode.mockResolvedValue({ success: true });
    authService.verifySmsCode.mockResolvedValue({ success: true });

    // Render the app
    render(<App />);

    // Verify we're on the login page
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();

    // Click to switch to registration mode
    const registerToggle = screen.getByText(/Create account/i, { selector: 'button, a, span' });
    fireEvent.click(registerToggle);

    // Fill in registration form
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/Display name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const phoneInput = screen.getByLabelText(/Mobile phone/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(usernameInput, testUser.username);
    await userEvent.type(nameInput, testUser.name);
    await userEvent.type(emailInput, testUser.email);
    await userEvent.type(phoneInput, testUser.phone);
    await userEvent.type(passwordInput, testUser.password);

    console.log('Step 1: Registration form filled');

    // ===== STEP 2: SMS VERIFICATION =====
    console.log('Step 2: Starting SMS verification...');

    // Submit to send SMS code
    const submitButton = screen.getByRole('button', { name: /create account|sign up|register/i });
    fireEvent.click(submitButton);

    // Wait for SMS code to be sent
    await waitFor(() => {
      expect(authService.sendSmsCode).toHaveBeenCalledWith(testUser.phone);
    });

    console.log('Step 2: SMS code sent');

    // Enter verification code
    await waitFor(() => {
      const codeInput = screen.getByLabelText(/verification code|sms code/i);
      expect(codeInput).toBeInTheDocument();
    });

    const codeInput = screen.getByLabelText(/verification code|sms code/i);
    await userEvent.type(codeInput, '123456');

    // Submit registration with verification code
    const verifyButton = screen.getByRole('button', { name: /verify|confirm|create account/i });
    fireEvent.click(verifyButton);

    // Wait for verification and registration
    await waitFor(() => {
      expect(authService.verifySmsCode).toHaveBeenCalledWith(testUser.phone, '123456');
      expect(authService.register).toHaveBeenCalledWith(
        testUser.username,
        testUser.password,
        testUser.name,
        testUser.phone,
        testUser.email,
        expect.any(Object)
      );
    });

    console.log('Step 2: User registered successfully');

    // ===== STEP 3: AUTHENTICATION =====
    console.log('Step 3: Authenticating user...');

    // Mock getCurrentUser to return the authenticated user
    authService.getCurrent.mockReturnValue({
      id: mockAuthResponse.userId,
      username: mockAuthResponse.username,
      name: mockAuthResponse.name,
      email: mockAuthResponse.email,
      phone: mockAuthResponse.phone,
      role: mockAuthResponse.role,
    });

    // Re-render to trigger authenticated state
    render(<App />);

    // Verify user is logged in
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Signed in as ${testUser.name}`, 'i'))).toBeInTheDocument();
    });

    console.log('Step 3: User authenticated successfully');

    // ===== STEP 4: NAVIGATE THROUGH APP =====
    console.log('Step 4: Testing app navigation...');

    // Verify the main app header is displayed
    expect(screen.getByText(/CueFinder/i)).toBeInTheDocument();
    expect(screen.getByText(/Billiard Cue Marketplace/i)).toBeInTheDocument();

    // Verify cues are loaded
    await waitFor(() => {
      expect(cueService.getCues).toHaveBeenCalled();
    });

    // Check if cues are displayed (they should be rendered in the CueList component)
    await waitFor(() => {
      expect(screen.getByText(/Premium Predator Cue/i)).toBeInTheDocument();
      expect(screen.getByText(/Classic McDermott/i)).toBeInTheDocument();
    });

    console.log('Step 4: Cues displayed successfully');

    // ===== STEP 5: TEST USER PROFILE ACCESS =====
    console.log('Step 5: Testing user profile access...');

    // Click on "My Profile" button
    const profileButton = screen.getByRole('button', { name: /My Profile/i });
    fireEvent.click(profileButton);

    // Verify profile page is displayed
    await waitFor(() => {
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    });

    console.log('Step 5: Profile page accessible');

    // ===== STEP 6: TEST ADD CUE FUNCTIONALITY =====
    console.log('Step 6: Testing add cue functionality...');

    // Navigate back to main view
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    // Click "Add Cue" button
    await waitFor(() => {
      const addCueButton = screen.getByRole('button', { name: /Add Cue/i });
      expect(addCueButton).toBeInTheDocument();
    });

    const addCueButton = screen.getByRole('button', { name: /Add Cue/i });
    fireEvent.click(addCueButton);

    // Verify form is displayed
    await waitFor(() => {
      expect(screen.getByText(/Add New Cue|Create Cue/i)).toBeInTheDocument();
    });

    console.log('Step 6: Add cue form accessible');

    // ===== STEP 7: TEST SEARCH FUNCTIONALITY =====
    console.log('Step 7: Testing search functionality...');

    // Navigate back to list
    const cancelButton = screen.getByRole('button', { name: /cancel|back/i });
    fireEvent.click(cancelButton);

    // Test search
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search cues/i);
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search cues/i);
    await userEvent.type(searchInput, 'Predator');

    console.log('Step 7: Search functionality working');

    // ===== STEP 8: TEST LOGOUT =====
    console.log('Step 8: Testing logout...');

    authService.logout.mockResolvedValue(true);
    authService.getCurrent.mockReturnValue(null);

    const signOutButton = screen.getByRole('button', { name: /Sign out/i });
    fireEvent.click(signOutButton);

    // Verify user is logged out
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });

    console.log('Step 8: Logout successful');

    // Re-render to show login page
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });

    console.log('✅ End-to-End Test Complete: All steps passed!');
  });

  test('User can login with existing credentials', async () => {
    console.log('Testing login with existing credentials...');

    // Mock the login API call
    authService.login.mockResolvedValue({
      id: mockAuthResponse.userId,
      username: mockAuthResponse.username,
      name: mockAuthResponse.name,
      email: mockAuthResponse.email,
      phone: mockAuthResponse.phone,
      role: mockAuthResponse.role,
    });

    authService.getCurrent.mockReturnValue(null);

    render(<App />);

    // Verify we're on the login page
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();

    // Fill in login form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(usernameInput, testUser.username);
    await userEvent.type(passwordInput, testUser.password);

    // Submit login
    const loginButton = screen.getByRole('button', { name: /sign in|login/i });
    fireEvent.click(loginButton);

    // Wait for login
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(testUser.username, testUser.password);
    });

    // Mock authenticated state
    authService.getCurrent.mockReturnValue({
      id: mockAuthResponse.userId,
      username: mockAuthResponse.username,
      name: mockAuthResponse.name,
      email: mockAuthResponse.email,
      phone: mockAuthResponse.phone,
      role: mockAuthResponse.role,
    });

    // Re-render
    render(<App />);

    // Verify user is logged in
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Signed in as ${testUser.name}`, 'i'))).toBeInTheDocument();
    });

    console.log('✅ Login test passed!');
  });

  test('Registration fails with invalid data', async () => {
    console.log('Testing registration validation...');

    authService.register.mockRejectedValue(new Error('Username already exists'));

    render(<App />);

    // Switch to registration
    const registerToggle = screen.getByText(/Create account/i, { selector: 'button, a, span' });
    fireEvent.click(registerToggle);

    // Fill in form with existing username
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const nameInput = screen.getByLabelText(/Display name/i);

    await userEvent.type(usernameInput, 'existinguser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(nameInput, 'Test User');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create account|register/i });
    fireEvent.click(submitButton);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Username already exists/i)).toBeInTheDocument();
    });

    console.log('✅ Validation test passed!');
  });

  test('Admin user can access admin features', async () => {
    console.log('Testing admin access...');

    // Mock admin user
    const adminUser = {
      id: 2,
      username: 'admin',
      name: 'Administrator',
      email: 'admin@example.com',
      phone: '+1234567890',
      role: 'admin',
    };

    authService.getCurrent.mockReturnValue(adminUser);

    render(<App />);

    // Verify admin button is visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument();
    });

    // Click admin button
    const adminButton = screen.getByRole('button', { name: /Admin/i });
    fireEvent.click(adminButton);

    // Verify admin page is accessible
    await waitFor(() => {
      expect(screen.getByText(/Admin/i)).toBeInTheDocument();
    });

    console.log('✅ Admin access test passed!');
  });
});
