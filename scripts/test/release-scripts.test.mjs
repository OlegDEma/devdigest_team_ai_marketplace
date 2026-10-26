// End-to-end tests for release.mjs, rollback.mjs, tag-releases.mjs and the
// linter's English/CHANGELOG checks, run against a throwaway git repository.
// Usage: node --test "scripts/test/*.test.mjs"

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const scripts = new URL("..", import.meta.url).pathname;
const DATE = "2026-10-26";

function write(root, rel, content) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), typeof content === "string" ? content : JSON.stringify(content, null, 2) + "\n");
}

function git(root, ...args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function run(script, root, ...args) {
  return spawnSync(process.execPath, [join(scripts, script), ...args, "--root", root], { encoding: "utf8" });
}

function version(root) {
  return JSON.parse(readFileSync(join(root, "plugins/demo/.claude-plugin/plugin.json"), "utf8")).version;
}

// A marketplace with one plugin "demo" released as 1.0.0 and one unreleased entry.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "marketplace-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, ".claude-plugin/marketplace.json", {
    name: "test-marketplace",
    owner: { name: "Test" },
    description: "Test marketplace",
    plugins: [{ name: "demo", source: "./plugins/demo", description: "Demo plugin" }],
  });
  write(root, "plugins/demo/.claude-plugin/plugin.json", {
    name: "demo", version: "1.0.0", description: "Demo plugin", author: { name: "Test" },
  });
  write(root, "plugins/demo/README.md", "# Demo\n");
  write(root, "plugins/demo/skills/hello/SKILL.md", "---\nname: hello\ndescription: Says hello\n---\nSay hello.\n");
  write(root, "plugins/demo/CHANGELOG.md",
    "# Changelog\n\n## [Unreleased]\n\n### Added\n- Goodbye skill.\n\n## [1.0.0] - 2026-10-01\n\n### Added\n- First release.\n");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Test");
  git(root, "config", "user.email", "test@example.com");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "init");
  return root;
}

test("release bumps version and dates the Unreleased section", (t) => {
  const root = fixture(t);
  const r = run("release.mjs", root, "demo", "minor", "--date", DATE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(version(root), "1.1.0");
  const cl = readFileSync(join(root, "plugins/demo/CHANGELOG.md"), "utf8");
  assert.match(cl, /## \[Unreleased\]\n\n## \[1\.1\.0\] - 2026-10-26\n\n### Added\n- Goodbye skill\.\n\n## \[1\.0\.0\]/);
});

test("release refuses an empty Unreleased section and a non-increasing version", (t) => {
  const root = fixture(t);
  assert.equal(run("release.mjs", root, "demo", "1.0.0").status, 1);
  write(root, "plugins/demo/CHANGELOG.md", "# Changelog\n\n## [Unreleased]\n\n## [1.0.0] - 2026-10-01\n\n- First.\n");
  const r = run("release.mjs", root, "demo", "patch");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no entries under "## \[Unreleased\]"/);
  assert.equal(version(root), "1.0.0");
});

test("dry run changes nothing", (t) => {
  const root = fixture(t);
  assert.equal(run("release.mjs", root, "demo", "major", "--dry-run").status, 0);
  assert.equal(version(root), "1.0.0");
  assert.equal(git(root, "status", "--porcelain"), "");
});

test("tag-releases tags missing versions once, with changelog notes", (t) => {
  const root = fixture(t);
  let r = run("tag-releases.mjs", root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tagged demo--v1\.0\.0/);
  assert.match(git(root, "tag", "-l", "--format=%(contents)", "demo--v1.0.0"), /First release/);
  r = run("tag-releases.mjs", root);
  assert.match(r.stdout, /no new releases to tag/);
});

test("rollback restores the old contents as a new patch release", (t) => {
  const root = fixture(t);
  run("tag-releases.mjs", root);
  write(root, "plugins/demo/skills/goodbye/SKILL.md", "---\nname: goodbye\ndescription: Says goodbye\n---\nBye.\n");
  assert.equal(run("release.mjs", root, "demo", "minor", "--date", DATE).status, 0);
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "release 1.1.0");
  run("tag-releases.mjs", root);

  const r = run("rollback.mjs", root, "demo", "1.0.0", "--date", DATE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(version(root), "1.1.1");
  assert.ok(!existsSync(join(root, "plugins/demo/skills/goodbye")), "file added after 1.0.0 is removed");
  const cl = readFileSync(join(root, "plugins/demo/CHANGELOG.md"), "utf8");
  assert.match(cl, /## \[1\.1\.1\] - 2026-10-26\n\n### Changed\n\n- Rolled back to 1\.0\.0/);
  assert.match(cl, /## \[1\.1\.0\]/, "history since the good tag is kept");
});

test("rollback refuses a missing tag", (t) => {
  const root = fixture(t);
  const r = run("rollback.mjs", root, "demo", "0.9.0");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tag demo--v0\.9\.0 not found/);
});

test("tag-releases refuses a version lower than one already released", (t) => {
  const root = fixture(t);
  git(root, "tag", "demo--v2.0.0");
  const r = run("tag-releases.mjs", root);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /lower than released 2\.0\.0/);
});

test("tag-releases ignores tags that are not SemVer", (t) => {
  const root = fixture(t);
  // Two tags, so sorting actually compares the non-SemVer one.
  git(root, "tag", "demo--vbeta");
  git(root, "tag", "demo--v0.9.0");
  const r = run("tag-releases.mjs", root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tagged demo--v1\.0\.0/);
});

// A feature branch off main, so check-version-bump has a base to compare with.
function branch(root) {
  run("tag-releases.mjs", root);
  git(root, "checkout", "-q", "-b", "feature");
}

test("check-version-bump fails when plugin files change without a bump", (t) => {
  const root = fixture(t);
  branch(root);
  write(root, "plugins/demo/skills/hello/SKILL.md", "---\nname: hello\ndescription: Says hello\n---\nSay hi.\n");
  git(root, "commit", "-q", "-am", "edit skill");
  const r = run("check-version-bump.mjs", root, "main");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /demo: 1 file\(s\) changed but version is still 1\.0\.0/);
  assert.match(r.stderr, /plugins\/demo\/skills\/hello\/SKILL\.md/);
});

