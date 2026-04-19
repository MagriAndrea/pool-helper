#!/usr/bin/env bash
# Symlinks agency-agents .md files into .claude/agents/ (flat structure)
# so Claude Code can discover them as native subagents.
#
# Why symlinks (not copies):
#  - agency-agents is a git submodule (auto-updates on `git submodule update --remote`)
#  - no duplicated content committed to this repo (.claude/agents/ is gitignored)
#
# Safe to re-run: removes stale symlinks first.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/.agents/agency-agents"
DEST_DIR="$REPO_ROOT/.claude/agents"

if [ ! -d "$SRC_DIR" ]; then
  echo "ERROR: agency-agents submodule not found at $SRC_DIR"
  echo "Run: git submodule update --init --recursive"
  exit 1
fi

mkdir -p "$DEST_DIR"

# Clean only broken/existing symlinks (don't touch real files if any)
find "$DEST_DIR" -maxdepth 1 -type l -delete

# Agent categories to include. README/CONTRIBUTING/LICENSE at submodule root
# are skipped because we only walk these subdirectories.
CATEGORIES=(
  academic
  design
  engineering
  finance
  game-development
  integrations
  marketing
  paid-media
  product
  project-management
  sales
  spatial-computing
  specialized
  strategy
  support
  testing
)

count=0
for cat in "${CATEGORIES[@]}"; do
  cat_dir="$SRC_DIR/$cat"
  [ -d "$cat_dir" ] || continue
  while IFS= read -r -d '' agent_file; do
    base="$(basename "$agent_file")"
    # Only link files whose frontmatter starts with `name:` on line 2
    # (real agents). Skips READMEs, briefs, and other prose docs.
    if [ "$(sed -n '1p' "$agent_file")" != "---" ]; then continue; fi
    if ! sed -n '2,6p' "$agent_file" | grep -q '^name:'; then continue; fi
    ln -sf "$agent_file" "$DEST_DIR/$base"
    count=$((count + 1))
  done < <(find "$cat_dir" -type f -name '*.md' -print0)
done

echo "Linked $count agents into $DEST_DIR"
echo "Restart Claude Code to pick up the new subagents."
