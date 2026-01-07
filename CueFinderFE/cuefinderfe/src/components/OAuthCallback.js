import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';

/**
 * OAuth Callback Handler
 * This page receives the redirect from Google OAuth
 * Extracts the tokens from URL and sends them to the parent window
 */
export default function OAuthCallback() {
  useEffect(() => {
    try {
      // Parse the URL fragment (everything after #)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');
      
      if (idToken) {
        // Decode the ID token to get user info (JWT format)
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        
        // Send data back to the parent window (LoginPage)
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-success',
            provider: 'google',
            idToken: idToken,
            accessToken: accessToken,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
          }, window.location.origin);
          
          // Close this popup window
          window.close();
        } else {
          console.error('No opener window found');
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
