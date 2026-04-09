/**
 * E2E Test for Google OAuth Login Flow
 * Tests both popup-based and fallback main-window redirect scenarios
 */

const { test, expect } = require('@playwright/test');

test.describe('Google OAuth Login', () => {
  const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`${LOCAL_URL}/login`);
  });

  test('should display Google login button', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
  });

  test('should handle OAuth callback with tokens in pathname', async ({ page, context }) => {
    // Simulate Google redirecting with tokens in pathname (non-standard behavior)
    const mockIdToken = createMockIdToken({
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg'
    });
    
    const mockAccessToken = 'ya29.mock_access_token';
    
    // Navigate directly to callback URL with pathname format (as Google does it)
    const callbackUrl = `${LOCAL_URL}/iss=https://accounts.google.com` +
      `&access_token=${mockAccessToken}` +
      `&token_type=Bearer` +
      `&expires_in=3599` +
      `&scope=email%20profile%20openid` +
      `&id_token=${mockIdToken}`;
    
    // Mock the backend API call
    await page.route('**/api/auth/external-login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_jwt_token',
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'test_user',
            role: 'User'
          }
        })
      });
    });
    
    await page.goto(callbackUrl);
    
    // Should redirect to login page, which processes sessionStorage
    await expect(page).toHaveURL(`${LOCAL_URL}/login`);
    
    // Wait for processing
    await page.waitForTimeout(1000);
    
    // Should then redirect to home page after successful login
    await expect(page).toHaveURL(LOCAL_URL + '/');
  });

  test('should handle OAuth callback with tokens in hash', async ({ page }) => {
    // Test standard hash fragment format
    const mockIdToken = createMockIdToken({
      email: 'hash.test@example.com',
      name: 'Hash Test User',
      picture: 'https://example.com/hash.jpg'
    });
    
    const mockAccessToken = 'ya29.hash_access_token';
    
    // Navigate to callback with hash format (standard OAuth 2.0 implicit flow)
    const callbackUrl = `${LOCAL_URL}/oauth-callback` +
      `#access_token=${mockAccessToken}` +
      `&token_type=Bearer` +
      `&expires_in=3599` +
      `&id_token=${mockIdToken}` +
      `&scope=email%20profile%20openid`;
    
    // Mock the backend API
    await page.route('**/api/auth/external-login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_jwt_hash_token',
          user: {
            id: 2,
            email: 'hash.test@example.com',
            username: 'hash_test',
            role: 'User'
          }
        })
      });
    });
    
    // Open in new window to simulate popup
    const popup = await page.context().newPage();
    await popup.goto(callbackUrl);
    
    // Popup should close automatically (we can't test window.close in Playwright easily)
    // But we can verify the callback logic runs
    await popup.waitForTimeout(500);
    
    // Check console for OAuth processing logs
    const logs = [];
    popup.on('console', msg => logs.push(msg.text()));
    
    expect(logs.some(log => log.includes('OAuth Callback'))).toBeTruthy();
  });

  test('should handle OAuth errors', async ({ page }) => {
    // Simulate Google returning an error
    const callbackUrl = `${LOCAL_URL}/oauth-callback?error=access_denied&error_description=User%20denied%20access`;
    
    // Open in popup context
    const popup = await page.context().newPage();
    await popup.goto(callbackUrl);
    
    // Wait for error processing
    await popup.waitForTimeout(500);
    
    // Verify error is logged
    const logs = [];
    popup.on('console', msg => logs.push(msg.text()));
    
    expect(logs.some(log => log.includes('OAuth error'))).toBeTruthy();
  });

  test('should handle missing tokens', async ({ page }) => {
    // Navigate to callback without any tokens
    await page.goto(`${LOCAL_URL}/oauth-callback`);
    
    // Should not crash, just show the callback page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate OAuth callback route patterns', async ({ page }) => {
    // Test that /iss=/* route is configured
    const pathWithIss = `${LOCAL_URL}/iss=https://accounts.google.com&test=value`;
    await page.goto(pathWithIss);
    
    // Should render OAuthCallback component (not 404)
    // We can't see the component name but we can check it doesn't show route error
    const body = await page.textContent('body');
    expect(body).not.toContain('Page Not Found');
  });
});

/**
 * Creates a mock JWT ID token for testing
 * In real tests, you'd use a proper JWT library
 */
function createMockIdToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: '390019490259-o1bkohlkn9endfcomlk7t5ao0car57uh.apps.googleusercontent.com',
    sub: '1234567890',
    email: payload.email,
    email_verified: true,
    name: payload.name,
    picture: payload.picture,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }));
  const signature = 'mock_signature';
  
  return `${header}.${body}.${signature}`;
}

/**
 * Helper to convert string to base64 (Node.js compatible)
 */
function btoa(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
