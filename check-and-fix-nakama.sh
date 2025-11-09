#!/bin/bash

# Comprehensive script to check and fix Nakama on server

SERVER_IP="5.181.218.160"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Check and Fix Nakama on Server                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Finding Nakama directory structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh root@$SERVER_IP << 'EOF'
echo "Checking directory structure..."
echo ""
echo "/root/wayfarer contents:"
ls -la /root/wayfarer/ 2>/dev/null | head -10 || echo "Directory not found"

echo ""
echo "Looking for docker-compose.yml..."
find /root -name "docker-compose.yml" 2>/dev/null

echo ""
echo "Looking for local.yml..."
find /root -name "local.yml" 2>/dev/null

echo ""
echo "Docker containers:"
docker ps -a | grep -i nakama || echo "No Nakama containers found"
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Checking where Nakama should be"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find the actual docker-compose.yml location
DOCKER_COMPOSE_PATH=$(ssh root@$SERVER_IP "find /root -name 'docker-compose.yml' -type f 2>/dev/null | head -1")

if [ -z "$DOCKER_COMPOSE_PATH" ]; then
    echo "❌ Could not find docker-compose.yml"
    echo ""
    echo "Please SSH into the server and check:"
    echo "  ssh root@$SERVER_IP"
    echo "  find /root -name docker-compose.yml"
    exit 1
fi

NAKAMA_DIR=$(dirname "$DOCKER_COMPOSE_PATH")
echo "Found Nakama directory: $NAKAMA_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Copying local.yml to correct location"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Copy local.yml to the correct location
scp wayfarer-nakama/local.yml root@$SERVER_IP:$NAKAMA_DIR/local.yml

if [ $? -eq 0 ]; then
    echo "✅ Configuration copied to $NAKAMA_DIR/local.yml"
else
    echo "⚠️  Direct copy failed, trying alternative..."
    ssh root@$SERVER_IP "cat > $NAKAMA_DIR/local.yml" < wayfarer-nakama/local.yml
    echo "✅ Configuration copied (alternative method)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Verifying configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh root@$SERVER_IP << EOF
cd $NAKAMA_DIR
echo "Checking bind_address in local.yml:"
grep -A 2 "socket:" local.yml | grep bind_address || echo "⚠️  bind_address not found!"
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Restarting Nakama"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh root@$SERVER_IP << EOF
cd $NAKAMA_DIR
echo "Current directory: \$(pwd)"
echo ""

# Detect docker compose command (v2 or v1)
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo "Using: docker compose (v2)"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo "Using: docker-compose (v1)"
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' found"
    exit 1
fi

echo ""
echo "Stopping all Nakama containers..."
\$DOCKER_COMPOSE_CMD down 2>/dev/null || docker stop \$(docker ps -aq --filter "name=nakama") 2>/dev/null || echo "No containers to stop"
sleep 3

echo ""
echo "Starting Nakama..."
\$DOCKER_COMPOSE_CMD up -d

echo ""
echo "Waiting for containers to start..."
sleep 15

echo ""
echo "Container status:"
\$DOCKER_COMPOSE_CMD ps || docker ps | grep -E "(nakama|cockroach)"

echo ""
echo "Checking if Nakama is listening on port 7350..."
ss -tlnp | grep 7350 || netstat -tlnp 2>/dev/null | grep 7350 || echo "⚠️  Port 7350 not listening yet"

echo ""
echo "Checking Nakama logs (last 10 lines):"
\$DOCKER_COMPOSE_CMD logs nakama --tail 10 2>/dev/null || docker logs \$(docker ps -aq --filter "name=nakama") --tail 10 2>/dev/null || echo "Could not fetch logs"
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Checking firewall"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh root@$SERVER_IP << 'EOF'
echo "Checking firewall status..."
if command -v ufw >/dev/null 2>&1; then
    if ufw status | grep -q "7350"; then
        echo "✅ Port 7350 is allowed in UFW"
    else
        echo "⚠️  Port 7350 not in UFW rules"
        echo ""
        echo "Opening port 7350..."
        ufw allow 7350/tcp
        ufw reload
        echo "✅ Port 7350 opened"
    fi
else
    echo "UFW not installed, checking iptables..."
    if iptables -L INPUT -n | grep -q "7350"; then
        echo "✅ Port 7350 is allowed in iptables"
    else
        echo "⚠️  Port 7350 not in iptables rules"
        echo "Note: You may need to add iptables rule manually"
    fi
fi
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Testing connection from local machine"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 5

if timeout 5 nc -zv $SERVER_IP 7350 2>&1 | grep -q "succeeded"; then
    echo "✅ SUCCESS! Port 7350 is now accessible"
    echo ""
    echo "You can now run:"
    echo "  ./run-integration-tests.sh"
else
    echo "❌ Connection still failing"
    echo ""
    echo "Next steps to debug:"
    echo "1. SSH into server: ssh root@$SERVER_IP"
    echo "2. Check Nakama logs: cd $NAKAMA_DIR && docker-compose logs nakama"
    echo "3. Check if listening: ss -tlnp | grep 7350"
    echo "4. Check firewall: ufw status"
    echo "5. Check VPS provider firewall (hosting control panel)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

