-- Migration: Add terms acceptance tracking to Users table
-- Date: 2026-01-09
-- Description: Adds columns to track if user has accepted terms and conditions

-- Add AcceptedTerms column
ALTER TABLE Users
ADD AcceptedTerms BIT NOT NULL DEFAULT 0;

-- Add AcceptedTermsAt column
ALTER TABLE Users
ADD AcceptedTermsAt DATETIME2 NULL;

-- Update existing users to have accepted terms (for backwards compatibility)
UPDATE Users
SET AcceptedTerms = 1,
    AcceptedTermsAt = CreatedAt
WHERE AcceptedTerms = 0;

-- Add comment/description
EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Indicates whether the user has accepted the terms and conditions', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Users',
    @level2type = N'COLUMN', @level2name = N'AcceptedTerms';

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Timestamp when the user accepted the terms and conditions', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Users',
    @level2type = N'COLUMN', @level2name = N'AcceptedTermsAt';

PRINT 'Migration completed: Added AcceptedTerms and AcceptedTermsAt columns to Users table';
