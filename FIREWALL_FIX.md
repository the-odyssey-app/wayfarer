# Firewall Fix for Nakama Connection Issue

## Problem
The server is running, but connections to port 7350 are being refused. The Hostinger dashboard shows "Firewall rules: 0", which means the firewall is blocking the port.

## Solution

### Step 1: Configure Hostinger Firewall (REQUIRED)

The Hostinger VPS dashboard has a firewall that needs to be configured:

1. **Go to your Hostinger VPS dashboard**
2. **Navigate to the "Security" or "Firewall" section** (from the sidebar)
3. **Add a new firewall rule:**
   - **Type:** Inbound
   - **Protocol:** TCP
   - **Port:** 7350
   - **Action:** Allow
   - **Description:** Nakama Server
4. **Save and apply the rule**

### Step 2: Verify Nakama is Running on the Server

SSH into your server and check:

```bash
ssh root@5.181.218.160

# Check if Nakama container is running
docker ps | grep nakama

# If not running, start it:
cd /root/wayfarer/wayfarer-nakama
docker-compose up -d

# Check if port 7350 is listening
ss -tlnp | grep 7350
```

Expected output should show:
```
tcp  0  0  0.0.0.0:7350  0.0.0.0:*  LISTEN
```

### Step 3: Check System Firewall (if needed)

Even after configuring Hostinger's firewall, you may need to check the system firewall:

```bash
# Check UFW status
ufw status

# If UFW is active, allow port 7350
ufw allow 7350/tcp
ufw reload

# Or check iptables
iptables -L INPUT -n | grep 7350
```

### Step 4: Test Connection

From your local machine:

```bash
# Test connection
curl -v http://5.181.218.160:7350/

# Or use netcat
nc -zv 5.181.218.160 7350
```

## Quick Fix Script

You can run this script to check and fix common issues:

```bash
ssh root@5.181.218.160 << 'EOF'
# Check Nakama container
echo "Checking Nakama container..."
docker ps | grep nakama || echo "Nakama not running - starting..."
cd /root/wayfarer/wayfarer-nakama && docker-compose up -d

# Check port listening
echo "Checking port 7350..."
ss -tlnp | grep 7350 || echo "Port 7350 not listening"

# Check UFW
echo "Checking UFW..."
if command -v ufw >/dev/null 2>&1; then
    ufw status
    if ! ufw status | grep -q "7350"; then
        echo "Opening port 7350 in UFW..."
        ufw allow 7350/tcp
        ufw reload
    fi
fi
EOF
```

## Important Notes

1. **Hostinger Firewall is the most likely culprit** - The dashboard shows "Firewall rules: 0", which means you need to add rules through the Hostinger control panel.

2. **You may need to allow multiple ports:**
   - Port 7350: Nakama client connections
   - Port 7351: Nakama console (optional, for admin access)

3. **After adding firewall rules, wait a few minutes** for them to propagate.

4. **If the issue persists**, check:
   - Nakama logs: `docker logs <nakama-container-id>`
   - Docker port mapping in `docker-compose.yml`
   - Nakama config in `local.yml` (should have `bind_address: "0.0.0.0"`)

