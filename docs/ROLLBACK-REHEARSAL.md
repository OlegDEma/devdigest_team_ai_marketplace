# Rollback rehearsal: sdd-engineering 1.0.0 → 1.1.0 → stable 1.0.0

Rehearsed on 2026-11-03 in an empty project (scope `local`), with `claude` 2.1.311. Procedure: [STABLE-CHANNEL.md](STABLE-CHANNEL.md).

## Steps and evidence

| # | Step | `claude plugin list --json` (scope local) | Smoke eval |
| :- | :- | :- | :- |
| 1 | `marketplace add OlegDEma/devdigest_team_ai_marketplace#stable`, install `sdd-engineering@dev-digest-ai-marketplace-stable` | `sdd-engineering` 1.0.0, `engineering-paved-path` 1.0.0, `research-tools` 1.0.0, `architecture-review` 1.0.0, all enabled, no errors | 5/5 cases, score 1.0 each, $0.89 |
| 2 | Update: uninstall the stable plugin, install `sdd-engineering@dev-digest-ai-marketplace` (main) | `sdd-engineering` 1.1.0 with `engineering-paved-path` 1.1.0, `research-tools` 1.2.0, `architecture-review` 1.0.0, `security-review` 1.0.0, all enabled, no errors | 1.1.0 suite, 6 cases (see below) |
| 3 | Return: uninstall the main plugin (its auto-installed dependencies go with it), install `sdd-engineering@dev-digest-ai-marketplace-stable` | back to the four plugins at 1.0.0, all enabled, no errors | 5/5 cases, score 1.0 each, $0.63 |

Each switch took one uninstall and one install; nothing changed in the repository.

## Eval of the 1.1.0 behaviour

Suite of tag `sdd-engineering--v1.1.0`, run from `plugins/`:

- `skill-review-plan-resolves` (new in 1.1.0: `/sdd-engineering:review-plan` resolves): 1.0.
- `agents-resolve` now launches `security-review:security-reviewer` as well (seven agents): the first run scored 0.89 because the `no-agent-not-found` grader matched in the trace; the same case rerun three times scored 1.0 each time. Treat it as a flaky first run, not a regression, and keep watching it.
- The other four cases: 1.0.

## What the smoke eval does and does not prove

It proves that the skills and agents resolve under their namespaces after install and that the dependency plugins load. It does not run a real workflow; for that see [COST-BASELINE.md](COST-BASELINE.md).

Eval reports (JSON and HTML): [`evidence/eval/`](evidence/README.md).

## Findings

- `claude plugin eval plugins/sdd-engineering` fails for every case: sibling plugins in `plugins:` are outside the containment root. Running it from `plugins/` with `--eval-dir sdd-engineering/evals` works. `STABLE-CHANNEL.md` has the command.
- Dependencies cannot be pinned from the marketplace entry. Installing from the `stable` ref is what yields 1.0.0 for all four, because the dependency plugins are read from the same branch.
- Do not leave both channels enabled for the same plugin in one scope.
