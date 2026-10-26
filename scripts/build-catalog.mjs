// Builds the data for the catalog site from the repository: reads
// .claude-plugin/marketplace.json and plugins/, writes catalog.json and
// feed.xml. Only an allowlist of metadata is published; file bodies and hook
// commands never reach the output. Node built-ins only, no dependencies.
//
// Usage: node scripts/build-catalog.mjs [--root <dir>] [--out <dir>] [--repo owner/name]
// Exit code: 0 = ok, 1 = invalid input or an unsafe published string.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { bumpKind, fail, git, main, parseChangelog, parseSemver, today } from "./lib/release-utils.mjs";
import { unsafeReason } from "./lib/safety.mjs";

const SECTION_NAMES = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];
const SCRIPT_RE = /([\w.-]+\.(?:sh|bash|js|mjs|cjs|ts|py|rb|ps1))\b/;

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return fail(`${path}: ${e.message}`);
  }
};
const posix = (p) => p.split("\\").join("/");
const titleCase = (s) => s.split(/[-_]/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

/** Frontmatter with single-line, quoted and YAML block-scalar (`>` / `|`) values. */
export function parseFrontmatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fields = {};
  const lines = m[1].split("\n");
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^[>|][+-]?$/.test(value)) {
      const folded = value[0] === ">";
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === "")) block.push(lines[++i].trim());
      value = block.join(folded ? " " : "\n").trim();
    } else if (/^(["']).*\1$/.test(value)) {
      value = value.slice(1, -1);
    }
    fields[kv[1]] = value;
  }
  return fields;
}

