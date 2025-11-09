#!/bin/bash
# Script to merge multiple worktree branches into a consolidated branch

set -e

MAIN_REPO="/home/cb/wayfarer"
CONSOLIDATED_BRANCH="fix-all-critical-issues-$(date +%Y%m%d)"
TARGET_BRANCH="${1:-master}"  # Default to master, or pass as first argument

cd "$MAIN_REPO"

echo "=== Worktree Merge Strategy ==="
echo "Target branch: $TARGET_BRANCH"
echo "Consolidated branch: $CONSOLIDATED_BRANCH"
echo ""

# List all branches that need merging
BRANCHES_TO_MERGE=(
    "fix-critical-issues-hSL5g"
    "fix-critical-issues-4EWF7"
    "fix-critical-quest-issues-05aU0"
    "fix-critical-quest-issues-Y1OcQ"
    "fix-critical-quest-issues-pawYy"
    "feat-dev-setup-NQXnc"
)

# Check if we should merge QJkVC (has unique commit)
if git log --oneline master..2025-11-04-jaux-QJkVC | grep -q .; then
    echo "Note: 2025-11-04-jaux-QJkVC has unique commits, may need manual review"
fi

echo "Step 1: Create/checkout consolidated branch"
if git show-ref --verify --quiet refs/heads/"$CONSOLIDATED_BRANCH"; then
    echo "Branch $CONSOLIDATED_BRANCH already exists, switching to it..."
    git checkout "$CONSOLIDATED_BRANCH"
else
    echo "Creating new branch $CONSOLIDATED_BRANCH from $TARGET_BRANCH..."
    git checkout -b "$CONSOLIDATED_BRANCH" "$TARGET_BRANCH"
fi

echo ""
echo "Step 2: Merging branches..."
for branch in "${BRANCHES_TO_MERGE[@]}"; do
    echo "  Checking branch: $branch"
    
    # Check if branch has commits ahead of current branch
    if git log --oneline "$CONSOLIDATED_BRANCH".."$branch" | grep -q .; then
        echo "    → Merging $branch (has unique commits)"
        if git merge "$branch" --no-edit; then
            echo "    ✓ Successfully merged $branch"
        else
            echo "    ✗ Merge conflict in $branch - resolve manually"
            echo "    After resolving, run: git merge --continue"
            exit 1
        fi
    else
        echo "    → Skipping $branch (no unique commits)"
    fi
done

echo ""
echo "Step 3: Summary"
echo "Current branch: $(git branch --show-current)"
echo "Commits ahead of $TARGET_BRANCH:"
git log --oneline "$TARGET_BRANCH".."$CONSOLIDATED_BRANCH" | head -10

echo ""
echo "=== Next Steps ==="
echo "1. Review the merged changes: git log $TARGET_BRANCH..$CONSOLIDATED_BRANCH"
echo "2. Test the merged code"
echo "3. Merge to $TARGET_BRANCH: git checkout $TARGET_BRANCH && git merge $CONSOLIDATED_BRANCH"
echo "4. Push: git push origin $CONSOLIDATED_BRANCH"
echo ""
echo "To handle backend file (wayfarer-nakama submodule):"
echo "  cd wayfarer-nakama && git add nakama-data/modules/index.js && git commit -m 'Add RPC functions'"

