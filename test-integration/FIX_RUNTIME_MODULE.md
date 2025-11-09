# Fix: RPC Functions Return 404 Not Found

## Problem
All RPC function calls are returning `404 Not Found - RPC function not found`. This means the Nakama runtime module is not loading on the remote server.

## Root Cause
The `docker-compose.yml` file doesn't configure Nakama to load the runtime module. The runtime module needs to be:
1. Deployed to the server
2. Properly mounted in the container
3. Configured in Nakama (via config file or command-line flags)

## Solution

### Step 1: Check Current Status

Run the diagnostic script:
```bash
cd test-integration
./check-runtime-module.sh
```

### Step 2: Ensure Runtime Module is Deployed

The runtime module should be at:
```
~/wayfarer/wayfarer-nakama/nakama-data/modules/index.js
```

On the remote server, verify it exists:
```bash
ssh root@5.181.218.160
cd ~/wayfarer/wayfarer-nakama
ls -la nakama-data/modules/
```

If it doesn't exist, copy it:
```bash
# From your local machine
scp -r wayfarer-nakama/nakama-data/modules root@5.181.218.160:~/wayfarer/wayfarer-nakama/nakama-data/
```

### Step 3: Update docker-compose.yml to Load Runtime Module

The current `docker-compose.yml` doesn't configure the runtime module. You need to either:

#### Option A: Use a Config File (Recommended)

1. Copy `local.yml` to the server:
```bash
scp wayfarer-nakama/local.yml root@5.181.218.160:~/wayfarer/wayfarer-nakama/
```

2. Update `docker-compose.yml` on the server to use the config file:
```yaml
nakama:
  image: registry.heroiclabs.com/heroiclabs/nakama:3.22.0
  entrypoint:
    - "/bin/sh"
    - "-ecx"
    - >
      /nakama/nakama migrate up --database.address root@cockroachdb:26257 &&
      exec /nakama/nakama --name nakama1 --database.address root@cockroachdb:26257 --config /nakama/local.yml --logger.level DEBUG --session.token_expiry_sec 7200
  # ... rest of config
```

#### Option B: Add Command-Line Flags

Update the `docker-compose.yml` entrypoint to include runtime configuration:
```yaml
entrypoint:
  - "/bin/sh"
  - "-ecx"
  - >
    /nakama/nakama migrate up --database.address root@cockroachdb:26257 &&
    exec /nakama/nakama 
      --name nakama1 
      --database.address root@cockroachdb:26257 
      --runtime.js_entrypoint index.js
      --logger.level DEBUG 
      --session.token_expiry_sec 7200
```

### Step 4: Restart Nakama

After making changes:
```bash
ssh root@5.181.218.160
cd ~/wayfarer/wayfarer-nakama
docker-compose down
docker-compose up -d
```

### Step 5: Verify Runtime Module Loaded

Check the logs:
```bash
docker-compose logs nakama | grep -i "runtime\|module\|initialized"
```

You should see:
```
Wayfarer JavaScript Runtime Module initialized
RPC functions registered: ...
```

### Step 6: Test Again

Run the integration tests:
```bash
./run-integration-tests.sh
```

## Quick Fix Script

If you want to automate this, create a deployment script:

```bash
#!/bin/bash
# deploy-runtime-module.sh

REMOTE_HOST="5.181.218.160"
REMOTE_USER="root"
REMOTE_PATH="~/wayfarer/wayfarer-nakama"

# Copy runtime module
scp -r wayfarer-nakama/nakama-data/modules ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/nakama-data/

# Copy config file
scp wayfarer-nakama/local.yml ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

# Restart Nakama
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker-compose down && docker-compose up -d"

echo "✅ Runtime module deployed and Nakama restarted"
```

## Alternative: Check if Module Needs Dependencies

The runtime module might need npm packages installed. Check if `package.json` dependencies are needed:

```bash
ssh root@5.181.218.160
cd ~/wayfarer/wayfarer-nakama/nakama-data/modules
npm install  # If running in container, might need to do this differently
```

However, Nakama's JavaScript runtime should handle this automatically if the module is properly configured.
