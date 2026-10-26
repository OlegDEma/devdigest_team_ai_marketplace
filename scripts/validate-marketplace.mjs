#!/usr/bin/env node
// Structural linter for the marketplace. Complements `claude plugin validate`
// with team rules from docs/PLUGIN-GUIDELINES.md, docs/SECURITY.md and
// docs/RELEASES.md. Node built-ins only, no dependencies.
//
// Usage: node scripts/validate-marketplace.mjs [marketplace-root]
// Exit code: 0 = ok (warnings allowed), 1 = errors found.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { CYRILLIC_RE, latestRelease, parseChangelog } from "./lib/release-utils.mjs";
import { HIDDEN_UNICODE_RE } from "./lib/safety.mjs";

const root = resolve(process.argv[2] ?? ".");
const errors = [];
const warnings = [];
const error = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
const SHA1_RE = /^[0-9a-f]{40}$/;
const SHA256_RE = /^[0-9a-fA-F]{64}$/;

const RESERVED_MARKETPLACE_NAMES = new Set([
  "claude-code-marketplace", "claude-code-plugins", "claude-plugins-official",
  "anthropic-marketplace", "anthropic-plugins", "agent-skills",
  "anthropic-agent-skills", "life-sciences", "knowledge-work-plugins",
  "claude-for-legal", "claude-for-financial-services", "financial-services-plugins",
  "first-party-plugins", "claude-tag-plugins", "claude-community",
  "claude-plugins-community", "healthcare", "anthropic-plugin-directory",
  "claude-plugin-directory", "inline", "builtin", "skills-dir", "synced",
  "claude-plugin-test", "npm", "pip", "uv", "cargo", "github", "gh",
]);
const RESERVED_PLUGIN_PREFIXES = ["claude-", "anthropic-", "anthropics-", "cc-plugin-"];
const RESERVED_PLUGIN_NAMES = new Set(["claude", "anthropic", "anthropics", "claude-code", "claude-mods"]);
const KNOWN_SOURCE_TYPES = new Set(["github", "url", "git-subdir", "npm", "archive", "command"]);

function readJson(path, where) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    error(where, `cannot parse JSON (${e.message})`);
    return null;
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    const st = statSync(p, { throwIfNoEntry: false });
    if (!st) continue;
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function checkHiddenUnicode(files) {
  for (const f of files) {
    if (!/\.(md|json|ya?ml|sh|mjs|js|ts|py|txt)$/.test(f)) continue;
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (HIDDEN_UNICODE_RE.test(line)) {
        error(`${relative(root, f)}:${i + 1}`, "hidden Unicode (bidi/zero-width) character");
      }
    });
  }
}

// All published text is English (PLUGIN-GUIDELINES.md, Language).
function checkEnglish(where, value) {
  const values = Array.isArray(value) ? value : [value];
  if (values.some((v) => typeof v === "string" && CYRILLIC_RE.test(v))) {
    error(where, "must be written in English (found Cyrillic)");
  }
}

