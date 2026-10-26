# Design brief: DevDigest AI Marketplace catalog

Brief for designing the catalog site. Full functional spec: [../CATALOG-SITE.md](../CATALOG-SITE.md). Realistic mockup data: [sample-catalog.json](sample-catalog.json). Use this data in mockups, not lorem ipsum.

## What it is

An internal "store" of the DevDigest team's AI tools for Claude Code: plugins that contain skills, agents, commands, hooks and MCP servers. The site helps people find the right tool, understand what it does, and install it with one copied command.

The audience is the team's developers, 10–50 people. They live in the terminal and value speed, density and honesty, not marketing.

## Three key scenarios

1. **Find.** "I need a skill for reviewing PRs" → type into search → see cards → copy the install command. Target: under 10 seconds.
2. **Connect for the first time.** A new team member opens the site → "First time here?" → 3–5 steps with copy buttons → marketplace connected in 30 seconds.
3. **What's new.** Once a week I check what was added or updated, and whether there are breaking changes (MAJOR).

## Technical constraints that affect design

- **Static site** on GitHub Pages, no server. All data is already in the browser, so search and filters are instant, with no spinner per action. A spinner is needed only on first load.
- **No external resources:** no Google Fonts, CDNs, stock images or analytics. Use system fonts (`system-ui`, monospace `ui-monospace`) or one font we will add to the repository (say which). Icons are inline SVG.
- **Implementation is vanilla HTML/CSS/JS, no framework.** Mockups must translate easily to plain HTML + CSS variables. No effects that require heavy libraries.
- **Light and dark themes** are both required.
- **From 360 px** (phone) to wide desktop.
- **Accessibility:** WCAG AA contrast, visible focus, full keyboard operation (`/` focuses search, `Esc` clears it, `Cmd/Ctrl+K` opens quick jump).
- **The catalog is empty at launch** (`plugins: []`). The empty catalog is the first thing people will see, so it needs a real design, not a fallback.
- **UI copy is English.** Claude Code terms (skill, agent, hook, MCP, plugin) are used as-is.
- **The site shows metadata only.** There are no file contents, prompt code or scripts, so don't design a code viewer. Only short commands to copy.

## Character and style

A developer tool, not a landing page. Reference feel: Linear docs or the Raycast Store, but denser. Calm, tidy, one accent color.

There is no existing team design system. Propose a minimal one of your own: a small set of tokens (colors, type scale, spacing, radii) that the whole site is built from.

- Each artifact type has a recognizable color or icon: plugin, skill, agent, command, hook, MCP. The type must read at a glance and not rely on color alone.
- Commands (`claude plugin install …`) are shown in monospace in a block with a "Copy" button and a "Copied" state.
- SemVer version badges: MAJOR stands out as a breaking-change warning, MINOR is neutral, PATCH is muted.
- No half-screen heroes. Search is the main element of the home page, above the fold.

## MVP screens

The spec feature is in parentheses.

### 1. Home (`#/`)
- Header: marketplace name, navigation ("Catalog", "What's new", "Get started"), theme toggle.
- Banner "First time here? Connect the marketplace in 30 seconds → Get started". Dismissible with a close icon (F5).
- **Search bar** is the main element. Placeholder like "e.g. a skill for PR review", with a hint about the `/` key (F1).
- **Stats tiles:** plugins, skills, agents, commands, plugins with hooks, MCP servers, "updated …" (F7).
- Expandable "Catalog health" block: README and CHANGELOG percentages, list of issues with links (F7).
- **Latest updates:** 5 entries and a "All updates" link (F6).
- Grid of all plugins (no-query state).

### 2. Search results (same screen with a query)
- **Filter facets:** type, category, plugin, tags, with counts. Side panel on desktop; on mobile a "Filters" button with a bottom sheet (F2).
- A "N found · Reset filters · Copy link" row.
- If a type was recognized in the query ("skill"), an active filter chip "Type: skill ×" is shown (F1).
- **Result card:** type icon, name, description with highlighted matches, plugin badge, version, tags, "Copy install" button (F1, F4). The key component of the site; rough layout:

  ```text
  ┌──────────────────────────────────────────────────────────────┐
  │ [skill]  pr-review                         code-review 2.0.0 │
  │ Full PR **review** against the team checklist: security,     │
  │ tests, readability, naming                                   │
  │ #review  #pr  #quality                                       │
  │ ┌──────────────────────────────────────────────┐             │
  │ │ claude plugin install code-review@dev-dig…   │ [ Copy ]    │
  │ └──────────────────────────────────────────────┘             │
  └──────────────────────────────────────────────────────────────┘
  ```

  The copy button on a skill/agent/command card copies the install command of its **parent plugin** (Claude Code installs plugins, not single skills). Make that visible, e.g. the plugin name inside the command. The whole card is clickable except the command block.
