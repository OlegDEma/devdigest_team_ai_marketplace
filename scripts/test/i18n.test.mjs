import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { messages } from "../../site/src/messages.js";

const src = new URL("../../site/src/", import.meta.url).pathname;
const files = readdirSync(src).filter((f) => /\.(jsx?|mjs)$/.test(f) && f !== "messages.js");
const read = (f) => readFileSync(join(src, f), "utf8");

test("every message key used in the code exists in messages.js", () => {
  const missing = [];
  for (const f of files) {
    // t('key'), tx('key'), rich('key'), plural('key', n): literal keys only
    for (const m of read(f).matchAll(/\b(?:t|tx|rich|plural|list)\(\s*'([a-z0-9_.-]+)'\s*[,)]/gi)) {
      const key = m[1];
      const ok = key in messages || `${key}.one` in messages;
      if (!ok) missing.push(`${f}: ${key}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("plural messages come in .one / .other pairs", () => {
  for (const key of Object.keys(messages)) {
    if (key.endsWith(".one")) assert.ok(`${key.slice(0, -4)}.other` in messages, `${key} has no .other`);
  }
});

test("Template.jsx has no literal UI text, only message lookups", () => {
  const body = read("Template.jsx");
  const text = [...body.matchAll(/>([^<>{}]*[A-Za-z]{2,}[^<>{}]*)</g)].map((m) => m[1].trim());
  const attrs = [...body.matchAll(/\b(?:title|aria-label|placeholder|alt)="([^"]*[A-Za-z]{2,}[^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual([...text, ...attrs].filter(Boolean), []);
});

test("messages are non-empty strings (or string lists)", () => {
  for (const [key, value] of Object.entries(messages)) {
    const ok = typeof value === "string" ? value.length > 0 : Array.isArray(value) && value.every((v) => typeof v === "string");
    assert.ok(ok, `${key} must be a non-empty string`);
  }
});
