# Spec: marketplace catalog UI on GitHub Pages

A static site on `*.github.io` for searching and browsing the plugins, skills, agents, commands, hooks and MCP configurations in this marketplace, and for installing them in a few clicks.

Design brief and mockup data: [design/CATALOG-DESIGN-BRIEF.md](design/CATALOG-DESIGN-BRIEF.md), [design/sample-catalog.json](design/sample-catalog.json).

## Constraints and principles

- **Dev-first audience.** The team's developers, 10–50 people, who live in the terminal: speed and density over marketing.
- **The repository is the source of truth.** Everything on the site is derived from `marketplace.json` and `plugins/` at build time; nothing is edited on the site.
- **No server of our own.** The site is static files only. GitHub Actions generates all data once at deploy time; everything else runs in the browser.
- **"Smart" search is not a runtime LLM.** Search is client-side keyword + fuzzy matching with synonyms. It sits behind a `SearchProvider` interface so semantic search can be added later without a server (see [Future: semantic search](#future-semantic-search)).
- **No external requests at runtime.** Fonts, libraries and data are served from the same github.io origin. No analytics, cookies, CDNs or third-party widgets.
- **Only metadata is published** (option 1). The site is public, so the bodies of `SKILL.md`, agents, commands, scripts and hooks never reach it. The "Source" link points to the private repository and only opens for team members.
- **Allowlist, not denylist.** The build script copies only explicitly listed fields into `catalog.json` (see [Data model](#data-model)). A new field appears on the site only after this spec is changed.
- **React + Vite, built in CI.** The frontend is a React 18 single-page app bundled by Vite; GitHub Actions builds it on every deploy (see [Technology decision](#technology-decision)). React ships inside the bundle, nothing is loaded from a CDN. The data script `build-catalog.mjs` stays dependency-free (Node built-ins only), like `validate-marketplace.mjs`.
- **Only real data.** The site shows only plugins and artifacts that exist in the repository. There is no sample data in the app; fixtures live in `site/fixtures/` and are used only by tests and `npm run dev:fixtures`.

## Features

MVP covers F1–F7; stage 2 covers F8–F12.

| # | Feature | Why | Stage |
| :- | :- | :- | :- |
| F1 | Natural-language search, results as cards | The user types "I need a skill for reviewing PRs" and sees relevant artifacts | MVP |
| F2 | Filters (type, category, plugin, tags), state in the URL | Narrow results and share a link | MVP |
| F3 | Plugin page and artifact page | Full description, contents, dependencies, source | MVP |
| F4 | Copy buttons for install commands | Install without typing commands by hand | MVP |
| F5 | "How to connect the marketplace" onboarding with copy buttons | New team members get connected in 30 seconds | MVP |
| F6 | What's new: release feed from `CHANGELOG.md`/`version`, plus RSS | See what was added and updated without watching git | MVP |
| F7 | Stats tiles (how many plugins, skills, agents…) | Overview of catalog "health", computed from the index | MVP |
| F8 | Plugin contents and dependency graph | See exactly what gets installed and what gets pulled in | 2 |
| F9 | Security panel | Which hooks, scripts and MCP servers run, before installing | 2 |
| F10 | Stack builder | Pick several plugins and get a ready `settings.json` or script | 2 |
| F11 | Role bundles | Curated sets: "Newcomer", "Reviewer", "Backend" | 2 |
| F12 | Author wizard and "Suggest a skill" | Skeleton for a new plugin and a GitHub request for a missing skill | 2 |

Deliberately **out of scope**: reviews and ratings, install counters, showing artifact contents. The first two need a server, the third contradicts option 1. Embedding-based semantic search is not implemented in v1, but the architecture leaves room for it (see [Future: semantic search](#future-semantic-search)).

### F1. Search

**Index.** An in-house keyword provider (`site/src/search.js`, no library) builds the index in the browser from `catalog.json` on page load, with typo tolerance (edit distance 1), prefix matching and the field weights below. The catalog is sized for hundreds of documents, so a prebuilt index is unnecessary. Every plugin and every artifact is an index document. The index and the UI are in English.

| Field | Weight |
| :- | :- |
| `name`, `displayName` | 4 |
| `tags`, `keywords` | 3 |
| `description` | 2 |
| `plugin`, `category` | 1 |

Settings: `prefix: true`, `fuzzy: 0.2`, `combineWith: "AND"`. If there are 0 results, the search is retried with `OR`.

**Normalization** (same for index and query): NFKC, lowercase, all apostrophes (`'`, `’`, `ʼ`) collapse to `'`. Prefix search partly covers word endings ("reviewing", "tests" → "test").

**Query parsing:**
1. Type words become a filter and are removed from the query: `skill*` → skill; `agent*` → agent; `command*` → command; `hook*` → hook; `mcp` → mcp; `plugin*` → plugin. Ukrainian forms such as `скіл*` and `агент*` map the same way.
2. Stopwords (list in `site/src/search.js`: English plus a few common Ukrainian words; "i", "need", "for", "a", "the"…) are removed.
3. Each remaining word is expanded with synonyms from the synonym table in `site/src/search.js` (e.g. `"review": ["code-review", "pr"]`, `"tests": ["test", "testing"]`). Synonyms are ORed within a group; groups are ANDed together.

The team is Ukrainian-speaking, so the synonym table also has a small Ukrainian→English section (e.g. `"рев'ю": ["review", "code-review"]`). A query like "скіл для рев'ю" then resolves to the same English index terms.

**Result card:** type icon, name (`displayName` or `name`), description with highlighted matches, plugin and version badges, tags, and a "Copy install" button (F4). Clicking the card opens F3.

**Empty result:** a hint to clear filters and a "Can't find it? Suggest a skill" link. It opens a new GitHub issue with a prefilled title and the query text (`/issues/new?title=…&body=…&labels=skill-request`). F12 reuses the same link later.

**UX:** `/` focuses the search, `Esc` clears it. Search runs as you type with a 100 ms debounce. With no query, all plugins are shown, sorted by last release date.

**Quick jump (`Cmd+K` / `Ctrl+K`):** available on every page. Opens a modal palette with a search input that uses the same index; results are grouped by type, followed by site pages (Get started, What's new, Bundles). `↑`/`↓` move, `Enter` opens, `Cmd/Ctrl+Enter` copies the install command of the highlighted item, `Esc` closes. Focus is trapped in the palette and returns to the previous element on close.

**Copy-install logic:** the "Copy install" button on any artifact card copies the install command of its **parent plugin**, since Claude Code installs plugins, not individual skills. On the artifact page, the invocation command (`/<plugin>:<skill>`) is shown separately from the install command.

**Acceptance criteria:**
- On fixtures, the query "I need a skill for reviewing PRs" returns only skills, with the skill tagged `review` ranked first.
- The Ukrainian query "скіл для рев'ю" returns the same top result.
- A query with a one-letter typo ("reviw") finds the same skill.
- Search takes < 50 ms on 1000 documents (fixture generator).
- `Cmd/Ctrl+K` → type "review" → `Enter` opens the top result's page, using the keyboard only.

### F2. Filters and URL

- Facets: type (plugin/skill/agent/command/hook/mcp), `category`, plugin, tags (multi-select). Each value shows a result count.
- All state lives in the hash, since GitHub Pages has no SPA fallback: `#/?q=review&type=skill&tag=sdd`.
- A "Copy link" button copies the current URL.

**Acceptance criteria:** opening a copied URL in a new tab reproduces the same query, filters and results.

### F3. Plugin and artifact pages

**Plugin** (`#/plugin/<name>`): `displayName`, description, version, author, license, category, tags, last release date, install command (F4), artifacts grouped by type, dependencies (links to other plugins), last 3 changelog entries (F6), a "Source" link to `plugins/<name>/` on GitHub, and "README".

**Artifact** (`#/plugin/<name>/<type>/<artifact>`): name, description from frontmatter, type, parent plugin and its install command, link to the file on GitHub. For a skill, show how to invoke it: `/<plugin>:<skill>`.

**Acceptance criteria:** a nonexistent path shows a 404 state with search, not a blank page.

### F4. Install commands

Generated at build time from `marketplace.json` (`name`) and `GITHUB_REPOSITORY`. Nothing is hardcoded.

```bash
claude plugin install <plugin>@<marketplace>
```

The button copies the command via `navigator.clipboard`, falling back to text selection if it is unavailable. After copying, "Copied" is shown for 2 s.

### F5. Onboarding

A `#/start` page linked from the header. New visitors see a dismissible "First time here?" banner on the home page; its state is stored in `localStorage`. The steps mirror the README, each with a copy button:

1. Repository access: `gh auth login && gh auth setup-git`.
2. Add the marketplace: `claude plugin marketplace add <owner>/<repo>`.
3. For the whole project: the same with `--scope project`, plus committing `.claude/settings.json`.
4. Install a first plugin: link to F1 or F11.
5. Enable auto-update: `/plugin` → Marketplaces → Enable auto-update. Or manually with `marketplace update` and `plugin update`.
6. A "Troubleshooting" block about `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` when there is no SSH key.

An "SSH / HTTPS" toggle switches the commands in steps 1–2.

**Acceptance criteria:** the step text is generated from the same sources as the README (`marketplace.json`, `GITHUB_REPOSITORY`) and does not diverge from it. Verified by a build-script test.

### F6. What's new

- **Source:** `plugins/<name>/CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/) format: headings `## [1.1.0] - 2026-10-20`, with `### Added/Changed/Fixed/Removed` sections under them. The format must be documented in `PLUGIN-GUIDELINES.md` and checked by `validate-marketplace.mjs`. The version in `plugin.json` must match the first entry.
- **Entry without a date:** if the heading has no date, use the date of the commit that changed `version` in `plugin.json` (`git log`). That is why the workflow checks out with `fetch-depth: 0`.
- **`#/new` page:** a chronological feed across all plugins, 30 entries per page with pagination. Each entry shows the plugin, version, date, a change-type badge (new plugin / MAJOR / MINOR / PATCH, derived from the SemVer diff) and the changelog items as plain text. Markdown is rendered by a minimal safe subset renderer: lists, `code`, links to github.com. HTML is not supported.
- **On the home page:** a "Latest updates" block with 5 entries.
- **RSS:** `feed.xml` (RSS 2.0) with the same entries is generated at build time. It can be subscribed to in Slack or an RSS reader.

**Acceptance criteria:** a new plugin version released after merging into `main` appears on the site and in `feed.xml` with no manual steps.

### F7. Stats tiles

The home page shows a row of counter tiles: plugins, skills, agents, commands, plugins with hooks, MCP servers, plus the date the catalog was last updated.

Below it is an expandable "Catalog health" block. It is computed from the index at build time; the site only displays it:

- % of plugins with `README.md`, `CHANGELOG.md`, `keywords` or `tags`;
- plugins whose `version` does not match the first `CHANGELOG` entry;
- plugins with no release for more than 180 days;
- plugins with an empty `description` on at least one artifact.

Each item in the issue list links to the relevant plugin page.

### Empty catalog

`marketplace.json` currently has `plugins: []`, so the empty catalog is the launch state, not an edge case. The site must build, deploy and look intentional with zero plugins:

- Home: the search bar stays; instead of the plugin grid, a "No plugins yet" block explains that the catalog fills from the repository and links to `CONTRIBUTING.md` and (stage 2) the author wizard and "Suggest a skill".
- Stats tiles show zeros; "Catalog health" is hidden.
- What's new and `feed.xml`: an empty feed with a "No releases yet" message (the RSS file is still valid).
- Get started works unchanged: connecting the marketplace makes sense before the first plugin.

**Acceptance criteria:** `build-catalog.mjs` on the current repository (zero plugins) exits with 0, and every page renders its empty state without console errors.

### F8. Plugin contents and dependency graph *(stage 2)*

- The plugin page shows a tree of `skills/`, `agents/`, `commands/`, `hooks/`, `.mcp.json` (names only).
- The `dependencies` graph is drawn as inline SVG with a simple layered layout, no libraries. "Depended on by" (reverse edges) is shown separately.
- Graph nodes are clickable.

### F9. Security panel *(stage 2)*

A block on the plugin page. Only the following is published:

- **hooks:** event name (`PreToolUse`, `SessionStart`…), `matcher` and the script **file name**. The command string is not published;
- **MCP:** server name and transport (`stdio`/`http`). URL, `args` and `env` are not published;
- **scripts/:** list of file names;
- "needs security review" markers per the `CODEOWNERS`/`SECURITY.md` rules.

If a plugin has no hooks, MCP or scripts, a "No executable code" badge is shown.

### F10. Stack builder *(stage 2)*

- Cards and pages have a "+ Add to stack" button. The selection is stored in `localStorage`.
- The stack panel automatically adds dependencies of the selected plugins and marks them "pulled in as dependency".
- The builder produces three outputs:
  1. a bash script with `marketplace add` and `plugin install` for each plugin;
  2. a project `.claude/settings.json` snippet (`extraKnownMarketplaces` + `enabledPlugins`);
  3. a link to the current stack (`#/stack?p=a,b,c`).

### F11. Role bundles *(stage 2)*

- Source: `site/bundles.json` in the repository: `id`, `title`, `description`, `plugins[]`, `owner`. Ownership is set in `CODEOWNERS`.
- The `#/bundles` page shows bundle cards. A "Use bundle" button fills F10.
- The build script fails if a bundle references a missing plugin.

### F12. Author wizard and "Suggest a skill" *(stage 2)*

- **Wizard** (`#/new-plugin`): a form with `name` (kebab-case, checked with the same regexes as the validator, including reserved prefixes), `displayName`, `description`, `category`, `tags`, and lists of skills and agents. Output: a preview of the files (`plugin.json`, `SKILL.md`, `CHANGELOG.md`, `README.md`, the `marketplace.json` entry), a copy button per file and a GitHub "new file" link (`/new/main?filename=plugins/<name>/.claude-plugin/plugin.json&value=…`) for the first file. A reminder about the `plugin/<name>` branch and the checklist from `CONTRIBUTING.md`.
- **Suggest a skill:** a "what you need / what for / example" form opens an issue with the `.github/ISSUE_TEMPLATE/skill-request.yml` template and the `skill-request` label.

## Architecture

```text
package.json                 # scripts: dev, dev:fixtures, build, test
scripts/
├── build-catalog.mjs        # Node built-ins: repository → site/public/catalog.json + feed.xml
├── lib/safety.mjs           # hidden-Unicode and secret checks shared with the validator
└── validate-marketplace.mjs # runs before the build
site/
├── index.html               # Vite entry
├── vite.config.js           # relative base, so it works under /<repo>/
├── src/
│   ├── main.jsx             # loads catalog.json, shows loading / error states
│   ├── App.jsx              # routing (hash), state, view models
│   ├── Template.jsx         # presentational markup
│   ├── search.js            # query parsing, synonyms, keyword provider
│   ├── catalog.js, util.js, constants.js, sprite.js
│   └── styles.css           # tokens, light/dark theme
├── public/                  # generated catalog.json and feed.xml (git-ignored)
├── fixtures/                # test marketplace: 6 plugins incl. an external one
└── dist/                    # build output (git-ignored), deployed to Pages
.github/workflows/pages.yml
```

**`build-catalog.mjs`:**
1. Reads `.claude-plugin/marketplace.json`. For each plugin with a local `source`, reads `plugin.json` and walks `skills/*/SKILL.md`, `agents/*.md`, `commands/**/*.md`, `hooks/hooks.json`, `.mcp.json`, `scripts/` and `CHANGELOG.md`.
2. Parses **only the frontmatter** (`name`, `description`) of markdown files; the body is never read. Descriptions are cleaned for display: `<example>` blocks and escaped newlines are dropped and the text is cut at 400 characters.
3. Plugins with a remote `source` (`github`, `git-subdir`) enter the catalog with metadata from their `marketplace.json` entry and an "external" flag, without contents.
4. Writes `catalog.json` and `feed.xml` into `site/public/`; Vite copies them into `site/dist/`.
5. Flags: `--root <dir>` (default `.`), `--out <dir>`, `--repo owner/name` (default `$GITHUB_REPOSITORY`, then the `origin` remote).
6. Exits with code 1 if any published string contains hidden Unicode characters or looks like a secret (`scripts/lib/safety.mjs`).
7. Hook artifacts are described from allowlisted fields only (event, matcher, script file name); the command string is never published.

**`pages.yml`:** runs on push to `main` and via `workflow_dispatch`. Steps: `checkout` (`fetch-depth: 0`) → `setup-node` 22 → `validate-marketplace.mjs` → `npm ci` → `npm run build` (generates the data, then bundles the app) → `actions/upload-pages-artifact` (`site/dist`) → `actions/deploy-pages`. Permissions: `pages: write`, `id-token: write`, `contents: read`. `validate.yml` runs the same build on every PR, so a broken site never reaches `main`.

**Local development:**
```bash
npm install
npm run dev            # real data from this repository, hot reload at http://localhost:5173
npm run dev:fixtures   # the same server on site/fixtures (6 sample plugins)
npm run build          # production build into site/dist
npm run preview        # serve site/dist
```
`npm run dev` regenerates `catalog.json` on start; after changing a plugin, restart it or run `npm run catalog`.

## Technology decision

React 18 + Vite, built by GitHub Actions on every merge to `main`.

| Pros | Cons |
| :- | :- |
| Components, JSX and tooling (tests, linters, TypeScript later) instead of one large file | Adds `package.json`, `node_modules` and dependency updates to a repository that had none |
| Dependencies are bundled: no CDN, which keeps "no external requests at runtime" true | The deploy workflow now needs `npm ci` and a build step that can fail |
| Dev server with hot reload comes with Vite | React is heavier than the problem strictly needs (about 66 KB gzip for the whole app) |
| Stage 2 features (graph, stack builder, wizard) are easier to build and test | The app was ported from a Claude Design prototype, so parts of `App.jsx` are still a class component and can be modernised later |
| The PR build catches site breakage before merge | |

The earlier plan (vanilla JS, no bundler, vendored MiniSearch) is superseded by this decision.

## Data model

`catalog.json` (`schemaVersion: 1`):

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-26T12:00:00Z",
  "marketplace": { "name": "dev-digest-ai-marketplace", "description": "…", "repo": "OlegDEma/devdigest_team_ai_marketplace" },
  "plugins": [{
    "name": "sdd-engineering",
    "displayName": "SDD Engineering",
    "version": "1.1.0",
    "description": "…",
    "author": "DevDigest Team",
    "license": "UNLICENSED",
    "category": "engineering",
    "tags": ["sdd", "specs"],
    "keywords": ["sdd", "engineering"],
    "dependencies": [{ "name": "core-conventions", "version": "^1.0.0" }],
    "external": false,
    "path": "plugins/sdd-engineering",
    "lastReleasedAt": "2026-10-20",
    "hasReadme": true,
    "components": {
      "hooks": [{ "event": "PreToolUse", "matcher": "Bash", "script": "check.sh" }],
      "mcpServers": [{ "name": "jira", "transport": "http" }],
      "scripts": ["check.sh"]
    },
    "changelog": [{ "version": "1.1.0", "date": "2026-10-20", "bump": "minor", "sections": { "Added": ["…"] } }]
  }],
  "artifacts": [{
    "id": "sdd-engineering/skill/write-spec",
    "type": "skill",
    "name": "write-spec",
    "description": "…",
    "plugin": "sdd-engineering",
    "path": "plugins/sdd-engineering/skills/write-spec/SKILL.md"
  }],
  "stats": { "plugins": 1, "skills": 1, "agents": 0, "commands": 0, "pluginsWithHooks": 1, "mcpServers": 1, "health": { "…": "…" } }
}
```

Any field outside this schema is not published.

## Non-functional requirements

- First load without `catalog.json`: up to 100 KB gzip. For 100 plugins, `catalog.json` is up to 300 KB.
- The UI is keyboard accessible, has a visible focus, `aria-live` for the result count, and WCAG AA contrast.
- Light and dark theme via `prefers-color-scheme`, with a toggle.
- Mobile widths from 360 px with no horizontal scroll.
- The interface language is English. Claude Code terms (skill, agent, hook) are used as-is.
- `localStorage` is used only for the theme, the onboarding banner and the stack; every call is wrapped in `try/catch`. The site works fully without it.
- **Graceful degradation:** `index.html` has a `<noscript>` note that points to `catalog.json`, so the data stays reachable without JavaScript. If `catalog.json` fails to load, the page shows an error with "Try again" instead of a blank screen. A browser without `navigator.clipboard` falls back to selecting the command text.

## Future: semantic search

Not implemented in v1; this only fixes the extension point so it can be added without a rewrite or a server.

- `search.js` exposes a `SearchProvider` interface: `init(catalog)`, `search(query, filters) → [{ id, score, matches }]`. v1 ships the keyword provider (prefix, typo tolerance and synonyms) and all UI code talks to the interface only.
- A later `SemanticProvider` could use embeddings precomputed in CI into `embeddings.json` (one vector per document) and a small self-hosted model run in the browser (e.g. transformers.js) to embed the query, then mix the score with the keyword score. Everything stays static files on the same origin.
- Trigger to revisit: users regularly get empty or irrelevant results for descriptive queries ("something to help with DB migrations"), visible in "Suggest a skill" issues.

## Testing

- Unit tests for `build-catalog.mjs` (`scripts/test/build-catalog.test.mjs`) on `node:test`, no dependencies: frontmatter and CHANGELOG parsing, allowlist (the `command` field from hooks never reaches the output), unsafe strings, empty marketplace. Tests for `search.js` come with the search provider extraction.
- Fixtures in `site/fixtures/`: 5–10 plugins of varied makeup, including an external one and one without a CHANGELOG, plus an empty marketplace (`plugins: []`).
- Tests run in `validate.yml` on every PR. `pages.yml` only deploys.

## Changes to existing files

- `docs/PLUGIN-GUIDELINES.md`: `CHANGELOG.md` format (Keep a Changelog, date required) (done), and a required `description` in skill/agent/command frontmatter.
- `scripts/validate-marketplace.mjs`: CHANGELOG format check and version match with `plugin.json` (done).
- `README.md`: link to the site.
- `CONTRIBUTING.md`: item "check how the plugin looks in the catalog (local development)".
- `CODEOWNERS`: `/site/` and `/scripts/build-catalog.mjs`.

## Prerequisites and open questions

1. **Pages hosting for a private repository.** On the free plan, GitHub Pages works only from public repositories. Options:
   - (a) GitHub Pro for the owner's account;
   - (b) the workflow deploys the built `site/dist` to a separate **public** repository (e.g. `OlegDEma/devdigest-catalog`) via a deploy key. The public repository then holds only metadata.

   The decision only affects the last step of `pages.yml`.
2. **Public CHANGELOG.** Changelog text ends up on the site. Authors should know it is public text; add an item to the PR checklist.
3. **Owners of `bundles.json` and the synonym dictionary:** who curates them.
4. **Visual language.** There is no team design system yet; the design brief asks for a minimal one of our own (CSS tokens). Settle at the design stage whether it should later be reused by other team tools.
5. **PR preview.** GitHub Pages serves one site per repository, so there are no native per-PR previews. Options: none in v1; or `validate.yml` uploads the built `site/dist` as a workflow artifact on every PR for local review.
6. **Separate repository vs `site/` subdirectory.** Source stays in `site/` in this repository either way; only the deploy target depends on question 1.
