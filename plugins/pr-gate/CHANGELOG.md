# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-26

### Added

- `/pr-gate:review` skill: a local pre-PR merge gate with six stages (collect, deterministic checks, route and review, verify and waive, decide and stamp, report). Report-only by default; blocking mode is opt-in via `.claude/pr-gate.json`.
- `scripts/collect-diff.sh`: collects the branch diff against an auto-detected base branch plus the working tree.
- `scripts/run-checks.mjs`: detects and runs the project's own typecheck, lint, test (and optionally build) from `package.json` scripts and Makefile targets, per changed package; CI config is shown as hints only.
- `scripts/gate-stamp.mjs` and `scripts/gate-lib.mjs`: freshness stamp writer and validator stored in `.claude/reviews/`.
- Generic cross-file tripwires, the adversarial verifier brief, waivers with a three-strike rule, and the report and stamp format.
- Documented opt-in `git push` prompt hook in the README (no hook is shipped active).
