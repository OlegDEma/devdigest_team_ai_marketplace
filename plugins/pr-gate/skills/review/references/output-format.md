# Output format: gate output and stamp

Two outputs from every run: a **human output** (printed to chat and saved to `.claude/reviews/<branch>.report.md`) and a small **stamp** (`.claude/reviews/<branch>.stamp.json`) that a re-run and the optional push hook read to reuse the verdict.

## Human output (fixed shape)

```text
PR Gate: <branch> -> <base>
Verdict: <BLOCKED | PASS WITH WARNINGS | PASS>   (N critical, M warnings, K suggestions)   mode: <report-only | blocking>
Scope: <X> changed files in <slices>  ·  <Y> excluded (lockfiles, build output, docs)
Tier 1: <check>: PASS|FAIL|not wired ...

CRITICAL: must fix before this PR opens
  <path>:<line> · <skill>/<rule>   [confirmed]
    <why: one line + the concrete failure scenario / reproduction>
    Fix: <specific change>

WARNING: should address, does not block
  <path>:<line> · <skill>/<rule>   [flagged, not confirmed]
    <why>
    Fix: <specific change>

SUGGESTION: optional  (showing top 10 of <K>)
  <path>:<line> · <skill>/<rule> - <one-liner>

Waived: <signature - reason>   (omit if none)

What I could not check:
  - <reviewer or skill not installed, check not wired, CI step not run, ...>

Next: <fix the N criticals then re-run  |  nothing blocking, safe to open the PR>
```

Rules:

- Verdict line first; the reader wants the answer immediately.
- Group by severity, then by file; most severe first.
- Every CRITICAL shows `[confirmed]` with its reproduction; a downgraded one shows `[flagged, not confirmed]`.
- De-duplicated: one line per issue; extra rule ids inline (`react-best-practices/keys +1`).
- Cap SUGGESTIONs at the configured number; summarise the rest as a count.
- In report-only mode, say "would block in blocking mode" next to a BLOCKED verdict.
- Mask secrets in quoted evidence.
- "What I could not check" is mandatory, even when empty ("nothing").

## Verdict logic

```text
if any Tier-1 check failed            -> BLOCKED
elif any CONFIRMED CRITICAL remains   -> BLOCKED
elif any WARNING                      -> PASS WITH WARNINGS
else                                  -> PASS
```

## The stamp

Do not hand-write it. Stage 5 calls the writer, which owns the schema in `scripts/gate-lib.mjs`:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gate-stamp.mjs" --write <pass|warn|block> \
     --counts '{"critical":1,"warning":3,"suggestion":5}' [--waivers <sig,...>]
```

```json
{
  "plugin": "pr-gate",
  "version": "1.0.0",
  "base": null,
  "head": "<git rev-parse HEAD>",
  "worktree": "clean | <sha256 of the uncommitted diff + untracked files>",
  "mode": "report-only | blocking",
  "verdict": "pass | warn | block",
  "counts": { "critical": 1, "warning": 3, "suggestion": 5 },
  "waivers": [],
  "generated_at": "2026-10-26T00:00:00Z"
}
```

`head` plus `worktree` is the freshness key: any edit after the review makes the stamp STALE. The detailed findings live in the `.report.md` next to the stamp. Validators judge by the stamp's own `mode`.
