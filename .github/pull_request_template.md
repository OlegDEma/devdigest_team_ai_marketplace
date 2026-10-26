## What changed

<!-- New plugin / plugin update / catalog or docs change. Briefly — why. -->

## Plugin(s)

- Name:
- Version: `x.y.z` → `x.y.z`
- Change type (SemVer): MAJOR / MINOR / PATCH

## Checklist

- [ ] `node scripts/validate-marketplace.mjs` passes
- [ ] `claude plugin validate . --strict` passes
- [ ] `name` in `marketplace.json` matches `name` in `plugin.json`; the `name` of an existing plugin is unchanged
- [ ] `version` is bumped with `node scripts/release.mjs` (only in `plugin.json`), and the plugin's `CHANGELOG.md` has an entry
- [ ] Descriptions, README and CHANGELOG are in English
- [ ] Plugin installed locally (`claude plugin marketplace add ./` → `claude plugin install <name>@dev-digest-ai-marketplace`) and every skill/command run
- [ ] Dependencies on other plugins are declared in `dependencies`
- [ ] No secrets, tokens or `.env` ([docs/SECURITY.md](../docs/SECURITY.md))
- [ ] Hooks, `scripts/`, `.mcp.json` reviewed: what they run and with which permissions
- [ ] External sources pinned via `sha` / `sha256`
- [ ] The row in the "Plugin catalog" table in `README.md` is updated