function checkChangelog(dir, where, version) {
  const path = join(dir, "CHANGELOG.md");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  checkEnglish(`${where} CHANGELOG.md`, text);
  const { sections } = parseChangelog(text);
  for (const s of sections) {
    if (s.heading.toLowerCase() !== "unreleased" && !s.date) {
      error(`${where} CHANGELOG.md`, `section [${s.heading}] needs a date: "## [${s.heading}] - YYYY-MM-DD"`);
    }
  }
  const latest = latestRelease({ sections });
  if (version && latest?.heading !== version) {
    error(`${where} CHANGELOG.md`, `newest section is [${latest?.heading ?? "none"}], but plugin.json version is ${version}; use scripts/release.mjs`);
  }
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

function checkPluginDir(entryName, dir, where) {
  const manifestPath = join(dir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    error(where, "missing .claude-plugin/plugin.json (required by PLUGIN-GUIDELINES)");
    return;
  }
  const manifest = readJson(manifestPath, `${where} plugin.json`);
  if (!manifest) return;

  if (manifest.name !== entryName) {
    error(where, `plugin.json name "${manifest.name}" must equal marketplace entry name "${entryName}"`);
  }
  if (!manifest.version) error(where, "plugin.json must set version");
  else if (!SEMVER_RE.test(manifest.version)) error(where, `version "${manifest.version}" is not SemVer`);
  if (!manifest.description) error(where, "plugin.json must set description");
  if (!manifest.author?.name) warn(where, "plugin.json should set author.name");

  const claudePluginEntries = readdirSync(join(dir, ".claude-plugin"));
  for (const f of claudePluginEntries) {
    if (f !== "plugin.json") error(where, `.claude-plugin/ must contain only plugin.json, found "${f}"`);
  }
  if (existsSync(join(dir, "bin"))) error(where, "top-level bin/ is rejected by claude.ai org sync; use scripts/");
  if (existsSync(join(dir, "CLAUDE.md"))) error(where, "CLAUDE.md is not loaded from plugins; move instructions into a skill");
  if (!existsSync(join(dir, "README.md"))) error(where, "missing README.md");
  if (!existsSync(join(dir, "CHANGELOG.md"))) warn(where, "missing CHANGELOG.md");
  checkEnglish(`${where} plugin.json description`, manifest.description);
  checkEnglish(`${where} plugin.json displayName`, manifest.displayName);
  checkEnglish(`${where} plugin.json keywords`, manifest.keywords);
  if (existsSync(join(dir, "README.md"))) checkEnglish(`${where} README.md`, readFileSync(join(dir, "README.md"), "utf8"));
  checkChangelog(dir, where, manifest.version);
  for (const f of walk(dir)) {
    const rel = relative(dir, f);
    if (["README.md", "CHANGELOG.md", ".claude-plugin/plugin.json"].includes(rel)) continue;
    if (/\.(md|json|ya?ml|sh|mjs|js|ts|py|txt)$/.test(f) && CYRILLIC_RE.test(readFileSync(f, "utf8"))) {
      warn(`${where} ${rel}`, "contains Cyrillic; plugin content should be in English");
    }
  }

  const skillsDir = join(dir, "skills");
  if (existsSync(skillsDir)) {
    for (const skill of readdirSync(skillsDir)) {
      const skillPath = join(skillsDir, skill);
      if (!statSync(skillPath).isDirectory()) continue;
      const skillMd = join(skillPath, "SKILL.md");
      if (!existsSync(skillMd)) {
        error(`${where} skills/${skill}`, "missing SKILL.md");
        continue;
      }
      const fm = parseFrontmatter(readFileSync(skillMd, "utf8"));
      if (!fm) error(`${where} skills/${skill}`, "SKILL.md has no YAML frontmatter");
      else {
        if (!fm.name) error(`${where} skills/${skill}`, "SKILL.md frontmatter missing name");
        if (!fm.description) error(`${where} skills/${skill}`, "SKILL.md frontmatter missing description");
        checkEnglish(`${where} skills/${skill} description`, fm.description);
      }
    }
  }

  const agentsDir = join(dir, "agents");
  if (existsSync(agentsDir)) {
    for (const f of walk(agentsDir).filter((p) => p.endsWith(".md"))) {
      const fm = parseFrontmatter(readFileSync(f, "utf8"));
      const rel = relative(dir, f);
      if (!fm) error(`${where} ${rel}`, "agent has no YAML frontmatter");
      else if (!fm.description) error(`${where} ${rel}`, "agent frontmatter missing description");
      else checkEnglish(`${where} ${rel} description`, fm.description);
    }
  }

  const commandsDir = join(dir, "commands");
  if (existsSync(commandsDir)) {
    for (const f of walk(commandsDir).filter((p) => p.endsWith(".md"))) {
      const fm = parseFrontmatter(readFileSync(f, "utf8"));
      if (fm?.description) checkEnglish(`${where} ${relative(dir, f)} description`, fm.description);
    }
  }

  return manifest;
}

function checkExternalSource(src, where) {
  if (!KNOWN_SOURCE_TYPES.has(src.source)) {
    error(where, `unknown source type "${src.source}"`);
    return;
  }
  if (["github", "url", "git-subdir"].includes(src.source)) {
    if (!src.sha) error(where, `${src.source} source must pin "sha" (SECURITY.md)`);
    else if (!SHA1_RE.test(src.sha)) error(where, "sha must be a full 40-char lowercase commit SHA");
  }
  if (src.source === "url" || src.source === "git-subdir") {
    if (typeof src.url === "string" && src.url.startsWith("http://")) error(where, "use https:// URLs only");
  }
  if (src.source === "archive") {
    if (!src.url?.startsWith("https://")) error(where, "archive url must use https://");
    if (!src.sha256) error(where, "archive source must pin sha256");
    else if (!SHA256_RE.test(src.sha256)) error(where, "sha256 must be 64 hex chars");
  }
  if (src.source === "command") warn(where, "command sources run on users' machines; needs security review");
}

// ---- marketplace.json ----

const marketplacePath = join(root, ".claude-plugin", "marketplace.json");
if (!existsSync(marketplacePath)) {
  console.error(`✘ ${relative(process.cwd(), marketplacePath)} not found`);
  process.exit(1);
}
const mp = readJson(marketplacePath, "marketplace.json");
if (!mp) {
  report();
}

if (typeof mp.name !== "string" || !mp.name) error("name", "required");
else {
  if (!KEBAB_RE.test(mp.name)) error("name", `"${mp.name}" must be kebab-case`);
  if (RESERVED_MARKETPLACE_NAMES.has(mp.name.toLowerCase())) error("name", `"${mp.name}" is reserved`);
  if (/^claudeai-/i.test(mp.name)) error("name", "names starting with claudeai- are reserved");
  if (/(official.*(claude|anthropic))|((claude|anthropic).*official)/i.test(mp.name)) {
    error("name", `"${mp.name}" impersonates an official marketplace`);
  }
}
if (!mp.owner?.name) error("owner.name", "required");
if (!mp.description) warn("description", "missing marketplace description");
checkEnglish("description", mp.description);
if (!Array.isArray(mp.plugins)) error("plugins", "must be an array");

const plugins = Array.isArray(mp.plugins) ? mp.plugins : [];
const names = plugins.map((p) => p?.name);
const registeredDirs = new Set();

const sorted = [...names].sort((a, b) => String(a).localeCompare(String(b)));
if (names.join("\n") !== sorted.join("\n")) error("plugins", "entries must be sorted alphabetically by name");

const seen = new Set();
plugins.forEach((entry, i) => {
  const where = `plugins[${i}]${entry?.name ? ` (${entry.name})` : ""}`;
  if (!entry || typeof entry !== "object") return error(where, "must be an object");

  const { name, source } = entry;
  if (!name) error(where, "name is required");
  else {
    if (seen.has(name)) error(where, `duplicate plugin name "${name}"`);
    seen.add(name);
    if (!ID_RE.test(name)) error(where, "name may use only letters, digits, '.', '_', '-'");
    if (!KEBAB_RE.test(name)) error(where, "name must be kebab-case");
    const lower = name.toLowerCase();
    if (RESERVED_PLUGIN_NAMES.has(lower) || RESERVED_PLUGIN_PREFIXES.some((p) => lower.startsWith(p))) {
      error(where, `name "${name}" is reserved for Anthropic`);
    }
  }
  if (!entry.description) error(where, "description is required");
  checkEnglish(`${where} description`, entry.description);
  checkEnglish(`${where} category`, entry.category);
  checkEnglish(`${where} tags`, entry.tags);
  if (entry.version) {
    error(where, "do not set version in marketplace entry; set it only in plugin.json (RELEASES.md)");
  }
  if (entry.dependencies) {
    for (const dep of entry.dependencies) {
      const depName = typeof dep === "string" ? dep : dep?.name;
      const bare = typeof dep === "string" ? !dep.includes("@") : !dep?.marketplace;
      if (bare && depName && !names.includes(depName)) {
        error(where, `dependency "${depName}" is not in this marketplace`);
      }
    }
  }

  if (source === undefined) return error(where, "source is required");
  if (typeof source === "string") {
    if (!source.startsWith("./") && source !== ".") return error(where, `source "${source}" must start with "./"`);
    if (source.split("/").includes("..")) return error(where, `source "${source}" must not contain ".."`);
    if (source.includes("\\")) return error(where, "use forward slashes in source");
    const dir = resolve(root, source);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return error(where, `source dir "${source}" does not exist`);
    registeredDirs.add(dir);
    const manifest = checkPluginDir(name, dir, where);
    for (const dep of manifest?.dependencies ?? []) {
      const depName = typeof dep === "string" ? dep : dep?.name;
      const bare = typeof dep === "string" ? !dep.includes("@") : !dep?.marketplace;
      if (bare && depName && !names.includes(depName)) {
        error(where, `plugin.json dependency "${depName}" is not in this marketplace`);
      }
    }
  } else if (typeof source === "object" && source) {
    checkExternalSource(source, where);
  } else {
    error(where, "source must be a string or an object");
  }
});

// Every folder in plugins/ must be registered, and nothing registered may be missing.
const pluginsRoot = join(root, "plugins");
if (existsSync(pluginsRoot)) {
  for (const d of readdirSync(pluginsRoot)) {
    const p = join(pluginsRoot, d);
    if (statSync(p).isDirectory() && !registeredDirs.has(p)) {
      error(`plugins/${d}`, "directory is not registered in marketplace.json");
    }
  }
}

// renames: targets must resolve to a current plugin or null, without cycles.
if (mp.renames !== undefined) {
  if (typeof mp.renames !== "object" || mp.renames === null || Array.isArray(mp.renames)) {
    error("renames", "must be an object");
  } else {
    for (const from of Object.keys(mp.renames)) {
      if (names.includes(from)) error(`renames.${from}`, "old name is still an active plugin");
      let cur = from;
      const visited = new Set();
      while (cur !== null && cur in mp.renames) {
        if (visited.has(cur)) {
          error(`renames.${from}`, "rename chain has a cycle");
          break;
        }
        visited.add(cur);
        cur = mp.renames[cur];
      }
      if (cur !== null && !visited.has(cur) && !names.includes(cur)) {
        error(`renames.${from}`, `chain ends at "${cur}", which is not in plugins[]`);
      }
    }
  }
}

checkHiddenUnicode([marketplacePath, ...(existsSync(pluginsRoot) ? walk(pluginsRoot) : [])]);

report();

function report() {
  for (const w of warnings) console.log(`⚠ ${w}`);
  for (const e of errors) console.log(`✘ ${e}`);
  if (errors.length) {
    console.log(`\n✘ Marketplace lint failed: ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }
  const count = Array.isArray(mp?.plugins) ? mp.plugins.length : 0;
  console.log(`✔ Marketplace lint passed (${count} plugin(s), ${warnings.length} warning(s))`);
  process.exit(0);
}
