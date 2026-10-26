#!/usr/bin/env bash
# ledger.sh - deterministic counter for "curation due" (engineering-insights plugin).
#
#   ledger.sh record <module> <recorded|none>   one line per wrap-up of engineering-insights
#   ledger.sh status                            tasks since the last `curated` marker; due at THRESHOLD
#   ledger.sh curated                           marker: a human acted on the insight-curator's proposals
#
# Runs ONLY when the skill (or a person) calls it. No network, no hooks, no eval.
# The only file it writes is the ledger: <project root>/.claude/insight-curator/ledger.tsv
# (project root = git top level, else the current directory).
#
# The ledger is append-only. Add `.claude/insight-curator/ledger.tsv merge=union` to
# .gitattributes so parallel branches can both append. Union merge may land lines in
# random order, so `status` counts `task` lines dated AFTER the latest `curated` date,
# plus same-day `task` lines that sit below the last `curated` line of that date. The
# count may be off by a few near a marker, which is fine for a "~10 tasks" trigger.
#
# INSIGHTS_LEDGER overrides the file path (for tests, so the real ledger is untouched).
set -euo pipefail

THRESHOLD=10

if [ -n "${INSIGHTS_LEDGER:-}" ]; then
  LEDGER="$INSIGHTS_LEDGER"
else
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  LEDGER="$ROOT/.claude/insight-curator/ledger.tsv"
fi
HEADER=$'# date\tkind\tmodule\trecorded - append via ledger.sh only'

ensure_file() {
  if [ ! -f "$LEDGER" ]; then
    mkdir -p "$(dirname "$LEDGER")"
    printf '%s\n' "$HEADER" > "$LEDGER"
  fi
}

cmd="${1:-}"
case "$cmd" in
  record)
    module="${2:-}"
    flag="${3:-}"
    # module is a repo-relative directory (or `root`): letters, digits, . _ - /
    case "$module" in
      ""|*[!A-Za-z0-9._/-]*|/*|*..*)
        echo "ledger.sh: module must be 'root' or a repo-relative directory (A-Z a-z 0-9 . _ - /), no '..'" >&2
        exit 2 ;;
    esac
    case "$flag" in
      recorded|none) ;;
      *) echo "ledger.sh: flag must be recorded|none" >&2; exit 2 ;;
    esac
    ensure_file
    printf '%s\ttask\t%s\t%s\n' "$(date +%F)" "$module" "$flag" >> "$LEDGER"
    ;;
  curated)
    ensure_file
    printf '%s\tcurated\t-\t-\n' "$(date +%F)" >> "$LEDGER"
    ;;
  status)
    ensure_file
    read -r since n < <(awk -F'\t' '
      /^#/ || NF < 2 { next }
      $2 == "curated" { if ($1 >= since) { since = $1; last = NR } }
      $2 == "task"    { tasks[NR] = $1 }
      END {
        for (i in tasks) if (tasks[i] > since || (tasks[i] == since && i + 0 > last + 0)) n++
        printf "%s %d\n", (since == "" ? "never" : since), n
      }' "$LEDGER")
    if [ "$n" -ge "$THRESHOLD" ]; then
      verdict="curation due: invoke insight-curator"
    else
      verdict="not due"
    fi
    echo "ledger: $n tasks since $since (threshold $THRESHOLD) - $verdict"
    ;;
  *)
    echo "usage: ledger.sh record <module> <recorded|none> | status | curated" >&2
    exit 2
    ;;
esac
