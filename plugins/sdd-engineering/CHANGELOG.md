# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.1] - 2026-10-26

### Changed

- The planner and implementer skill routing tables now include `engineering-paved-path:drizzle-orm-patterns` and `engineering-paved-path:postgresql-table-design`, so data steps no longer fall back to `none`.
- Requires `engineering-paved-path` `^1.1.0`.

## [1.1.0] - 2026-10-26

### Added

- `review-plan` skill: `/sdd-engineering:review-plan plan:<path>` runs `architecture-review:architecture-reviewer` (and `security-review:security-reviewer` when the spec or plan names untrusted input, auth, external I/O or secrets) in plan-time mode on a plan, relays a verdict of at most 15 lines and the findings, and never edits the plan or the spec.
- `run-plan` launches `security-review:security-reviewer` in the same parallel message as `plan-verifier` and `architecture-reviewer` whenever the diff touches source code; the owner can skip it with `security:skip`.
- `run-plan` pre-flight suggests `review-plan` when the plan header shows no review, and the final report suggests the `pr-gate` plugin's `pr-self-review` skill when it is installed (no dependency).
- Dependency on `security-review` `^1.0.0`.
- Eval case `skill-review-plan-resolves`; `agents-resolve` now also launches `security-review:security-reviewer`, and every case loads the `security-review` plugin.

### Changed

- `run-plan` fix list and re-review delta include security `CRITICAL` and `WARNING` findings (`SR-n`); the same security reviewer re-checks its own ids. This replaces the conditional `general-purpose` security fallback.

## [1.0.0] - 2026-10-26

### Added

- `spec-creator` agent: writes a feature specification (what and why, EARS acceptance criteria, edge cases, contracts, diagrams) in rounds of gap-finding questions; writes only spec files, by default `docs/specs/YYYY-MM-DD-slug.md`.
- `implementation-planner` agent: two-pass planner (requirements review with the single- vs multi-agent question, then a phased plan in `docs/plans/`) that maps every step to an acceptance criterion and to an `engineering-paved-path` skill or `none`; preloads `engineering-paved-path:architecture`.
- `implementer` agent: executes plan phases, writes tests per acceptance criterion, verifies with the plan's commands or the project's own, and returns an Implementation Report.
- `plan-verifier` agent: read-only check of every acceptance criterion as Met, Not met or Unverifiable with evidence, re-running the plan's verification commands; ends with a machine-readable summary.
- `spec` skill: `/sdd-engineering:spec` entry point that runs `spec-creator` rounds and fans out `research-tools:researcher` requests in parallel.
- `run-plan` skill: `/sdd-engineering:run-plan` runs implementers by the plan's DAG, then `architecture-review:architecture-reviewer` and `plan-verifier` in parallel, then a bounded fix cycle.
- `workflow-retro` skill: `/sdd-engineering:workflow-retro` (manual only) with `scripts/collect.py`, which derives the transcript folder from the working directory and reports tokens, agents, timeline, parallelism and tool errors.
- Namespace smoke eval suite in `evals/` for `claude plugin eval`.
- Dependencies on `engineering-paved-path`, `research-tools` and `architecture-review`, each `^1.0.0`.
