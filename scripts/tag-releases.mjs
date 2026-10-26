#!/usr/bin/env node
// Creates the missing `<plugin>--v<version>` tags for the current commit.
// Runs on every push to main (.github/workflows/release-tags.yml), so merging a
// release PR is enough to publish its tag. Idempotent: existing tags are kept.
//
// Usage: node scripts/tag-releases.mjs [--push] [--remote origin] [--root <dir>] [--dry-run]

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  changelogPath, compareSemver, fail, git, localPlugins, main, manifestPath, parseArgs,
  parseChangelog, parseSemver, readJsonFile, tagExists, tagName,
} from "./lib/release-utils.mjs";

main(() => {
  const { opts, positional } = parseArgs(process.argv.slice(2), ["push", "remote", "root", "dry-run"]);
  if (positional.length) fail("usage: node scripts/tag-releases.mjs [--push] [--remote origin] [--dry-run]");
  const root = resolve(opts.root ?? ".");
  const remote = opts.remote ?? "origin";

  const created = [];
  const problems = [];
  for (const plugin of localPlugins(root)) {
    if (!existsSync(manifestPath(plugin))) continue;
    const { version } = readJsonFile(manifestPath(plugin));
    const tag = tagName(plugin.name, version);
    if (tagExists(root, tag)) continue;

    // A lower version than an existing release never reaches users who already
    // have the higher one (RELEASES.md, Rollback), so refuse to tag it.
    // Tags that are not SemVer (e.g. a hand-made demo--vbeta) are not releases.
    const released = (git(root, ["tag", "--list", `${plugin.name}--v*`]) || "")
      .split("\n").filter(Boolean).map((t) => t.slice(plugin.name.length + 3))
      .filter((v) => parseSemver(v));
    const highest = released.sort(compareSemver).at(-1);
    if (highest && compareSemver(version, highest) < 0) {
      problems.push(`${plugin.name}: version ${version} is lower than released ${highest}; bump it instead (rollback.mjs)`);
      continue;
    }

    let notes = "";
    if (existsSync(changelogPath(plugin))) {
      const section = parseChangelog(readFileSync(changelogPath(plugin), "utf8"))
        .sections.find((s) => s.heading === version);
      notes = section?.body ?? "";
    }
    const message = `${plugin.name} ${version}${notes ? `\n\n${notes}` : ""}`;
    if (!opts["dry-run"]) git(root, ["tag", "-a", tag, "-m", message]);
    created.push(tag);
    console.log(`${opts["dry-run"] ? "would tag" : "tagged"} ${tag}`);
  }

  if (!created.length) console.log("no new releases to tag");
  if (created.length && opts.push && !opts["dry-run"]) {
    git(root, ["push", remote, ...created.map((t) => `refs/tags/${t}`)]);
    console.log(`pushed ${created.length} tag(s) to ${remote}`);
  }
  if (problems.length) fail(problems.join("\n"));
});
