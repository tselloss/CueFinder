# Terms and Conditions Implementation - Quick Start Guide

## What Was Implemented

A complete terms and conditions acceptance feature for user registration, requiring users to accept terms before they can create an account. The implementation is bilingual (English and Greek) and GDPR compliant.

## Key Features

✅ **Mandatory Acceptance**: Users cannot register without accepting terms  
✅ **Bilingual Support**: Full terms in both English and Greek  
✅ **Easy Access**: Clickable link to view full terms in new tab  
✅ **Language Auto-Switch**: Shows terms in user's selected language  
✅ **Audit Trail**: Tracks when users accepted terms  
✅ **GDPR Compliant**: Includes data protection and privacy information  
✅ **Backend Validation**: Server-side enforcement of terms acceptance  

## Files Changed

### Backend (C#/.NET)
1. `Models/User.cs` - Added `AcceptedTerms` and `AcceptedTermsAt` fields
2. `SolutionLibraries/CueFinder.Auth/Models/RegisterRequest.cs` - Added `AcceptedTerms` property
3. `SolutionLibraries/CueFinder.Auth/Services/AuthService.cs` - Added validation

### Frontend (React)
1. `CueFinderFE/cuefinderfe/src/components/LoginPage.js` - Added checkbox and validation
2. `CueFinderFE/cuefinderfe/src/api/authService.js` - Updated to send acceptedTerms
3. `CueFinderFE/cuefinderfe/src/auth/AuthContext.js` - Updated register function
4. `CueFinderFE/cuefinderfe/src/locales/en.json` - Added English translations
5. `CueFinderFE/cuefinderfe/src/locales/gr.json` - Added Greek translations

### Terms Documents
1. `CueFinderFE/cuefinderfe/public/terms-en.html` - English terms (NEW)
2. `CueFinderFE/cuefinderfe/public/terms-gr.html` - Greek terms (NEW)

### Database
1. `scripts/add-terms-acceptance-columns.sql` - Migration script (NEW)
2. `scripts/apply-terms-migration.ps1` - Helper script to run migration (NEW)

### Documentation
1. `docs/TERMS_AND_CONDITIONS_IMPLEMENTATION.md` - Full implementation details (NEW)

## How to Deploy

### Step 1: Apply Database Migration

Option A - Using PowerShell script:
```powershell
cd scripts
.\apply-terms-migration.ps1
```

Option B - Manual SQL execution:
```powershell
sqlcmd -S localhost,5432 -d CueFinderDB -U sa -P YourPassword -i scripts\add-terms-acceptance-columns.sql
```

### Step 2: Rebuild and Restart Backend
```powershell
cd CueFinderBE
dotnet build
docker-compose up -d --build backend
```

### Step 3: Rebuild and Restart Frontend
```powershell
cd CueFinderFE/cuefinderfe
npm run build
docker-compose up -d --build frontend
```

## How It Works

### User Registration Flow

1. **User opens registration page** (`/register`)
2. **User fills in form fields**:
   - Username
   - Password
   - Name
   - Email
   - Phone
   - Address (optional)
3. **User sees checkbox**: "I accept the Terms and Conditions"
4. **User clicks on "Terms and Conditions"** link:
   - Opens in new tab
   - Shows English version if language is English
   - Shows Greek version if language is Greek
5. **User checks the checkbox**
6. **User clicks "Create Account"**
7. **Frontend validates**:
   - If checkbox not checked → shows error message
   - If checked → sends request to backend with `acceptedTerms: true`
8. **Backend validates**:
   - If `acceptedTerms` is false → returns error
   - If true → creates user and records acceptance timestamp
9. **User proceeds with phone verification**

### Validation Logic

**Frontend (LoginPage.js)**:
```javascript
if (!acceptedTerms) {
  throw new Error(t('registration.terms.required'));
}
```

**Backend (AuthService.cs)**:
```csharp
if (!request.AcceptedTerms) {
    throw new ArgumentException("You must accept the terms and conditions to register");
}
```

## Testing the Feature

### Test Case 1: Registration Without Accepting Terms
1. Go to `/register`
2. Fill in all fields
3. Do NOT check the terms checkbox
4. Click "Create Account"
5. **Expected**: Error message "You must accept the terms and conditions to register"

### Test Case 2: Registration With Terms Accepted
1. Go to `/register`
2. Fill in all fields
3. Check the terms checkbox
4. Click "Create Account"
5. **Expected**: Proceeds to phone verification step

### Test Case 3: View Terms in English
1. Set language to English (if not default)
2. Go to `/register`
3. Click on "Terms and Conditions" link
4. **Expected**: Opens `/terms-en.html` in new tab

### Test Case 4: View Terms in Greek
1. Set language to Greek
2. Go to `/register`
3. Click on "Όρους και Προϋποθέσεις" link
4. **Expected**: Opens `/terms-gr.html` in new tab

### Test Case 5: Database Storage
1. Register a new user with terms accepted
2. Query database: `SELECT AcceptedTerms, AcceptedTermsAt FROM Users WHERE Username = 'newuser'`
3. **Expected**: `AcceptedTerms = 1` and `AcceptedTermsAt` has a timestamp

## Translations

### English
- "I accept the Terms and Conditions"
- "You must accept the terms and conditions to register"

### Greek
- "Αποδέχομαι τους Όρους και Προϋποθέσεις"
- "Πρέπει να αποδεχτείτε τους όρους και προϋποθέσεις για να εγγραφείτε"

## Terms Document Contents

Both English and Greek versions include:
1. Acceptance of Terms
2. Use of Service
3. User Accounts
4. Listings and Transactions
5. Prohibited Activities
6. Privacy and Data Protection (GDPR)
7. Intellectual Property
8. Limitation of Liability
9. Termination
10. Changes to Terms
11. Governing Law
12. Contact Information

## Troubleshooting

### Issue: Checkbox doesn't appear
- Clear browser cache
- Verify frontend rebuilt: `docker-compose up -d --build frontend`

### Issue: Terms link doesn't work
- Verify files exist: `CueFinderFE/cuefinderfe/public/terms-en.html` and `terms-gr.html`
- Check nginx is serving static files correctly

### Issue: Backend rejects registration even with checkbox checked
- Check network request includes `"acceptedTerms": true`
- Verify backend code rebuilt
- Check AuthService.cs has the validation code

### Issue: Database error
- Verify migration ran successfully
- Check columns exist: `sp_columns 'Users'`
- Look for `AcceptedTerms` and `AcceptedTermsAt` columns

## Related to Other Web Sales Pages

This implementation follows industry best practices seen on major e-commerce and marketplace platforms:
- **eBay**: Requires terms acceptance during registration
- **Etsy**: Checkbox for terms and privacy policy
- **Amazon**: Must accept terms to create seller account
- **Facebook Marketplace**: Terms acceptance required
- **Airbnb**: Explicit consent required with clickable links

## Legal Compliance

✅ **GDPR Article 7**: Explicit consent with clear affirmative action  
✅ **GDPR Article 12**: Easy access to terms  
✅ **GDPR Article 13**: Information about data processing  
✅ **GDPR Article 21**: Right to object  
✅ **ePrivacy Directive**: Consent mechanism  

## Admin Considerations

As mentioned in the requirements, admins have special considerations:
- Admins can view all user acceptance records
- Terms document includes information about both admin and user roles
- Future enhancement: Admin panel to track acceptance statistics

## Support

For questions or issues:
- Check documentation: `docs/TERMS_AND_CONDITIONS_IMPLEMENTATION.md`
- Contact: support@cuefinder.com
