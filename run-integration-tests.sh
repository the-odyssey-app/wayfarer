#!/bin/bash

# Wayfarer Full Integration Test Script
# This script runs comprehensive integration tests for all backend processes
# with fake users and fake groups

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAKAMA_DIR="${SCRIPT_DIR}/wayfarer-nakama"
TEST_DIR="${SCRIPT_DIR}/test-integration"

# Remote server configuration (default to remote server)
REMOTE_SERVER="${REMOTE_SERVER:-5.181.218.160}"
USE_REMOTE="${USE_REMOTE:-true}"

# Nakama configuration - use remote server by default, or localhost if USE_REMOTE=false
if [ "${USE_REMOTE}" = "true" ]; then
    NAKAMA_HOST="${NAKAMA_HOST:-${REMOTE_SERVER}}"
else
    NAKAMA_HOST="${NAKAMA_HOST:-localhost}"
fi
NAKAMA_PORT="${NAKAMA_PORT:-7350}"
NAKAMA_SERVER_KEY="${NAKAMA_SERVER_KEY:-defaultkey}"
NAKAMA_HTTP_KEY="${NAKAMA_HTTP_KEY:-defaulthttpkey}"

# Test user configuration
TEST_USER_COUNT="${TEST_USER_COUNT:-5}"
TEST_GROUP_COUNT="${TEST_GROUP_COUNT:-2}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Wayfarer Full Integration Test Suite                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_section "Checking Prerequisites"
MISSING_DEPS=0

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    MISSING_DEPS=1
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

# Check for docker-compose (only needed for local mode, supports both 'docker-compose' and 'docker compose')
DOCKER_COMPOSE_CMD=""
if [ "${USE_REMOTE}" != "true" ]; then
    if command_exists docker-compose; then
        DOCKER_COMPOSE_CMD="docker-compose"
        echo -e "${GREEN}✅ docker-compose is installed${NC}"
    elif docker compose version > /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        echo -e "${GREEN}✅ docker compose is installed${NC}"
    else
        echo -e "${RED}❌ docker-compose is not installed (required for local mode)${NC}"
        echo -e "${YELLOW}   Install docker-compose or set USE_REMOTE=true to test against remote server${NC}"
        MISSING_DEPS=1
    fi
else
    echo -e "${GREEN}✅ docker-compose not required (using remote server)${NC}"
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} is installed${NC}"
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    MISSING_DEPS=1
else
    echo -e "${GREEN}✅ npm $(npm -v) is installed${NC}"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "\n${RED}Please install missing dependencies before running tests.${NC}"
    exit 1
fi

# Create test directory
mkdir -p "$TEST_DIR"

# Display configuration
print_section "Test Configuration"
echo "  Nakama Host: ${NAKAMA_HOST}"
echo "  Nakama Port: ${NAKAMA_PORT}"
echo "  Test Mode: $([ "${USE_REMOTE}" = "true" ] && echo "Remote Server" || echo "Local Docker")"
echo "  Test Users: ${TEST_USER_COUNT}"
echo "  Test Groups: ${TEST_GROUP_COUNT}"

# Start backend services (only if using local mode)
if [ "${USE_REMOTE}" != "true" ]; then
    # Check if Nakama directory exists
    if [ ! -d "$NAKAMA_DIR" ]; then
        echo -e "${RED}❌ Nakama directory not found: $NAKAMA_DIR${NC}"
        exit 1
    fi

    print_section "Starting Backend Services (Local)"
    cd "$NAKAMA_DIR"

    echo "Checking if services are already running..."
    if $DOCKER_COMPOSE_CMD ps 2>/dev/null | grep -q "Up"; then
        echo -e "${YELLOW}⚠️  Services are already running. Stopping them first...${NC}"
        $DOCKER_COMPOSE_CMD down
    fi

    echo "Starting CockroachDB and Nakama services..."
    $DOCKER_COMPOSE_CMD up -d

    echo "Waiting for services to be healthy..."
    MAX_WAIT=60
    WAIT_COUNT=0

    # Wait for CockroachDB
    echo "Waiting for CockroachDB..."
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if $DOCKER_COMPOSE_CMD ps 2>/dev/null | grep -q "cockroachdb.*Up" && \
           $DOCKER_COMPOSE_CMD exec -T cockroachdb cockroach sql --insecure -e "SELECT 1" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ CockroachDB is healthy${NC}"
            break
        fi
        WAIT_COUNT=$((WAIT_COUNT + 1))
        sleep 1
        echo -n "."
    done

    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        echo -e "\n${RED}❌ CockroachDB failed to become healthy after ${MAX_WAIT} seconds${NC}"
        $DOCKER_COMPOSE_CMD logs --tail=50 cockroachdb
        exit 1
    fi

    # Wait for Nakama
    WAIT_COUNT=0
    echo -e "\nWaiting for Nakama..."
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        # Check if container is running and healthy
        if $DOCKER_COMPOSE_CMD ps 2>/dev/null | grep -q "nakama.*Up"; then
            # Try a simple connection test
            if timeout 2 bash -c "echo > /dev/tcp/${NAKAMA_HOST}/${NAKAMA_PORT}" 2>/dev/null || \
               curl -s -f "http://${NAKAMA_HOST}:${NAKAMA_PORT}/" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Nakama is healthy${NC}"
                break
            fi
        fi
        WAIT_COUNT=$((WAIT_COUNT + 1))
        sleep 1
        echo -n "."
    done

    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        echo -e "\n${RED}❌ Nakama failed to become healthy after ${MAX_WAIT} seconds${NC}"
        echo "Checking logs..."
        $DOCKER_COMPOSE_CMD logs --tail=50 nakama
        exit 1
    fi

    echo -e "${GREEN}✅ Backend services are running${NC}"
