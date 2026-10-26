import { buildDocs } from './search.js';
import { t } from './i18n.jsx';

const DEFAULTS = { license: 'UNLICENSED', keywords: [], dependencies: [], external: false, hasReadme: false, changelog: [], components: null };

/** Hooks and MCP servers have no prose in the repository; their description is composed from structured fields. */
function describe(a) {
  if (a.hook) {
    const h = a.hook;
    const key = `art.hook_desc${h.script ? '' : '_noscript'}${h.matcher ? '_matcher' : ''}`;
    return t(key, { script: h.script, event: h.event, matcher: h.matcher });
  }
  if (a.mcp) return t('art.mcp_desc', { name: a.name, transport: a.mcp.transport });
  return '';
}

/** Turns catalog.json into the lookup structures the UI works with. */
export function makeCatalog(data) {
  const plugins = (data.plugins || []).map((p) => Object.assign({}, DEFAULTS, p, p.external ? {} : { components: Object.assign({ hooks: [], mcpServers: [], scripts: [] }, p.components) }));
  const arts = (data.artifacts || []).map((a) => Object.assign({}, a, { description: a.description || describe(a) }));
  const by = {};
  plugins.forEach((p) => (by[p.name] = p));
  const feed = [];
  plugins.forEach((p) => p.changelog.forEach((c) => feed.push(Object.assign({}, c, { plugin: p.name, displayName: p.displayName }))));
  feed.sort((a, b) => b.date.localeCompare(a.date) || a.plugin.localeCompare(b.plugin));
  const st = data.stats || {};
  const health = st.health || { readme: 0, changelog: 0, tags: 0, issues: [] };
  return {
    plugins, arts, by, feed, docs: buildDocs(plugins, arts), empty: !plugins.length,
    built: (data.generatedAt || '').slice(0, 10), builtAt: data.generatedAt || '',
    stats: { plugins: plugins.length, skill: st.skills || 0, agent: st.agents || 0, command: st.commands || 0, hooks: st.pluginsWithHooks || 0, mcp: st.mcpServers || 0 },
    health,
  };
}
