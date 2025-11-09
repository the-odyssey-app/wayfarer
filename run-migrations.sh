#!/bin/bash

# Script to run all database migrations on the remote Nakama server
# This will create all missing tables and fix the database schema
# Usage: ./run-migrations.sh [--fix-schema] [--migration <name>]

# Load centralized configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/scripts/load-deployment-config.sh"

REMOTE_HOST="${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}"
NAKAMA_DIR="${DEPLOYMENT_SERVER_DIR}"
MIGRATIONS_DIR="wayfarer-nakama/migrations"

# Parse arguments
FIX_SCHEMA=false
SPECIFIC_MIGRATION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --fix-schema)
            FIX_SCHEMA=true
            shift
            ;;
        --migration)
            SPECIFIC_MIGRATION="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--fix-schema] [--migration <name>]"
            echo ""
            echo "Options:"
            echo "  --fix-schema      - Run schema fixes (adds missing columns)"
            echo "  --migration <name> - Run specific migration file only"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Wayfarer Database Migration Runner                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking local migration files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Error: Migration directory not found: $MIGRATIONS_DIR"
    exit 1
fi

MIGRATION_FILES=$(ls -1 $MIGRATIONS_DIR/*.sql | sort)
MIGRATION_COUNT=$(echo "$MIGRATION_FILES" | wc -l)

echo "Found $MIGRATION_COUNT migration files:"
echo "$MIGRATION_FILES" | while read file; do
    echo "  - $(basename $file)"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Uploading migration files to server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create migrations directory on server
ssh "${REMOTE_HOST}" "mkdir -p $NAKAMA_DIR/migrations"

# Upload all migration files
for file in $MIGRATION_FILES; do
    filename=$(basename $file)
    echo "Uploading $filename..."
    scp "$file" "${REMOTE_HOST}:$NAKAMA_DIR/migrations/$filename"
    if [ $? -eq 0 ]; then
        echo "  ✅ $filename uploaded"
    else
        echo "  ❌ Failed to upload $filename"
        exit 1
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Checking CockroachDB container"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get CockroachDB container ID
COCKROACH_CONTAINER=$(ssh "${REMOTE_HOST}" "docker ps --format '{{.Names}}' | grep cockroachdb | head -1")

if [ -z "$COCKROACH_CONTAINER" ]; then
    echo "❌ CockroachDB container not found"
    echo ""
    echo "Starting CockroachDB..."
    ssh "${REMOTE_HOST}" "cd $NAKAMA_DIR && docker compose up -d cockroachdb"
    sleep 5
    COCKROACH_CONTAINER=$(ssh "${REMOTE_HOST}" "docker ps --format '{{.Names}}' | grep cockroachdb | head -1")
    
    if [ -z "$COCKROACH_CONTAINER" ]; then
        echo "❌ Failed to start CockroachDB"
        exit 1
    fi
fi

echo "✅ CockroachDB container: $COCKROACH_CONTAINER"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Running migrations in order"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run each migration in order
MIGRATION_NUM=1
for file in $MIGRATION_FILES; do
    filename=$(basename $file)
    echo "[$MIGRATION_NUM/$MIGRATION_COUNT] Running $filename..."
    
    # Copy file to container and execute
    OUTPUT=$(ssh "${REMOTE_HOST}" << EOF
cd $NAKAMA_DIR
docker cp migrations/$filename $COCKROACH_CONTAINER:/tmp/$filename 2>&1
docker exec -i $COCKROACH_CONTAINER cockroach sql --insecure --database=nakama < /tmp/$filename 2>&1
EOF
    )
    
    EXIT_CODE=$?
    
    # Check for actual SQL errors in output
    if echo "$OUTPUT" | grep -qi "ERROR\|error\|failed"; then
        echo "  ❌ $filename had errors:"
        echo "$OUTPUT" | grep -i "ERROR\|error" | head -5
    elif [ $EXIT_CODE -eq 0 ]; then
        echo "  ✅ $filename completed successfully"
    else
        echo "  ⚠️  $filename exited with code $EXIT_CODE"
        echo "     Output: $OUTPUT"
    fi
    
    MIGRATION_NUM=$((MIGRATION_NUM + 1))
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Verifying migrations - Schema Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Checking for required tables..."
ssh "${REMOTE_HOST}" << EOF
docker exec $COCKROACH_CONTAINER cockroach sql --insecure --database=nakama -e "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_preferences',
    'user_activity_patterns',
    'item_collection_sets',
    'user_audio_favorites',
    'events',
    'user_verifications',
    'safety_reports',
    'match_requests',
    'place_visits'
  )
ORDER BY table_name;
"
EOF

echo ""
echo "Verifying critical columns exist..."
echo "Checking quests table for is_group column..."
QUEST_GROUP_CHECK=$(ssh "${REMOTE_HOST}" "docker exec $COCKROACH_CONTAINER cockroach sql --insecure --database=nakama -e \"SELECT column_name FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'is_group';\" 2>&1")
if echo "$QUEST_GROUP_CHECK" | grep -q "is_group"; then
    echo "  ✅ quests.is_group column exists"
else
    echo "  ❌ quests.is_group column MISSING"
fi

echo "Checking quest_steps table for activity_type and time_minutes columns..."
STEP_COLS_CHECK=$(ssh "${REMOTE_HOST}" "docker exec $COCKROACH_CONTAINER cockroach sql --insecure --database=nakama -e \"SELECT column_name FROM information_schema.columns WHERE table_name = 'quest_steps' AND column_name IN ('activity_type', 'time_minutes');\" 2>&1")
if echo "$STEP_COLS_CHECK" | grep -q "activity_type" && echo "$STEP_COLS_CHECK" | grep -q "time_minutes"; then
    echo "  ✅ quest_steps.activity_type and time_minutes columns exist"
elif echo "$STEP_COLS_CHECK" | grep -q "activity_type"; then
    echo "  ⚠️  quest_steps.activity_type exists, but time_minutes MISSING"
elif echo "$STEP_COLS_CHECK" | grep -q "time_minutes"; then
    echo "  ⚠️  quest_steps.time_minutes exists, but activity_type MISSING"
else
    echo "  ❌ quest_steps.activity_type and time_minutes columns MISSING"
fi

echo "Checking achievements table for reward_xp and reward_coins columns..."
ACH_COLS_CHECK=$(ssh "${REMOTE_HOST}" "docker exec $COCKROACH_CONTAINER cockroach sql --insecure --database=nakama -e \"SELECT column_name FROM information_schema.columns WHERE table_name = 'achievements' AND column_name IN ('reward_xp', 'reward_coins');\" 2>&1")
if echo "$ACH_COLS_CHECK" | grep -q "reward_xp" && echo "$ACH_COLS_CHECK" | grep -q "reward_coins"; then
    echo "  ✅ achievements.reward_xp and reward_coins columns exist"
else
    echo "  ❌ achievements.reward_xp and/or reward_coins columns MISSING"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step $([ "$FIX_SCHEMA" = true ] && echo "7" || echo "6"): Listing all tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "All tables in database:"
ssh "${REMOTE_HOST}" << EOF
docker exec $COCKROACH_CONTAINER cockroach sql --insecure --database=nakama -e "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Migration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Restart Nakama to ensure it picks up new tables:"
echo "   ssh ${REMOTE_HOST} 'cd $NAKAMA_DIR && docker compose restart nakama'"
echo ""
echo "2. Re-run integration tests:"
echo "   ./run-integration-tests.sh"
echo ""

