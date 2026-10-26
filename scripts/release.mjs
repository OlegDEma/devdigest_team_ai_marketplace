#!/usr/bin/env node
// Prepares a plugin release on a feature branch: bumps `version` in
// plugin.json and turns the `## [Unreleased]` CHANGELOG section into a dated
// version section. Commits nothing; the tag is created after merge to main by
// tag-releases.mjs (.github/workflows/release-tags.yml). See docs/RELEASES.md.
//
// Usage: node scripts/release.mjs <plugin> <major|minor|patch|X.Y.Z>
//          [--date YYYY-MM-DD] [--root <dir>] [--dry-run]

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  bumpSemver, changelogPath, compareSemver, fail, findPlugin, formatChangelog, git,
  main, manifestPath, parseArgs, parseChangelog, readJsonFile, runValidator, tagExists,
  tagName, today, unreleasedSection, writeJsonFile,
} from "./lib/release-utils.mjs";

main(() => {
  const { opts, positional } = parseArgs(process.argv.slice(2), ["date", "root", "dry-run"]);
  const [name, bump] = positional;
  if (!name || !bump || positional.length > 2) {
    fail("usage: node scripts/release.mjs <plugin> <major|minor|patch|X.Y.Z> [--date YYYY-MM-DD] [--dry-run]");
  }
  const root = resolve(opts.root ?? ".");
  const date = opts.date ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`--date "${date}" must be YYYY-MM-DD`);

  const plugin = findPlugin(root, name);
  const manifest = readJsonFile(manifestPath(plugin));
  const current = manifest.version;
  const next = bumpSemver(current, bump);
  if (compareSemver(next, current) <= 0) fail(`new version ${next} must be greater than current ${current}`);

  const tag = tagName(name, next);
  if (tagExists(root, tag)) fail(`tag ${tag} already exists; run "git fetch --tags" and pick another version`);

  const branch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "main") console.log("⚠ you are on main; releases go through a PR from a feature branch");

  const clPath = changelogPath(plugin);
  if (!existsSync(clPath)) fail(`${relative(root, clPath)} not found; create it with a "## [Unreleased]" section`);
  const changelog = parseChangelog(readFileSync(clPath, "utf8"));
  const unreleased = unreleasedSection(changelog);
  if (!unreleased?.body) {
    fail(`${relative(root, clPath)} has no entries under "## [Unreleased]"; describe the changes there first`);
  }

  // Keep an empty Unreleased section on top for the next change.
  const idx = changelog.sections.indexOf(unreleased);
  changelog.sections.splice(idx, 1,
    { heading: "Unreleased", date: null, body: "" },
    { heading: next, date, body: unreleased.body });

  console.log(`${name}: ${current} → ${next} (${date})`);
  if (opts["dry-run"]) {
    console.log(`\n--- ${relative(root, clPath)} (dry run) ---\n${formatChangelog(changelog)}`);
    return;
  }

  writeJsonFile(manifestPath(plugin), { ...manifest, version: next });
  writeFileSync(clPath, formatChangelog(changelog));
  runValidator(root);

  console.log(`
Next steps:
  git add ${plugin.rel}
  git commit -m "release: ${name} ${next}"
  open a PR; after merge to main, ${tag} is tagged automatically`);
});
