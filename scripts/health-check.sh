#!/bin/bash
# Consolidated Health Check Script for Nakama
# Combines functionality from check-server-nakama.sh and diagnose-nakama-connection.sh
# Usage: ./scripts/health-check.sh [--quick] [--full] [--connection]

set -e

# Load centralized configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${PROJECT_ROOT}/scripts/load-deployment-config.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
CHECK_MODE="full"  # default: full check

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            CHECK_MODE="quick"
            shift
            ;;
        --full)
            CHECK_MODE="full"
            shift
            ;;
        --connection)
            CHECK_MODE="connection"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--quick|--full|--connection]"
            echo ""
            echo "Modes:"
            echo "  --quick      - Quick status check (container + port)"
            echo "  --full       - Full diagnostic (default)"
            echo "  --connection - Connection diagnostic only"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

REMOTE_HOST="${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}"

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Nakama Health Check - Mode: ${CHECK_MODE^^}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Server: ${DEPLOYMENT_SERVER_HOST}"
echo ""

# ============================================
# CONNECTION CHECK
# ============================================

check_connection() {
    print_section "Connection Diagnostic"
    
    # Test SSH connectivity
    print_info "Testing SSH connectivity (port 22)..."
    if timeout 3 nc -zv "${DEPLOYMENT_SERVER_HOST}" 22 2>&1 | grep -q "succeeded"; then
        print_success "SSH port (22) is accessible"
    else
        print_error "SSH port (22) is NOT accessible"
        return 1
    fi
    
    # Test Nakama port
    print_info "Testing Nakama port ${NAKAMA_PORT}..."
    if timeout 3 nc -zv "${DEPLOYMENT_SERVER_HOST}" "${NAKAMA_PORT}" 2>&1 | grep -q "succeeded"; then
        print_success "Nakama port (${NAKAMA_PORT}) is accessible"
    else
        print_error "Nakama port (${NAKAMA_PORT}) is NOT accessible"
        echo ""
        echo "Possible causes:"
        echo "  - Nakama is not running on the server"
        echo "  - Nakama is only listening on localhost (127.0.0.1)"
        echo "  - Firewall is blocking port ${NAKAMA_PORT}"
        echo "  - Nakama is listening on a different port"
        return 1
    fi
    
    # Test HTTP endpoint
    print_info "Testing HTTP endpoint..."
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://${NAKAMA_HOST}:${NAKAMA_PORT}/" 2>/dev/null || echo "000")
    if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "404" ]; then
        print_success "HTTP endpoint responding (status: ${HTTP_RESPONSE})"
    else
        print_warning "HTTP endpoint not responding (status: ${HTTP_RESPONSE})"
    fi
}

# ============================================
# QUICK CHECK
# ============================================

check_quick() {
    print_section "Quick Status Check"
    
    # Check container
    print_info "Checking Docker containers..."
    CONTAINER_STATUS=$(ssh "${REMOTE_HOST}" "docker ps | grep -i nakama || echo 'NOT_RUNNING'" 2>/dev/null)
    
    if [ "$CONTAINER_STATUS" != "NOT_RUNNING" ]; then
        print_success "Nakama container is running"
        echo "$CONTAINER_STATUS"
    else
        print_error "Nakama container is NOT running"
        echo ""
        echo "Checking stopped containers..."
        ssh "${REMOTE_HOST}" "docker ps -a | grep -i nakama || echo 'No Nakama containers found'"
    fi
    
    # Check port
    print_info "Checking port ${NAKAMA_PORT}..."
    if timeout 3 nc -zv "${DEPLOYMENT_SERVER_HOST}" "${NAKAMA_PORT}" 2>&1 | grep -q "succeeded"; then
        print_success "Port ${NAKAMA_PORT} is accessible"
    else
        print_error "Port ${NAKAMA_PORT} is NOT accessible"
    fi
}

# ============================================
# FULL CHECK
# ============================================

check_full() {
    print_section "Full Diagnostic"
    
    # Container status
    print_info "1. Checking Docker containers..."
    echo "Running containers:"
    ssh "${REMOTE_HOST}" "docker ps | grep -i nakama || echo 'No Nakama container found running'" 2>/dev/null
    
    echo ""
    echo "All containers (including stopped):"
    ssh "${REMOTE_HOST}" "docker ps -a | grep -i nakama || echo 'No Nakama container found'" 2>/dev/null
    
    # Port listening
    print_info "2. Checking what's listening on port ${NAKAMA_PORT}..."
    ssh "${REMOTE_HOST}" "ss -tlnp | grep ${NAKAMA_PORT} || netstat -tlnp 2>/dev/null | grep ${NAKAMA_PORT} || echo 'Nothing listening on port ${NAKAMA_PORT}'" 2>/dev/null
    
    # Firewall
    print_info "3. Checking firewall status..."
    ssh "${REMOTE_HOST}" << 'EOF'
if command -v ufw >/dev/null 2>&1; then
    ufw status | grep -E "(7350|Status)" || echo "UFW status unknown"
elif command -v iptables >/dev/null 2>&1; then
    iptables -L INPUT -n | grep 7350 || echo "Port 7350 not in iptables rules"
else
    echo "No firewall tool found"
fi
EOF
    
    # Logs
    print_info "4. Checking Nakama logs (last 20 lines)..."
    CONTAINER_ID=$(ssh "${REMOTE_HOST}" "docker ps -aq --filter 'name=nakama' | head -1" 2>/dev/null)
    if [ -n "$CONTAINER_ID" ]; then
        ssh "${REMOTE_HOST}" "docker logs ${CONTAINER_ID} --tail 20 2>/dev/null || echo 'Could not fetch logs'"
    else
        echo "No container found to check logs"
    fi
    
    # Directory structure
    print_info "5. Checking Nakama directory..."
    ssh "${REMOTE_HOST}" "cd ${DEPLOYMENT_SERVER_DIR} && pwd && ls -la docker-compose.yml 2>/dev/null || echo 'wayfarer-nakama directory not found'" 2>/dev/null
    
    # Runtime status
    print_info "6. Checking runtime status..."
    if [ -n "$CONTAINER_ID" ]; then
        RPC_COUNT=$(ssh "${REMOTE_HOST}" "docker logs ${CONTAINER_ID} 2>&1 | grep 'Registered JavaScript runtime RPC' | wc -l" 2>/dev/null || echo "0")
        if [ "$RPC_COUNT" -gt 0 ]; then
            print_success "Runtime loaded: ${RPC_COUNT} RPCs registered"
        else
            print_warning "Runtime may not be loaded (0 RPCs found)"
        fi
        
        # Check for errors
        ERROR_COUNT=$(ssh "${REMOTE_HOST}" "docker logs ${CONTAINER_ID} --since=5m 2>&1 | grep -i 'error' | grep -v 'level.*debug' | wc -l" 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT" -eq 0 ]; then
            print_success "No recent errors in logs"
        else
            print_warning "${ERROR_COUNT} recent errors found in logs"
        fi
    fi
}

# ============================================
# MAIN EXECUTION
# ============================================

case "$CHECK_MODE" in
    connection)
        check_connection
        ;;
    quick)
        check_quick
        ;;
    full)
        check_connection
        check_full
        ;;
esac

print_section "Health Check Complete"
echo ""
echo "Mode: ${CHECK_MODE}"
echo "Server: ${DEPLOYMENT_SERVER_HOST}"
echo ""
echo "For more detailed diagnostics, run:"
echo "  ./scripts/health-check.sh --full"
echo ""

exit 0

