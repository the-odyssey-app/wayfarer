# Quick Fix: Deploy Runtime Module Configuration

## Problem
All RPC functions return `404 Not Found` because the runtime module isn't loading.

## Quick Fix Steps

### 1. Update docker-compose.yml on Remote Server

SSH into the server and update the docker-compose.yml:

```bash
ssh root@5.181.218.160
cd ~/wayfarer/wayfarer-nakama
```

Edit `docker-compose.yml` and change the nakama entrypoint from:
```yaml
exec /nakama/nakama --name nakama1 --database.address root@cockroachdb:26257 --logger.level DEBUG --session.token_expiry_sec 7200
```

To:
```yaml
exec /nakama/nakama --name nakama1 --database.address root@cockroachdb:26257 --config /nakama/local.yml --logger.level DEBUG --session.token_expiry_sec 7200
```

And add the local.yml mount to volumes:
```yaml
volumes:
  - ./nakama-data:/nakama/data
  - ./local.yml:/nakama/local.yml
```

### 2. Ensure Runtime Module Files Exist

Verify the module is on the server:
```bash
ls -la nakama-data/modules/index.js
```

If missing, copy from local:
```bash
# From your local machine
scp -r wayfarer-nakama/nakama-data/modules root@5.181.218.160:~/wayfarer/wayfarer-nakama/nakama-data/
scp wayfarer-nakama/local.yml root@5.181.218.160:~/wayfarer/wayfarer-nakama/
```

### 3. Restart Nakama

```bash
docker-compose down
docker-compose up -d
```

### 4. Verify It's Working

Check logs:
```bash
docker-compose logs nakama | grep -i "runtime\|module\|initialized"
```

You should see:
```
Wayfarer JavaScript Runtime Module initialized
```

### 5. Test Again

Run integration tests:
```bash
# From your local machine
./run-integration-tests.sh
```

## Automated Fix Script

Save this as `fix-runtime.sh` and run it:

```bash
#!/bin/bash
REMOTE_HOST="5.181.218.160"
REMOTE_USER="root"
REMOTE_PATH="~/wayfarer/wayfarer-nakama"

echo "Deploying runtime module configuration..."

# Copy files
scp -r wayfarer-nakama/nakama-data/modules ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/nakama-data/
scp wayfarer-nakama/local.yml ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
scp wayfarer-nakama/docker-compose.yml ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

# Restart services
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker-compose down && docker-compose up -d"

echo "✅ Done! Check logs with: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose logs nakama | grep -i runtime'"
```
