#!/bin/bash

# Quick script to check Nakama status on remote server
# Run this via SSH to diagnose issues

SERVER_IP="5.181.218.160"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Remote Server Nakama Diagnostic Script                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will SSH into the server and check Nakama status."
echo "Make sure you have SSH access configured."
echo ""
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking Nakama Status on $SERVER_IP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Nakama Docker container is running
echo "1. Checking Docker containers..."
ssh root@$SERVER_IP "docker ps | grep -i nakama || echo 'No Nakama container found running'"

echo ""
echo "2. Checking all Docker containers (including stopped)..."
ssh root@$SERVER_IP "docker ps -a | grep -i nakama || echo 'No Nakama container found'"

echo ""
echo "3. Checking what's listening on port 7350..."
ssh root@$SERVER_IP "ss -tlnp | grep 7350 || netstat -tlnp 2>/dev/null | grep 7350 || echo 'Nothing listening on port 7350'"

echo ""
echo "4. Checking firewall status..."
ssh root@$SERVER_IP "ufw status 2>/dev/null || iptables -L INPUT -n | grep 7350 || echo 'Firewall check completed'"

echo ""
echo "5. Checking Nakama logs (last 20 lines)..."
ssh root@$SERVER_IP "docker logs \$(docker ps -aq --filter 'name=nakama') --tail 20 2>/dev/null || echo 'Could not fetch logs'"

echo ""
echo "6. Checking if Nakama directory exists..."
ssh root@$SERVER_IP "cd ~/wayfarer-nakama && pwd && ls -la docker-compose.yml 2>/dev/null || echo 'wayfarer-nakama directory not found'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Diagnostic Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

