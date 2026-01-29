/**
 * Cue Case API E2E Tests
 * 
 * Tests the cue case backend API endpoints and data persistence
 * This simplified version focuses on API validation without complex UI navigation
 */

const { test, expect } = require('@playwright/test');

const API_BASE_URL = 'http://localhost:5200/api';

// Helper functions
async function registerUser(request, userData) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: userData
  });
  return response.ok();
}

async function loginAndGetToken(request, username, password) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username, password }
  });
  if (!response.ok()) {
    console.error('Login failed:', await response.text());
    return null;
  }
  const data = await response.json();
  return data.accessToken;
}

async function createCueCase(request, authToken, caseData) {
  const response = await request.post(`${API_BASE_URL}/cuecases`, {
    headers: { Authorization: `Bearer ${authToken}` },
    data: caseData
  });
  if (!response.ok()) {
    console.error('Create case failed:', await response.text());
    return null;
  }
  return await response.json();
}

async function getMyCueCases(request, authToken) {
  const response = await request.get(`${API_BASE_URL}/cuecases/my-cases`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (!response.ok()) return [];
  return await response.json();
}

async function getCueCaseById(request, caseId) {
  const response = await request.get(`${API_BASE_URL}/cuecases/${caseId}`);
  if (!response.ok()) return null;
  return await response.json();
}

async function updateCueCase(request, authToken, caseId, updateData) {
  const response = await request.put(`${API_BASE_URL}/cuecases/${caseId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    data: updateData
  });
  if (!response.ok()) {
    console.error('Update case failed:', await response.text());
    return null;
  }
  return await response.json();
}

async function deleteCueCase(request, authToken, caseId) {
  const response = await request.delete(`${API_BASE_URL}/cuecases/${caseId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  return response.ok();
}

async function searchCueCases(request, query) {
  const response = await request.get(`${API_BASE_URL}/cuecases/search?q=${encodeURIComponent(query)}`);
  if (!response.ok()) return [];
  return await response.json();
}

// Test data
const timestamp = Date.now();
const testUser = {
  username: `caseuser_${timestamp}`,
  password: 'CasePass123!',
  name: 'Case Test User',
  email: `casetest${timestamp}@example.com`,
  phone: '+15559876543',
  location: 'Test City, USA',
  acceptedTerms: true
};

const testCase = {
  title: 'Premium 2x4 Hard Case',
  brand: 'Predator',
  price: 299.99,
  condition: 'Excellent',
  description: 'High-quality hard case with plush interior, perfect for protecting your investment.',
  caseCapacity: '2x4',
  caseOpening: 'Butterfly',
  caseType: 'Hard',
  color: 'Black',
  caseMaterial: 'ABS Plastic with aluminum frame',
  outerDimensions: '35" x 6" x 4"',
  pocketSpace: 'Large',
  handleExtensionSpace: 'Integrated telescopic handle',
  caseWeight: '8.5 lbs',
  location: 'New York, NY'
};

test.describe('Cue Case API Tests', () => {
  let authToken;
  let createdCaseId;

  test.beforeAll(async ({ request }) => {
    console.log('\n🚀 Setting up test user...');
    
    // Register user
    const registered = await registerUser(request, testUser);
    expect(registered).toBeTruthy();
    console.log(`✅ User registered: ${testUser.username}`);
    
    // Login
    authToken = await loginAndGetToken(request, testUser.username, testUser.password);
    expect(authToken).toBeTruthy();
    console.log('✅ Auth token obtained\n');
  });

  test('1. Create a new cue case listing', async ({ request }) => {
    console.log('📝 Test 1: Creating new cue case...');
    
    const createdCase = await createCueCase(request, authToken, testCase);
    
    expect(createdCase).toBeTruthy();
    expect(createdCase.id).toBeTruthy();
    expect(createdCase.title).toBe(testCase.title);
    expect(createdCase.brand).toBe(testCase.brand);
    expect(createdCase.price).toBe(testCase.price);
    expect(createdCase.caseCapacity).toBe(testCase.caseCapacity);
    expect(createdCase.caseOpening).toBe(testCase.caseOpening);
    expect(createdCase.caseType).toBe(testCase.caseType);
    
    createdCaseId = createdCase.id;
    console.log(`✅ Case created successfully with ID: ${createdCaseId}\n`);
  });

  test('2. Retrieve case by ID', async ({ request }) => {
    console.log('🔍 Test 2: Retrieving case by ID...');
    
    const fetchedCase = await getCueCaseById(request, createdCaseId);
    
    expect(fetchedCase).toBeTruthy();
    expect(fetchedCase.id).toBe(createdCaseId);
    expect(fetchedCase.title).toBe(testCase.title);
    expect(fetchedCase.brand).toBe(testCase.brand);
    expect(fetchedCase.caseCapacity).toBe(testCase.caseCapacity);
    
    console.log('✅ Case retrieved successfully\n');
  });

  test('3. Get my cue cases', async ({ request }) => {
    console.log('📦 Test 3: Fetching my cases...');
    
    const myCases = await getMyCueCases(request, authToken);
    
    expect(myCases).toBeTruthy();
    expect(Array.isArray(myCases)).toBeTruthy();
    expect(myCases.length).toBeGreaterThan(0);
    
    const foundCase = myCases.find(c => c.id === createdCaseId);
    expect(foundCase).toBeTruthy();
    expect(foundCase.title).toBe(testCase.title);
    
    console.log(`✅ Found ${myCases.length} case(s) for user\n`);
  });

  test('4. Update the cue case', async ({ request }) => {
    console.log('✏️  Test 4: Updating case...');
    
    const updateData = {
      ...testCase,
      title: 'Updated Premium 2x4 Hard Case',
      price: 349.99,
      color: 'Blue'
    };
    
    const updatedCase = await updateCueCase(request, authToken, createdCaseId, updateData);
    
    expect(updatedCase).toBeTruthy();
    expect(updatedCase.id).toBe(createdCaseId);
    expect(updatedCase.title).toBe(updateData.title);
    expect(updatedCase.price).toBe(updateData.price);
    expect(updatedCase.color).toBe(updateData.color);
    
    console.log('✅ Case updated successfully\n');
  });

  test('5. Search for cue cases', async ({ request }) => {
    console.log('🔎 Test 5: Searching for cases...');
    
    const searchResults = await searchCueCases(request, 'Premium');
    
    expect(searchResults).toBeTruthy();
    expect(Array.isArray(searchResults)).toBeTruthy();
    expect(searchResults.length).toBeGreaterThan(0);
    
    const foundCase = searchResults.find(c => c.id === createdCaseId);
    expect(foundCase).toBeTruthy();
    
    console.log(`✅ Search returned ${searchResults.length} result(s)\n`);
  });

  test('6. Test all case capacity options', async ({ request }) => {
    console.log('📦 Test 6: Testing case capacity options...');
    
    const capacities = ['1x1', '1x2', '2x4', '3x5', '4x8'];
    const createdCapacityCases = [];
    
    for (const capacity of capacities) {
      const caseData = {
        ...testCase,
        title: `${capacity} Test Case`,
        caseCapacity: capacity
      };
      
      const created = await createCueCase(request, authToken, caseData);
      expect(created).toBeTruthy();
      expect(created.caseCapacity).toBe(capacity);
      createdCapacityCases.push(created.id);
      console.log(`  ✓ Created case with capacity: ${capacity}`);
    }
    
    // Cleanup
    for (const id of createdCapacityCases) {
      await deleteCueCase(request, authToken, id);
    }
    
    console.log('✅ All capacity options validated\n');
  });

  test('7. Test all case opening types', async ({ request }) => {
    console.log('🔓 Test 7: Testing case opening types...');
    
    const openingTypes = ['Butterfly', 'Top Open', 'Side Open', 'Zipper'];
    const createdOpeningCases = [];
    
    for (const opening of openingTypes) {
      const caseData = {
        ...testCase,
        title: `${opening} Test Case`,
        caseOpening: opening
      };
      
      const created = await createCueCase(request, authToken, caseData);
      expect(created).toBeTruthy();
      expect(created.caseOpening).toBe(opening);
      createdOpeningCases.push(created.id);
      console.log(`  ✓ Created case with opening: ${opening}`);
    }
    
    // Cleanup
    for (const id of createdOpeningCases) {
      await deleteCueCase(request, authToken, id);
    }
    
    console.log('✅ All opening types validated\n');
  });

  test('8. Test all case types', async ({ request }) => {
    console.log('🏗️  Test 8: Testing case types...');
    
    const caseTypes = ['Soft', 'Hard', 'Semi-Hard'];
    const createdTypeCases = [];
    
    for (const type of caseTypes) {
      const caseData = {
        ...testCase,
        title: `${type} Test Case`,
        caseType: type
      };
      
      const created = await createCueCase(request, authToken, caseData);
      expect(created).toBeTruthy();
      expect(created.caseType).toBe(type);
      createdTypeCases.push(created.id);
      console.log(`  ✓ Created case with type: ${type}`);
    }
    
    // Cleanup
    for (const id of createdTypeCases) {
      await deleteCueCase(request, authToken, id);
    }
    
    console.log('✅ All case types validated\n');
  });

  test('9. Delete the cue case', async ({ request }) => {
    console.log('🗑️  Test 9: Deleting case...');
    
    const deleted = await deleteCueCase(request, authToken, createdCaseId);
    expect(deleted).toBeTruthy();
    
    // Verify it's gone
    const fetchedCase = await getCueCaseById(request, createdCaseId);
    expect(fetchedCase).toBeFalsy();
    
    console.log('✅ Case deleted successfully\n');
  });

  test.afterAll(async () => {
    console.log('🧹 Cleanup completed\n');
  });
});


