import { buildDocs } from './search.js';

const DEFAULTS = { license: 'UNLICENSED', keywords: [], dependencies: [], external: false, hasReadme: false, changelog: [], components: null };

/** Turns catalog.json into the lookup structures the UI works with. */
export function makeCatalog(data) {
  const plugins = (data.plugins || []).map((p) => Object.assign({}, DEFAULTS, p, p.external ? {} : { components: Object.assign({ hooks: [], mcpServers: [], scripts: [] }, p.components) }));
  const arts = data.artifacts || [];
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
