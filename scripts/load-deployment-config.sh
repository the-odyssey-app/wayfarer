#!/bin/bash
# Load deployment configuration from centralized source
# Usage: source scripts/load-deployment-config.sh
#
# This script loads configuration from .env.deployment and .env.deployment.local
# All deployment scripts should source this file to get consistent configuration

# Get the project root directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/.env.deployment"
LOCAL_CONFIG="${PROJECT_ROOT}/.env.deployment.local"

# Function to load config file
load_config() {
    local file="$1"
    if [ -f "$file" ]; then
        # Export all variables, handling comments and empty lines
        set -a
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "${line// }" ]]; then
                # Export the variable
                export "$line" 2>/dev/null || true
            fi
        done < "$file"
        set +a
    fi
}

# Load base config first
if [ -f "$CONFIG_FILE" ]; then
    load_config "$CONFIG_FILE"
fi

# Override with local config if exists (local takes precedence)
if [ -f "$LOCAL_CONFIG" ]; then
    load_config "$LOCAL_CONFIG"
fi

# Set defaults if not set (fallback values)
export DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
export DEPLOYMENT_SERVER_HOST="${DEPLOYMENT_SERVER_HOST:-5.181.218.160}"
export DEPLOYMENT_SERVER_USER="${DEPLOYMENT_SERVER_USER:-root}"
export DEPLOYMENT_SERVER_DIR="${DEPLOYMENT_SERVER_DIR:-/root/wayfarer/wayfarer-nakama}"

# Nakama configuration defaults
export NAKAMA_HOST="${NAKAMA_HOST:-${DEPLOYMENT_SERVER_HOST}}"
export NAKAMA_PORT="${NAKAMA_PORT:-7350}"
export NAKAMA_CONSOLE_PORT="${NAKAMA_CONSOLE_PORT:-7351}"
export NAKAMA_SERVER_KEY="${NAKAMA_SERVER_KEY:-defaultkey}"
export NAKAMA_HTTP_KEY="${NAKAMA_HTTP_KEY:-defaulthttpkey}"

# Legacy variable support (for backward compatibility)
export REMOTE_SERVER="${REMOTE_SERVER:-${DEPLOYMENT_SERVER_HOST}}"

# Environment-specific overrides
if [ "${DEPLOYMENT_ENV}" = "development" ]; then
    # Use localhost for development if LOCAL_NAKAMA_HOST is set
    if [ -n "${LOCAL_NAKAMA_HOST}" ]; then
        export NAKAMA_HOST="${LOCAL_NAKAMA_HOST}"
    fi
    if [ -n "${LOCAL_NAKAMA_PORT}" ]; then
        export NAKAMA_PORT="${LOCAL_NAKAMA_PORT}"
    fi
fi

# Computed variables (for convenience)
export REMOTE_HOST="${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}"
export NAKAMA_URL="http://${NAKAMA_HOST}:${NAKAMA_PORT}"
export NAKAMA_CONSOLE_URL="http://${NAKAMA_HOST}:${NAKAMA_CONSOLE_PORT}"

# Export PROJECT_ROOT for use in scripts
export PROJECT_ROOT

