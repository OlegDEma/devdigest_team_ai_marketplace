# Evidence

Raw results behind [COST-BASELINE.md](../COST-BASELINE.md) and [ROLLBACK-REHEARSAL.md](../ROLLBACK-REHEARSAL.md). Measured 2026-11-03 with `claude` 2.1.311.

## Evals (`eval/`)

Each result has a `.json` (full run: prompts, graders, per-run scores) and a self-contained `.html` report; open the HTML in a browser.

| Files | Plugin version | Suite | Result |
| :- | :- | :- | :- |
| `1-stable-1.0.0-smoke` | `sdd-engineering` 1.0.0, `stable` branch | 5 smoke cases | 5/5, score 1.0 each, $0.89 |
| `2-main-1.1.0-suite` | 1.1.0, tag `sdd-engineering--v1.1.0` | 6 cases, incl. new `skill-review-plan-resolves` | 5/6 at 1.0; `agents-resolve` 0.89 (grader `no-agent-not-found` matched once) |
| `3-main-1.1.0-agents-resolve-x3` | 1.1.0 | `agents-resolve`, 3 runs | 3/3, score 1.0 each: the failure above did not reproduce |
| `4-stable-1.0.0-smoke-after-rollback` | 1.0.0, `stable` branch, after main → stable | 5 smoke cases | 5/5, score 1.0 each, $0.63 |

Command: `cd plugins && claude plugin eval . --eval-dir sdd-engineering/evals --ablation none --no-publish --trust-plugin` (see [STABLE-CHANNEL.md](../STABLE-CHANNEL.md)). A smoke eval proves that skills and agents resolve under their namespaces after install; it does not run a real workflow.

## Cost runs (`cost/`)

`runs-summary.txt` is the output of `node scripts/cost/summarize.mjs …`; `<label>.result.json` is the `claude -p --output-format json` result of each run (cost, usage, subagent counts, final report).

| Labels | Variant |
| :- | :- |
| `base1`–`base3` | 1.0.0, three agents (reference) |
| `v110_1`–`v110_3` | **baseline**, 1.1.0, four agents |
| `opt1`–`opt3` | **optimized**, 1.2.0, three agents |
| `gate1` | quality gate: plan §10 names a layering risk, the architecture reviewer still runs (it also spent one fix round, so its cost is not comparable) |

The `turns` and token columns of `runs-summary.txt` describe the main session only; `cost_usd` includes every subagent. Do not average across variants: the all-runs line at the bottom of the table mixes them. Use the per-variant means in `COST-BASELINE.md`.
