// Shared helpers for release.mjs, rollback.mjs, tag-releases.mjs and the
// marketplace linter. Node built-ins only, no dependencies.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
export const CYRILLIC_RE = /[\u0400-\u04FF]/;

export class UsageError extends Error {}

export function fail(msg) {
  throw new UsageError(msg);
}

// Runs a script entry point: prints UsageError messages without a stack trace.
export function main(fn) {
  try {
    fn();
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    console.error(`✘ ${e.message}`);
    process.exit(1);
  }
}

export function parseArgs(argv, flags = []) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const [key, inline] = a.slice(2).split("=", 2);
    if (!flags.includes(key)) fail(`unknown option --${key}`);
    if (inline !== undefined) opts[key] = inline;
    else if (["root", "date", "remote"].includes(key)) opts[key] = argv[++i];
    else opts[key] = true;
  }
  return { opts, positional };
}

// ---- SemVer ----

export function parseSemver(v) {
  const m = SEMVER_RE.exec(v ?? "");
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ? m[4].slice(1) : "" };
}

export function compareSemver(a, b) {
  const x = parseSemver(a);
  const y = parseSemver(b);
  for (const k of ["major", "minor", "patch"]) if (x[k] !== y[k]) return x[k] - y[k];
  // A pre-release sorts before the release it precedes.
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  return x.pre < y.pre ? -1 : 1;
}

export function bumpSemver(version, kind) {
  const v = parseSemver(version);
  if (!v) fail(`current version "${version}" is not SemVer`);
  if (kind === "major") return `${v.major + 1}.0.0`;
  if (kind === "minor") return `${v.major}.${v.minor + 1}.0`;
  if (kind === "patch") return `${v.major}.${v.minor}.${v.patch + 1}`;
  if (!parseSemver(kind)) fail(`"${kind}" is not major, minor, patch or a SemVer version`);
  return kind;
}

export function bumpKind(from, to) {
  if (!from) return "new";
  const a = parseSemver(from);
  const b = parseSemver(to);
  if (a.major !== b.major) return "major";
  if (a.minor !== b.minor) return "minor";
  return "patch";
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---- git ----

export function git(root, args, { allowFail = false } = {}) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (r.status !== 0 && !allowFail) fail(`git ${args.join(" ")} failed:\n${r.stderr.trim()}`);
  return r.status === 0 ? r.stdout.trim() : null;
}

export function tagName(plugin, version) {
  return `${plugin}--v${version}`;
}

export function tagExists(root, tag) {
  return git(root, ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], { allowFail: true }) !== null;
}

export function isPathClean(root, path) {
  return git(root, ["status", "--porcelain", "--", path]) === "";
}

// ---- marketplace and plugins ----

export function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJsonFile(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

// Returns local plugins registered in marketplace.json: { name, dir, rel }.
export function localPlugins(root) {
  const mpPath = join(root, ".claude-plugin", "marketplace.json");
  if (!existsSync(mpPath)) fail(`${mpPath} not found`);
  const mp = readJsonFile(mpPath);
  return (mp.plugins ?? [])
    .filter((p) => typeof p?.source === "string")
    .map((p) => ({ name: p.name, rel: p.source.replace(/^\.\//, ""), dir: resolve(root, p.source) }));
}

export function findPlugin(root, name) {
  const plugin = localPlugins(root).find((p) => p.name === name);
  if (!plugin) fail(`"${name}" is not a local plugin in marketplace.json`);
  return plugin;
}

export function manifestPath(plugin) {
  return join(plugin.dir, ".claude-plugin", "plugin.json");
}

export function changelogPath(plugin) {
  return join(plugin.dir, "CHANGELOG.md");
}

// ---- CHANGELOG (Keep a Changelog) ----

const SECTION_RE = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/;

// Splits a changelog into its preamble and "## [x]" sections, keeping raw text.
export function parseChangelog(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const preamble = [];
  const sections = [];
  for (const line of lines) {
    const m = SECTION_RE.exec(line);
    if (m) sections.push({ heading: m[1], date: m[2] ?? null, body: [] });
    else if (sections.length) sections.at(-1).body.push(line);
    else preamble.push(line);
  }
  for (const s of sections) s.body = s.body.join("\n").trim();
  return { preamble: preamble.join("\n").trimEnd(), sections };
}

export function formatChangelog({ preamble, sections }) {
  const parts = [preamble || "# Changelog"];
  for (const s of sections) {
    const heading = s.date ? `## [${s.heading}] - ${s.date}` : `## [${s.heading}]`;
    parts.push(s.body ? `${heading}\n\n${s.body}` : heading);
  }
  return parts.join("\n\n") + "\n";
}

// Newest released (non-Unreleased) section, or null.
export function latestRelease(changelog) {
  return changelog.sections.find((s) => s.heading.toLowerCase() !== "unreleased") ?? null;
}

export function unreleasedSection(changelog) {
  return changelog.sections.find((s) => s.heading.toLowerCase() === "unreleased") ?? null;
}

// ---- validator ----

export function runValidator(root) {
  const script = new URL("../validate-marketplace.mjs", import.meta.url).pathname;
  const r = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  if (r.status !== 0) fail("marketplace lint failed; fix the errors above");
}
