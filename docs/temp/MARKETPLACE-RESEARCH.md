# Marketplace research

Research into the official Claude Code instructions and community practices this repository is built on. As of October 2026, Claude Code v2.1.292.

## 1. What a marketplace is

A marketplace is a directory or git repository with a `.claude-plugin/marketplace.json` file that lists plugins and where to get each one. Users add it with a single command (`/plugin marketplace add <owner>/<repo>`) and install plugins as `<plugin>@<marketplace>`. The repository can be private.

## 2. Required structure

```text
<root>/                          # marketplace root — all relative paths are resolved from here
├── .claude-plugin/
│   └── marketplace.json
└── plugins/
    └── <plugin>/
        ├── .claude-plugin/plugin.json   # manifest only
        ├── skills/<name>/SKILL.md
        ├── agents/  commands/  hooks/hooks.json
        ├── .mcp.json  .lsp.json
        └── README.md
```

Plugin components live in the plugin root, not in `.claude-plugin/`. `CLAUDE.md` inside a plugin is not loaded.

## 3. `marketplace.json`

Required fields: `name`, `owner.name`, `plugins[]`; each entry needs `name` and `source`.

| Field | Purpose |
| :- | :- |
| `name` | Marketplace identifier: letters, digits, `.`, `_`, `-`. Cannot be a reserved name |
| `owner` | `name` is required, `email`/`url` are not |
| `description` | Without it, `validate` warns |
| `metadata.pluginRoot` | Lets you write `"source": "formatter"` instead of `./plugins/formatter` |
| `renames` | Map of old name → new name or `null`; migrates users' installs |
| `forceRemoveDeletedPlugins` | Removes plugins dropped from the catalog from users' machines |
| `allowCrossMarketplaceDependenciesOn` | Marketplaces that dependencies may be pulled from |

Plugin entry fields: `description`, `version`, `category`, `tags`, `strict`, `displayName`, `dependencies`, `defaultEnabled`, `relevance`, `metadata`, plus any `plugin.json` fields.

### Plugin sources (`source`)

| Type | When |
| :- | :- |
| `"./plugins/x"` | Plugin in this same repository |
| `github` | Separate GitHub repository (`repo`, `ref`, `sha`) |
| `url` | Any git repository by URL |
| `git-subdir` | Subfolder of a monorepo (sparse checkout) |
| `npm` | npm package (install scripts are not run) |
| `archive` | zip over HTTPS with `sha256` |
| `command` | Directory printed by a command on the user's machine |

## 4. `plugin.json`

The only required field is `name` (kebab-case). Important ones: `version`, `description`, `author`, `displayName`, `dependencies`, `userConfig` (values Claude Code asks the user for; `sensitive: true` — stored in the system keychain), `defaultEnabled`.

Component paths are relative with `./`, no `..`. Hooks/MCP use `${CLAUDE_PLUGIN_ROOT}` (plugin files, changes with each update) and `${CLAUDE_PLUGIN_DATA}` (state, survives updates).

## 5. Common pitfalls

1. **Relative paths are resolved from the marketplace root**, not from `.claude-plugin/`. `validate` lets a path to a non-existent folder through; only `install` fails.
2. **Entry `name` ≠ `name` in `plugin.json`** → `Plugin not found in marketplace`. Keep them identical.
3. **Version and updates.** Users get a new copy only when the version changes. `version: "1.0.0"` + new commits without a bump = nobody gets the changes. Either bump on every release, or omit `version` (the version is then the commit SHA). Do not set it in both places: `plugin.json` wins.
4. **`name` is immutable.** To change what is displayed, use `displayName`; for an unavoidable rename, use `renames` (append-only).
5. **Reserved names**: official ones (`claude-plugins-official`, `anthropic-plugins` …), imitations (`official-claude-…`), `github`, `npm`, `inline`, the `claudeai-` prefix. For plugins — the prefixes `claude-`, `anthropic-`, `cc-plugin-`.
6. **Cache.** The plugin is copied into a cache; paths outside the plugin do not work. Symlinks inside the marketplace are dereferenced, those pointing outside are skipped.
7. **Git LFS is not supported** — you get pointer files. Keep large submodules outside plugin folders.
8. **Private repo.** `marketplace.json` has no field for a token; git uses the user's credentials non-interactively. Recommendation: `gh auth login && gh auth setup-git`; without SSH — `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`. `GITHUB_TOKEN` in the environment does not work on its own for background updates.
9. **Auto-update is off by default** — the user enables it in `/plugin`, or an admin via `autoUpdate` in managed settings.
10. **A URL marketplace** (`.../marketplace.json` over HTTPS) does not support relative `source` — only git hosting does.
11. **claude.ai org sync** (Team/Enterprise): the repo must be private; a plugin with `bin/` in its root is rejected.
12. **`validate --strict` on an empty catalog** always fails because of the `Marketplace has no plugins defined` warning.
13. **`validate` does not catch everything**: hooks in a marketplace entry as a path/array, unreachable external `source` — only visible on `install`/load.

## 6. Distribution within the team

- Manually: `claude plugin marketplace add <owner>/<repo>` → `claude plugin install <plugin>@<marketplace>`.
- Per project: `claude plugin marketplace add <owner>/<repo> --scope project` and commit `.claude/settings.json` — the marketplace is registered for everyone who trusts the folder.
- Per organization: an admin sets `extraKnownMarketplaces`, `enabledPlugins`, `autoUpdate` in managed settings; `strictKnownMarketplaces` restricts the allowed marketplaces.
- stable/beta channels — two marketplaces with different `name`s pointing to different `ref`s.

## 7. Community practices

- **CI on every PR**: `claude plugin validate . --strict` + custom policies. Validation in `anthropics/claude-plugins-community` additionally checks alphabetical sorting, duplicates, description length, HTTPS-only, presence of `sha`, hidden Unicode characters.
- **Pin external plugins via `sha`** — plugins run arbitrary code.
- **Review via CODEOWNERS** and a justification for why each plugin is needed.
- **Small focused plugins** instead of one large one; `category`/`tags` for discovery.
- **A README in every plugin**, plus a reference example (like `example-plugin` in the official repo).
- **Frontmatter in `SKILL.md`/agents** is a frequent source of failures; check it in CI.

## How this is reflected in the repository

| Rule | Where |
| :- | :- |
| Plugin structure, manifest, dependencies | [docs/PLUGIN-GUIDELINES.md](../PLUGIN-GUIDELINES.md) |
| Secrets, permissions, script review | [docs/SECURITY.md](../SECURITY.md) |
| SemVer, tags, updates, rollback | [docs/RELEASES.md](../RELEASES.md) |
| Automated checks | [scripts/validate-marketplace.mjs](../../scripts/validate-marketplace.mjs), [.github/workflows/validate.yml](../../.github/workflows/validate.yml) |

## Sources

- [Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Host and maintain a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace.md)
- [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference.md)
- [Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference)
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- [Claude Plugins Validation Action (instagit)](https://instagit.com/anthropics/claude-plugins-community/claude-plugin-validation-action-workflow/)
- [Shared skills, shared success — Medium](https://medium.com/@pekastel/shared-skills-shared-success-how-claude-code-plugins-embed-team-expertise-5012bc0ff232)
