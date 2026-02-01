#!/bin/bash
# Fix passwordless sudo for automated deployments
# Run this ONCE on the server to allow CI/CD to run deployment commands without sudo password

set -euo pipefail

echo "🔐 Configuring passwordless sudo for CI/CD deployments..."

# Backup sudoers file
sudo cp /etc/sudoers /etc/sudoers.backup

# Add cuefinder user to sudoers with NOPASSWD for specific commands
# This allows GitHub Actions to run docker/deployment commands without a password
echo "Adding cuefinder to sudoers for docker and deployment commands..."

# Create a new sudoers file for cuefinder
cat <<'SUDOERS_EOF' | sudo tee /etc/sudoers.d/cuefinder > /dev/null
# Allow cuefinder user to run docker and deployment commands without password
cuefinder ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /bin/systemctl, /home/cuefinder/app/deployment/*.sh

# Allow password-less execution of specific scripts
cuefinder ALL=(ALL) NOPASSWD: /bin/sh -c *deploy*
cuefinder ALL=(ALL) NOPASSWD: /bin/bash -c *deploy*
cuefinder ALL=(ALL) NOPASSWD: /usr/bin/tee /home/cuefinder/app/.env*
cuefinder ALL=(ALL) NOPASSWD: /bin/chown cuefinder\:cuefinder /home/cuefinder/app/.env*
cuefinder ALL=(ALL) NOPASSWD: /bin/chmod 600 /home/cuefinder/app/.env*
SUDOERS_EOF

# Verify sudoers syntax
sudo visudo -c

echo "✅ Sudoers configuration complete!"
echo ""
echo "Testing passwordless sudo..."
sudo -n docker ps > /dev/null && echo "✓ Docker access verified" || echo "✗ Docker access failed"

echo ""
echo "🎯 Your CI/CD deployments will now work without sudo password prompts!"
