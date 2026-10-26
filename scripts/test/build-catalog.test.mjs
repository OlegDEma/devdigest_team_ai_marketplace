import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertSafe, buildCatalog, cleanDescription, parseFrontmatter, parseSectionBody } from "../build-catalog.mjs";
import { UsageError } from "../lib/release-utils.mjs";

const fixtures = new URL("../../site/fixtures", import.meta.url).pathname;
const catalog = buildCatalog(fixtures, "owner/repo");
const plugin = (name) => catalog.plugins.find((p) => p.name === name);
const artifact = (id) => catalog.artifacts.find((a) => a.id === id);

test("frontmatter: single line, quoted and folded block values", () => {
  const fm = parseFrontmatter('---\nname: a\ndescription: >\n  first\n  second\ntitle: "quoted"\n---\nbody');
  assert.deepEqual(fm, { name: "a", description: "first second", title: "quoted" });
  assert.deepEqual(parseFrontmatter("no frontmatter"), {});
});

test("changelog sections: bullets, continuation lines, unknown headings ignored", () => {
  const out = parseSectionBody("### Added\n- one\n- two\n  continued\n### Mystery\n- ignored\n### Fixed\n- three");
  assert.deepEqual(out, { Added: ["one", "two continued"], Fixed: ["three"] });
});

test("catalog: plugins, artifacts and stats from fixtures", () => {
  assert.equal(catalog.plugins.length, 6);
  assert.deepEqual(catalog.plugins.map((p) => p.name), [...catalog.plugins.map((p) => p.name)].sort());
  assert.equal(catalog.stats.skills, 5);
  assert.equal(catalog.stats.pluginsWithHooks, 2);
  assert.equal(catalog.stats.mcpServers, 1);
});

test("changelog: Unreleased is skipped, bump kinds follow SemVer, newest first", () => {
  const cr = plugin("code-review");
  assert.deepEqual(cr.changelog.map((c) => [c.version, c.bump]), [["2.0.0", "major"], ["1.3.1", "patch"], ["1.3.0", "minor"]]);
  assert.equal(cr.lastReleasedAt, "2026-10-24");
  assert.equal(plugin("jira-workflow").changelog[0].bump, "new");
});

test("hooks: only the script file name is published, never the command", () => {
  const hooks = plugin("react-tools").components.hooks;
  assert.deepEqual(hooks, [{ event: "PostToolUse", matcher: "Write|Edit", script: "format-on-save.sh" }]);
  assert.ok(!JSON.stringify(catalog).includes("secret-flag"));
});

test("mcp servers, scripts and artifact ids", () => {
  assert.deepEqual(plugin("jira-workflow").components.mcpServers, [{ name: "jira", transport: "http" }]);
  assert.deepEqual(plugin("jira-workflow").components.scripts, ["load-current-ticket.sh"]);
  assert.ok(artifact("code-review/skill/pr-review"));
  assert.equal(artifact("code-review/skill/pr-review").description, "Full PR review against the team checklist: security, tests, readability, naming");
  assert.deepEqual(artifact("react-tools/hook/posttooluse-write-edit").hook, { event: "PostToolUse", matcher: "Write|Edit", script: "format-on-save.sh" });
  assert.equal(artifact("react-tools/hook/posttooluse-write-edit").description, "");
  assert.deepEqual(artifact("jira-workflow/mcp/jira").mcp, { transport: "http" });
});

test("external plugins keep metadata only", () => {
  const ext = plugin("onboarding-helper");
  assert.equal(ext.external, true);
  assert.equal(ext.components, null);
  assert.equal(catalog.artifacts.filter((a) => a.plugin === "onboarding-helper").length, 0);
});

test("health issues carry a kind and params, never display text", () => {
  const issue = catalog.stats.health.issues.find((i) => i.kind === "empty-description");
  assert.deepEqual(issue, { plugin: "testing-toolkit", kind: "empty-description", params: { type: "skill", name: "ci-failure" } });
  assert.ok(catalog.stats.health.issues.every((i) => !("message" in i)));
});

test("health issues are reported for incomplete plugins", () => {
  const kinds = catalog.stats.health.issues.filter((i) => i.plugin === "testing-toolkit").map((i) => i.kind).sort();
  assert.deepEqual(kinds, ["empty-description", "no-changelog", "no-readme"]);
});

test("empty marketplace builds to an empty catalog", () => {
  const root = mkdtempSync(join(tmpdir(), "catalog-"));
  mkdirSync(join(root, ".claude-plugin"));
  writeFileSync(join(root, ".claude-plugin", "marketplace.json"), JSON.stringify({ name: "m", plugins: [] }));
  const empty = buildCatalog(root, "o/r");
  assert.equal(empty.plugins.length, 0);
  assert.equal(empty.stats.plugins, 0);
  assert.deepEqual(empty.stats.health.issues, []);
});

test("unsafe published strings are rejected", () => {
  assert.throws(() => assertSafe({ description: "a​b" }), UsageError);
  assert.throws(() => assertSafe({ notes: ["ghp_" + "a".repeat(36)] }), UsageError);
  assert.doesNotThrow(() => assertSafe(catalog));
});

test("descriptions: examples and escaped newlines are dropped, long text is cut on a word", () => {
  assert.equal(cleanDescription("Reviews code.\\n\\n<example>user: hi</example> Use proactively."), "Reviews code. Use proactively.");
  const long = cleanDescription("word ".repeat(200));
  assert.ok(long.length <= 401 && long.endsWith("…"));
});
