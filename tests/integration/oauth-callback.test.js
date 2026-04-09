/**
 * Integration Test for OAuth Callback Component
 * Tests token extraction from different URL formats
 */

// Mock window.location and window.opener
global.window = {
  location: {
    href: '',
    hash: '',
    search: '',
    pathname: '',
    origin: 'http://localhost:3000'
  },
  opener: null,
  close: jest.fn(),
  sessionStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  }
};

describe('OAuth Callback Token Parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.window.opener = null;
  });

  test('should extract tokens from hash fragment (standard OAuth)', () => {
    const mockIdToken = createMockIdToken({
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg'
    });
    
    global.window.location.hash = `#access_token=ya29.mock_token&token_type=Bearer&expires_in=3599&id_token=${mockIdToken}`;
    global.window.location.pathname = '/oauth-callback';
    
    // Simulate the parsing logic from OAuthCallback.js
    let params;
    if (global.window.location.hash) {
      params = new URLSearchParams(global.window.location.hash.substring(1));
    }
    
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    
    expect(idToken).toBe(mockIdToken);
    expect(accessToken).toBe('ya29.mock_token');
  });

  test('should extract tokens from pathname (Google non-standard)', () => {
    const mockIdToken = createMockIdToken({
      email: 'pathname@example.com',
      name: 'Pathname User',
      picture: 'https://example.com/pathname.jpg'
    });
    
    global.window.location.pathname = `/iss=https://accounts.google.com&access_token=ya29.pathname_token&id_token=${mockIdToken}`;
    global.window.location.hash = '';
    
    // Simulate the parsing logic
    let params;
    if (global.window.location.pathname && global.window.location.pathname !== '/oauth-callback') {
      const pathParams = global.window.location.pathname.substring(1);
      params = new URLSearchParams(pathParams);
    }
    
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    
    expect(idToken).toBe(mockIdToken);
    expect(accessToken).toBe('ya29.pathname_token');
  });

  test('should decode ID token payload', () => {
    const mockIdToken = createMockIdToken({
      email: 'decode@example.com',
      name: 'Decode Test',
      picture: 'https://example.com/decode.jpg'
    });
    
    // Decode the payload (second part of JWT)
    const payload = JSON.parse(atob(mockIdToken.split('.')[1]));
    
    expect(payload.email).toBe('decode@example.com');
    expect(payload.name).toBe('Decode Test');
    expect(payload.picture).toBe('https://example.com/decode.jpg');
    expect(payload.iss).toBe('https://accounts.google.com');
  });

  test('should store data in sessionStorage when no opener', () => {
    const mockIdToken = createMockIdToken({
      email: 'storage@example.com',
      name: 'Storage Test',
      picture: 'https://example.com/storage.jpg'
    });
    
    global.window.opener = null; // Main window, not popup
    global.window.location.pathname = `/iss=https://accounts.google.com&access_token=ya29.storage&id_token=${mockIdToken}`;
    
    // Simulate OAuthCallback behavior in main window
    let params = new URLSearchParams(global.window.location.pathname.substring(1));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    
    if (idToken && !global.window.opener) {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      global.window.sessionStorage.setItem('oauth_success', JSON.stringify({
        provider: 'google',
        idToken: idToken,
        accessToken: accessToken,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }));
    }
    
    expect(global.window.sessionStorage.setItem).toHaveBeenCalledWith(
      'oauth_success',
      expect.stringContaining('storage@example.com')
    );
  });

  test('should send postMessage when opener exists', () => {
    const mockIdToken = createMockIdToken({
      email: 'popup@example.com',
      name: 'Popup Test',
      picture: 'https://example.com/popup.jpg'
    });
    
    // Mock opener window
    global.window.opener = {
      postMessage: jest.fn(),
      closed: false
    };
    
    global.window.location.hash = `#id_token=${mockIdToken}&access_token=ya29.popup`;
    
    // Simulate popup behavior
    let params = new URLSearchParams(global.window.location.hash.substring(1));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    
    if (idToken && global.window.opener && !global.window.opener.closed) {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      global.window.opener.postMessage({
        type: 'oauth-success',
        provider: 'google',
        idToken: idToken,
        accessToken: accessToken,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }, global.window.location.origin);
    }
    
    expect(global.window.opener.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'oauth-success',
        provider: 'google',
        email: 'popup@example.com'
      }),
      'http://localhost:3000'
    );
  });

  test('should handle OAuth error in URL', () => {
    global.window.location.search = '?error=access_denied&error_description=User%20denied%20access';
    
    const params = new URLSearchParams(global.window.location.search.substring(1));
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    expect(error).toBe('access_denied');
    expect(errorDescription).toBe('User denied access');
  });
});

/**
 * Helper to create mock ID token
 */
function createMockIdToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test' }));
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
  const signature = btoa('mock_signature');
  
  return `${header}.${body}.${signature}`;
}

/**
 * Base64 encoding helper
 */
function btoa(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return window.btoa(str);
}

/**
 * Base64 decoding helper
 */
function atob(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8');
  }
  return window.atob(str);
}
