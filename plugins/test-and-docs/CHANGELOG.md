# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-26

### Added

- `test-writer` agent: writes one test for a named behavior, edge case or reported bug (failing first for bugs), discovers the project's test runner, helpers and mocks, reuses them, runs the test it wrote and reports the real result. Never changes production code and never skips, weakens or deletes an existing test. Routes to `engineering-paved-path` skills by what the test touches.
- `doc-writer` agent: documents an implemented feature from a plan, an implementation report or the code, with a Mermaid diagram (`engineering-paved-path:mermaid-diagram` preloaded). Classifies the document (tutorial, how-to, reference, explanation, or a declared fallback), discovers the project's docs layout, updates a neighbouring doc before adding a file and links the result from the project's agent map. Never writes specs or plans.
