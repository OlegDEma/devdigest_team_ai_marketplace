#!/usr/bin/env bash
# Runs the cost-experiment workflow once: /sdd-engineering:run-plan on the csv-export fixture.
# usage: scripts/cost/run-workflow.sh <label> [claude args...]
# Output: .cost-runs/<label>/{result.json,test-out.txt,meta.txt}; summarize with scripts/cost/summarize.mjs.
# Pass --plugin-dir <ABSOLUTE path> to measure a local copy of sdd-engineering instead of the installed one
# (the script runs in a temp copy of the fixture, so a relative path would not resolve).
set -u
label=${1:?label}; shift
root=$(cd "$(dirname "$0")/../.." && pwd)
work="$root/.cost-runs/$label"
rm -rf "$work"; mkdir -p "$work"; cp -R "$root/docs/cost/fixture/." "$work/"
cd "$work"
git init -q; git add -A; git -c user.email=cost@example.com -c user.name=cost commit -qm base
start=$(date +%s)
claude -p "/sdd-engineering:run-plan plan:docs/plans/2026-10-27-csv-export.md" \
  --permission-mode acceptEdits \
  --allowedTools "Bash(npm:*) Bash(node:*) Bash(git diff:*) Bash(git status:*) Bash(git log:*) Bash(ls:*) Bash(grep:*) Bash(sed:*) Bash(cat:*) Bash(wc:*)" \
  --output-format json --max-budget-usd 6 "$@" > result.json 2> stderr.txt
echo "exit=$? seconds=$(( $(date +%s) - start ))" > meta.txt
npm test > test-out.txt 2>&1; echo "npm_test_exit=$?" >> meta.txt
echo "done: $work"
