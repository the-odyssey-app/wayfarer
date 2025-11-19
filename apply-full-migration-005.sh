#!/bin/bash
# Apply full migration 005 - event_participation and event_leaderboards tables

set -e

echo "Applying full migration 005 (event tables)..."

SQL="
USE nakama;

-- Event Leaderboards (separate from global leaderboards)
CREATE TABLE IF NOT EXISTS event_leaderboards (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  metric_type TEXT DEFAULT 'xp',
  score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id, metric_type)
);
CREATE INDEX IF NOT EXISTS idx_event_leaderboards_event ON event_leaderboards(event_id);
CREATE INDEX IF NOT EXISTS idx_event_leaderboards_user ON event_leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_event_leaderboards_rank ON event_leaderboards(event_id, metric_type, rank);

-- Event Participation Tracking
CREATE TABLE IF NOT EXISTS event_participation (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  quests_completed INTEGER DEFAULT 0,
  items_collected INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_participation_event ON event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_user ON event_participation(user_id);
"

# Apply via SSH
if command -v ssh >/dev/null 2>&1; then
    echo "Applying migration via SSH..."
    ssh root@5.181.218.160 "docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure" <<< "$SQL" && echo "✅ Migration applied successfully" || echo "❌ Failed to apply migration"
else
    echo "SSH not available. Please run manually:"
    echo ""
    echo "ssh root@5.181.218.160"
    echo "docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure << 'EOF'"
    echo "$SQL"
    echo "EOF"
fi