test("check-version-bump also catches uncommitted changes", (t) => {
  const root = fixture(t);
  branch(root);
  write(root, "plugins/demo/README.md", "# Demo\n\nMore docs.\n");
  assert.equal(run("check-version-bump.mjs", root, "main").status, 1);
});

test("check-version-bump passes after release.mjs, for a new plugin and without plugin changes", (t) => {
  const root = fixture(t);
  branch(root);
  let r = run("check-version-bump.mjs", root, "main");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /no plugin files changed since main/);

  write(root, ".github/notes.md", "Not a plugin file.\n");
  assert.equal(run("check-version-bump.mjs", root, "main").status, 0);

  write(root, "plugins/demo/skills/goodbye/SKILL.md", "---\nname: goodbye\ndescription: Says goodbye\n---\nBye.\n");
  assert.equal(run("release.mjs", root, "demo", "minor", "--date", DATE).status, 0);
  r = run("check-version-bump.mjs", root, "main");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /demo: 1\.0\.0 → 1\.1\.0/);

  const mp = JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8"));
  mp.plugins.push({ name: "extra", source: "./plugins/extra", description: "Extra plugin" });
  write(root, ".claude-plugin/marketplace.json", mp);
  write(root, "plugins/extra/.claude-plugin/plugin.json", {
    name: "extra", version: "0.1.0", description: "Extra plugin", author: { name: "Test" },
  });
  git(root, "add", ".");
  r = run("check-version-bump.mjs", root, "main");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /extra: new plugin, 0\.1\.0/);
});

test("check-version-bump rejects a version that went down", (t) => {
  const root = fixture(t);
  branch(root);
  write(root, "plugins/demo/.claude-plugin/plugin.json", {
    name: "demo", version: "0.9.0", description: "Demo plugin", author: { name: "Test" },
  });
  const r = run("check-version-bump.mjs", root, "main");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /version went down from 1\.0\.0 to 0\.9\.0/);
});

test("linter rejects Cyrillic descriptions and a CHANGELOG out of sync with the version", (t) => {
  const root = fixture(t);
  const lint = () => spawnSync(process.execPath, [join(scripts, "validate-marketplace.mjs"), root], { encoding: "utf8" });
  assert.equal(lint().status, 0, lint().stdout);

  write(root, "plugins/demo/skills/hello/SKILL.md", "---\nname: hello\ndescription: Вітається\n---\nSay hello.\n");
  let r = lint();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /skills\/hello description: must be written in English/);

  write(root, "plugins/demo/skills/hello/SKILL.md", "---\nname: hello\ndescription: Says hello\n---\nSay hello.\n");
  write(root, "plugins/demo/.claude-plugin/plugin.json", {
    name: "demo", version: "1.2.0", description: "Demo plugin", author: { name: "Test" },
  });
  r = lint();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /newest section is \[1\.0\.0\], but plugin\.json version is 1\.2\.0/);
});
