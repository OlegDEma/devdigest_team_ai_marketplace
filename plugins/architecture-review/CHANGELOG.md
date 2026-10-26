# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-26

### Added

- Agent `architecture-reviewer`: read-only architectural verdict (`approve | request_changes | comment`) with `path:line` evidence and `CRITICAL | WARNING | SUGGESTION` findings, on a plan, a working tree or a named file list, judged against the project's own layer map; preloads `engineering-paved-path:architecture`.
