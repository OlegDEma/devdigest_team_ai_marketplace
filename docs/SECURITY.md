# Security policy

Plugins run code on developers' machines: hooks run shell commands, MCP servers start processes, skills can ask Claude to run commands. That is why every plugin is reviewed like regular production code.

## Permissions

- **Least privilege.** Commands and skills declare only the `allowedTools` they cannot work without. Do not allow unrestricted `Bash` if `Bash(git status:*)` is enough.
- **Hooks** must not modify files outside the project, make network requests or `git push` unless this is explicitly described in the plugin's README.
- **No `defaultEnabled: false` tricks**: a plugin does what it describes and nothing more.
- **MCP servers**: only `https://` for remote ones; local ones with pinned package versions.

## Secrets policy

- The repository **never** contains tokens, passwords, API keys, `.env` files, or private URLs with credentials.
- Secrets a plugin needs are requested via `userConfig` with `"sensitive": true` — they are stored in the system credential store, not in `settings.json`.
- In hooks, values are read from `CLAUDE_PLUGIN_OPTION_<KEY>` variables; do not use `${user_config.*}` in shell-form hooks (Claude Code blocks this).
- Access to the private marketplace goes only through the user's git credentials (`gh auth setup-git` or an SSH key). There are never tokens in `marketplace.json`.
- If a secret ends up in git history, treat it as compromised: revoke, rotate, then clean the history.

## Script review

For every file in `hooks/`, `scripts/` and every `.mcp.json`, the reviewer checks:

- [ ] What exactly runs and with which arguments
- [ ] Paths to plugin files go through `"${CLAUDE_PLUGIN_ROOT}"`, quoted
- [ ] No `curl | sh`, no downloading and executing code from the network
- [ ] No `eval` over data from tool input
- [ ] No access to `~/.ssh`, `~/.aws`, the keychain, or browser history
- [ ] External dependencies are pinned to a version; `sha256` for `archive`, `sha` for git
- [ ] No hidden Unicode characters (bidi, zero-width) in scripts and markdown

## External plugins

A plugin from another repository is added only with a pinned `sha` and after the same review. Updating the `sha` is a separate PR with a review of the diff between commits.

## Reporting a vulnerability

Do not open a public issue. Contact the owners listed in [CODEOWNERS](../CODEOWNERS) directly. Until it is fixed, the plugin can be removed from the catalog (see rollback in [RELEASES.md](RELEASES.md)).
