// gate-lib.mjs - the one place the stamp contract and project config live, so the
// stamp writer and the stamp validator can never drift.
// Node built-ins only. No network. Git is invoked read-only (rev-parse, diff,
// ls-files) through execFileSync with argument arrays - never through a shell.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const GATE_VERSION = "1.0.0";
export const REVIEWS_DIR = join(".claude", "reviews");
export const CONFIG_FILE = join(".claude", "pr-gate.json");

export function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

export function repoRoot() {
  return git(["rev-parse", "--show-toplevel"]);
}

export function branchName(root = repoRoot()) {
  return git(["rev-parse", "--abbrev-ref", "HEAD"], root);
}

// The branch name is sanitised before it becomes a file name, so a branch such as
// "feature/../../x" can never escape .claude/reviews/.
export function stampPathFor(branch, root = repoRoot()) {
  return join(root, REVIEWS_DIR, `${branch.replace(/[^\w.-]/g, "__").replace(/\.{2,}/g, "_")}.stamp.json`);
}

// Optional project config: .claude/pr-gate.json
//   { "mode": "report-only" | "blocking", "base": "<ref or null>", "caps": { ... } }
// Missing or unreadable file means report-only with auto-detected base.
export function readConfig(root = repoRoot()) {
  let cfg = {};
  try {
    cfg = JSON.parse(readFileSync(join(root, CONFIG_FILE), "utf8"));
  } catch {
    /* defaults below */
  }
  const mode = cfg.mode === "blocking" ? "blocking" : "report-only";
  return { base: null, caps: {}, ...cfg, mode };
}

// Tree fingerprint. HEAD pins the commit; `worktree` folds in uncommitted changes so
// any edit after a review makes the stamp STALE. "clean" means nothing uncommitted.
// Files under .claude/reviews/ are excluded, otherwise writing the stamp would
// change the tree and invalidate its own freshness.
export function worktreeHash(root = repoRoot()) {
  let diff = "";
  try {
    diff = git(["diff", "HEAD", "--", ".", ":!.claude/reviews"], root);
  } catch {
    /* no HEAD yet */
  }
  const others = git(["ls-files", "--others", "--exclude-standard"], root)
    .split("\n")
    .filter((f) => f && !f.startsWith(".claude/reviews/"));
  if (!diff && others.length === 0) return "clean";
  const h = createHash("sha256").update(diff);
  for (const f of others) {
    h.update("\0" + f + "\0");
    try {
      h.update(readFileSync(join(root, f)));
    } catch {
      /* vanished or unreadable - the name still counts */
    }
  }
  return h.digest("hex");
}

export function currentTree(root = repoRoot()) {
  return { head: git(["rev-parse", "HEAD"], root), worktree: worktreeHash(root) };
}
