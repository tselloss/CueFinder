-- Migration: Add HidePhone privacy setting to Users table
-- Date: 2026-01-13
-- Description: Adds column to allow users to hide their phone number from other users

-- Add HidePhone column with default value of 0 (phone is visible by default)
ALTER TABLE Users
ADD HidePhone BIT NOT NULL DEFAULT 0;

-- Add comment/description
EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Indicates whether the user''s phone number should be hidden from other users', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Users',
    @level2type = N'COLUMN', @level2name = N'HidePhone';

PRINT 'Migration completed: Added HidePhone column to Users table';
