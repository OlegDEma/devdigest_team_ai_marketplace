#!/usr/bin/env node
// run-checks.mjs - Tier-1 deterministic gate. Detects the project's OWN checks for the
// packages that contain changed files and runs them. Invents no commands.
//
//   node run-checks.mjs [--list] [--with-build] [--base <ref>]
//
//   --list         print the plan (what would run) and run nothing
//   --with-build   also run each package's `build` script (slow; skipped by default)
//   --base <ref>   base branch override (otherwise auto-detected by collect-diff.sh)
//
// Detection sources, in order of authority:
//   1. package.json "scripts" of the nearest package.json above each changed file
//      (typecheck | type-check | check-types | tsc, lint, test | test:unit, build)
//   2. Makefile targets in the package directory (typecheck, lint, test, check, build)
//   3. CI config (.github/workflows, .gitlab-ci.yml): printed as hints ONLY, never run
//
// Safety: only commands already declared by the project itself are run, through
// spawnSync with an argument array and no shell; no network access of its own; no git
// writes; each check has a timeout (PR_GATE_TIMEOUT_MS, default 600000).
// Exit: 0 all passed or nothing to check - 1 at least one check failed.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const withBuild = args.includes("--with-build");
const baseIdx = args.indexOf("--base");
const baseArg = baseIdx >= 0 ? args[baseIdx + 1] : undefined;
const timeout = Number(process.env.PR_GATE_TIMEOUT_MS) || 600000;

const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
if (top.status !== 0) {
  console.error("run-checks: not inside a git repository");
  process.exit(2);
}
const root = top.stdout.trim();

const collected = spawnSync("sh", [join(here, "collect-diff.sh"), ...(baseArg ? [baseArg] : [])], {
  cwd: root,
  encoding: "utf8",
});
const changed = collected.stdout.split("\n").filter(Boolean);
const baseLine = /base: (.+)/.exec(collected.stderr || "");
if (changed.length === 0) {
  console.log("Tier-1: no changed files - nothing to check.");
  process.exit(0);
}

const CATEGORIES = [
  ["typecheck", ["typecheck", "type-check", "check-types", "tsc"], ["typecheck"]],
  ["lint", ["lint"], ["lint"]],
  ["test", ["test", "test:unit"], ["test", "check"]],
  ["build", ["build"], ["build"]],
];
const NPM_DEFAULT_TEST = /no test specified/;

function nearestPackageDir(file) {
  let dir = dirname(resolve(root, file));
  while (dir.startsWith(root)) {
    if (existsSync(join(dir, "package.json"))) return dir;
    if (dir === root) break;
    dir = dirname(dir);
  }
  return existsSync(join(root, "Makefile")) ? root : null;
}

function packageManager(dir) {
  let d = dir;
  while (d.startsWith(root)) {
    if (existsSync(join(d, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(d, "yarn.lock"))) return "yarn";
    if (existsSync(join(d, "bun.lock")) || existsSync(join(d, "bun.lockb"))) return "bun";
    if (existsSync(join(d, "package-lock.json"))) return "npm";
    if (d === root) break;
    d = dirname(d);
  }
  return "npm";
}

function makeTargets(dir) {
  for (const name of ["Makefile", "makefile", "GNUmakefile"]) {
    const p = join(dir, name);
    if (existsSync(p)) {
      const targets = new Set();
      for (const line of readFileSync(p, "utf8").split("\n")) {
        const m = /^([A-Za-z0-9_.-]+)\s*:(?!=)/.exec(line);
        if (m) targets.add(m[1]);
      }
      return targets;
    }
  }
  return new Set();
}

const dirs = new Set();
for (const f of changed) {
  const d = nearestPackageDir(f);
  if (d) dirs.add(d);
}

const plan = []; // {label, dir, cmd, argv}
for (const dir of dirs) {
  const rel = relative(root, dir) || ".";
  let scripts = {};
  try {
    scripts = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).scripts || {};
  } catch {
    /* no package.json (Makefile-only dir) */
  }
  const targets = makeTargets(dir);
  const pm = packageManager(dir);
  for (const [category, scriptNames, makeNames] of CATEGORIES) {
    if (category === "build" && !withBuild) continue;
    const script = scriptNames.find(
      (n) => scripts[n] && !(category === "test" && NPM_DEFAULT_TEST.test(scripts[n])),
    );
    if (script) {
      const argv = pm === "npm" ? ["run", "--silent", script] : ["run", script];
      plan.push({ label: `${rel} · ${category}`, dir, cmd: pm, argv });
      continue;
    }
    const target = makeNames.find((n) => targets.has(n));
    if (target) plan.push({ label: `${rel} · ${category}`, dir, cmd: "make", argv: [target] });
  }
}

// CI hints: show what the project's CI runs, but never execute it.
function ciHints() {
  const hints = [];
  const files = [];
  const wf = join(root, ".github", "workflows");
  if (existsSync(wf)) for (const f of readdirSync(wf)) if (/\.ya?ml$/.test(f)) files.push(join(wf, f));
  if (existsSync(join(root, ".gitlab-ci.yml"))) files.push(join(root, ".gitlab-ci.yml"));
  for (const f of files) {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = /^\s*(?:-\s*)?(?:run:\s*)?(.+)$/.exec(line);
      const isCommandLine = /^\s*(-\s*)?run:\s*\S|^\s*-\s+(npm|pnpm|yarn|bun|npx|make|tsc|eslint|vitest|jest|pytest|go|cargo)\b/.test(line);
      if (m && isCommandLine && /\b(typecheck|type-check|tsc|lint|test|build|check)\b/.test(m[1])) {
        hints.push(`${relative(root, f)}: ${m[1].trim()}`);
      }
    }
  }
  return hints.slice(0, 10);
}

if (baseLine) console.log(`Base: ${baseLine[1]}`);
if (plan.length === 0) {
  console.log("Tier-1: no typecheck/lint/test scripts or Makefile targets found for the changed packages.");
  console.log("        Report this as 'no deterministic checks wired' - do not mark checks as passed.");
  for (const h of ciHints()) console.log(`  ci hint (not run): ${h}`);
  process.exit(0);
}

console.log(`Tier-1 deterministic checks${listOnly ? " (plan only)" : ""}${withBuild ? " (with build)" : ""}`);
let failed = 0;
for (const item of plan) {
  const shown = `${item.cmd} ${item.argv.join(" ")}`;
  if (listOnly) {
    console.log(`  ${item.label.padEnd(36)} ${shown}`);
    continue;
  }
  const r = spawnSync(item.cmd, item.argv, {
    cwd: item.dir,
    encoding: "utf8",
    timeout,
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, CI: "1" }, // keeps test runners out of watch mode
  });
  const ok = r.status === 0 && !r.error;
  console.log(`  ${item.label.padEnd(36)} ${ok ? "PASS" : "FAIL"}   (${shown})`);
  if (!ok) {
    failed++;
    const out = `${r.stdout || ""}${r.stderr || ""}${r.error ? String(r.error.message) : ""}`;
    console.log(out.split("\n").slice(-25).map((l) => `      ${l}`).join("\n"));
  }
}
for (const h of ciHints()) if (!listOnly) console.log(`  ci hint (not run): ${h}`);

if (listOnly) process.exit(0);
console.log(failed ? `\nTier-1: FAILED (${failed}) - each failure is a deterministic CRITICAL.` : "\nTier-1: all checks passed.");
process.exit(failed ? 1 : 0);
