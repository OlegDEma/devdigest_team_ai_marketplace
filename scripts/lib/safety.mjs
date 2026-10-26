// Checks shared by the validator and the catalog build: strings that end up in
// a published artifact must not hide content or leak credentials.

// Bidi controls and zero-width characters that can hide content from reviewers.
export const HIDDEN_UNICODE_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;

// Well-known credential shapes. Deliberately narrow to keep false positives rare.
export const SECRET_PATTERNS = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
  /\bsk-[A-Za-z0-9_-]{32,}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

export function unsafeReason(value) {
  if (typeof value !== "string") return null;
  if (HIDDEN_UNICODE_RE.test(value)) return "hidden Unicode characters";
  if (SECRET_PATTERNS.some((re) => re.test(value))) return "something that looks like a secret";
  return null;
}
