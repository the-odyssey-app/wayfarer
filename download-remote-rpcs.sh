#!/bin/bash

# Script to download RPC files from remote Nakama server
# This will SSH into the server and copy the actual RPC implementations

# Load centralized configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/scripts/load-deployment-config.sh"

SERVER_IP="${DEPLOYMENT_SERVER_HOST}"
REMOTE_NAKAMA_DIR="${DEPLOYMENT_SERVER_DIR}"
LOCAL_MODULES_DIR="wayfarer-nakama/nakama-data/modules"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Download RPC Files from Remote Nakama Server             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will:"
echo "  1. SSH into remote server (${DEPLOYMENT_SERVER_HOST})"
echo "  2. Find Nakama runtime modules directory"
echo "  3. Download all RPC files to local directory"
echo ""
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Finding Nakama directory on remote server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find Nakama directory on server
REMOTE_NAKAMA_PATH=$(ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "find ~ /root /opt /var -type d -name 'wayfarer-nakama' 2>/dev/null | head -1")

if [ -z "$REMOTE_NAKAMA_PATH" ]; then
    echo "❌ Could not find wayfarer-nakama directory on remote server"
    echo ""
    echo "Trying to find Nakama Docker container..."
    CONTAINER_ID=$(ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "docker ps -aq --filter 'name=nakama' | head -1")
    
    if [ -z "$CONTAINER_ID" ]; then
        echo "❌ Could not find Nakama container"
        exit 1
    fi
    
    echo "✅ Found Nakama container: $CONTAINER_ID"
    echo ""
    echo "Checking container for modules directory..."
    
    # Check if modules exist in container
    MODULES_CHECK=$(ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "docker exec $CONTAINER_ID ls -la /nakama/data/modules/ 2>/dev/null | head -5")
    
    if [ -z "$MODULES_CHECK" ]; then
        echo "❌ Could not find /nakama/data/modules/ in container"
        echo ""
        echo "Trying alternative locations..."
        ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "docker exec $CONTAINER_ID find / -type d -name 'modules' 2>/dev/null | head -5"
        exit 1
    fi
    
    echo "✅ Found modules directory in container"
    REMOTE_MODULES_PATH="/nakama/data/modules"
    USE_DOCKER=true
else
    echo "✅ Found wayfarer-nakama directory: $REMOTE_NAKAMA_PATH"
    REMOTE_MODULES_PATH="$REMOTE_NAKAMA_PATH/nakama-data/modules"
    USE_DOCKER=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Listing RPC files on remote server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$USE_DOCKER" = true ]; then
    echo "Listing files in Docker container..."
    ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "docker exec $CONTAINER_ID ls -la $REMOTE_MODULES_PATH/ | grep -E '\.js$|index'"
    RPC_FILES=$(ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "docker exec $CONTAINER_ID ls $REMOTE_MODULES_PATH/*.js 2>/dev/null | xargs -n1 basename")
else
    echo "Listing files on remote server..."
    ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "ls -la $REMOTE_MODULES_PATH/ | grep -E '\.js$|index'"
    RPC_FILES=$(ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "ls $REMOTE_MODULES_PATH/*.js 2>/dev/null | xargs -n1 basename")
fi

if [ -z "$RPC_FILES" ]; then
    echo "❌ No RPC files found on remote server"
    exit 1
fi

echo ""
echo "Found RPC files:"
echo "$RPC_FILES" | while read file; do
    echo "  - $file"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Downloading RPC files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create local modules directory if it doesn't exist
mkdir -p "$LOCAL_MODULES_DIR"

# Download each file
echo "$RPC_FILES" | while read file; do
    if [ -z "$file" ]; then
        continue
    fi
    
    echo "Downloading $file..."
    
    if [ "$USE_DOCKER" = true ]; then
        ssh "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}" "docker exec $CONTAINER_ID cat $REMOTE_MODULES_PATH/$file" > "$LOCAL_MODULES_DIR/$file"
    else
        scp "${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}:$REMOTE_MODULES_PATH/$file" "$LOCAL_MODULES_DIR/$file"
    fi
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Downloaded $file"
    else
        echo "  ❌ Failed to download $file"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Verifying downloaded files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LOCAL_FILES=$(ls -1 "$LOCAL_MODULES_DIR"/*.js 2>/dev/null | wc -l)
echo "Downloaded $LOCAL_FILES files to $LOCAL_MODULES_DIR"
echo ""
echo "Files:"
ls -lh "$LOCAL_MODULES_DIR"/*.js 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'

echo ""
echo "✅ Download complete!"
echo ""
echo "Next steps:"
echo "  1. Review the downloaded RPC files"
echo "  2. Compare with documentation in wayfarer-nakama/remote-server/rpcs/"
echo "  3. Update tests if parameter formats differ"

