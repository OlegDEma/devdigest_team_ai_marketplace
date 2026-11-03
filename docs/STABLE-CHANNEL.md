# Stable channel

Two marketplaces serve the same repository:

| Channel | Marketplace name | Ref | Content |
| :- | :- | :- | :- |
| main | `dev-digest-ai-marketplace` | `main` | Latest released versions of every plugin |
| stable | `dev-digest-ai-marketplace-stable` | `stable` branch | Only versions that passed the checks below, promoted by hand |

The names differ on purpose: Claude Code identifies a plugin as `<plugin>@<marketplace>`, so both channels can be added on one machine without clashing. The `stable` branch is a snapshot of the repository whose `.claude-plugin/marketplace.json` has the stable marketplace `name`; everything else is the verified state of `main`.

Currently promoted: `sdd-engineering` 1.0.0, `engineering-paved-path` 1.0.0, `research-tools` 1.0.0, `architecture-review` 1.0.0 (commit `8dca7ba`, tag `sdd-engineering--v1.0.0`).

## Install from stable

```bash
claude plugin marketplace add OlegDEma/devdigest_team_ai_marketplace#stable
claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable
claude plugin list --json   # every plugin enabled, no errors
```

Per project, so the whole team gets it:

```bash
claude plugin marketplace add OlegDEma/devdigest_team_ai_marketplace#stable --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable --scope project
```

Dependencies come from the same branch, so installing `sdd-engineering` from stable pulls the stable `engineering-paved-path`, `research-tools` and `architecture-review` (all 1.0.0).

## Return from main to stable (rollback)

Use this when a release on `main` is broken and the previous version must be back on the user's machine today. It needs no release and no change in the repository.

```bash
claude plugin uninstall sdd-engineering@dev-digest-ai-marketplace --scope <scope>
claude plugin marketplace add OlegDEma/devdigest_team_ai_marketplace#stable
claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable --scope <scope>
claude plugin list --json
```

Install only one channel of a plugin per scope: both register the same skill and agent names (`sdd-engineering:run-plan`), so having both enabled is ambiguous. Then run the smoke eval (see *Check before promoting*) to confirm the rolled-back version works.

To fix `main` for everyone, do the release rollback from [RELEASES.md](RELEASES.md#rollback) (a new PATCH with the old content).

## Check before promoting

A version is promoted only when all of these hold:

1. Its tag exists (`<plugin>--v<version>`) and `claude plugin validate . --strict` passes on that commit.
2. The plugin's eval suite is green. Run it from the `plugins/` folder: the cases load sibling plugins by relative path, and `claude plugin eval` only allows plugins under the folder it runs against, so `claude plugin eval plugins/<name>` rejects them.

   ```bash
   cd plugins
   claude plugin eval . --eval-dir <name>/evals --ablation none --max-cost-usd 3 --no-publish --trust-plugin
   ```

   Record the result in the plugin's `RELEASES.md`.
3. A real workflow ran on it end to end (for `sdd-engineering`: `/sdd-engineering:run-plan` on the fixture in [`cost/fixture`](cost/fixture) via `scripts/cost/run-workflow.sh`).
4. `claude plugin list --json` shows the plugin and its dependencies enabled without errors after a clean install from the `stable` ref.

## Promote a new verified version

Work on a local clone; `<ref>` is the verified commit or tag on `main`.

```bash
git fetch --tags origin
git switch stable
git rm -r -q --ignore-unmatch plugins
git checkout <ref> -- plugins            # plugin folders exactly as released
git checkout <ref> -- .claude-plugin/marketplace.json
# restore the stable identity in .claude-plugin/marketplace.json:
#   "name": "dev-digest-ai-marketplace-stable"  and the stable "description"
claude plugin validate . --strict
git commit -am "stable: promote <plugin> <version>"
git push origin stable
```

Users on the stable channel get the new version at the next marketplace update, because the version in `plugin.json` changes. Keep `stable` protected: push only after the checks above, and review the diff like a release PR.

## Limits

- A plugin's own dependencies follow the version ranges in its `plugin.json` (`^1.0.0`), resolved against the tags of this repository. The `stable` branch supplies the plugin folders, so the dependencies that were installed in the check above are the ones from the stable snapshot; if a dependency range is widened later, re-run the check.
- `stable` holds one version of each plugin. Several stable lines (for example 1.x and 2.x) would need a second branch and marketplace name.
