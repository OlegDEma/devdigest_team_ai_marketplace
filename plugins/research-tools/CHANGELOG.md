# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-10-26

### Added

- `investigator` agent: read-only structural code tracer (definitions, importers and callers, consumers of a field, blast radius of a stated change). No shell, web or write tools; reports an edge table with `path:line` evidence, `(inferred)` markers, drift between duplicate definitions and an explicit "Not searched" list. 25-turn budget.
- `brainstorm` agent: read-only option generator that runs before `/sdd-engineering:spec`. Fixes a rubric first, produces 3-5 options that differ in mechanism (always including "reuse what exists / do nothing"), checks each against the project's decision log, ADRs and specs, scores them, recommends one with a runner-up and a flip condition, and ends with a hand-off block for the spec step. Writes nothing; the human chooses.

### Changed

- `/research-tools:research` skill: a new structural question type (S) is routed to `investigator`; other question types still go to `researcher`.
- `researcher` description and tracing note point to `investigator` for purely structural questions (behavior unchanged).

## [1.1.0] - 2026-10-26

### Added

- `/research-tools:research` skill: quick entry point that turns a request into up to 4 concrete questions, picks the mode (repository, external or both), launches one `researcher` per question in parallel, returns the reports unchanged and, with `save`, writes them to `docs/research/`.

## [1.0.0] - 2026-10-26

### Added

- `researcher` agent: read-only research in two modes (repository research including git history, and external research via WebSearch/WebFetch), with a clarification gate, a 40-turn budget with a reserve, and structured reports (answer and confidence, findings with `path:line` or source citations, an explicit "Not found / unverified" list, scope and limits) that can be passed as-is to `sdd-engineering:spec-creator` and `sdd-engineering:implementation-planner`.
