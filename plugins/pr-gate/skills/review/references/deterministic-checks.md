# Tier-1 deterministic checks

The high-signal, zero-false-positive half of the gate: the project's own tooling. Any failure is a **CRITICAL** with no verification needed; a red typecheck is a fact. `scripts/run-checks.mjs` detects and runs exactly these for the packages that contain changed files.

## How checks are detected

For each changed file the script finds the nearest `package.json` above it (so a monorepo package is checked, not the whole repository), then looks for:

| Check | package.json scripts tried, in order | Makefile targets tried |
| --- | --- | --- |
| typecheck | `typecheck`, `type-check`, `check-types`, `tsc` | `typecheck` |
| lint | `lint` | `lint` |
| test | `test`, `test:unit` (the npm placeholder "no test specified" is ignored) | `test`, `check` |
| build | `build` (only with `--with-build`) | `build` |

The package manager follows the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`/`bun.lockb`, else npm). `CI=1` is set so test runners do not start in watch mode. Each check has a timeout (`PR_GATE_TIMEOUT_MS`, default 10 minutes).

CI config (`.github/workflows/*.yml`, `.gitlab-ci.yml`) is only scanned for command lines that mention typecheck/lint/test/build/check and printed as **hints, never executed**. If CI runs something the script did not detect (an integration suite, an architecture check), say so under "What I could not check" and suggest the user run it.

## Rules

- **Never invent a command.** If the project has no script or target for a category, report "not wired". A check that did not run is never reported as passed.
- **Slow or environment-bound checks** (a full build, integration tests needing Docker or a database, end-to-end suites) are out of the fast gate by default. Mention them as manual extras when the diff touches the code they cover.
- **Do not change the environment** to make a check pass (installing dependencies, starting services). If a check fails because dependencies are missing, report that as the cause and ask the user.
- A failing check that also fails on the base branch is still a failure of this tree, but note "also fails on base" if you can show it without checking out another branch.

## Opt-in hard gates (not installed by this plugin)

The same checks can back stronger enforcement, which the user wires up deliberately:

- a git `pre-push` hook that runs `node <plugin>/scripts/run-checks.mjs` (Tier-1 only; the model-driven tiers stay in the interactive skill);
- the Claude Code push hook described in the plugin README;
- a CI job running the project's own checks (the gate stamp is for local use and is not a CI contract).
