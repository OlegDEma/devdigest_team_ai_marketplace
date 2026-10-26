// Summarizes .cost-runs/<label> directories: cost, tokens, turns, duration, success.
// usage: node scripts/cost/summarize.mjs <label>...
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const rows = [];
for (const label of process.argv.slice(2)) {
  const dir = join(root, '.cost-runs', label);
  const res = existsSync(join(dir, 'result.json')) ? JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8')) : {};
  const meta = readFileSync(join(dir, 'meta.txt'), 'utf8');
  const u = res.usage ?? {};
  const testsPass = /npm_test_exit=0/.test(meta);
  // The workflow only counts if the implementer and the verifier really ran (not a hand-made implementation).
  // The architecture reviewer is optional since sdd-engineering 1.1.0 (skipped for small single-layer diffs).
  const spawned = res.subagent_stats?.by_type ?? {};
  const workflowRan = ['sdd-engineering:implementer', 'sdd-engineering:plan-verifier']
    .every((t) => spawned[t] >= 1);
  rows.push({
    label,
    success: testsPass && workflowRan && !res.is_error,
    agents: Object.values(spawned).reduce((a, b) => a + b, 0),
    cost_usd: Number((res.total_cost_usd ?? 0).toFixed(4)),
    turns: res.num_turns,
    seconds: Number(/seconds=(\d+)/.exec(meta)?.[1]),
    input: u.input_tokens,
    cache_write: u.cache_creation_input_tokens,
    cache_read: u.cache_read_input_tokens,
    output: u.output_tokens,
  });
}
console.table(rows);
const ok = rows.filter((r) => r.success);
if (ok.length) {
  const mean = ok.reduce((s, r) => s + r.cost_usd, 0) / ok.length;
  console.log(`successful runs: ${ok.length}/${rows.length}; mean cost per successful workflow: $${mean.toFixed(4)}`);
}
