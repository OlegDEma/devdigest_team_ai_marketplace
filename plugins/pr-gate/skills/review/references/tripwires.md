# Cross-file tripwires

Failure modes that **compile and pass file-local review**, so no single skill catches them; they need a diff-wide view. Run them over the changed-file set from `collect-diff.sh`. Each tripwire has a detection recipe, a severity and a fix.

These are generic. If the project documents its own conventions (`AGENTS.md`, `CLAUDE.md`, contributing guide) that add more cross-file rules (for example "a field is declared in three places"), read them and apply those too, attributing the finding to that document.

Most tripwires are grep-detectable: run the pattern, then **read the surrounding code to confirm** before flagging. A match in a test fixture, a comment, an example or documentation is not a bug. Ground each hit with the offending line and a one-line failure scenario.

## T1. Schema change without a migration (or a hand-edited generated migration): CRITICAL

- **Detect (a):** the diff changes ORM/schema definitions (Prisma `schema.prisma`, Drizzle/TypeORM/SQLAlchemy/ActiveRecord models, `*.sql` DDL) but adds no migration file in the project's migrations folder. Find the folder and the generator from the project (`prisma/migrations`, `drizzle/`, `db/migrate`, `alembic/versions`, a `db:generate`/`migrate` script).
- **Detect (b):** the diff edits an existing migration that has already been applied (anything not added in this branch), or hand-edits a generated snapshot.
- **Consequence:** deploy runs against a database that does not match the code; queries fail or data is lost.
- **Fix:** generate a new migration with the project's tool; never edit applied migrations.

## T2. New route, handler or server action without auth, authorization and validation: CRITICAL

- **Detect:** a route/endpoint/controller/server action added in the diff that lacks any of: input validation on params/query/body, an authentication check, an ownership or role check for the specific object. Compare with how sibling routes in the same folder do it; the project's pattern is the bar.
- **Consequence:** unauthenticated or cross-tenant access, or malformed input reaching business logic.
- **Fix:** add validation at the edge, authenticate, and authorize the specific resource before acting. An intentionally public route must be marked as such in the code or docs; if it is not, flag it.

## T3. Committed secret: CRITICAL

- **Detect:** a changed file adds a value matching a secret pattern: AWS `AKIA[0-9A-Z]{16}`, Google `AIza[0-9A-Za-z_-]{35}`, GitHub `gh[pousr]_[A-Za-z0-9]{36,}`, npm `npm_[A-Za-z0-9]{36}`, Slack `xox[abprs]-`, `-----BEGIN [A-Z ]*PRIVATE KEY-----`, a connection URI with inline credentials (`://user:password@`), or `(secret|api[_-]?key|token|password)\s*[:=]\s*['"][^'"]{8,}`; or adds a tracked `.env`/`.env.*` file (other than `.env.example`).
- **Consequence:** credential exposure in git history.
- **Fix:** move it to the environment or a secret store and rotate it; if it was ever committed, treat it as compromised. Never waive.
- **Reporting:** quote the file and line, but mask the value in the report (first 4 characters and `...`).

## T4. Debug leftovers: WARNING

- **Detect:** lines added by the diff that contain `console.log`, `debugger`, `print(`/`pprint(` of variables, `binding.pry`, `fmt.Println` debugging, `.only(` on tests (`it.only`, `describe.only`, `fit`), `TODO remove`/`XXX`, commented-out blocks of code, or hard-coded localhost URLs in non-test code. Ignore files whose job is logging or CLI output, and test helpers.
- **Consequence:** noisy logs, leaked data, or silently skipped tests (`.only` makes CI run a fraction of the suite).
- **Fix:** remove them. `.only` on a test is a CRITICAL when the project's CI would pass with the rest of the suite skipped.

## T5. Contract and consumer mismatch: CRITICAL

- **Detect:** the diff changes a shared contract (an API schema, OpenAPI file, shared types package, Zod/JSON schema, protobuf, event payload, DTO, or a hand-copied type that exists in two places) without the matching change in its producer or consumers, or changes one copy of a duplicated definition and not the other. Grep for the changed field or type name across the repository and compare each use.
- **Consequence:** compiles in isolation, fails at runtime (undefined field, validation rejection, wrong casing).
- **Fix:** update every producer and consumer in the same PR, or keep the old field until consumers move.

## T6. Dangerous command introduced: CRITICAL

- **Detect:** any added script, CI workflow, Makefile, Dockerfile or doc that tells someone to run a destructive command on shared state: `docker compose down -v`, `rm -rf` on a variable path, `git push --force`, `DROP TABLE`/`TRUNCATE` outside a migration, `curl ... | sh`.
- **Consequence:** data or history loss when someone follows the script.
- **Fix:** remove it or replace it with a non-destructive equivalent.

## T7. Wrong package manager or second lockfile: WARNING

- **Detect:** a changed script, doc or CI step runs a different package manager from the one the package's lockfile indicates, or a second lockfile appears in the same package.
- **Fix:** use the package's own manager; keep one lockfile per package.
