# Google OAuth Testing Instructions

## ✅ Changes Deployed

### Backend (DatabaseAuthService.cs)
- ✅ Auto-accepts Terms and Conditions for OAuth users
- ✅ Sets `AcceptedTerms = true` and `AcceptedTermsAt = DateTime.UtcNow` for new Google sign-ins

### Frontend (LoginPage.jsx)
- ✅ Added popup blocker detection
- ✅ Added `response_mode=fragment` to force hash-based tokens
- ✅ Added `prompt=select_account` to improve UX
- ✅ Added console logging for debugging
- ✅ Added terms disclaimer: "By signing in with Google, you agree to our Terms and Conditions"

### Translations (en.json & gr.json)
- ✅ `auth.googleTermsDisclaimer`: "By signing in with Google, you agree to our Terms and Conditions"
- ✅ `auth.popupBlocked`: "Popup blocked. Please allow popups for this site."

## 🧪 Testing Steps

1. **Navigate to Login Page**
   ```
   http://localhost:3000/login
   ```

2. **Verify Disclaimer is Visible**
   - Look for the text below the Google button:
   - English: "By signing in with Google, you agree to our Terms and Conditions"
   - Greek: "Συνδεόμενοι με το Google, αποδέχεστε τους Όρους και τις Προϋποθέσεις μας"

3. **Open Browser Console** (F12)
   - Go to Console tab to see OAuth debug logs

4. **Click "Continue with Google"**
   - A popup window (500x600) should open
   - Console log: `Opening Google OAuth popup...`
   - Console log: `Redirect URI: http://localhost:3000/oauth-callback`
   - Console log: `Client ID: 390019490259-o1bkohlkn9endfcomlk7t5ao0car57uh...`

5. **Sign in with Google**
   - Select your Google account
   - Grant permissions

6. **Verify Callback Processing**
   - Check console for:
   ```
   OAuth Callback - Full URL: http://localhost:3000/oauth-callback#access_token=...
   OAuth Callback - Hash: #access_token=...
   ID Token found: true
   Access Token found: true
   ```

7. **Verify Successful Login**
   - Popup should close automatically
   - You should be redirected to home page (/)
   - User info should appear in navbar
   - Check localStorage for JWT token

8. **Verify Terms Acceptance** (Backend Check)
   ```bash
   docker exec -it cuefinder-postgres psql -U cue_finder_user cuefinder -c "SELECT username, email, accepted_terms, accepted_terms_at, external_provider FROM users WHERE email = 'your-google-email@gmail.com';"
   ```
   - `accepted_terms` should be `true`
   - `accepted_terms_at` should have a timestamp
   - `external_provider` should be `Google`

## 🐛 Troubleshooting

### Popup is Blocked
- **Error**: "Popup blocked. Please allow popups for this site."
- **Fix**: Click the popup blocker icon in browser address bar and allow popups for localhost:3000

### Redirect URI Mismatch
- **Error**: In Google OAuth screen - "redirect_uri_mismatch"
- **Fix**: Verify Google Cloud Console has `http://localhost:3000/oauth-callback` in Authorized redirect URIs

### Tokens in Pathname (Not Hash)
- **Symptom**: URL like `/iss=https://accounts.google.com&access_token=...`
- **Status**: ✅ Fixed - OAuthCallback now handles pathname format
- **Route**: `/iss=/*` catches these redirects

### No Routes Matched
- **Error**: "No routes matched location"
- **Status**: ✅ Fixed - Added wildcard route `/iss=/*` in App.js

### Invalid Client
- **Error**: 401 Unauthorized - "invalid_client"
- **Check**: 
  - Frontend: `echo $env:REACT_APP_GOOGLE_CLIENT_ID`
  - Backend: `docker exec cuefinder-backend sh -c "printenv | grep GoogleOAuth"`
- **Verify**: Client ID matches Google Cloud Console

### Backend API Not Called
- **Check Logs**:
  ```bash
  docker logs cuefinder-backend --tail 50 | grep -i "external.*login"
  ```
- **Expected Log**: `External login attempt for provider: Google, email: your@email.com`

## 📊 Test Scenarios

### Scenario 1: First-Time Google User
1. Sign in with Google (never registered before)
2. ✅ New user created automatically
3. ✅ Username = `email_prefix_12345678`
4. ✅ `accepted_terms` = true
5. ✅ `is_verified` = true
6. ✅ Redirected to home page

### Scenario 2: Existing Email (Registered via Email)
1. User registered with email/password previously
2. Sign in with Google using same email
3. ✅ Links Google account to existing user
4. ✅ `external_provider` = "Google"
5. ✅ User logged in successfully

### Scenario 3: Popup Blocked
1. Browser blocks popup
2. ✅ Error message shown: "Popup blocked. Please allow popups for this site."
3. ✅ Google loading indicator stops

### Scenario 4: User Denies Access
1. Click Google button
2. Deny permissions in Google screen
3. ✅ Error handled gracefully
4. ✅ User returned to login page

## 🔍 Verification Queries

### Check New Google Users
```sql
SELECT 
  id, username, email, name, 
  accepted_terms, accepted_terms_at, 
  is_verified, external_provider,
  created_at
FROM users 
WHERE external_provider = 'Google'
ORDER BY created_at DESC
LIMIT 5;
```

### Check OAuth Login Logs
```bash
# Backend logs for today
docker logs cuefinder-backend --since "2026-04-07T00:00:00" 2>&1 | grep -i "oauth\|external.*login"

# Frontend access logs
docker logs cuefinder-frontend --tail 100 | grep oauth
```

## ✅ Success Criteria

- [ ] Google button visible with disclaimer below it
- [ ] Popup opens (or shows blocked message)
- [ ] Google sign-in screen appears
- [ ] After sign-in, popup closes automatically
- [ ] User redirected to home page
- [ ] User info displayed in navbar
- [ ] Database shows `accepted_terms = true`
- [ ] Database shows `external_provider = 'Google'`
- [ ] No console errors
- [ ] JWT token in localStorage

## 📝 Next Steps After Local Success

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add Google OAuth with automatic terms acceptance and improved error handling"
   git push origin release
   ```

2. **Production Deployment**
   - Trigger GitHub Actions workflow
   - Wait for deployment to complete
   - Test on https://billiardscuefinder.com/login

3. **Production Verification**
   - Same testing steps as local
   - Verify redirect URI: `https://billiardscuefinder.com/oauth-callback`
   - Check production database for accepted_terms