else
    # Remote mode - just verify connectivity
    print_section "Testing Remote Server Connection"
    echo "Testing connection to ${NAKAMA_HOST}:${NAKAMA_PORT}..."
    
    MAX_WAIT=30
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if timeout 2 bash -c "echo > /dev/tcp/${NAKAMA_HOST}/${NAKAMA_PORT}" 2>/dev/null || \
           curl -s -f "http://${NAKAMA_HOST}:${NAKAMA_PORT}/" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Remote server is reachable${NC}"
            break
        fi
        WAIT_COUNT=$((WAIT_COUNT + 1))
        sleep 1
        echo -n "."
    done

    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        echo -e "\n${RED}❌ Cannot connect to remote server ${NAKAMA_HOST}:${NAKAMA_PORT}${NC}"
        echo -e "${YELLOW}Please ensure the server is running and accessible${NC}"
        exit 1
    fi
fi

# Check if test runner exists, if not create it
cd "$SCRIPT_DIR"
if [ ! -f "$TEST_DIR/test-runner.js" ]; then
    print_section "Creating Test Runner"
    echo "Setting up test runner..."
fi

# Install test dependencies if needed
if [ ! -d "$TEST_DIR/node_modules" ]; then
    print_section "Installing Test Dependencies"
    cd "$TEST_DIR"
    npm init -y > /dev/null 2>&1
    npm install --save @heroiclabs/nakama-js > /dev/null 2>&1
    echo -e "${GREEN}✅ Test dependencies installed${NC}"
fi

# Run integration tests
print_section "Running Integration Tests"
cd "$TEST_DIR"

# Set environment variables for test runner
export NAKAMA_HOST
export NAKAMA_PORT
export NAKAMA_SERVER_KEY
export NAKAMA_HTTP_KEY
export TEST_USER_COUNT
export TEST_GROUP_COUNT
export TEST_DIR

# Load .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo "Loading environment variables from .env file..."
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

# External API keys (optional - tests will skip if not set)
export GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY:-}"
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"

# Run the test runner
if node test-runner.js; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ All Integration Tests Passed!                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    
    # Optionally stop services (only in local mode)
    if [ "${USE_REMOTE}" != "true" ] && [ "${KEEP_SERVICES_RUNNING:-false}" != "true" ]; then
        echo -e "\n${YELLOW}Stopping backend services...${NC}"
        cd "$NAKAMA_DIR"
        $DOCKER_COMPOSE_CMD down
        echo -e "${GREEN}✅ Services stopped${NC}"
    elif [ "${USE_REMOTE}" != "true" ]; then
        echo -e "\n${YELLOW}Services left running (KEEP_SERVICES_RUNNING=true)${NC}"
    fi
    
    exit 0
else
    echo -e "\n${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ Integration Tests Failed                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    
    if [ "${USE_REMOTE}" != "true" ]; then
        echo -e "\n${YELLOW}Checking backend logs...${NC}"
        cd "$NAKAMA_DIR"
        $DOCKER_COMPOSE_CMD logs --tail=50 nakama
    fi
    
    # Optionally stop services (only in local mode)
    if [ "${USE_REMOTE}" != "true" ] && [ "${KEEP_SERVICES_RUNNING:-false}" != "true" ]; then
        echo -e "\n${YELLOW}Stopping backend services...${NC}"
        cd "$NAKAMA_DIR"
        $DOCKER_COMPOSE_CMD down
    elif [ "${USE_REMOTE}" != "true" ]; then
        echo -e "\n${YELLOW}Services left running for debugging${NC}"
    fi
    
    exit 1
fi
