/**
 * Simple E2E Test: Register → Login → Create Listing
 */

const { test, expect } = require('@playwright/test');

const API_BASE_URL = 'http://localhost:5200/api';

// Helper: Register user
async function registerUser(request, userData) {
  return await request.post(`${API_BASE_URL}/auth/register`, { data: userData });
}

// Helper: Login
async function loginUser(request, username, password) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, { data: { username, password } });
  if (!response.ok()) return null;
  const data = await response.json();
  return data.accessToken;
}

test('Complete Flow: Register → Login → Create Listing', async ({ request }) => {
  console.log('\n========== E2E TEST: REGISTER → LOGIN → CREATE LISTING ==========\n');
  
  // Generate unique user
  const timestamp = Date.now();
  const testUsername = `user_${timestamp}`;
  const testPassword = 'TestPass123!';
  const testEmail = `user_${timestamp}@test.com`;
  const testName = 'Test User';

  // ============= STEP 1: REGISTER =============
  console.log('📝 STEP 1: Registering user...');
  const registerData = {
    username: testUsername,
    email: testEmail,
    password: testPassword,
    name: testName,
    acceptedTerms: true
  };

  let registerResponse = await registerUser(request, registerData);
  expect(registerResponse.ok()).toBeTruthy();
  
  let registerJson = await registerResponse.json();
  const authToken = registerJson.accessToken;
  const userId = registerJson.userId;
  
  expect(authToken).toBeTruthy();
  expect(userId).toBeTruthy();
  console.log(`✅ Registration successful (User ID: ${userId})\n`);

  // ============= STEP 2: LOGIN =============
  console.log('🔐 STEP 2: Logging in...');
  const token = await loginUser(request, testUsername, testPassword);
  
  expect(token).toBeTruthy();
  expect(token).toBe(authToken);
  console.log(`✅ Login successful\n`);

  // ============= STEP 3: CREATE LISTING =============
  console.log('📋 STEP 3: Creating cue listing...');
  const cueData = {
    title: 'Premium Billiard Cue',
    brand: 'McDermott',
    price: 250.00,
    description: 'Beautiful handcrafted billiard cue',
    location: 'New York, NY',
    weight: 19,
    length: 58,
    cueType: 'Standard'
  };

  const cueResponse = await request.post(`${API_BASE_URL}/cues`, {
    headers: { Authorization: `Bearer ${authToken}` },
    data: cueData
  });

  expect(cueResponse.ok()).toBeTruthy();
  const cueJson = await cueResponse.json();
  const cueId = cueJson.id;
  
  expect(cueId).toBeTruthy();
  console.log(`✅ Listing created successfully (Cue ID: ${cueId})\n`);

  // ============= SUMMARY =============
  console.log('========== TEST SUMMARY ==========');
  console.log('✅ All tests completed!\n');
  console.log('Results:');
  console.log(`  1. ✅ User Registration: PASSED`);
  console.log(`  2. ✅ User Login: PASSED`);
  console.log(`  3. ✅ Create Listing: PASSED (ID: ${cueId})`);
  console.log('\n===================================\n');
});


