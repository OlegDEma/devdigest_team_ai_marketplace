# Contributing

All materials in this repository — docs, plugin manifests, skill/agent/command descriptions, READMEs and changelogs — are written in English. The linter fails on Cyrillic in published fields (see [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md#language)).

## Adding a plugin

1. Create a branch `plugin/<plugin-name>`.
2. Add a `plugins/<plugin-name>/` folder following [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md), with a `CHANGELOG.md` whose first version section matches `version` in `plugin.json`.
3. Register the plugin in `.claude-plugin/marketplace.json` (keep entries in alphabetical order):

   ```json
   {
     "name": "<plugin-name>",
     "source": "./plugins/<plugin-name>",
     "description": "One sentence: what the plugin does",
     "category": "engineering",
     "tags": ["sdd"]
   }
   ```

4. Check locally:

   ```bash
   node scripts/validate-marketplace.mjs
   claude plugin validate ./plugins/<plugin-name>
   claude plugin validate . --strict
   claude plugin marketplace add ./
   claude plugin install <plugin-name>@dev-digest-ai-marketplace
   ```

   Run every skill/command at least once in a real session.
   To see how the plugin looks in the catalog, run `npm install && npm run dev` and open http://localhost:5173.
5. Add a row to the "Plugin catalog" table in [README.md](README.md).
6. Open a PR and fill in the checklist below. After merge, the `<plugin-name>--v<version>` tag is created automatically.

## Changing a plugin

- Describe every change under `## [Unreleased]` in the plugin's `CHANGELOG.md`.
- Any change users should receive needs a version bump: run `node scripts/release.mjs <plugin-name> <major|minor|patch>` on your branch — see [docs/RELEASES.md](docs/RELEASES.md). Without it, users stay on the cached copy, and the PR check `scripts/check-version-bump.mjs` fails.
- To undo a bad release, use `node scripts/rollback.mjs <plugin-name> <good-version>` — never lower the version by hand.
- Never change a plugin's `name`. For a new name in the UI, use `displayName`. If a rename is unavoidable, add an entry to `renames` in `marketplace.json`.

## PR checklist

- [ ] `node scripts/validate-marketplace.mjs` and `claude plugin validate . --strict` pass with no errors or warnings
- [ ] `name` in `marketplace.json` matches `name` in `plugin.json`
- [ ] `version` bumped per SemVer with `scripts/release.mjs`, entry added to the plugin's `CHANGELOG.md`
- [ ] All descriptions, README and CHANGELOG are in English; changelog text has nothing internal (it is published on the catalog site)
- [ ] Plugin installed and checked locally
- [ ] No secrets, tokens or `.env` (see [docs/SECURITY.md](docs/SECURITY.md))
- [ ] Hooks and scripts reviewed: what they run and with which permissions
- [ ] Dependencies on other plugins declared in `dependencies`

## Review

Owners from [CODEOWNERS](CODEOWNERS) approve every PR. Changes to `hooks/`, `.mcp.json`, `scripts/` and `bin/` need a separate security review.
