# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-26

### Added

- Agent `security-reviewer`: read-only security verdict (`approve | request_changes | comment`) with `path:line` evidence and `CRITICAL | WARNING | SUGGESTION` findings (`SR-n`) on a plan, a working tree or a named file list; every CRITICAL is adversarially self-verified before it is reported; supports plan-time and post-code lite modes and re-checking earlier finding ids; preloads `engineering-paved-path:security`.