/** `### Added` + `- item` lines of one changelog section → { Added: [...] }. */
export function parseSectionBody(body) {
  const out = {};
  let current = null;
  for (const raw of body.split("\n")) {
    const h = raw.match(/^###\s+(.+?)\s*$/);
    if (h) {
      current = SECTION_NAMES.find((n) => n.toLowerCase() === h[1].toLowerCase()) ?? null;
      continue;
    }
    if (!current) continue;
    const item = raw.match(/^\s*[-*]\s+(.*)$/);
    if (item) (out[current] ??= []).push(item[1].trim());
    else if (/^\s+\S/.test(raw) && out[current]?.length) out[current][out[current].length - 1] += ` ${raw.trim()}`;
  }
  return out;
}

/** Agent descriptions often carry `<example>` blocks and escaped newlines; keep the first readable part. */
export function cleanDescription(text, max = 400) {
  const flat = String(text ?? "")
    .replace(/<example>[\s\S]*?<\/example>/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 200 ? cut.lastIndexOf(" ") : max).replace(/[,;:.\s]+$/, "")}…`;
}

function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d, prefix) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.isDirectory()) walk(join(d, e.name), `${prefix}${e.name}:`);
      else if (e.name.endsWith(".md")) out.push({ file: join(d, e.name), name: prefix + e.name.slice(0, -3) });
    }
  };
  walk(dir, "");
  return out;
}

function readChangelog(dir, pluginPath, root) {
  const path = join(dir, "CHANGELOG.md");
  if (!existsSync(path)) return [];
  const released = parseChangelog(readFileSync(path, "utf8")).sections.filter((s) => s.heading.toLowerCase() !== "unreleased");
  const entries = released.map((s) => ({
    version: s.heading,
    date: s.date ?? (git(root, ["log", "-1", "--format=%cs", "--", pluginPath], { allowFail: true }) || today()),
    sections: parseSectionBody(s.body),
  }));
  return entries.map((e, i) => {
    const older = entries[i + 1]?.version;
    const v = parseSemver(e.version);
    if (!v) return { ...e, bump: "patch" };
    if (older && parseSemver(older)) return { ...e, bump: bumpKind(older, e.version) };
    // Oldest known entry: a first release, or an undocumented bump of the same kind.
    const first = /^(1\.0\.0|0\.1\.0|0\.0\.1)$/.test(`${v.major}.${v.minor}.${v.patch}`);
    return { ...e, bump: first ? "new" : v.patch ? "patch" : v.minor ? "minor" : "major" };
  });
}

function readHooks(dir, manifest) {
  const file = join(dir, "hooks", "hooks.json");
  const config = existsSync(file) ? readJson(file) : typeof manifest.hooks === "object" && manifest.hooks ? manifest.hooks : null;
  const byEvent = config?.hooks ?? {};
  const out = [];
  for (const [event, groups] of Object.entries(byEvent)) {
    for (const group of Array.isArray(groups) ? groups : []) {
      const commands = (group.hooks ?? []).map((h) => (typeof h.command === "string" ? h.command.match(SCRIPT_RE)?.[1] : null));
      // Only the script file name is published, never the command string.
      out.push({ event, matcher: typeof group.matcher === "string" ? group.matcher : "", script: commands.find(Boolean) ?? "" });
    }
  }
  return out;
}

function readMcp(dir, manifest) {
  const file = join(dir, ".mcp.json");
  const config = existsSync(file) ? readJson(file) : typeof manifest.mcpServers === "object" && manifest.mcpServers ? manifest : null;
  const servers = config?.mcpServers ?? (config && !config.mcpServers ? config : {});
  return Object.entries(servers).filter(([, c]) => c && typeof c === "object").map(([name, c]) => ({
    name,
    transport: c.type === "http" || c.type === "sse" ? c.type : c.url ? "http" : "stdio",
  }));
}

function uniqueSlug(base, used) {
  const slug = base.toLowerCase().replace(/[^a-z0-9:._-]+/g, "-").replace(/^-+|-+$/g, "") || "item";
  let candidate = slug;
  for (let n = 2; used.has(candidate); n++) candidate = `${slug}-${n}`;
  used.add(candidate);
  return candidate;
}

function buildLocalPlugin(entry, root) {
  const rel = posix(entry.source.replace(/^\.\//, "")).replace(/\/$/, "");
  const dir = join(root, rel);
  const manifestFile = join(dir, ".claude-plugin", "plugin.json");
  const manifest = existsSync(manifestFile) ? readJson(manifestFile) : {};
  const changelog = readChangelog(dir, rel, root);
  const components = {
    hooks: readHooks(dir, manifest),
    mcpServers: readMcp(dir, manifest),
    scripts: existsSync(join(dir, "scripts")) ? readdirSync(join(dir, "scripts"), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort() : [],
  };
  const plugin = {
    name: entry.name,
    displayName: manifest.displayName || titleCase(entry.name),
    version: manifest.version ?? "0.0.0",
    description: manifest.description || entry.description || "",
    author: manifest.author?.name || entry.author?.name || "",
    license: manifest.license || "UNLICENSED",
    category: entry.category || "uncategorized",
    tags: strings(entry.tags),
    keywords: strings(manifest.keywords),
    dependencies: (manifest.dependencies ?? []).map((d) => (typeof d === "string" ? d : { name: d.name, version: d.version })).filter((d) => (typeof d === "string" ? d : d.name)),
    external: false,
    path: rel,
    lastReleasedAt: changelog[0]?.date ?? (git(root, ["log", "-1", "--format=%cs", "--", rel], { allowFail: true }) || today()),
    hasReadme: existsSync(join(dir, "README.md")),
    components,
    changelog,
  };

  const used = new Set();
  const artifacts = [];
  const add = (type, name, description, file, slugBase = name, extra = {}) => {
    artifacts.push({ id: `${entry.name}/${type}/${uniqueSlug(slugBase, used)}`, type, name, description, plugin: entry.name, path: posix(relative(root, file)), ...extra });
  };

  const skillsDir = join(dir, "skills");
  if (existsSync(skillsDir)) {
    for (const e of readdirSync(skillsDir, { withFileTypes: true }).filter((x) => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(skillsDir, e.name, "SKILL.md");
      if (!existsSync(file)) continue;
      const fm = parseFrontmatter(readFileSync(file, "utf8"));
      add("skill", fm.name || e.name, cleanDescription(fm.description), file, e.name);
    }
  }
  for (const [type, folder] of [["agent", "agents"], ["command", "commands"]]) {
    for (const { file, name } of listMarkdown(join(dir, folder))) {
      const fm = parseFrontmatter(readFileSync(file, "utf8"));
      add(type, type === "agent" ? fm.name || name : name, cleanDescription(fm.description), file, name);
    }
  }
  const hooksFile = existsSync(join(dir, "hooks", "hooks.json")) ? join(dir, "hooks", "hooks.json") : manifestFile;
  for (const h of components.hooks) {
    const label = h.matcher ? `${h.event} · ${h.matcher}` : h.event;
    // No prose: the site composes the sentence from these fields in its own language.
    add("hook", label, "", hooksFile, label, { hook: { event: h.event, matcher: h.matcher, script: h.script } });
  }
  for (const s of components.mcpServers) add("mcp", s.name, "", existsSync(join(dir, ".mcp.json")) ? join(dir, ".mcp.json") : manifestFile, s.name, { mcp: { transport: s.transport } });

  return { plugin, artifacts };
}

function buildExternalPlugin(entry) {
  const ref = typeof entry.source === "object" ? entry.source : {};
  return {
    plugin: {
      name: entry.name,
      displayName: titleCase(entry.name),
      version: entry.version ?? ref.ref ?? "",
      description: entry.description ?? "",
      author: entry.author?.name ?? "",
      license: "UNLICENSED",
      category: entry.category || "uncategorized",
      tags: strings(entry.tags),
      keywords: [],
      dependencies: [],
      external: true,
      path: null,
      lastReleasedAt: today(),
      hasReadme: false,
      components: null,
      changelog: [],
    },
    artifacts: [],
  };
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 864e5);
}

function computeStats(plugins, artifacts, generatedAt) {
  const local = plugins.filter((p) => !p.external);
  const pct = (pred) => (local.length ? Math.round((100 * local.filter(pred).length) / local.length) : 0);
  const issues = [];
  for (const p of local) {
    if (!p.changelog.length) issues.push({ plugin: p.name, kind: "no-changelog" });
    else if (p.changelog[0].version !== p.version) issues.push({ plugin: p.name, kind: "version-mismatch", params: { version: p.version, latest: p.changelog[0].version } });
    if (!p.hasReadme) issues.push({ plugin: p.name, kind: "no-readme" });
    const age = daysBetween(p.lastReleasedAt, generatedAt.slice(0, 10));
    if (age > 180) issues.push({ plugin: p.name, kind: "stale", params: { days: age } });
    // Hooks and MCP servers carry structured data instead of prose, so they never count here.
    for (const a of artifacts.filter((x) => x.plugin === p.name && !x.description && !x.hook && !x.mcp)) {
      issues.push({ plugin: p.name, kind: "empty-description", params: { type: a.type, name: a.name } });
    }
  }
  const count = (t) => artifacts.filter((a) => a.type === t).length;
  return {
    plugins: plugins.length,
    skills: count("skill"),
    agents: count("agent"),
    commands: count("command"),
    pluginsWithHooks: plugins.filter((p) => p.components?.hooks.length).length,
    mcpServers: count("mcp"),
    health: {
      readme: pct((p) => p.hasReadme),
      changelog: pct((p) => p.changelog.length > 0),
      tags: pct((p) => p.tags.length > 0 || p.keywords.length > 0),
      issues,
    },
  };
}

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildFeed(catalog, siteUrl) {
  const entries = catalog.plugins.flatMap((p) => p.changelog.map((c) => ({ ...c, plugin: p })));
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.plugin.name.localeCompare(b.plugin.name));
  const items = entries.slice(0, 50).map((e) => {
    const body = Object.entries(e.sections).map(([sec, list]) => `${sec}: ${list.join("; ")}`).join("\n");
    return `    <item>
      <title>${xml(`${e.plugin.displayName} ${e.version}`)}</title>
      <link>${xml(`${siteUrl}#/plugin/${e.plugin.name}`)}</link>
      <guid isPermaLink="false">${xml(`${e.plugin.name}@${e.version}`)}</guid>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <description>${xml(body)}</description>
    </item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(catalog.marketplace.name)}: what's new</title>
    <link>${xml(siteUrl)}</link>
    <description>${xml(items.length ? "Plugin releases" : "No releases yet")}</description>
