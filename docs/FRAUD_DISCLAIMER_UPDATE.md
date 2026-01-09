# Disclaimer Update - Fraud and User Responsibility

## Date: January 9, 2026

## Changes Made

Added a comprehensive disclaimer section (4.1) to both English and Greek terms and conditions documents regarding platform liability and user caution.

## New Section: "Disclaimer of Liability for Fraud and Deceptive Practices"

### Greek Version (Αποποίηση Ευθύνης για Απάτη και Δόλιες Πράξεις)

**Key Points:**
- ❌ **CueFinder bears NO RESPONSIBILITY** if users are deceived by other users
- ⚠️ Users must be **EXTREMELY CAUTIOUS** when:
  - Sending money to any user
  - Providing personal information or banking details
  - Agreeing to meet for product delivery
  - Conducting any transactions

**Safety Recommendations Added:**
1. Meet in public places for product delivery
2. Verify the identity of the seller or buyer
3. Never send money before seeing the product
4. Use secure payment methods
5. If something seems too good to be true, it probably isn't
6. Trust your instincts - if something seems suspicious, do not proceed

### English Version (Same content, translated)

The same warnings and recommendations are provided in English for international users.

## Why This Is Important

### Legal Protection
- Clearly states platform is not liable for user-to-user fraud
- Establishes that CueFinder is an intermediary platform only
- Protects the company from legal liability

### User Safety
- Warns users about potential scams
- Provides practical safety tips
- Encourages careful decision-making
- Promotes meeting in public places

### Industry Standard
Similar disclaimers are used by:
- eBay
- Craigslist
- Facebook Marketplace
- OLX
- Letgo
- OfferUp

## Implementation

### Files Modified
1. `CueFinderFE/cuefinderfe/public/terms-gr.html` - Greek terms
2. `CueFinderFE/cuefinderfe/public/terms-en.html` - English terms

### Section Structure
- **Section 4**: Listings and Transactions
- **Section 4.1**: Disclaimer of Liability for Fraud (NEW)
- **Section 5**: Prohibited Activities
- (All subsequent sections remain numbered correctly)

## User Impact

### What Users Will See
When users click on "Terms and Conditions" during registration, they will now see:
1. Clear warning that platform is not responsible for fraud
2. Bold text emphasizing extreme caution needed
3. Specific scenarios where caution is required
4. Practical safety recommendations
5. Final statement of user responsibility

### User Journey
1. User clicks on terms link
2. Sees comprehensive warning about fraud
3. Reads safety recommendations
4. Understands they are responsible for their own transactions
5. Makes informed decision before accepting terms

## Legal Compliance

✅ **Disclosure Requirements**: Clearly states platform limitations  
✅ **User Awareness**: Explicitly warns users of risks  
✅ **Reasonable Care**: Provides safety guidance  
✅ **Liability Limitation**: Protects platform from fraud claims  
✅ **Consumer Protection**: Empowers users with information  

## Greek Translation Quality

The Greek translation uses:
- Strong, clear language
- Appropriate legal terminology
- Cultural context for Greek users
- Emphasis on personal responsibility (πρόσεκτικος = careful)
- Direct warnings in bold text

## Testing Recommendations

### Verify the Changes
1. Open registration page
2. Switch language to Greek
3. Click "Όρους και Προϋποθέσεις"
4. Verify section 4.1 appears with warnings
5. Switch language to English
6. Click "Terms and Conditions"
7. Verify section 4.1 appears with warnings

### Check Formatting
- Bold text displays correctly
- Lists are properly formatted
- Section numbering is sequential
- Links work properly

## Future Enhancements

Consider adding:
1. **Reporting System**: Allow users to report suspicious activity
2. **User Ratings**: Implement seller/buyer ratings
3. **Verified Badges**: For trusted users
4. **Escrow Service**: Optional secure payment holding
5. **Insurance Option**: Optional transaction insurance
6. **Dispute Resolution**: Mediation service for conflicts

## Support

If users have questions about safety:
- Email: cuefinderinfo@gmail.com
- Refer to Section 4.1 of Terms and Conditions
- Recommend local police for fraud cases

## Summary

**Before**: Terms mentioned platform is not involved in transactions  
**After**: Terms explicitly state NO liability for fraud + comprehensive safety guidelines

This update protects both the platform legally and users practically by setting clear expectations and providing actionable safety advice.
