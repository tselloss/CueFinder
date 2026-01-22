#!/bin/bash
# Check and fix production database schema

echo "=== Checking Production Database Schema ==="
echo ""

# Check current schema
echo "Current schema for Posts and Discussions tables:"
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder -c "
SELECT table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('Posts','Discussions') 
AND column_name='CreatedByUsername';
"

echo ""
echo "=== Applying Schema Updates ==="

# Apply the add-username-columns script
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder <<'EOF'
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';
ALTER TABLE "Discussions" ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';
EOF

echo ""
echo "=== Verifying Updates ==="

# Verify schema after update
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder -c "
SELECT table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('Posts','Discussions') 
AND column_name='CreatedByUsername';
"

echo ""
echo "=== Schema Update Complete ==="
