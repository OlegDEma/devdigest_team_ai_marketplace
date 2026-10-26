# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-26

### Added

- `engineering-insights` skill: records non-obvious learnings after a non-trivial task into the `INSIGHTS.md` of the touched module (routing, dedupe, fixed sections, dated append-only format, quality bar, "skip when nothing non-obvious"), recalls them before work, and keeps a ledger of completed tasks that reports "curation due" at about 10.
- `scripts/ledger.sh` helper (no network, runs only when the skill calls it, writes only `.claude/insight-curator/ledger.tsv` in the project).
- `insight-curator` agent: read-only audit of all `INSIGHTS.md` files (duplicates, contradictions, stale evidence, misfiled entries, files near the split point, promotion candidates) that returns a proposal table and edits nothing.
