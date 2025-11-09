#!/bin/bash

# Script to deploy Nakama configuration fix to remote server
# This fixes the connection issue by updating bind_address

SERVER_IP="5.181.218.160"
NAKAMA_DIR="wayfarer-nakama"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Deploy Nakama Configuration Fix                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "This script will:"
echo "1. Copy updated local.yml to server"
echo "2. Restart Nakama container"
echo "3. Verify connection"
echo ""
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

# Check if local.yml exists locally
if [ ! -f "$NAKAMA_DIR/local.yml" ]; then
    echo "❌ Error: $NAKAMA_DIR/local.yml not found locally"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Finding Nakama directory on server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find Nakama directory on server
REMOTE_NAKAMA_DIR=$(ssh root@$SERVER_IP "find ~ /root -type d -name 'wayfarer-nakama' -o -type f -name 'docker-compose.yml' | grep -E '(wayfarer-nakama|docker-compose.yml)' | head -1 | xargs dirname 2>/dev/null" | head -1)

if [ -z "$REMOTE_NAKAMA_DIR" ]; then
    # Try common locations
    for dir in "/root/wayfarer-nakama" "/root/wayfarer/wayfarer-nakama" "/home/wayfarer/wayfarer-nakama"; do
        if ssh root@$SERVER_IP "test -d $dir" 2>/dev/null; then
            REMOTE_NAKAMA_DIR="$dir"
            break
        fi
    done
fi

if [ -z "$REMOTE_NAKAMA_DIR" ]; then
    echo "⚠️  Could not find wayfarer-nakama directory automatically"
    echo ""
    echo "Please specify the path manually:"
    read -p "Enter Nakama directory path on server (or press Enter to use ~/wayfarer-nakama): " REMOTE_NAKAMA_DIR
    REMOTE_NAKAMA_DIR="${REMOTE_NAKAMA_DIR:-~/wayfarer-nakama}"
fi

echo "Using directory: $REMOTE_NAKAMA_DIR"

# Create directory if it doesn't exist
ssh root@$SERVER_IP "mkdir -p $REMOTE_NAKAMA_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Copying updated local.yml to server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Copy local.yml to server
scp "$NAKAMA_DIR/local.yml" root@$SERVER_IP:$REMOTE_NAKAMA_DIR/local.yml

if [ $? -eq 0 ]; then
    echo "✅ Configuration file copied successfully to $REMOTE_NAKAMA_DIR/local.yml"
else
    echo "❌ Failed to copy configuration file"
    echo ""
    echo "Trying alternative method..."
    # Try copying to temp location first
    ssh root@$SERVER_IP "cat > /tmp/local.yml" < "$NAKAMA_DIR/local.yml"
    ssh root@$SERVER_IP "mv /tmp/local.yml $REMOTE_NAKAMA_DIR/local.yml"
    
    if [ $? -eq 0 ]; then
        echo "✅ Configuration file copied successfully (alternative method)"
    else
        echo "❌ Failed to copy configuration file"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Restarting Nakama container"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Restart Nakama on server
ssh root@$SERVER_IP << EOF
cd $REMOTE_NAKAMA_DIR
echo "Current directory: \$(pwd)"
echo "Stopping Nakama..."
docker-compose stop nakama 2>/dev/null || docker stop \$(docker ps -aq --filter "name=nakama") 2>/dev/null || echo "No running container found"
sleep 2
echo "Starting Nakama..."
docker-compose up -d nakama 2>/dev/null || docker-compose up -d 2>/dev/null
sleep 5
echo "Checking Nakama status..."
docker-compose ps nakama 2>/dev/null || docker ps | grep nakama || echo "Could not verify status"
EOF

if [ $? -eq 0 ]; then
    echo "✅ Nakama restarted"
else
    echo "⚠️  Warning: Nakama restart may have failed, check manually"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Verifying connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 5

# Test connection
if timeout 5 nc -zv $SERVER_IP 7350 2>&1 | grep -q "succeeded"; then
    echo "✅ Connection successful! Port 7350 is now accessible"
    echo ""
    echo "You can now run:"
    echo "  ./run-integration-tests.sh"
else
    echo "❌ Connection still failing. Please check:"
    echo ""
    echo "1. SSH into server: ssh root@$SERVER_IP"
    echo "2. Check Nakama logs: docker-compose logs nakama"
    echo "3. Check firewall: ufw status"
    echo "4. Verify config: cat ~/wayfarer-nakama/local.yml | grep bind_address"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deployment Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

