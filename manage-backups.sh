#!/bin/bash

# Database Backup & Restore Management Script
# Usage: ./manage-backups.sh [backup|restore|list|verify|cleanup]

set -e

BACKUP_DIR="/home/cuefinder/backups"
DB_NAME="cuefinder"
DB_USER="postgres"
CONTAINER="cuefinder-postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== CueFinder Database Backup Manager ===${NC}\n"

# Function: Create backup
backup() {
    echo -e "${YELLOW}[1/3] Creating database backup...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/cuefinder_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec $CONTAINER pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"
    
    if [ -s "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
        echo "  Size: $(du -h $BACKUP_FILE | cut -f1)"
    else
        echo -e "${RED}✗ Backup file is empty!${NC}"
        rm "$BACKUP_FILE"
        exit 1
    fi
    
    # Verify backup
    echo -e "${YELLOW}[2/3] Verifying backup...${NC}"
    TEMP_DB="cuefinder_verify_$$"
    
    docker exec $CONTAINER createdb -U $DB_USER "$TEMP_DB" > /dev/null 2>&1 || true
    
    if docker exec $CONTAINER psql -U $DB_USER -d "$TEMP_DB" < "$BACKUP_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backup verification successful${NC}"
        docker exec $CONTAINER dropdb -U $DB_USER "$TEMP_DB" > /dev/null 2>&1 || true
    else
        echo -e "${YELLOW}⚠️  Backup verification failed (but backup file exists)${NC}"
    fi
    
    # Show record counts
    echo -e "${YELLOW}[3/3] Recording backup statistics...${NC}"
    USERS=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;")
    POSTS=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM forumposts;" 2>/dev/null || echo "N/A")
    CUES=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM cues;" 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}✓ Backup statistics:${NC}"
    echo "  Users: $USERS"
    echo "  Forum Posts: $POSTS"
    echo "  Cues: $CUES"
    echo ""
}

# Function: List backups
list_backups() {
    echo -e "${BLUE}Available Backups:${NC}\n"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}No backups directory found${NC}"
        return
    fi
    
    ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{print $9, "(" $5 ")"}' | nl -nln -w2 -s' ' || {
        echo -e "${YELLOW}No backups found${NC}"
    }
    
    echo ""
    echo -e "${BLUE}Backup Directory Size:${NC}"
    du -sh "$BACKUP_DIR"
    echo ""
}

# Function: Restore from backup
restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Backup file not specified${NC}"
        echo "Usage: ./manage-backups.sh restore <backup-file>"
        echo ""
        list_backups
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}✗ Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
    echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}\n"
    
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    # Create safety backup first
    echo -e "${YELLOW}[1/4] Creating safety backup of current database...${NC}"
    SAFETY_BACKUP="$BACKUP_DIR/cuefinder_safety_backup_$(date +%Y%m%d_%H%M%S).sql"
    docker exec $CONTAINER pg_dump -U $DB_USER -d $DB_NAME > "$SAFETY_BACKUP"
    echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"
    
    # Stop application
    echo -e "${YELLOW}[2/4] Stopping application services...${NC}"
    docker compose stop backend-blue backend-green moderator 2>/dev/null || true
    sleep 3
    echo -e "${GREEN}✓ Services stopped${NC}"
    
    # Restore from backup
    echo -e "${YELLOW}[3/4] Restoring from backup...${NC}"
    if docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"; then
        echo -e "${GREEN}✓ Restore completed${NC}"
    else
        echo -e "${RED}✗ Restore failed! Attempting to restore safety backup...${NC}"
        docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME < "$SAFETY_BACKUP"
        echo -e "${GREEN}✓ Safety backup restored${NC}"
        exit 1
    fi
    
    # Restart application
    echo -e "${YELLOW}[4/4] Restarting application services...${NC}"
    docker compose up -d backend-blue backend-green moderator
    sleep 5
    
    # Verify
    echo -e "${GREEN}✓ Restore completed successfully${NC}"
    echo ""
    echo -e "${BLUE}Service Status:${NC}"
    docker compose ps backend-blue backend-green moderator | grep -E "NAME|backend|moderator"
    echo ""
}

