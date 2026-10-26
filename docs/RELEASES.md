# Releases

## How Claude Code detects updates

Users get a new copy of a plugin **only when its version changes**. The version is read from `plugin.json` first, then from the `marketplace.json` entry. If you push new commits without changing `version`, users stay on the cached copy.

Our rule: `version` is set **only in `plugin.json`** and is bumped in every release. We don't duplicate it in the `marketplace.json` entry (otherwise `validate` warns about the mismatch, and `plugin.json` wins anyway).

## SemVer

| Change | Version | Example |
| :- | :- | :- |
| Removed/renamed a skill, agent or command; changed the `userConfig` format; new required dependency | MAJOR | `1.4.2` → `2.0.0` |
| New skill/agent/command, new optional setting | MINOR | `1.0.0` → `1.1.0` |
| Prompt fixes, hook bug fixes, documentation | PATCH | `1.1.0` → `1.1.1` |

## Tags

Every plugin release is marked with a git tag in the format Claude Code uses to resolve version ranges in `dependencies`:

```text
<plugin-name>--v<version>
```

For example, `sdd-engineering--v1.0.0`. Tags are created **automatically** on `main`: after every merge, the [Tag releases](../.github/workflows/release-tags.yml) workflow runs `scripts/tag-releases.mjs`, which tags each plugin whose `plugin.json` version has no tag yet. It refuses to tag a version lower than one already released.

## Scripts

All scripts use Node built-ins only and commit nothing: you review the result, commit and open a PR as usual.

| Script | What it does |
| :- | :- |
| `node scripts/release.mjs <plugin> <major\|minor\|patch\|X.Y.Z>` | Bumps `version` in `plugin.json`, moves `## [Unreleased]` in `CHANGELOG.md` into a dated version section, runs the linter |
| `node scripts/rollback.mjs <plugin> <good-version>` | Restores the plugin folder from `<plugin>--v<good-version>`, keeps the current CHANGELOG, sets the version to the next PATCH and adds a changelog entry, runs the linter |
| `node scripts/tag-releases.mjs [--push]` | Creates missing release tags for the current commit. Runs in CI; locally use `--dry-run` to preview. Tags that are not SemVer are ignored |
| `node scripts/check-version-bump.mjs <base-ref>` | Fails if a plugin's files changed since `<base-ref>` but its `version` did not go up. Runs on every PR; locally: `node scripts/check-version-bump.mjs origin/main` |

`release.mjs`, `rollback.mjs` and `tag-releases.mjs` accept `--dry-run`. `release.mjs` and `rollback.mjs` also accept `--date YYYY-MM-DD`.

Every change to a plugin's folder, including its README, ships to users only with a new version, so the PR check requires a bump for any changed file under `plugins/<name>/`. A new plugin passes without one.

## Release process

1. While working on the change, add entries under `## [Unreleased]` in `plugins/<name>/CHANGELOG.md` (format: [PLUGIN-GUIDELINES.md](PLUGIN-GUIDELINES.md#changelogmd)).
2. On your branch, prepare the release:

   ```bash
   node scripts/release.mjs sdd-engineering minor
   ```

3. `claude plugin validate . --strict`, commit, open a PR.
4. Merge the PR into `main`. The `sdd-engineering--v1.1.0` tag is created automatically.

## Update (for users)

Auto-update is enabled in `/plugin` → **Marketplaces** → **Enable auto-update**. Manually:

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update <plugin-name>@dev-digest-ai-marketplace
```

## Rollback

One marketplace version serves one version of each plugin, so a rollback is a new release:

1. **Quick rollback:** restore the plugin contents from the previous tag and **bump** the PATCH version (for example, broken `1.1.0` → rollback as `1.1.1` with the code of `1.0.0`). Setting the number back to `1.0.0` won't work for those who already have `1.1.0`. The script does all of this:

   ```bash
   git fetch --tags
   node scripts/rollback.mjs sdd-engineering 1.0.0
   # review the diff, commit, PR, merge: 1.1.1 is tagged automatically
   ```

   The plugin's `CHANGELOG.md` must have no unreleased entries; the folder must have no uncommitted changes.

2. **Pinning a single user:** a user can add the marketplace at a specific ref:

   ```bash
   claude plugin marketplace add OlegDEma/devdigest_team_ai_marketplace#<tag-or-branch>
   ```

3. **Removing a plugin entirely:** remove its entry from `plugins`, add `"<name>": null` to `renames`; if needed, set `"forceRemoveDeletedPlugins": true` so the plugin is removed from users' machines.

## Renaming

We don't change `name`. For a different name in the UI, use `displayName`. If a rename is unavoidable, add to `marketplace.json`:

```json
"renames": { "old-name": "new-name" }
```

`renames` is append-only; never delete old entries.