- **Empty state:** "Nothing found", a hint to clear filters, a "Suggest a skill" button (opens a GitHub issue).

### 3. Plugin page (`#/plugin/<name>`)
- Header: displayName, `name` in mono, version, author, license, category, tags, last release date (F3).
- **Install block** with the command and a copy button (F4).
- Contents: lists of skills, agents, commands, hooks and MCP, grouped by type, with short descriptions.
- Dependencies: link chips to other plugins.
- Changelog: last 3 versions and a link to all of them (F6).
- "Source on GitHub" and "README" links. The repository is private, so add a hint next to them: "requires repository access".
- An "External plugin" label for plugins from another repository (see `onboarding-helper` in the data): they have no contents.

### 4. Artifact page (`#/plugin/<name>/<type>/<artifact>`)
- Type, name, description, parent plugin (link card), invocation command (`/<plugin>:<skill>`), plugin install command, link to the file (F3).

### 5. Get started (`#/start`) (F5)
- A numbered stepper with 5–6 steps, each with a command block and copy button.
- An "SSH / HTTPS" toggle above the steps switches the commands.
- A collapsed "Troubleshooting" block at the bottom.
- The goal is to get through the screen in 30 seconds, so keep text minimal.

### 6. What's new (`#/new`) (F6)
- A chronological feed grouped by date.
- Entry: plugin, version, change-type badge (new plugin / MAJOR / MINOR / PATCH), Added/Changed/Fixed/Removed items.
- An "RSS" icon and link in the heading.
- "Show more" pagination.

### 7. Quick jump (`Cmd/Ctrl+K`) (F1)
- A modal palette over any page: search input, results grouped by type, then site pages (Get started, What's new).
- Keyboard-first: highlighted row, `↑↓` / `Enter` / `Esc` hints in the footer, `Cmd/Ctrl+Enter` copies the install command.
- On mobile: full-screen sheet.

### 8. Empty catalog (launch state)
- Home with zero plugins: search bar, stats tiles at 0, and a "No plugins yet" block that explains the catalog fills from the repository, with links "How to add a plugin" (CONTRIBUTING) and "Suggest a skill".
- What's new with no releases: "No releases yet".
- Design this with the same care as the populated home page.

### 9. System states
- First load: card skeletons.
- 404: "This page doesn't exist" with search.
- Catalog load error: a message and a "Try again" button.
- "Copied": an inline state on the button for 2 s, no toast.
- No JavaScript: a plain, lightly styled list of plugins with install commands (rendered at build time). Only basic styles are needed; it just has to look tidy.

## Stage 2 screens (lower priority)

Components plus one mockup each are enough:

- **Security panel** on the plugin page: hooks (event + matcher + script name), MCP (name + transport), scripts. A "No executable code" badge if there is none of these (F9).
- **Dependency graph:** simple layered SVG, chip nodes (F8).
- **Stack builder:** "+ Add to stack" button on cards, a counter in the header, a side panel with the list, a "pulled in as dependency" label and three output tabs: bash, `settings.json`, link (F10).
- **Role bundles** (`#/bundles`): "Newcomer", "Reviewer", "Backend" cards with a "Use bundle" button (F11).
- **Author wizard** (`#/new-plugin`): form on the left, preview of the generated files on the right (tabs per file) (F12).
- **"Suggest a skill":** a short three-field form (F12).

## Components

Needed in both themes and with all states (default, hover, focus, active, disabled):

- header with navigation and theme toggle, mobile menu;
- search bar (empty, with text, with clear button);
- quick jump palette (results, highlighted row, empty);
- filter chip (inactive, active, with count, with ×);
- artifact / plugin card;
- type badge (6 kinds), version badge, SemVer change badge (4 kinds), tag;
- **command block with copy** (default, "Copied");
- stats tile;
- changelog entry;
- banner (info, dismissible);
- onboarding stepper;
- empty state, skeleton, error.

## What to deliver

1. **Mockups** of all MVP screens: desktop (1280) and mobile (375), light and dark themes. Home is needed twice: populated (from `sample-catalog.json`) and empty (zero plugins).
2. **An HTML/CSS prototype**, not a React or Tailwind build:
   - colors, spacing, radii, shadows and fonts as CSS custom properties on `:root`, dark theme via `[data-theme="dark"]` and `prefers-color-scheme`;
   - semantic component classes (`.card`, `.badge--skill`, `.cmd`, `.stat`…), no utility classes;
   - a single `styles.css` that can be taken as is.
3. **Icons** for artifact types and the UI as separate SVGs (`currentColor`).
4. **A description of states** not visible in static mockups: hover, focus, the "Copied" animation.

Development will then wire the prototype to real data from `catalog.json`. The data structure is in `sample-catalog.json`.
