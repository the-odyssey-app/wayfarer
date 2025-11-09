# Fixing Nakama Connection Issues

The connection to `5.181.218.160:7350` is being refused. Here's how to fix it:

## Quick Diagnosis

SSH into your server and run these commands:

```bash
ssh root@5.181.218.160
```

### 1. Check if Nakama is Running

```bash
# Check Docker containers
docker ps | grep nakama

# Or check all containers (including stopped)
docker ps -a | grep nakama
```

**If no container found:**
- Nakama is not running
- Start it: `cd wayfarer-nakama && docker-compose up -d`

### 2. Check What Ports Are Listening

```bash
# Check what's listening on port 7350
ss -tlnp | grep 7350

# Or
netstat -tlnp | grep 7350
```

**Expected output:**
```
tcp  0  0  0.0.0.0:7350  0.0.0.0:*  LISTEN  <pid>/nakama
```

**If you see `127.0.0.1:7350` instead:**
- Nakama is only listening on localhost
- Fix: Update Nakama config to bind to `0.0.0.0`

**If nothing shows:**
- Nakama is not running or port is not exposed

### 3. Check Firewall

```bash
# Check UFW status
ufw status

# Check iptables
iptables -L INPUT -n | grep 7350
```

**If firewall is blocking:**
```bash
# Allow port 7350
ufw allow 7350/tcp
ufw reload

# Or for iptables
iptables -A INPUT -p tcp --dport 7350 -j ACCEPT
```

### 4. Check Docker Port Mapping

```bash
# Check docker-compose.yml
cd wayfarer-nakama
cat docker-compose.yml | grep -A 5 "ports:"
```

**Ensure you have:**
```yaml
ports:
  - "7350:7350"
```

**If missing, add it:**
```yaml
services:
  nakama:
    ports:
      - "7350:7350"  # Client port
      - "7351:7351"  # HTTP port (optional)
```

### 5. Check Nakama Configuration

```bash
cd wayfarer-nakama
cat local.yml | grep -A 10 "socket"
```

**Ensure binding to all interfaces:**
```yaml
socket:
  bind_address: "0.0.0.0"  # Not "127.0.0.1" or "localhost"
  port: 7350
```

### 6. Check Logs

```bash
# Get container ID
CONTAINER_ID=$(docker ps -aq --filter "name=nakama")

# Check logs
docker logs $CONTAINER_ID --tail 50
```

Look for errors like:
- `bind: address already in use`
- `permission denied`
- `cannot bind to port`

## Common Fixes

### Fix 1: Start Nakama

```bash
cd wayfarer-nakama
docker-compose up -d
docker-compose ps
```

### Fix 2: Update Docker Compose Port Mapping

Edit `wayfarer-nakama/docker-compose.yml`:

```yaml
services:
  nakama:
    ports:
      - "7350:7350"
      - "7351:7351"
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Fix 3: Update Nakama Config

Edit `wayfarer-nakama/local.yml`:

```yaml
socket:
  bind_address: "0.0.0.0"  # Listen on all interfaces
  port: 7350
```

Restart Nakama:
```bash
docker-compose restart nakama
```

### Fix 4: Open Firewall Port

```bash
# UFW
ufw allow 7350/tcp
ufw reload

# Or iptables
iptables -A INPUT -p tcp --dport 7350 -j ACCEPT
iptables-save
```

### Fix 5: Check Host Firewall (VPS Provider)

Some VPS providers have a host-level firewall. Check your VPS control panel:
- Look for "Firewall" or "Security Groups"
- Add rule: Allow TCP port 7350
- Save and apply

## Verify Fix

After making changes, verify from your local machine:

```bash
# Test connection
nc -zv 5.181.218.160 7350

# Or
curl http://5.181.218.160:7350/

# Or run tests
./run-integration-tests.sh
```

## Still Having Issues?

1. **Check if port is in use:**
   ```bash
   lsof -i :7350
   ```

2. **Check Docker network:**
   ```bash
   docker network ls
   docker network inspect <network-name>
   ```

3. **Try restarting everything:**
   ```bash
   cd wayfarer-nakama
   docker-compose down
   docker-compose up -d
   ```

4. **Check system resources:**
   ```bash
   df -h
   free -h
   ```

5. **Check Docker logs:**
   ```bash
   docker-compose logs nakama
   ```

