# PR Gate

A local pre-PR merge gate. Before you open or update a pull request, `/pr-gate:review` collects everything pending (branch vs the detected base branch **plus** the working tree), runs the project's own checks, routes slices to review skills and agents that are already installed, puts all findings on one severity scale (CRITICAL / WARNING / SUGGESTION), adversarially verifies every CRITICAL, writes a freshness stamp and reports. It ships **report-only**: it tells you what would block and never stops you. Blocking mode is opt-in.

## Install

```bash
claude plugin install pr-gate@dev-digest-ai-marketplace
```

**Dependencies: none declared.** The gate works on its own (own checks, tripwires, project conventions). It uses these plugins *when they are installed* and reports "could not check" when they are not:

| Optional plugin | Used for |
| :- | :- |
| `engineering-paved-path` | `react-best-practices`, `next-best-practices`, `fastify-best-practices`, `react-testing-library`, `typescript-expert`, `zod`, `architecture`, `security` rules per slice |
| `architecture-review` | `architecture-reviewer` for layer and boundary verdicts on the backend slice |
| `security-review` | `security-reviewer` for a deep pass on auth/secrets/input-handling files |

## What's inside

| Component | Type | Invocation | Purpose |
| :- | :- | :- | :- |
| `review` | skill | `/pr-gate:review [base] [--with-build]` | The six-stage gate: collect, deterministic checks, route and review, verify and waive, decide and stamp, report. |
| `scripts/collect-diff.sh` | script | called by the skill | Prints the review set; auto-detects the base branch. |
| `scripts/run-checks.mjs` | script | called by the skill | Detects and runs the project's typecheck / lint / test (and optionally build) per changed package. |
| `scripts/gate-stamp.mjs` | script | called by the skill and the optional hook | Writes and validates the freshness stamp. |

## How it works

1. **Collect.** Changed files vs the merge-base with the base branch (`origin/HEAD`, then `origin/main`, `origin/master`, `main`, `master`, `develop`; override with an argument, `PR_GATE_BASE` or `base` in the config) plus staged, unstaged and untracked files. Lockfiles and build output are dropped. Empty or docs-only diffs stop here.
2. **Deterministic checks (Tier 1).** For each package containing changed files: its `typecheck`, `lint` and `test` scripts from `package.json` (package manager chosen from the lockfile), or the same-named Makefile targets. `build` only with `--with-build`. CI config is shown as hints, never run. A failure is a CRITICAL; a missing check is reported as "not wired", never as passed.
3. **Route and review (Tier 2).** Slices (frontend, tests, backend, schema, contracts, security-sensitive) go to one reviewer each (at most 4), using the optional plugins above when present, plus the cross-file tripwires: schema change without migration, new route without auth/validation, committed secret, debug leftovers, contract/consumer mismatch, dangerous commands, wrong package manager.
4. **Verify and waive.** A separate verifier tries to disprove each CRITICAL. Refuted ones become "flagged, not confirmed" WARNINGs. Waivers are recorded in `.claude/reviews/waivers.md` with a three-strike rule.
5. **Decide and stamp.** The verdict (`pass`, `warn`, `block`) is written with the commit and a fingerprint of uncommitted changes, so any later edit makes the stamp stale.
6. **Report.** Verdict first, then findings with `path:line`, consequence and fix, then "What I could not check".

## Where state lives

In **your project**, not in the plugin or `${CLAUDE_PLUGIN_DATA}`:

- `.claude/reviews/<branch>.stamp.json` and `.report.md`: written by the gate. A stamp belongs to one repository and branch and may be committed or read by a team member; `${CLAUDE_PLUGIN_DATA}` is per user and invisible to the repository. You may want `.claude/reviews/*.report.md` in `.gitignore`.
- `.claude/reviews/waivers.md`: the waiver ledger (created on the first waiver).
- `.claude/pr-gate.json` (optional): `{ "mode": "report-only" | "blocking", "base": null, "caps": { "max_review_agents": 4, "max_suggestions_shown": 10 } }`.

## Blocking mode (opt-in)

Create `.claude/pr-gate.json` with `{ "mode": "blocking" }`. A confirmed, unwaived CRITICAL (or a failed Tier-1 check) then makes the skill refuse to run `gh pr create` or push, offer fixes, and re-run after you approve them. "Open anyway" is honored when you say it, and the unresolved CRITICALs should then be noted in the PR body. This is enforced by the skill's instructions, not by the operating system: it is a guard rail for a careful developer, not a security boundary.

## Optional: run the gate automatically on `git push`

The plugin does **not** ship an active hook: an always-on push hook is intrusive, and a hook shipped by a plugin runs for every user. If you want it, add this to your **project** `.claude/settings.json` (or your user settings) yourself:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git push*)",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Before executing this git push command, run the pr-gate:review skill (or check the stamp with: node <path-to-plugin>/scripts/gate-stamp.mjs). Review the diff against the base branch for bugs, leftover debug code and secrets, and report the verdict before pushing."
          }
        ]
      }
    ]
  }
}
```

What it does: a `prompt` hook adds an instruction to Claude every time it is about to run a command matching `git push*`. It runs no script itself and does not block the push; Claude runs the gate (which executes your project's own check scripts and writes `.claude/reviews/`), then pushes or, in blocking mode, stops. Adjust the matcher (for example add `Bash(gh pr create*)`) to taste.

## Safety notes (scripts need a separate security review)

- `collect-diff.sh` runs read-only git commands (`rev-parse`, `show-ref`, `symbolic-ref`, `merge-base`, `diff --name-only`, `status`) and `sort`/`sed`/`grep`.
- `gate-stamp.mjs` and `gate-lib.mjs` run read-only git commands through `execFileSync` with argument arrays (no shell) and write only `.claude/reviews/<branch>.stamp.json` (branch name sanitised).
- `run-checks.mjs` runs only commands the project itself declares (`package.json` scripts, Makefile targets) through `spawnSync` without a shell, with a timeout and `CI=1`. Running them is equivalent to you typing `npm test`; do not use the gate in a repository whose scripts you do not trust.
- No network access, no `eval`, no destructive git commands, no dependencies beyond Node 18+ and POSIX `sh`.

## Evals

The original skill had a prompt-based eval suite in a custom `evals.json` format. It is not ported, because it does not run unchanged under the plugin eval format (`case.yaml` / `prompt.md` plus graders) and its fixtures were specific to another stack.

## Limits

- It reviews with the models and skills available in your session; it is not a substitute for human review or CI.
- The stamp is local evidence. It does not stop a raw `git push` or the GitHub Merge button.
- Monorepo detection is by nearest `package.json`; Python, Go or Rust projects are covered only through Makefile targets.
