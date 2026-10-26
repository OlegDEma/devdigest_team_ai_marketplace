# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-26

### Added

- `researcher` agent: read-only research in two modes (repository research including git history, and external research via WebSearch/WebFetch), with a clarification gate, a 40-turn budget with a reserve, and structured reports (answer and confidence, findings with `path:line` or source citations, an explicit "Not found / unverified" list, scope and limits) that can be passed as-is to `sdd-engineering:spec-creator` and `sdd-engineering:implementation-planner`.
