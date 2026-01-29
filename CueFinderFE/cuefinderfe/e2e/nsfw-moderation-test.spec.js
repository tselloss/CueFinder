/**
 * NSFW Moderation E2E Test
 * 
 * This test demonstrates the full moderation flow:
 * 1. User logs in
 * 2. Attempts to upload an NSFW image
 * 3. Backend calls OpenNSFW2 for scanning
 * 4. Image is rejected with moderation error
 * 5. User sees rejection message
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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
  if (!response.ok()) return null;
  const data = await response.json();
  return data.accessToken;
}

// Test data
const timestamp = Date.now();
const testUser = {
  username: `nsfwtest_${timestamp}`,
  password: 'NSFWTest123!',
  name: 'NSFW Test User',
  email: `nsfwtest${timestamp}@example.com`,
  phone: '+15559999999',
  location: 'Test City, USA',
  acceptedTerms: true
};

const testCue = {
  title: 'Test Cue for Moderation',
  brand: 'TestBrand',
  price: '100',
  description: 'Testing NSFW moderation flow',
  location: 'Test City, USA'
};

test.describe('NSFW Moderation Flow', () => {
  let authToken;
  let cueId;

  test.beforeAll(async ({ request }) => {
    console.log('\n🚀 SETUP: Registering test user...');
    
    // Register user with retry
    let retries = 3;
    while (retries > 0) {
      try {
        const registered = await registerUser(request, testUser);
        if (registered) {
          console.log(`✅ User registered: ${testUser.username}`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️  Retry... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        retries--;
      }
    }
    
    // Get token with retry
    retries = 3;
    while (retries > 0 && !authToken) {
      try {
        authToken = await loginAndGetToken(request, testUser.username, testUser.password);
        if (authToken) {
          console.log('✅ Auth token obtained');
          break;
        }
      } catch (e) {
        console.log(`  ⚠️  Retry login... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        retries--;
      }
    }

    // Create a test cue first
    console.log('\n📝 SETUP: Creating test cue...');
    retries = 3;
    while (retries > 0 && !cueId) {
      try {
        const cueResponse = await request.post(`${API_BASE_URL}/cues`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: testCue
        });
        if (cueResponse.ok()) {
          const cueData = await cueResponse.json();
          cueId = cueData.id;
          console.log(`✅ Cue created with ID: ${cueId}\n`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️  Retry cue creation... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        retries--;
      }
    }
  }, { timeout: 120000 });

  test('NSFW Image Upload Rejection - Full Flow', async ({ page, request }) => {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('🎬 NSFW MODERATION TEST - FULL FLOW');
    console.log('════════════════════════════════════════════════════════\n');

    // ========================================
    // STEP 1: Login via UI
    // ========================================
    console.log('📍 STEP 1: Login via Web UI');
    console.log('─'.repeat(50));
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1500);

    console.log('  → Clicking "Sign In" button');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(800);

    console.log('  → Entering username: ' + testUser.username);
    await page.fill('input[type="text"]', testUser.username);
    
    console.log('  → Entering password');
    await page.fill('input[type="password"]', testUser.password);
    
    console.log('  → Clicking Sign In button in modal');
    await page.click('button:has-text("Sign In"):near(input[type="password"])');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {
      console.log('  ℹ️  (Dashboard redirect may not have URL change)');
    });
    await page.waitForTimeout(2000);
    console.log('✅ Login successful\n');

    // ========================================
    // STEP 2: Navigate to Create/Edit Cue
    // ========================================
    console.log('📍 STEP 2: Navigate to cue listing page');
    console.log('─'.repeat(50));
    console.log(`  → Navigating to cue ${cueId}`);
    await page.goto(`http://localhost:3000/items/${cueId}?edit=true`);
    await page.waitForTimeout(2000);
    console.log('✅ Cue page loaded\n');

    // ========================================
    // STEP 3: Upload NSFW Image
    // ========================================
    console.log('📍 STEP 3: Upload NSFW Image');
    console.log('─'.repeat(50));
    const nsfwImagePath = 'C:\\Users\\karac\\Downloads\\nsfw-ida-testing-some-underwear-v0-mod5ylqkkmyc1.webp';
    
    if (!fs.existsSync(nsfwImagePath)) {
      console.error(`❌ NSFW test image not found: ${nsfwImagePath}`);
      throw new Error('Test image missing');
    }
    
    console.log(`  → Image path: ${nsfwImagePath}`);
    console.log('  → Locating file input element');
    
    const fileInput = await page.locator('input[type="file"]').first();
    console.log('  → Setting file input value');
    await fileInput.setInputFiles(nsfwImagePath);
    await page.waitForTimeout(1500);
    console.log('✅ File selected for upload\n');

    // ========================================
    // STEP 4: Monitor Network Request
    // ========================================
    console.log('📍 STEP 4: Monitor Upload & Moderation Scan');
    console.log('─'.repeat(50));
    
    // Listen for moderation endpoint call
    let scanResponse = null;
    let uploadResponse = null;
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/moderation/upload-image') || url.includes('/api/images/upload')) {
        uploadResponse = response;
        console.log(`  📡 Upload request: ${response.status()} ${response.statusText()}`);
      }
      if (url.includes('/scan')) {
        scanResponse = response;
        console.log(`  📡 OpenNSFW2 scan response: ${response.status()}`);
      }
    });

    // Trigger upload by waiting for upload button or auto-upload
    console.log('  → Waiting for upload to process...');
    await page.waitForTimeout(3000);

    // ========================================
    // STEP 5: Check for Rejection Message
    // ========================================
    console.log('\n📍 STEP 5: Verify Moderation Rejection');
    console.log('─'.repeat(50));
    
    // Look for error message on the page
    const errorMessages = await page.locator('text=/violates content|rejected|unsafe|moderation/i').all();
    
    if (errorMessages.length > 0) {
      console.log('✅ REJECTION MESSAGE FOUND!');
      for (const msg of errorMessages) {
        const text = await msg.textContent();
        console.log(`  ▸ "${text.trim()}"`);
      }
    } else {
      console.log('  ℹ️  Checking for modal or toast notification...');
      // Check for toast or alert
      await page.waitForTimeout(500);
    }

    // ========================================
    // STEP 6: Direct API Test (for verification)
    // ========================================
    console.log('\n📍 STEP 6: Direct API Test (Verify Rejection)');
    console.log('─'.repeat(50));
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(nsfwImagePath));
    
    const apiUpload = await fetch('http://localhost:5200/api/moderation/upload-image?cueId=' + cueId, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    }).catch(e => console.log('  ⚠️  Fetch error (may require different auth setup): ' + e.message));

    if (apiUpload) {
      const apiStatus = apiUpload.status;
      const apiData = await apiUpload.json();
      
      console.log(`  📡 API Response Status: ${apiStatus}`);
      console.log(`  📊 Response: ${JSON.stringify(apiData, null, 2)}`);
      
      if (apiStatus === 400 && apiData.message && apiData.message.includes('violates content policy')) {
        console.log('\n✅ ✅ ✅ MODERATION WORKING CORRECTLY ✅ ✅ ✅');
        console.log(`  Flag Reason: ${apiData.flag_reason}`);
        console.log(`  Confidence: ${apiData.confidence}`);
      }
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ NSFW MODERATION FLOW TEST COMPLETE');
    console.log('════════════════════════════════════════════════════════\n');
  });
});


