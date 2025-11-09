#!/bin/bash

# Script to fix database schema issues on remote server

REMOTE_SERVER="root@5.181.218.160"
REMOTE_DIR="/root/wayfarer/wayfarer-nakama"
CONTAINER="wayfarer-nakama-cockroachdb-1"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Fixing Database Schema Issues                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to run SQL on remote server
run_sql() {
    local sql="$1"
    local description="$2"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    ssh $REMOTE_SERVER "docker exec $CONTAINER cockroach sql --insecure --execute=\"USE nakama; $sql\"" 2>&1
    
    echo ""
}

echo "🔧 Fixing Achievements Table..."
run_sql "ALTER TABLE achievements ADD COLUMN IF NOT EXISTS reward_xp INTEGER;" "Adding reward_xp column"
run_sql "ALTER TABLE achievements ADD COLUMN IF NOT EXISTS reward_coins INTEGER;" "Adding reward_coins column"

echo "🔍 Verifying Schema..."
run_sql "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'achievements' ORDER BY ordinal_position;" "Achievements Table Schema"

echo "🔍 Checking Quest Steps Issue..."
run_sql "SELECT q.id, q.title, COUNT(qs.id) as step_count FROM quests q LEFT JOIN quest_steps qs ON q.id = qs.quest_id GROUP BY q.id, q.title ORDER BY q.id DESC LIMIT 10;" "Quests and Their Steps"

echo "✅ Schema fixes complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Re-run integration tests"
echo "  2. Check if quest steps are now being saved"
echo "  3. Check if achievements can now be created"