${items.join("\n")}
  </channel>
</rss>
`;
}

function detectRepo(root, flag) {
  if (flag) return flag;
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const url = git(root, ["remote", "get-url", "origin"], { allowFail: true }) ?? "";
  return url.match(/github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/)?.[1] ?? "owner/repo";
}

export function buildCatalog(root, repo) {
  const file = join(root, ".claude-plugin", "marketplace.json");
  if (!existsSync(file)) fail(`${file} not found`);
  const marketplace = readJson(file);
  const plugins = [];
  const artifacts = [];
  for (const entry of marketplace.plugins ?? []) {
    const built = typeof entry.source === "string" && entry.source.startsWith("./") ? buildLocalPlugin(entry, root) : buildExternalPlugin(entry);
    plugins.push(built.plugin);
    artifacts.push(...built.artifacts);
  }
  plugins.sort((a, b) => a.name.localeCompare(b.name));
  const generatedAt = new Date().toISOString();
  return {
    schemaVersion: 1,
    generatedAt,
    marketplace: { name: marketplace.name, description: marketplace.description ?? "", repo },
    plugins,
    artifacts,
    stats: computeStats(plugins, artifacts, generatedAt),
  };
}

export function assertSafe(value, where = "catalog") {
  if (typeof value === "string") {
    const reason = unsafeReason(value);
    if (reason) fail(`${where} contains ${reason}: ${JSON.stringify(value.slice(0, 80))}`);
  } else if (Array.isArray(value)) value.forEach((v, i) => assertSafe(v, `${where}[${i}]`));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) assertSafe(v, `${where}.${k}`);
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const [key, inline] = argv[i].replace(/^--/, "").split("=", 2);
    if (!["root", "out", "repo"].includes(key)) fail(`unknown argument ${argv[i]}`);
    flags[key] = inline ?? argv[++i];
  }
  return flags;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(run);

/** Builds the catalog and writes catalog.json + feed.xml into `out`. */
export function writeCatalog({ root, out, repo }) {
  const catalog = buildCatalog(root, repo);
  assertSafe(catalog);
  const [owner, name] = repo.split("/");
  const siteUrl = `https://${owner.toLowerCase()}.github.io/${name}/`;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
  writeFileSync(join(out, "feed.xml"), buildFeed(catalog, siteUrl));
  return catalog;
}

export { detectRepo };

function run() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const flags = parseFlags(process.argv.slice(2));
  const root = resolve(flags.root ?? ".");
  const out = resolve(flags.out ?? join(here, "..", "site", "public"));
  const catalog = writeCatalog({ root, out, repo: detectRepo(root, flags.repo) });
  console.log(`Catalog built: ${catalog.plugins.length} plugin(s), ${catalog.artifacts.length} artifact(s) → ${basename(out)}/`);
}
