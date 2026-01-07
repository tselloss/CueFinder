-- Add Location column to Users table if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'Location'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "Location" character varying(200);
        RAISE NOTICE 'Added Location column to Users table';
    ELSE
        RAISE NOTICE 'Location column already exists in Users table';
    END IF;
END $$;