# Function: Verify backup integrity
verify_backup() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Backup file not specified${NC}"
        echo "Usage: ./manage-backups.sh verify <backup-file>"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}✗ Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Verifying backup: $BACKUP_FILE${NC}\n"
    
    # Check file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${BLUE}File Info:${NC}"
    echo "  Size: $FILE_SIZE"
    echo "  Created: $(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f %Sm "$BACKUP_FILE")"
    echo ""
    
    # Try to restore to test database
    echo -e "${YELLOW}Testing restore capability...${NC}"
    TEMP_DB="cuefinder_verify_$$"
    
    docker exec $CONTAINER createdb -U $DB_USER "$TEMP_DB" > /dev/null 2>&1 || true
    
    if docker exec $CONTAINER psql -U $DB_USER -d "$TEMP_DB" < "$BACKUP_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backup is valid and restorable${NC}"
        
        # Show backup statistics
        echo ""
        echo -e "${BLUE}Backup Contents:${NC}"
        docker exec $CONTAINER psql -U $DB_USER -d "$TEMP_DB" -t -c \
            "SELECT 'users' as table_name, COUNT(*) as count FROM users
             UNION ALL
             SELECT 'forumcategories', COUNT(*) FROM forumcategories
             UNION ALL
             SELECT 'forumposts', COUNT(*) FROM forumposts
             UNION ALL
             SELECT 'cues', COUNT(*) FROM cues
             UNION ALL
             SELECT 'cuecases', COUNT(*) FROM cuecases
             UNION ALL
             SELECT 'ratings', COUNT(*) FROM ratings
             ORDER BY table_name;"
        
        docker exec $CONTAINER dropdb -U $DB_USER "$TEMP_DB" > /dev/null 2>&1 || true
    else
        echo -e "${RED}✗ Backup is corrupted or invalid${NC}"
        docker exec $CONTAINER dropdb -U $DB_USER "$TEMP_DB" > /dev/null 2>&1 || true
        exit 1
    fi
    echo ""
}

# Function: Cleanup old backups
cleanup_backups() {
    echo -e "${YELLOW}Cleaning up old backups (keeping last 30)...${NC}\n"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}No backups directory found${NC}"
        return
    fi
    
    # Count current backups
    CURRENT=$(ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
    echo "Current backups: $CURRENT"
    
    # Keep last 30, remove older
    if [ "$CURRENT" -gt 30 ]; then
        echo "Removing backups older than last 30..."
        ls -t "$BACKUP_DIR"/*.sql | tail -n +31 | while read backup; do
            echo -e "${YELLOW}  Removing: $(basename $backup)${NC}"
            rm "$backup"
        done
        NEW_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
        echo -e "${GREEN}✓ Cleanup complete. Remaining: $NEW_COUNT${NC}"
    else
        echo -e "${GREEN}✓ All backups are recent (< 30 backups)${NC}"
    fi
    
    # Compress old .sql files
    echo ""
    echo "Compressing backups older than 7 days..."
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 ! -name "*.gz" -exec gzip {} \; 2>/dev/null || true
    
    echo -e "${GREEN}✓ Compression complete${NC}"
    echo ""
    
    # Show directory size
    echo -e "${BLUE}Backup Directory Size:${NC}"
    du -sh "$BACKUP_DIR"
    echo ""
}

# Main script
case "${1:-help}" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list_backups
        ;;
    verify)
        verify_backup "$2"
        ;;
    cleanup)
        cleanup_backups
        ;;
    *)
        echo "Usage: ./manage-backups.sh [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  backup              Create new backup of database"
        echo "  restore <file>      Restore from backup file"
        echo "  list                List all available backups"
        echo "  verify <file>       Verify backup integrity"
        echo "  cleanup             Remove old backups (keep last 30)"
        echo ""
        echo "Examples:"
        echo "  ./manage-backups.sh backup"
        echo "  ./manage-backups.sh list"
        echo "  ./manage-backups.sh verify /home/cuefinder/backups/cuefinder_backup_20240101_120000.sql"
        echo "  ./manage-backups.sh restore /home/cuefinder/backups/cuefinder_backup_20240101_120000.sql"
        echo ""
        list_backups
        ;;
esac
