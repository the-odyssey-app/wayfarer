#!/bin/bash

# Script to check if Nakama runtime module is properly configured on remote server
# Uses centralized configuration from .env.deployment if available

# Load centralized configuration (if available)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [ -f "${PROJECT_ROOT}/scripts/load-deployment-config.sh" ]; then
    source "${PROJECT_ROOT}/scripts/load-deployment-config.sh"
fi

# Use centralized config with fallback to environment variables or defaults
REMOTE_HOST="${REMOTE_HOST:-${DEPLOYMENT_SERVER_HOST:-5.181.218.160}}"
REMOTE_USER="${REMOTE_USER:-${DEPLOYMENT_SERVER_USER:-root}}"
REMOTE_DIR="${DEPLOYMENT_SERVER_DIR:-/root/wayfarer/wayfarer-nakama}"

echo "Checking Nakama runtime module on ${REMOTE_HOST}..."
echo ""

# Check if runtime module file exists
echo "1. Checking if runtime module file exists..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "test -f ${REMOTE_DIR}/nakama-data/modules/index.js && echo '✅ Runtime module file exists' || echo '❌ Runtime module file NOT found'"

echo ""
echo "2. Checking Nakama container status..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker-compose ps"

echo ""
echo "3. Checking Nakama logs for runtime module initialization..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker-compose logs nakama | grep -i 'runtime\|module\|initialized' | tail -20"

echo ""
echo "4. Checking if modules directory is mounted..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker-compose exec -T nakama ls -la /nakama/data/modules/ 2>/dev/null || echo '❌ Cannot access modules directory in container'"

echo ""
echo "5. Checking Nakama config..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker-compose exec -T nakama cat /nakama/local.yml 2>/dev/null || echo '❌ No local.yml found in container'"

echo ""
echo "Done!"
