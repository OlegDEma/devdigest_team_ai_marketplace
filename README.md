# dev-digest-ai-marketplace

Private Claude Code plugin marketplace for the DevDigest team. We use it to distribute our AI Harness — skills, agents, commands, hooks and MCP configurations — to any team project with a single command.

## Structure

```text
.
├── .claude-plugin/
│   └── marketplace.json     # catalog: list of plugins and where to get them
├── plugins/                 # plugin sources (one folder per plugin)
│   └── <plugin-name>/
│       ├── .claude-plugin/plugin.json
│       ├── skills/ agents/ commands/ hooks/
│       └── README.md
├── site/                    # catalog site: React + Vite app, built and deployed to GitHub Pages by CI
│   ├── src/ fixtures/       # app source; fixture marketplace for dev and tests
│   └── vite.config.js
├── docs/
│   ├── PLUGIN-GUIDELINES.md # plugin structure, manifest, dependencies
│   ├── SECURITY.md          # permissions, secrets, script review
│   ├── RELEASES.md          # SemVer, tags, updates and rollback
│   ├── CATALOG-SITE.md      # catalog site spec
│   ├── design/              # design brief and sample data for the catalog site
│   └── temp/                # temporary materials, to be deleted after the first plugin
│       └── MARKETPLACE-RESEARCH.md  # research: official rules and practices
├── scripts/
│   ├── validate-marketplace.mjs  # custom structural linter (Node, no dependencies)
│   ├── build-catalog.mjs         # repository → catalog.json + feed.xml for the site
│   ├── release.mjs               # bump version + date CHANGELOG for a release
│   ├── tag-releases.mjs          # create missing <plugin>--v<version> tags (CI)
│   ├── rollback.mjs              # roll back to an older tag as a new PATCH
│   ├── check-version-bump.mjs    # PR check: changed plugin files need a version bump
│   ├── lib/                      # shared release helpers
│   └── test/                     # tests for the release scripts
├── .github/
│   ├── workflows/validate.yml    # CI on pull_request
│   ├── workflows/release-tags.yml  # tags releases after merge to main
│   ├── workflows/pages.yml       # builds the catalog site and deploys it to GitHub Pages
│   └── pull_request_template.md  # contributor checklist
├── package.json             # site tooling: npm run dev / build / test
├── CODEOWNERS
└── CONTRIBUTING.md
```

## Catalog site

The catalog at `https://olegdema.github.io/devdigest_team_ai_marketplace/` is generated from `marketplace.json` and `plugins/`, so it only ever shows real plugins. To work on it locally:

```bash
npm install
npm run dev           # real data from this repository, http://localhost:5173
npm run dev:fixtures  # same, with sample plugins from site/fixtures
```

Spec: [docs/CATALOG-SITE.md](docs/CATALOG-SITE.md).

## Installation

You need git access to this private repository. For HTTPS, set up a credential helper once:

```bash
gh auth login && gh auth setup-git
```

Add the marketplace and install a plugin:

```bash
claude plugin marketplace add OlegDEma/devdigest_team_ai_marketplace
claude plugin install <plugin-name>@dev-digest-ai-marketplace
```

To make the marketplace available to everyone working in a specific project, run this in that project's root and commit `.claude/settings.json`:

```bash
claude plugin marketplace add OlegDEma/devdigest_team_ai_marketplace --scope project
```

Without a GitHub SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.

## Updates

Auto-update is off by default: enable it in `/plugin` → **Marketplaces** → `dev-digest-ai-marketplace` → **Enable auto-update**, or update manually:

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update <plugin-name>@dev-digest-ai-marketplace
```

## Plugin catalog

| Plugin | Description | Depends on | Version |
| :- | :- | :- | :- |
| [`architecture-review`](plugins/architecture-review/) | Read-only architecture review of a plan, a working tree or a file list, with quoted evidence | `engineering-paved-path` | 1.0.0 |
| [`engineering-paved-path`](plugins/engineering-paved-path/) | Shared skills: React, Next.js, Fastify, architecture, testing, security, TypeScript, Zod, Mermaid | — | 1.0.0 |
| [`research-tools`](plugins/research-tools/) | Read-only `researcher` agent and `/research-tools:research` skill for repository and external research | — | 1.1.0 |
| [`sdd-engineering`](plugins/sdd-engineering/) | Spec-driven development: spec → plan → implement → review → verify → retro | all three above | 1.0.0 |

Start with `sdd-engineering`: installing it pulls in the other three. How they fit together: [docs/DEPENDENCY-GRAPH.md](docs/DEPENDENCY-GRAPH.md).

## For authors

Before opening a PR, read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md). Every change must pass both checks (CI runs the same checks on every PR):

```bash
node scripts/validate-marketplace.mjs
claude plugin validate . --strict
```

While the catalog is empty, `--strict` always fails on the `Marketplace has no plugins defined` warning, so until the first plugin lands CI runs `validate` without `--strict`.
