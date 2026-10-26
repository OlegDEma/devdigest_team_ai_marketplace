#!/usr/bin/env node
// gate-stamp.mjs - stamp writer and validator. Reviews nothing; it answers, in
// milliseconds, "is there a fresh passing review for exactly this tree?"
//
//   node gate-stamp.mjs                       validate the current branch's stamp
//   node gate-stamp.mjs --write <verdict> [--base ref] [--counts '{"critical":0}'] [--waivers sig,sig]
//
// verdict: pass | warn | block. The mode (report-only | blocking) comes from
// .claude/pr-gate.json and is copied into the stamp, so changing the config later
// never re-judges a review that already ran.
// Validate exit codes: 0 PASS - 1 BLOCKED - 3 STALE - 4 MISSING
// Writes exactly one file: .claude/reviews/<branch>.stamp.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { repoRoot, branchName, stampPathFor, currentTree, readConfig, GATE_VERSION } from "./gate-lib.mjs";

const root = repoRoot();
const branch = branchName(root);
const stampPath = stampPathFor(branch, root);
const args = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

if (args[0] === "--write") {
  const verdict = args[1];
  if (!["pass", "warn", "block"].includes(verdict)) {
    console.error("usage: gate-stamp.mjs --write <pass|warn|block> [--base ref] [--counts json] [--waivers a,b]");
    process.exit(2);
  }
  const cfg = readConfig(root);
  let counts = {};
  try {
    counts = JSON.parse(flag("--counts", "{}"));
  } catch {
    /* leave empty */
  }
  const stamp = {
    plugin: "pr-gate",
    version: GATE_VERSION,
    base: flag("--base", cfg.base),
    ...currentTree(root),
    mode: cfg.mode,
    verdict,
    counts,
    waivers: (flag("--waivers", "") || "").split(",").filter(Boolean),
    generated_at: new Date().toISOString(),
  };
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, JSON.stringify(stamp, null, 2) + "\n");
  console.log(`stamp written: ${stampPath} (${stamp.mode}, verdict=${verdict})`);
  process.exit(0);
}

if (!existsSync(stampPath)) {
  console.log(`MISSING - no review stamp for branch '${branch}'. Run /pr-gate:review.`);
  process.exit(4);
}
let stamp;
try {
  stamp = JSON.parse(readFileSync(stampPath, "utf8"));
} catch {
  console.log("MISSING - the stamp file is unreadable. Run /pr-gate:review.");
  process.exit(4);
}
const now = currentTree(root);
if (stamp.head !== now.head || stamp.worktree !== now.worktree) {
  const s = (x) => String(x).slice(0, 7);
  console.log(
    `STALE - tree changed since the review (stamp ${s(stamp.head)}/${s(stamp.worktree)} -> now ${s(now.head)}/${s(now.worktree)}). Re-run /pr-gate:review.`,
  );
  process.exit(3);
}
if (stamp.mode === "blocking" && stamp.verdict === "block") {
  console.log("BLOCKED - the last review found confirmed CRITICAL(s) under blocking mode.");
  process.exit(1);
}
console.log(`PASS - fresh ${stamp.mode} review (verdict=${stamp.verdict}) for '${branch}'.`);
process.exit(0);
