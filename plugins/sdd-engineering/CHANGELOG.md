# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
