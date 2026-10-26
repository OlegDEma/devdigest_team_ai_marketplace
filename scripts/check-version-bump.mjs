#!/usr/bin/env node
// Fails when a plugin's files changed since <base-ref> but its plugin.json
// version did not go up. Without a bump, users stay on the cached copy and never
// receive the change (docs/RELEASES.md). Runs on every PR in validate.yml.
//
// Compares the merge base of <base-ref> and HEAD with the working tree, so it
// also works locally before committing.
//
// Usage: node scripts/check-version-bump.mjs <base-ref> [--root <dir>]

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  compareSemver, fail, git, localPlugins, main, manifestPath, parseArgs, parseSemver,
  readJsonFile,
} from "./lib/release-utils.mjs";

main(() => {
  const { opts, positional } = parseArgs(process.argv.slice(2), ["root"]);
  const [base] = positional;
  if (!base || positional.length > 1) fail("usage: node scripts/check-version-bump.mjs <base-ref>");
  const root = resolve(opts.root ?? ".");

  const mergeBase = git(root, ["merge-base", base, "HEAD"], { allowFail: true });
  if (!mergeBase) fail(`no merge base between ${base} and HEAD; fetch full history (fetch-depth: 0)`);
  const changed = (git(root, ["diff", "--name-only", mergeBase]) || "").split("\n").filter(Boolean);

  const problems = [];
  let checked = 0;
  for (const plugin of localPlugins(root)) {
    const prefix = `${plugin.rel.replace(/\/$/, "")}/`;
    const files = changed.filter((f) => f.startsWith(prefix));
    if (!files.length || !existsSync(manifestPath(plugin))) continue;
    checked++;

    const current = readJsonFile(manifestPath(plugin)).version;
    const baseManifest = git(root, ["show", `${mergeBase}:${prefix}.claude-plugin/plugin.json`], { allowFail: true });
    if (baseManifest === null) {
      console.log(`✔ ${plugin.name}: new plugin, ${current}`);
      continue;
    }
    const previous = JSON.parse(baseManifest).version;
    if (!parseSemver(current) || !parseSemver(previous)) {
      problems.push(`${plugin.name}: cannot compare versions "${previous}" → "${current}"; both must be SemVer`);
    } else if (compareSemver(current, previous) <= 0) {
      const list = files.slice(0, 5).map((f) => `    ${f}`).join("\n");
      const more = files.length > 5 ? `\n    …and ${files.length - 5} more` : "";
      const state = current === previous ? `is still ${current}` : `went down from ${previous} to ${current}`;
      problems.push(
        `${plugin.name}: ${files.length} file(s) changed but version ${state}; ` +
        `run "node scripts/release.mjs ${plugin.name} <major|minor|patch>"\n${list}${more}`);
    } else {
      console.log(`✔ ${plugin.name}: ${previous} → ${current}`);
    }
  }

  if (problems.length) fail(problems.join("\n"));
  if (!checked) console.log(`no plugin files changed since ${base}`);
});
