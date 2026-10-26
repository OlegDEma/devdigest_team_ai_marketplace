#!/usr/bin/env node
// Rolls a plugin back to an earlier release as a NEW patch release: restores
// the plugin folder from `<plugin>--v<good>`, keeps the current CHANGELOG, and
// bumps the version past the broken one so users actually receive it.
// Commits nothing. See docs/RELEASES.md, "Rollback".
//
// Usage: node scripts/rollback.mjs <plugin> <good-version>
//          [--date YYYY-MM-DD] [--root <dir>] [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  bumpSemver, changelogPath, compareSemver, fail, findPlugin, formatChangelog, git,
  main, manifestPath, parseArgs, parseChangelog, readJsonFile, runValidator, tagExists,
  tagName, today, unreleasedSection, writeJsonFile, isPathClean,
} from "./lib/release-utils.mjs";

main(() => {
  const { opts, positional } = parseArgs(process.argv.slice(2), ["date", "root", "dry-run"]);
  const [name, good] = positional;
  if (!name || !good || positional.length > 2) {
    fail("usage: node scripts/rollback.mjs <plugin> <good-version> [--date YYYY-MM-DD] [--dry-run]");
  }
  const root = resolve(opts.root ?? ".");
  const date = opts.date ?? today();

  const plugin = findPlugin(root, name);
  const goodTag = tagName(name, good);
  if (!tagExists(root, goodTag)) fail(`tag ${goodTag} not found; run "git fetch --tags" or check the version`);

  const current = readJsonFile(manifestPath(plugin)).version;
  if (compareSemver(good, current) >= 0) fail(`${good} is not older than the current version ${current}`);
  const next = bumpSemver(current, "patch");
  if (tagExists(root, tagName(name, next))) fail(`tag ${tagName(name, next)} already exists`);
  if (!isPathClean(root, plugin.rel)) fail(`${plugin.rel} has uncommitted changes; commit or stash them first`);

  // Keep today's CHANGELOG: the old tag's copy would drop the history since then.
  const changelog = parseChangelog(readFileSync(changelogPath(plugin), "utf8"));
  const unreleased = unreleasedSection(changelog);
  if (unreleased?.body) fail(`CHANGELOG has unreleased entries; release or remove them before a rollback`);
  const entry = { heading: next, date, body: `### Changed\n\n- Rolled back to ${good}: reverts the changes released since ${good} (up to ${current}).` };
  const idx = unreleased ? changelog.sections.indexOf(unreleased) + 1 : 0;
  changelog.sections.splice(idx, 0, entry);

  console.log(`${name}: ${current} → ${next} with the contents of ${goodTag}`);
  if (opts["dry-run"]) {
    console.log(git(root, ["diff", "--stat", goodTag, "--", plugin.rel]) || "(no file differences)");
    return;
  }

  // restore --source also deletes files that were added after the good tag.
  git(root, ["restore", `--source=${goodTag}`, "--staged", "--worktree", "--", plugin.rel]);
  const manifest = readJsonFile(manifestPath(plugin));
  writeJsonFile(manifestPath(plugin), { ...manifest, version: next });
  writeFileSync(changelogPath(plugin), formatChangelog(changelog));
  runValidator(root);

  console.log(`
Review "git diff --staged" and "git diff", then:
  git add ${plugin.rel}
  git commit -m "rollback: ${name} ${next} (contents of ${good})"
  open a PR; after merge to main, ${tagName(name, next)} is tagged automatically`);
});
