import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';

/**
 * OAuth Callback Handler
 * This page receives the redirect from Google OAuth
 * Extracts the tokens from URL and sends them to the parent window
 */
export default function OAuthCallback() {
  useEffect(() => {
    console.log('=== OAUTH CALLBACK MOUNTED ===');
    console.log('Full URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Search:', window.location.search);
    console.log('Pathname:', window.location.pathname);
    console.log('Has window.opener:', !!window.opener);
    console.log('Opener closed:', window.opener?.closed);
    
    try {
      
      // Try both hash fragment and pathname (Google sometimes returns in pathname)
      let params;
      if (window.location.hash) {
        // Standard hash fragment format: #access_token=...
        params = new URLSearchParams(window.location.hash.substring(1));
      } else if (window.location.pathname && window.location.pathname !== '/oauth-callback') {
        // Google returned tokens in pathname: /iss=...&access_token=...
        const pathParams = window.location.pathname.substring(1); // Remove leading /
        params = new URLSearchParams(pathParams);
      } else {
        // Try search params as fallback
        params = new URLSearchParams(window.location.search.substring(1));
      }
      
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');
      
      console.log('=== TOKEN PARSING ===');
      console.log('ID Token found:', !!idToken);
      console.log('Access Token found:', !!accessToken);
      console.log('ID Token length:', idToken?.length);
      
      if (idToken) {
        console.log('=== DECODING ID TOKEN ===');
        // Decode the ID token to get user info (JWT format)
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        console.log('Decoded payload:', payload);
        console.log('Email:', payload.email);
        console.log('Name:', payload.name);
        
        // Check if we're in a popup or main window
        if (window.opener && !window.opener.closed) {
          console.log('=== POPUP MODE - Sending postMessage ===');
          // We're in a popup - send data back to parent
          const messageData = {
            type: 'oauth-success',
            provider: 'google',
            idToken: idToken,
            accessToken: accessToken,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
          };
          console.log('Message data:', messageData);
          window.opener.postMessage(messageData, window.location.origin);
          console.log('PostMessage sent, closing popup...');
          
          // Close this popup window
          setTimeout(() => window.close(), 500);
        } else {
          console.log('=== MAIN WINDOW MODE - Using sessionStorage ===');
          // We're in the main window - redirect happened here instead of popup
          const storageData = {
            provider: 'google',
            idToken: idToken,
            accessToken: accessToken,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
          };
          console.log('Storing in sessionStorage:', storageData);
          sessionStorage.setItem('oauth_success', JSON.stringify(storageData));
          console.log('Redirecting to /login...');
          // Redirect to login page which will process the stored data
          window.location.href = '/login';
        }
      } else {
        // Check for error in URL
        const error = params.get('error');
        if (error) {
          console.error('OAuth error:', error);
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-error',
              provider: 'google',
              error: error,
              errorDescription: params.get('error_description')
            }, window.location.origin);
            window.close();
          }
        }
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth-error',
          provider: 'google',
          error: 'processing_error',
          errorDescription: error.message
        }, window.location.origin);
        window.close();
      }
    }
  }, []);

  return (
    <Container className="text-center mt-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Processing...</span>
      </div>
      <p className="mt-3">Completing sign-in...</p>
    </Container>
  );
}
