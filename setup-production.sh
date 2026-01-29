#!/bin/bash
# ============================================================
# Production Setup Script for CueFinder
# ============================================================
# This script:
# 1. Creates required directories
# 2. Generates SSL certificates
# 3. Sets up automated backups
# 4. Verifies configuration
# ============================================================

set -e  # Exit on error

echo "=========================================="
echo "CueFinder Production Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# 1. CREATE REQUIRED DIRECTORIES
# ============================================================
echo -e "\n${YELLOW}[1/5] Creating required directories...${NC}"
mkdir -p /home/cuefinder/data/postgres
mkdir -p /home/cuefinder/backups
mkdir -p /home/cuefinder/ssl
mkdir -p /home/cuefinder/logs

chmod 700 /home/cuefinder/data/postgres
chmod 700 /home/cuefinder/backups
chmod 700 /home/cuefinder/ssl

echo -e "${GREEN}✓ Directories created${NC}"

# ============================================================
# 2. VERIFY .env.production EXISTS
# ============================================================
echo -e "\n${YELLOW}[2/5] Checking .env.production configuration...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${RED}✗ ERROR: .env.production not found!${NC}"
    echo "Please copy and configure .env.production.example:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Check for required variables
required_vars=("DB_PASSWORD" "JWT_SECRET" "SMTP_PASSWORD")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.production || grep -q "^${var}=CHANGE_ME\|^${var}=your_\|^${var}=REPLACE_" .env.production; then
        echo -e "${RED}✗ ERROR: ${var} not configured in .env.production${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ .env.production verified${NC}"

# ============================================================
# 3. GENERATE/VERIFY SSL CERTIFICATES
# ============================================================
echo -e "\n${YELLOW}[3/5] Checking SSL certificates...${NC}"

if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/key.pem" ]; then
    echo "⚠️  SSL certificates not found. Options:"
    echo ""
    echo "Option A - Use Let's Encrypt (RECOMMENDED for production):"
    echo "  1. Install certbot: sudo apt-get install certbot"
    echo "  2. Run: sudo certbot certonly --standalone -d billiardscuefinder.com -d www.billiardscuefinder.com"
    echo "  3. Copy certificates:"
    echo "     sudo cp /etc/letsencrypt/live/billiardscuefinder.com/fullchain.pem ./ssl/cert.pem"
    echo "     sudo cp /etc/letsencrypt/live/billiardscuefinder.com/privkey.pem ./ssl/key.pem"
    echo "     sudo chown $(whoami):$(whoami) ./ssl/*"
    echo ""
    echo "Option B - Generate self-signed certificate (FOR TESTING ONLY):"
    echo "  openssl req -x509 -newkey rsa:2048 -nodes -out ./ssl/cert.pem -keyout ./ssl/key.pem -days 365"
    echo ""
    read -p "Have you set up SSL certificates? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ SSL setup required before deployment${NC}"
        exit 1
    fi
fi

if [ -f "./ssl/cert.pem" ] && [ -f "./ssl/key.pem" ]; then
    echo -e "${GREEN}✓ SSL certificates found${NC}"
else
    echo -e "${RED}✗ SSL certificates still missing${NC}"
    exit 1
fi

# ============================================================
# 4. SETUP AUTOMATED BACKUPS
# ============================================================
echo -e "\n${YELLOW}[4/5] Setting up automated database backups...${NC}"

# Create backup script
cat > /home/cuefinder/backup-db.sh << 'EOF'
#!/bin/bash
# Daily database backup script
BACKUP_DIR="/home/cuefinder/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/cuefinder_$TIMESTAMP.sql"

# Create backup
docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > "$BACKUP_FILE" 2>/dev/null

# Compress
gzip "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_FILE.gz"
EOF

chmod +x /home/cuefinder/backup-db.sh

# Add to crontab for daily backups at 3 AM
CRON_CMD="0 3 * * * /home/cuefinder/backup-db.sh"
if ! crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo -e "${GREEN}✓ Automated daily backups scheduled at 3 AM${NC}"
else
    echo -e "${GREEN}✓ Backup script already in crontab${NC}"
fi

# ============================================================
# 5. FINAL VERIFICATION
# ============================================================
echo -e "\n${YELLOW}[5/5] Final verification...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

# Verify .gitignore
if ! grep -q "\.env\.production" .gitignore; then
    echo ".env.production" >> .gitignore
    echo -e "${GREEN}✓ Added .env.production to .gitignore${NC}"
fi

# ============================================================
# READY FOR DEPLOYMENT
# ============================================================
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Production setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify all variables in .env.production are set"
echo "2. Test the setup locally:"
echo "   export \$(cat .env.production | xargs)"
echo "   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
echo "3. Monitor the deployment:"
echo "   docker-compose logs -f nginx"
echo "   docker-compose logs -f backend-blue"
echo ""
echo "4. Test the application:"
echo "   curl https://billiardscuefinder.com"
echo "   curl https://billiardscuefinder.com/api/health"
echo ""
echo "IMPORTANT: Make sure backups are running:"
echo "   ls -lah /home/cuefinder/backups/"
