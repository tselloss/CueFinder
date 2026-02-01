/**
 * Playwright Global Setup
 * 
 * This file runs before all tests and sets up the test environment.
 * It registers test users in the database so they can be used in tests.
 */

const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Test users to be created
const TEST_USERS = [
  {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
    phone: '+12025551234',
    acceptedTerms: true
  },
  {
    username: 'testadmin',
    email: 'testadmin@example.com',
    password: 'TestAdmin123!',
    name: 'Test Admin',
    phone: '+12025555678',
    acceptedTerms: true
  }
];

/**
 * Register a user via HTTP POST request
 */
function registerUser(userData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(userData);
    
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ User registered: ${userData.username}`);
          resolve(true);
        } else if (res.statusCode === 409) {
          console.log(`ℹ️  User already exists: ${userData.username}`);
          resolve(true);
        } else {
          console.error(`❌ Failed to register ${userData.username}: ${res.statusCode}`, data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error registering ${userData.username}:`, error.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Global setup: Register all test users
 */
async function globalSetup() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 PLAYWRIGHT GLOBAL SETUP - Registering Test Users');
  console.log('='.repeat(60) + '\n');

  // Register all test users
  let registered = 0;
  for (const user of TEST_USERS) {
    const success = await registerUser(user);
    if (success) {
      registered++;
    }
    // Wait a bit between registrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✨ Setup complete: ${registered}/${TEST_USERS.length} users ready\n`);
  console.log('='.repeat(60) + '\n');
}

module.exports = globalSetup;

