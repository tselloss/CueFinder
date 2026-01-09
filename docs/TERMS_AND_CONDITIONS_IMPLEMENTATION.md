# Terms and Conditions Acceptance Implementation

## Overview
This document describes the implementation of mandatory terms and conditions acceptance during user registration in the CueFinder application.

## Implementation Date
January 9, 2026

## Components Modified

### 1. Backend Changes

#### Models/User.cs
Added two new properties to track terms acceptance:
- `AcceptedTerms` (bool): Whether the user has accepted the terms and conditions
- `AcceptedTermsAt` (DateTime?): Timestamp when terms were accepted

#### SolutionLibraries/CueFinder.Auth/Models/RegisterRequest.cs
Added property:
- `AcceptedTerms` (bool): Required field during registration

#### SolutionLibraries/CueFinder.Auth/Services/AuthService.cs
Added validation in `RegisterAsync` method:
- Validates that `AcceptedTerms` is true before allowing registration
- Throws `ArgumentException` with message "You must accept the terms and conditions to register" if not accepted

### 2. Frontend Changes

#### CueFinderFE/cuefinderfe/public/terms-en.html
Created comprehensive Terms and Conditions document in English including:
- Acceptance of Terms
- Use of Service
- User Accounts
- Listings and Transactions
- Prohibited Activities
- Privacy and Data Protection (GDPR compliant)
- Intellectual Property
- Limitation of Liability
- Termination
- Changes to Terms
- Governing Law
- Contact Information

#### CueFinderFE/cuefinderfe/public/terms-gr.html
Created comprehensive Terms and Conditions document in Greek (Όροι και Προϋποθέσεις) with the same sections translated.

#### CueFinderFE/cuefinderfe/src/locales/en.json
Added translations:
- `registration.terms.accept`: "I accept the"
- `registration.terms.link`: "Terms and Conditions"
- `registration.terms.required`: "You must accept the terms and conditions to register"

#### CueFinderFE/cuefinderfe/src/locales/gr.json
Added Greek translations:
- `registration.terms.accept`: "Αποδέχομαι τους"
- `registration.terms.link`: "Όρους και Προϋποθέσεις"
- `registration.terms.required`: "Πρέπει να αποδεχτείτε τους όρους και προϋποθέσεις για να εγγραφείτε"

#### CueFinderFE/cuefinderfe/src/components/LoginPage.js
Enhanced registration form:
- Added `acceptedTerms` state variable
- Added CheckBox component with link to terms document
- Link dynamically switches between Greek (`/terms-gr.html`) and English (`/terms-en.html`) based on current language
- Opens terms in new tab when clicked
- Validates checkbox is checked before submission
- Passes `acceptedTerms` value to register function

#### CueFinderFE/cuefinderfe/src/api/authService.js
Updated `register` function:
- Added `acceptedTerms` parameter (defaults to false)
- Sends `acceptedTerms` field in registration request

#### CueFinderFE/cuefinderfe/src/auth/AuthContext.js
Updated `register` function:
- Added `acceptedTerms` parameter
- Passes through to authService

### 3. Database Changes

#### scripts/add-terms-acceptance-columns.sql
Migration script to add new columns:
- Adds `AcceptedTerms` column (BIT, NOT NULL, DEFAULT 0)
- Adds `AcceptedTermsAt` column (DATETIME2, NULL)
- Updates existing users to have accepted terms (backwards compatibility)
- Adds column descriptions

## User Flow

1. User navigates to registration page
2. User fills in all required fields (username, password, name, email, phone, address)
3. User sees checkbox with text "I accept the Terms and Conditions" (localized)
4. User can click on "Terms and Conditions" link to view full document in new tab
5. Document shown is based on user's selected language (Greek or English)
6. User must check the checkbox to enable registration
7. When user clicks "Create Account":
   - Frontend validates checkbox is checked
   - If not checked, shows error message
   - If checked, sends `acceptedTerms: true` to backend
8. Backend validates `acceptedTerms` is true
   - If false, returns error "You must accept the terms and conditions to register"
   - If true, creates user with `AcceptedTerms = true` and `AcceptedTermsAt = current timestamp`

## Validation Points

### Frontend Validation
- Checkbox must be checked before form submission
- Error message displayed if user attempts to register without accepting terms

### Backend Validation
- AuthService checks `AcceptedTerms` field in RegisterRequest
- Returns ArgumentException if not accepted
- Prevents user creation if terms not accepted

## Compliance Features

1. **GDPR Compliance**: Terms document includes privacy and data protection information
2. **Language Support**: Both Greek and English versions available
3. **Audit Trail**: Timestamp recorded when terms are accepted
4. **Explicit Consent**: User must actively check box (not pre-checked)
5. **Access to Terms**: Easy access to full terms via clickable link
6. **Persistent Record**: Terms acceptance stored in database

## Testing Recommendations

1. Test registration without checking terms box
2. Test registration with terms box checked
3. Verify terms link opens correct language version
4. Verify terms open in new tab
5. Test language switching and verify correct terms shown
6. Verify backend rejects registration without accepted terms
7. Verify database stores acceptance timestamp correctly

## Future Enhancements

1. Version tracking for terms updates
2. Re-acceptance prompt when terms are updated
3. Admin panel to view terms acceptance statistics
4. Email notification with terms copy after registration
5. Privacy policy as separate document with separate acceptance checkbox
