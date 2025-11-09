#!/bin/bash

# Script to check database on remote server
# Verifies that test data was actually created

# Load centralized configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/scripts/load-deployment-config.sh"

REMOTE_SERVER="${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}"
REMOTE_DIR="${DEPLOYMENT_SERVER_DIR}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Database Verification - Remote Server                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to run SQL query on remote server
run_query() {
    local query="$1"
    local description="$2"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Try different container name patterns
    ssh $REMOTE_SERVER "cd $REMOTE_DIR && \
        (docker-compose exec -T cockroachdb cockroach sql --insecure --execute=\"$query\" 2>/dev/null || \
         docker exec \$(docker ps -q -f name=cockroach) cockroach sql --insecure --execute=\"$query\" 2>/dev/null || \
         docker exec wayfarer-nakama-cockroachdb-1 cockroach sql --insecure --execute=\"$query\" 2>/dev/null || \
         echo '⚠️  Could not execute query')"
    
    echo ""
}

echo "📊 Checking Quests Table..."
run_query "SELECT COUNT(*) as total_quests, COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_quests FROM quests;" "Total Quests and Recent Quests (last hour)"

run_query "SELECT id, title, difficulty, is_group, max_participants, current_participants, created_at FROM quests ORDER BY created_at DESC LIMIT 5;" "Most Recent Quests"

echo ""
echo "📊 Checking Quest Steps Table..."
run_query "SELECT COUNT(*) as total_steps, COUNT(DISTINCT quest_id) as quests_with_steps FROM quest_steps;" "Quest Steps Summary"

run_query "SELECT qs.quest_id, q.title, COUNT(qs.id) as step_count FROM quest_steps qs JOIN quests q ON qs.quest_id = q.id GROUP BY qs.quest_id, q.title ORDER BY q.created_at DESC LIMIT 5;" "Recent Quests with Step Counts"

echo ""
echo "📊 Checking Places Table..."
run_query "SELECT COUNT(*) as total_places, COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_places FROM places;" "Total Places and Recent Places (last hour)"

run_query "SELECT id, name, latitude, longitude, types, created_at FROM places ORDER BY created_at DESC LIMIT 5;" "Most Recent Places"

echo ""
echo "📊 Checking Achievements Table..."
run_query "SELECT COUNT(*) as total_achievements, achievement_type, COUNT(*) as count FROM achievements GROUP BY achievement_type;" "Achievements by Type"

run_query "SELECT id, user_id, achievement_type, description, reward_xp, created_at FROM achievements WHERE achievement_type = 'single_task' ORDER BY created_at DESC LIMIT 5;" "Single Task Achievements"

echo ""
echo "📊 Checking User Quests Table..."
run_query "SELECT COUNT(*) as total_user_quests, status, COUNT(*) as count FROM user_quests GROUP BY status;" "User Quests by Status"

run_query "SELECT uq.id, uq.user_id, uq.quest_id, q.title, uq.status, uq.progress_percent, uq.started_at FROM user_quests uq JOIN quests q ON uq.quest_id = q.id ORDER BY uq.created_at DESC LIMIT 5;" "Most Recent User Quests"

echo ""
echo "📊 Checking User Profiles (XP/Level)..."
run_query "SELECT user_id, level, total_xp, coins, updated_at FROM user_profiles ORDER BY total_xp DESC LIMIT 5;" "Top Users by XP"

run_query "SELECT COUNT(*) as total_profiles, SUM(total_xp) as total_xp_awarded, AVG(level) as avg_level FROM user_profiles;" "User Profiles Summary"

echo ""
echo "📊 Checking Test Users..."
run_query "SELECT username, email, created_at FROM users WHERE email LIKE '%@wayfarer.test' OR username LIKE 'testuser%' ORDER BY created_at DESC LIMIT 10;" "Test Users"

echo ""
echo "✅ Database check complete!"

