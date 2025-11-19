#!/bin/bash
# Apply events table migration (mechanics, reward_config, leaderboard_config columns)
# This script applies migration 005 to add missing columns to events table

set -e

echo "Applying events table migration..."

# Extract just the events ALTER statements from migration 005
# Using simple ALTER TABLE (CockroachDB supports IF NOT EXISTS)
SQL="USE nakama;
ALTER TABLE events ADD COLUMN IF NOT EXISTS mechanics JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reward_config JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS leaderboard_config JSONB;"

# Try to apply via SSH if we have access
if command -v ssh >/dev/null 2>&1; then
    echo "Attempting to apply migration via SSH..."
    ssh root@5.181.218.160 "docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure" <<< "$SQL" && echo "✅ Migration applied successfully" || echo "❌ Failed to apply migration via SSH"
else
    echo "SSH not available. Please run manually:"
    echo ""
    echo "ssh root@5.181.218.160"
    echo "docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure << 'EOF'"
    echo "$SQL"
    echo "EOF"
fi

