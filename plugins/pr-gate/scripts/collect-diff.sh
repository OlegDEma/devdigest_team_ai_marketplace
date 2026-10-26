#!/bin/sh
# collect-diff.sh - print the pre-PR review set: files changed on this branch vs the
# base branch PLUS the working tree (staged, unstaged, untracked), minus never-review
# paths. One path per line on stdout; empty output = nothing to review.
# The detected base is printed to stderr as "base: <ref>".
#
# Usage: collect-diff.sh [base]
# Base resolution: argument > $PR_GATE_BASE > origin/HEAD > origin/main > origin/master
#                  > main > master > develop > HEAD (no branch diff, working tree only).
# Read-only: runs only git rev-parse / show-ref / symbolic-ref / merge-base / diff / status.
# Excludes: node_modules, .git, lockfiles, dist/build/.next/coverage output, minified
# files and the gate's own .claude/reviews/ artifacts.
set -eu
cd "$(git rev-parse --show-toplevel)"

base="${1:-${PR_GATE_BASE:-}}"
if [ -z "$base" ]; then
  head_ref="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  if [ -n "$head_ref" ]; then
    base="$head_ref"
  else
    for cand in origin/main origin/master main master develop; do
      if git show-ref --verify --quiet "refs/remotes/$cand" || git show-ref --verify --quiet "refs/heads/$cand"; then
        base="$cand"
        break
      fi
    done
  fi
fi
[ -n "$base" ] || base="HEAD"
echo "base: $base" >&2

{
  if [ "$base" != "HEAD" ]; then
    mb="$(git merge-base HEAD "$base" 2>/dev/null || echo HEAD)"
    git diff --name-only --diff-filter=d "$mb" HEAD 2>/dev/null || true
  fi
  # working tree: strip the two status columns and the rename arrow
  git status --porcelain=v1 --untracked-files=all | sed -e 's/^...//' -e 's/.* -> //' -e 's/^"//' -e 's/"$//'
} \
  | sort -u \
  | grep -vE '(^|/)node_modules/|(^|/)\.git/|(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|go\.sum)$|(^|/)(dist|build|\.next|coverage|\.turbo)/|\.min\.(js|css)$|^\.claude/reviews/' \
  || true
