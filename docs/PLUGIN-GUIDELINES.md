# Plugin guidelines

Rules every plugin in `plugins/` must follow. The source of truth is the official Claude Code documentation: [Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference) and [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference.md).

## Plugin structure

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # ONLY the manifest, nothing else in this folder
├── skills/
│   └── <skill-name>/
│       └── SKILL.md
├── agents/
│   └── <agent-name>.md
├── commands/                # prefer skills/ for new plugins
├── hooks/
│   └── hooks.json
├── scripts/                 # executables for hooks/MCP
├── .mcp.json                # if needed
├── CHANGELOG.md
└── README.md
```

Rules:

- `skills/`, `agents/`, `hooks/` etc. live in the **plugin root**, not in `.claude-plugin/`.
- `CLAUDE.md` inside a plugin is not loaded — write instructions for Claude as a skill.
- Do not use a `bin/` folder in the plugin root: claude.ai org sync rejects such plugins. Executables go in `scripts/`.
- No paths outside the plugin folder (`..`). The plugin is copied into a cache, and external files are not available there. For code shared between plugins, use a symlink inside the marketplace (it is dereferenced on copy).
- Do not store plugin files in Git LFS — a clone only gets pointer files.

## Manifest `plugin.json`

```json
{
  "name": "sdd-engineering",
  "displayName": "SDD Engineering",
  "version": "1.0.0",
  "description": "Spec-driven development: from specification to code and review",
  "author": { "name": "DevDigest Team" },
  "license": "UNLICENSED",
  "keywords": ["sdd", "engineering"],
  "dependencies": []
}
```

| Field | Rule |
| :- | :- |
| `name` | Required. kebab-case, Latin characters. Matches `name` in `marketplace.json`. Immutable after the first release |
| `version` | Required for us. SemVer. Set **only** in `plugin.json`, not in the marketplace entry |
| `description` | One sentence on what the plugin does |
| `author` | `name` is required |
| `displayName` | Human-readable name for the UI, may change |

Forbidden names: those with the prefixes `claude-`, `anthropic-`, `cc-plugin-`, and any that imitate official Anthropic plugins.

## Paths and environment variables

- Paths in the manifest are relative and start with `./`.
- In hooks and MCP configs, refer to plugin files via `${CLAUDE_PLUGIN_ROOT}`, quoted: `"\"${CLAUDE_PLUGIN_ROOT}\"/scripts/check.sh"`.
- State, cache and `node_modules` go in `${CLAUDE_PLUGIN_DATA}`, because `${CLAUDE_PLUGIN_ROOT}` changes with every update.

## Dependencies

If a plugin uses skills/agents from another plugin, declare it in `dependencies`:

```json
"dependencies": [
  "core-conventions",
  { "name": "code-review", "version": "^1.2.0" }
]
```

- A bare name is resolved in this same marketplace.
- Version ranges are resolved against git tags `<plugin>--v<version>` (see [RELEASES.md](RELEASES.md)).
- Dependencies on plugins from other marketplaces are allowed only for marketplaces listed in `allowCrossMarketplaceDependenciesOn`.
- The dependency graph must be acyclic. Shared base components go into a separate "core" plugin.

## Registration in the marketplace

```json
{
  "name": "sdd-engineering",
  "source": "./plugins/sdd-engineering",
  "description": "Spec-driven development: from specification to code and review",
  "category": "engineering",
  "tags": ["sdd", "specs"]
}
```

- `source` is relative to the repository root (the folder containing `.claude-plugin/`), prefixed with `./`.
- Entries are sorted alphabetically by `name`.
- A plugin from another repository is added via a `github`/`git-subdir` source **with a mandatory `sha`**.

## Language

All plugin content is written in English:

- `plugin.json`: `description`, `displayName`, `keywords`.
- Marketplace entry: `description` and `tags`.
- Frontmatter of skills, agents and commands.
- `README.md` and `CHANGELOG.md`.

`scripts/validate-marketplace.mjs` fails on Cyrillic in any of the above and warns on Cyrillic elsewhere in plugin files (e.g. skill bodies).

## CHANGELOG.md

Format: [Keep a Changelog](https://keepachangelog.com/).

```markdown
# Changelog

## [Unreleased]

### Added
- New `spec-critic` agent.

## [1.0.0] - 2026-10-20

### Added
- First release.
```

Rules:

- Authors add entries under `## [Unreleased]` in their PR, using the subsections `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`.
- `scripts/release.mjs` turns `Unreleased` into a dated version section.
- The newest version section must equal `version` in `plugin.json` (the validator checks this).
- Dates are `YYYY-MM-DD`.
- Changelog text is published on the public catalog site: no internal secrets or hosts.

The release flow is described in [RELEASES.md](RELEASES.md).

## Verification

```bash
claude plugin validate ./plugins/<plugin-name>
claude plugin validate . --strict
```

`validate` does not catch everything: a non-existent `source`, hook loading errors and external source errors only show up during `claude plugin install`. That is why a local install is mandatory.
