import React from 'react';
import Template from './Template.jsx';
import { SPRITE } from './sprite.js';
import { TYPES, TL, TP, FK, SP, cfg } from './constants.js';
import { t as tx, plural } from './i18n.jsx';
import { norm, parseQ, runSearch, segs, md } from './search.js';
import { fShort, fLong, pd, WD, ago, install, artHref, depName, lsGet, lsSet, BUMP, SECS, readHash, homeHash } from './util.js';

export default class App extends React.Component {
  state = (() => {
    const u = new URLSearchParams(location.search); const h = readHash();
    const bannerP = u.get('banner');
    return Object.assign({}, h, {
      theme: u.get('theme') || lsGet('dd-theme') || 'dark', themeFromParam: !!u.get('theme'),
      banner: bannerP === '1' ? true : bannerP === '0' ? false : lsGet('dd-banner-dismissed') !== '1',
      qjOpen: u.get('qj') === '1', qjQuery: u.get('qjq') || '', qjIndex: 0, copied: null,
      sheetOpen: u.get('sheet') === '1', menuOpen: false, feedN: 30, mode: u.get('mode') === 'https' ? 'https' : 'ssh', done: {},
      ignoreQT: false, nfQ: ''
    });
  })();
  searchRef = React.createRef();
  qjRef = React.createRef();

  componentDidMount() {
    if (!document.getElementById('dd-sprite')) { const d = document.createElement('div'); d.id = 'dd-sprite'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">' + SPRITE + '</svg>'; document.body.prepend(d); }
    this.applyTheme();
    this.onHash = () => { const h = readHash(); this.setState(Object.assign({}, h, { menuOpen: false, sheetOpen: false, ignoreQT: false })); if (!h.q && !h.parts.length) {} window.scrollTo(0, 0); };
    window.addEventListener('hashchange', this.onHash);
    this.onKey = (e) => this.globalKey(e);
    window.addEventListener('keydown', this.onKey);
    if (this.state.qjOpen) setTimeout(() => this.qjRef.current && this.qjRef.current.focus(), 50);
  }
  componentWillUnmount() { window.removeEventListener('hashchange', this.onHash); window.removeEventListener('keydown', this.onKey); clearTimeout(this._ct); }
  componentDidUpdate() { this.applyTheme(); }
  applyTheme() { if (document.documentElement.getAttribute('data-theme') !== this.state.theme) document.documentElement.setAttribute('data-theme', this.state.theme); }

  cat() { return this.props.cat; }
  isHome() { return !this.state.parts.length; }

  globalKey(e) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); this.state.qjOpen ? this.closeQj() : this.openQj(); return; }
    if (this.state.qjOpen) return;
    const t = e.target; const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (e.key === '/' && !typing) { e.preventDefault(); this.searchRef.current && this.searchRef.current.focus(); return; }
    if (e.key === 'Escape') { if (this.state.sheetOpen) this.setState({ sheetOpen: false }); else if (this.state.menuOpen) this.setState({ menuOpen: false }); }
  }

  setQuery(q, f, sort) {
    const s = this.state; q = q === undefined ? s.q : q; f = f || s.f; sort = sort === undefined ? s.sort : sort;
    const next = { q, f, sort }; if (q !== s.q) next.ignoreQT = false;
    if (!this.isHome()) { this.setState(next); location.hash = homeHash(q, f, sort); return; }
    this.setState(next); try { history.replaceState(null, '', homeHash(q, f, sort)); } catch (e) {}
  }
  toggleF(k, v) { const f = Object.assign({}, this.state.f); f[k] = f[k].includes(v) ? f[k].filter((x) => x !== v) : f[k].concat(v); this.setQuery(undefined, f); }

  copy(key, text) {
    const done = () => { clearTimeout(this._ct); this.setState((s) => ({ copied: key, done: key.indexOf('step:') === 0 ? Object.assign({}, s.done, { [key.split(':')[1]]: true }) : s.done })); this._ct = setTimeout(() => this.setState({ copied: null }), 2000); };
    const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } catch (e) {} done(); };
    try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); return; } } catch (e) {}
    fallback();
  }
  cmd(key, text, hl, prompt) {
    const c = this.state.copied === key; let pre = text, h = '', post = '';
    if (hl) { const i = text.indexOf(hl); if (i >= 0) { pre = text.slice(0, i); h = hl; post = text.slice(i + hl.length); } }
    return { pre, hl: h, post, prompt: prompt || '$', cls: c ? 'copy-btn is-copied' : 'copy-btn', label: c ? tx('common.copied') : tx('common.copy'), icon: SP + (c ? 'check' : 'copy'), onCopy: (e) => { if (e) e.stopPropagation(); this.copy(key, text); } };
  }

  openQj = () => { this._prevFocus = document.activeElement; this.setState({ qjOpen: true, qjQuery: '', qjIndex: 0 }, () => setTimeout(() => this.qjRef.current && this.qjRef.current.focus(), 10)); };
  closeQj = () => { this.setState({ qjOpen: false }); const p = this._prevFocus; if (p && p.focus) setTimeout(() => p.focus(), 10); };

  qjModel(cat) {
    const q = this.state.qjQuery.trim(); let groups = [];
    const pages = [{ title: tx('page.catalog'), sub: tx('page.catalog_sub'), href: '#/', icon: 'search' }, { title: tx('page.start'), sub: tx('page.start_sub'), href: '#/start', icon: 'arrow-right' }, { title: tx('page.news'), sub: tx('page.news_sub'), href: '#/new', icon: 'rss' }];
    const docItem = (d) => ({ title: d.type === 'plugin' ? d.title : d.name, mono: d.type !== 'plugin', sub: d.type === 'plugin' ? d.description : d.plugin + ' · ' + (d.description || tx('common.no_description')), href: d.type === 'plugin' ? '#/plugin/' + d.plugin : artHref(d), icon: d.type, type: d.type, installCmd: install(d.plugin), id: d.id });
    if (!q) {
      groups.push({ label: TP.plugin, items: cat.docs.filter((d) => d.type === 'plugin').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(docItem) });
      groups.push({ label: tx('group.pages'), items: pages });
    } else {
      const { types, groups: g } = parseQ(q); let r = runSearch(cat.docs, g); if (types.length) r = r.filter((x) => types.includes(x.d.type));
      TYPES.forEach((t) => { const items = r.filter((x) => x.d.type === t).slice(0, 5).map((x) => docItem(x.d)); if (items.length) groups.push({ label: TP[t], items }); });
      const pg = pages.filter((p) => norm(p.title).includes(norm(q))); if (pg.length) groups.push({ label: tx('group.pages'), items: pg });
    }
    const flat = []; groups.forEach((g) => g.items.forEach((it) => flat.push(it)));
    const idx = Math.min(this.state.qjIndex, Math.max(0, flat.length - 1));
    this._qjFlat = flat;
    const out = groups.map((g) => ({ label: g.label, items: g.items.map((it) => { const i = flat.indexOf(it); const active = i === idx; const copied = this.state.copied === 'qj:' + it.id;
      return { title: it.title, sub: it.sub, domId: 'qj-' + i, sel: active ? 'true' : 'false', cls: 'palette__item' + (active ? ' is-active' : ''), iconCls: 'palette__icon' + (it.type ? ' t-' + it.type : ''), icon: SP + it.icon, titleCls: 'palette__title' + (it.mono ? ' mono' : ''),
        hint: copied ? tx('palette.hint_copied') : it.installCmd ? tx('palette.hint_open_copy', { mod: this.modKey() }) : tx('palette.hint_open'), hintCls: 'palette__hint' + (copied ? ' is-copied' : ''),
        open: () => this.qjGo(it), hover: () => { if (this.state.qjIndex !== i) this.setState({ qjIndex: i }); } }; }) }));
    return { groups: out, empty: !flat.length, activeId: flat.length ? 'qj-' + idx : undefined };
  }
  qjGo(it) { this.setState({ qjOpen: false }); location.hash = it.href; }
  onQjKey = (e) => {
    const flat = this._qjFlat || []; const n = flat.length; const i = Math.min(this.state.qjIndex, Math.max(0, n - 1));
    if (e.key === 'ArrowDown') { e.preventDefault(); if (n) this.setState({ qjIndex: (i + 1) % n }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) this.setState({ qjIndex: (i - 1 + n) % n }); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = flat[i]; if (!it) return; if (e.metaKey || e.ctrlKey) { if (it.installCmd) this.copy('qj:' + it.id, it.installCmd); } else this.qjGo(it); }
    else if (e.key === 'Escape') { e.preventDefault(); this.closeQj(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  };
  modKey() { return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl'; }

  facetOpts(base, f, qTypes) {
    const match = (d, skip) => FK.every((k) => { if (k === skip) return true; if (k === 'type') { const ts = f.type.concat(qTypes); return !ts.length || ts.includes(d.type); } if (!f[k].length) return true; if (k === 'category') return f.category.includes(d.category); if (k === 'plugin') return f.plugin.includes(d.plugin); return d.tags.some((t) => f.tag.includes(t)); });
    const mk = (k, values, opt) => values.map((v) => { const count = base.filter((d) => match(d, k) && (k === 'type' ? d.type === v : k === 'category' ? d.category === v : k === 'plugin' ? d.plugin === v : d.tags.includes(v))).length; const active = f[k].includes(v) || (k === 'type' && qTypes.includes(v));
      return { label: opt && opt.label ? opt.label(v) : v, count, pressed: active ? 'true' : 'false', cls: opt && opt.chip ? 'kw' + (active ? ' is-active' : '') : 'facet__opt' + (active ? ' is-active' : '') + (!count && !active ? ' is-zero' : ''), dot: k === 'type', dotCls: 'facet__dot t-' + v, toggle: () => this.toggleF(k, v), _show: count > 0 || active }; });
    const cat = this.cat();
    const uniq = (arr) => [...new Set(arr)].sort();
    return { match, facets: [
      { title: tx('facet.type'), rows: true, chips: false, opts: mk('type', TYPES, { label: (v) => TP[v] }) },
      { title: tx('facet.category'), rows: true, chips: false, opts: mk('category', uniq(cat.plugins.map((p) => p.category))) },
      { title: tx('facet.plugin'), rows: true, chips: false, opts: mk('plugin', cat.plugins.map((p) => p.name).sort()) },
      { title: tx('facet.tags'), rows: false, chips: true, opts: mk('tag', uniq([].concat(...cat.plugins.map((p) => p.tags))), { chip: true }).filter((o) => o._show) }
    ] };
  }

  updateVM(u, cat) {
    return { key: u.plugin + u.version, plugin: u.plugin, displayName: u.displayName, href: '#/plugin/' + u.plugin, version: u.version, date: u.date, dateShort: fShort(u.date), dateLong: fLong(u.date),
      bumpCls: 'bump bump--' + u.bump, bumpLabel: BUMP[u.bump], isMajor: u.bump === 'major', cls: 'update' + (u.bump === 'major' ? ' is-major' : ''), entryCls: 'feed-entry' + (u.bump === 'major' ? ' is-major' : ''),
      items: [].concat(...SECS.filter((s) => u.sections[s]).map((s) => u.sections[s].map((t) => ({ sec: tx('section.' + s), secCls: 'update__sec update__sec--' + s.toLowerCase(), segs: md(t) })))) };
  }

  cardVM(d, hits, cat) {
    const p = cat.by[d.plugin]; const isP = d.type === 'plugin'; const key = 'card:' + d.id; const c = this.state.copied === key;
    const counts = isP && p.components ? TYPES.slice(1).map((t) => { const n = cat.arts.filter((a) => a.plugin === p.name && a.type === t).length; return n ? { cls: 'card__count t-' + t, icon: SP + t, label: plural('count.' + t, n) } : null; }).filter(Boolean) : [];
    return { key: d.id, href: isP ? '#/plugin/' + p.name : artHref(d), badgeCls: 'badge t-' + d.type, icon: SP + d.type, typeLabel: TL[d.type], version: p.version,
      isMajor: !!(p.changelog[0] && p.changelog[0].bump === 'major'), title: isP ? p.displayName : d.name, titleCls: 'card__title' + (isP ? '' : ' card__title--mono'),
      segs: d.description ? segs(d.description, hits) : [{ t: tx('common.no_description'), plain: true }], descCls: 'card__desc' + (d.description ? '' : ' is-empty'),
      counts, hasCounts: counts.length > 0, external: isP && p.external,
      tags: p.tags.map((t) => ({ t, cls: 'tag' + (hits && hits.has(t) ? ' is-hit' : ''), onClick: (e) => { e.stopPropagation(); this.toggleF('tag', t); } })),
      plugin: p.name, author: p.author, copyCls: 'btn btn--sm btn--ghost' + (c ? ' is-copied' : ''), copyIcon: SP + (c ? 'check' : 'copy'), copyLabel: c ? tx('common.copied') : tx('common.copy_install'),
      copyTitle: isP ? install(p.name) : tx('card.install_title', { cmd: install(p.name), plugin: p.name }), onCopy: (e) => { e.stopPropagation(); this.copy(key, install(p.name)); } };
  }

  home(cat) {
    const s = this.state; const q = s.q.trim(); const { types, groups } = parseQ(q); const qTypes = s.ignoreQT ? [] : types;
    const anyF = FK.some((k) => s.f[k].length); const searching = !!q || anyF;
    let res = runSearch(cat.docs, groups);
    const base = res.map((r) => r.d);
    const { match, facets } = this.facetOpts(base, s.f, qTypes);
    res = res.filter((r) => match(r.d));
    if (!searching) res = res.filter((r) => r.d.type === 'plugin');
    const sort = s.sort || (q ? 'relevance' : 'release');
    if (sort === 'release') res.sort((a, b) => b.d.date.localeCompare(a.d.date) || TYPES.indexOf(a.d.type) - TYPES.indexOf(b.d.type));
    if (sort === 'name') res.sort((a, b) => a.d.title.localeCompare(b.d.title));
    const chips = [];
    qTypes.forEach((t) => { if (!s.f.type.includes(t)) chips.push({ label: tx('chip.type', { value: t }), fromQuery: true, aria: tx('chip.remove_type', { value: t }), remove: () => this.setState({ ignoreQT: true }) }); });
    FK.forEach((k) => s.f[k].forEach((v) => chips.push({ label: tx('chip.' + k, { value: v }), fromQuery: false, aria: tx('chip.remove', { value: v }), remove: () => this.toggleF(k, v) })));
    const activeCount = FK.reduce((n, k) => n + s.f[k].length, 0);
    const st = cat.stats; const zero = (n) => (n ? '' : ' is-zero');
    const stats = [['plugin', st.plugins, tx('stat.plugins'), '#/?type=plugin'], ['skill', st.skill, tx('stat.skills'), '#/?type=skill'], ['agent', st.agent, tx('stat.agents'), '#/?type=agent'], ['command', st.command, tx('stat.commands'), '#/?type=command'], ['hook', st.hooks, tx('stat.hooks'), '#/?type=hook'], ['mcp', st.mcp, tx('stat.mcp'), '#/?type=mcp']]
      .map(([t, v, l, h]) => ({ cls: 'stat t-' + t + zero(v), value: v, label: l, icon: SP + t, href: h }));
    stats.push({ cls: 'stat stat--meta', value: cat.feed.length ? ago(cat.feed[0].date) : tx('stat.no_releases'), label: cat.feed.length ? tx('stat.last_update', { date: fShort(cat.feed[0].date) }) : tx('stat.built', { date: fShort(cat.built) }), icon: SP + 'refresh', href: '#/new' });
    const h = cat.health;
    return {
      searching, browse: !searching && !cat.empty, catalogEmpty: cat.empty && !searching, hasCatalog: !cat.empty || searching,
      facets, chips, hasChips: chips.length > 0, hasActive: activeCount > 0, activeCountLabel: activeCount ? '· ' + activeCount : '',
      cards: res.map((r) => this.cardVM(r.d, r.hits, cat)), hasResults: res.length > 0, noResults: searching && !res.length, resultCount: res.length,
      noResultsText: cat.empty ? tx('results.empty_catalog') : tx(activeCount ? 'results.none_filters' : 'results.none', { query: q ? ' “' + q + '”' : '' }),
      listTitle: searching ? tx('results.title') : tx('results.all_plugins'), listCount: searching ? plural('results.count', res.length) : tx('results.browse', { plugins: st.plugins, artifacts: cat.arts.length, sort: tx(sort === 'name' ? 'results.sorted_name' : 'results.sorted_release') }),
      sort, sortOpts: (q ? [{ value: 'relevance', label: tx('sort.relevance') }] : []).concat([{ value: 'release', label: tx('sort.release') }, { value: 'name', label: tx('sort.name') }]),
      stats, showHealth: !cat.empty,
      health: { metrics: [[tx('health.readme'), h.readme], [tx('health.changelog'), h.changelog], [tx('health.tags'), h.tags]].map(([l, p]) => ({ label: l, pct: p, meterCls: 'meter' + (p < 80 ? ' is-low' : '') })), issueLabel: plural('health.issues', h.issues.length), issues: h.issues.map((i) => ({ kind: i.kind, plugin: i.plugin, href: '#/plugin/' + i.plugin, segs: md(tx('issue.' + i.kind, Object.assign({}, i.params, i.params && i.params.type ? { type: TL[i.params.type] } : {}))) })) },
      latest: cat.feed.slice(0, 5).map((u) => this.updateVM(u, cat)), hasLatest: cat.feed.length > 0,
      sheetCta: plural('results.show', res.length)
    };
  }

  pluginVM(p, cat) {
    const arts = cat.arts.filter((a) => a.plugin === p.name);
    const groups = TYPES.slice(1).map((t) => { const items = arts.filter((a) => a.type === t); return items.length ? { label: TP[t], count: items.length, icon: SP + t, headCls: 'contents__head t-' + t, items: items.map((a) => ({ name: a.name, href: artHref(a), desc: a.description || tx('common.no_description'), descCls: 'art-row__desc' + (a.description ? '' : ' is-empty') })) } : null; }).filter(Boolean);
    const deps = p.dependencies.map((d) => ({ name: depName(d), range: typeof d === 'string' ? '' : d.version, href: '#/plugin/' + depName(d) }));
    const dependents = cat.plugins.filter((x) => x.dependencies.some((d) => depName(d) === p.name)).map((x) => ({ name: x.name, href: '#/plugin/' + x.name }));
    return { name: p.name, displayName: p.displayName, description: p.description, version: p.version, author: p.author, license: p.license, category: p.category, catHref: '#/?category=' + p.category,
      released: fLong(p.lastReleasedAt), isMajor: !!(p.changelog[0] && p.changelog[0].bump === 'major'), external: p.external,
      tags: p.tags.map((t) => ({ t, href: '#/?tag=' + t })), cmd: this.cmd('plugin:' + p.name, install(p.name), p.name),
      hasContents: !p.external && groups.length > 0, groups, contentCount: arts.length,
      hasChangelog: p.changelog.length > 0, noChangelog: !p.changelog.length, changelog: p.changelog.slice(0, 3).map((c) => this.updateVM(Object.assign({}, c, { plugin: p.name }), cat)),
      changelogHref: cfg.GH + '/blob/main/' + p.path + '/CHANGELOG.md',
      hasSource: !!p.path, sourceHref: cfg.GH + '/tree/main/' + p.path, hasReadme: p.hasReadme && !!p.path, noReadme: !p.hasReadme, readmeHref: cfg.GH + '/blob/main/' + p.path + '/README.md',
      deps, hasDeps: deps.length > 0, noDeps: !deps.length, dependents, hasDependents: dependents.length > 0 };
  }

  artifactVM(a, cat) {
    const p = cat.by[a.plugin]; const sib = cat.arts.filter((x) => x.plugin === p.name && x.id !== a.id);
    const slash = a.type === 'skill' || a.type === 'command'; const inv = '/' + p.name + ':' + a.name;
    const hookParts = a.name.split(' · ');
    const hk = a.hook || { event: hookParts[0], matcher: hookParts[1] || '' };
    const runs = a.type === 'hook' ? { t: tx('art.when_runs'), x: hk.matcher ? tx('art.hook_runs_matcher', { event: hk.event, matcher: hk.matcher }) : tx('art.hook_runs', { event: hk.event }) }
      : a.type === 'agent' ? { t: tx('art.how_runs'), x: tx('art.agent_runs', { name: a.name }) }
      : a.type === 'mcp' ? { t: tx('art.how_runs'), x: tx('art.mcp_runs') } : null;
    return { type: a.type, name: a.name, badgeCls: 'badge t-' + a.type, icon: SP + a.type, desc: a.description || tx('art.no_description_fm'), descCls: 'hero__desc' + (a.description ? '' : ' is-empty'),
      plugin: p.name, pluginHref: '#/plugin/' + p.name, pluginDisplay: p.displayName, pluginDesc: p.description, version: p.version,
      hasInvoke: slash, invoke: this.cmd('inv:' + a.id, inv, a.name, '›'), hasRuns: !!runs, runsTitle: runs ? runs.t : '', runsText: runs ? runs.x : '',
      cmd: this.cmd('art:' + a.id, install(p.name), p.name), installNote: tx('art.install_note', { plugin: p.name, count: sib.length + 1 }),
      path: a.path, fileHref: cfg.GH + '/blob/main/' + a.path, hasSiblings: sib.length > 0, siblings: sib.map((x) => ({ name: x.name, href: artHref(x), desc: x.description || tx('common.no_description'), descCls: 'art-row__desc' + (x.description ? '' : ' is-empty') })) };
  }

  startVM(cat) {
    const ssh = this.state.mode === 'ssh'; const D = this.state.done; const first = cat.plugins.slice().sort((a, b) => b.lastReleasedAt.localeCompare(a.lastReleasedAt))[0] || {};
    const raw = [
      { id: 1, title: tx('start.s1.title'), text: tx(ssh ? 'start.s1.text_ssh' : 'start.s1.text_https'), cmds: [ssh ? 'ssh -T git@github.com' : 'gh auth login && gh auth setup-git'] },
      { id: 2, title: tx('start.s2.title'), text: tx('start.s2.text'), cmds: [ssh ? 'claude plugin marketplace add ' + cfg.REPO : 'claude plugin marketplace add https://github.com/' + cfg.REPO + '.git'] },
      { id: 3, title: tx('start.s3.title'), optional: true, text: tx('start.s3.text'), cmds: ['claude plugin marketplace add ' + cfg.REPO + ' --scope project', 'git add .claude/settings.json && git commit -m "Add DevDigest marketplace"'] },
      { id: 4, title: tx('start.s4.title'), text: tx(cat.empty ? 'start.s4.text_empty' : 'start.s4.text'), cmds: cat.empty ? [] : [install(first.name)], links: cat.empty ? [] : [{ label: tx('start.s4.link'), href: '#/' }] },
      { id: 5, title: tx('start.s5.title'), text: tx('start.s5.text'), cmds: ['claude plugin marketplace update ' + cfg.MP] }
    ];
    return raw.map((s, i) => ({ n: i + 1, title: s.title, optional: !!s.optional, segs: md(s.text), done: !!D[s.id], notDone: !D[s.id], cls: 'step' + (D[s.id] ? ' is-done' : ''),
      cmds: s.cmds.map((c, j) => this.cmd('step:' + s.id + ':' + j, c, first.name && c.indexOf(first.name) >= 0 ? first.name : '')), links: s.links || [], hasLinks: !!(s.links && s.links.length) }));
  }

  renderVals() {
    const s = this.state; const cat = this.cat(); const parts = s.parts;
    const ready = this.props.status === 'ready';
    let route = 'notFound', p = null, a = null;
    if (!parts.length) route = 'home';
    else if (parts[0] === 'plugin' && parts.length === 2 && cat.by[parts[1]]) { route = 'plugin'; p = cat.by[parts[1]]; }
    else if (parts[0] === 'plugin' && parts.length === 4) { a = cat.arts.find((x) => x.plugin === parts[1] && x.type === parts[2] && x.id.split('/')[2] === parts[3]); if (a) route = 'artifact'; }
    else if (parts.length === 1 && parts[0] === 'start') route = 'start';
    else if (parts.length === 1 && parts[0] === 'new') route = 'news';
    const v = { home: ready && route === 'home', plugin: ready && route === 'plugin', artifact: ready && route === 'artifact', start: ready && route === 'start', news: ready && route === 'news', notFound: ready && route === 'notFound' };
    const navActive = route === 'home' || route === 'plugin' || route === 'artifact' ? '#/' : route === 'news' ? '#/new' : route === 'start' ? '#/start' : '';
    const nav = [[tx('page.catalog'), '#/'], [tx('page.news'), '#/new'], [tx('page.start'), '#/start']].map(([l, h]) => ({ label: l, href: h, cls: 'nav__link' + (navActive === h ? ' is-active' : ''), current: navActive === h ? 'page' : undefined }));
    const home = route === 'home' ? this.home(cat) : { facets: [], cards: [], chips: [] };
    const qj = s.qjOpen ? this.qjModel(cat) : { groups: [], empty: false };
    const feedAll = cat.feed; const shown = feedAll.slice(0, s.feedN); const days = [];
    shown.forEach((u) => { let d = days[days.length - 1]; if (!d || d.date !== u.date) { const x = pd(u.date); d = { date: u.date, label: fLong(u.date), weekday: WD[new Date(Date.UTC(x.y, x.m - 1, x.dd)).getUTCDay()], entries: [] }; days.push(d); } d.entries.push(this.updateVM(u, cat)); });
    const lc = s.copied === 'link';
    return Object.assign({}, home, {
      marketplaceName: cfg.MP, ghHref: cfg.GH, contribHref: cfg.GH + '/blob/main/CONTRIBUTING.md',
      builtLabel: cat.builtAt ? tx('footer.built', { date: fLong(cat.built), time: cat.builtAt.slice(11, 16) }) : '',
      v, isLoading: this.props.status === 'loading', isError: this.props.status === 'error', sk: [1, 2, 3, 4],
      q: s.q, hasQ: !!s.q, noQ: !s.q, nav, menuOpen: s.menuOpen, menuExpanded: s.menuOpen ? 'true' : 'false', modKey: this.modKey(),
      themeIcon: SP + (s.theme === 'dark' ? 'sun' : 'moon'), themeLabel: tx(s.theme === 'dark' ? 'theme.to_light' : 'theme.to_dark'),
      showBanner: s.banner && !home.searching,
      suggestHref: cfg.GH + '/issues/new?labels=skill-request&title=' + encodeURIComponent(tx('suggest.title', { query: s.q || '' })) + '&body=' + encodeURIComponent(tx('suggest.body', { query: s.q || '—' })),
      copyLinkLabel: lc ? tx('common.link_copied') : tx('common.copy_link'), copyLinkIcon: SP + (lc ? 'check' : 'link'),
      sheetVisible: s.sheetOpen && route === 'home' && !cat.empty,
      pp: p ? this.pluginVM(p, cat) : { cmd: {}, groups: [], changelog: [], tags: [], deps: [], dependents: [] },
      ap: a ? this.artifactVM(a, cat) : { cmd: {}, invoke: {}, siblings: [] },
      modes: [['ssh', 'SSH'], ['https', 'HTTPS']].map(([m, l]) => ({ label: l, cls: 'segmented__btn' + (s.mode === m ? ' is-active' : ''), pressed: s.mode === m ? 'true' : 'false', select: () => this.setState({ mode: m }) })),
      modeNote: tx(s.mode === 'ssh' ? 'start.mode_ssh' : 'start.mode_https'),
      steps: route === 'start' ? this.startVM(cat) : [],
      trouble: [
        { err: tx('trouble.1.err'), fix: tx('trouble.1.fix'), cmd: this.cmd('tr:1', 'export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1'), hasCmd: true },
        { err: tx('trouble.2.err'), fix: tx('trouble.2.fix'), cmd: {}, hasCmd: false },
        { err: tx('trouble.3.err'), fix: tx('trouble.3.fix'), cmd: this.cmd('tr:3', 'claude plugin marketplace update ' + cfg.MP), hasCmd: true }
      ],
      hasFeed: feedAll.length > 0, feedEmpty: !feedAll.length, feedDays: days, feedMore: s.feedN < feedAll.length, feedShownLabel: tx('feed.showing', { shown: shown.length, total: feedAll.length }),
      showMore: () => this.setState({ feedN: s.feedN + 30 }),
      badPath: '#/' + parts.join('/'), nfQ: s.nfQ, onNfQ: (e) => this.setState({ nfQ: e.target.value }), nfSubmit: (e) => { e.preventDefault(); location.hash = homeHash(s.nfQ, { type: [], category: [], plugin: [], tag: [] }, ''); },
      qjOpen: s.qjOpen, qjQuery: s.qjQuery, qjGroups: qj.groups, qjEmpty: qj.empty, qjActiveId: qj.activeId,
      searchRef: this.searchRef, qjRef: this.qjRef,
      onQ: (e) => this.setQuery(e.target.value),
      onSearchKey: (e) => { if (e.key === 'Escape') { e.preventDefault(); if (s.q) this.setQuery(''); else e.target.blur(); } },
      clearQ: () => { this.setQuery(''); this.searchRef.current && this.searchRef.current.focus(); },
      onSort: (e) => this.setQuery(undefined, undefined, e.target.value),
      resetFilters: () => { this.setState({ ignoreQT: true }); this.setQuery(undefined, { type: [], category: [], plugin: [], tag: [] }); },
      copyLink: () => this.copy('link', location.href),
      dismissBanner: () => { lsSet('dd-banner-dismissed', '1'); this.setState({ banner: false }); },
      toggleTheme: () => { const t = s.theme === 'dark' ? 'light' : 'dark'; if (!s.themeFromParam) lsSet('dd-theme', t); this.setState({ theme: t }); },
      toggleMenu: () => this.setState({ menuOpen: !s.menuOpen }),
      openSheet: () => this.setState({ sheetOpen: true }), closeSheet: () => this.setState({ sheetOpen: false }),
      retry: this.props.onRetry,
      openQj: this.openQj, closeQj: this.closeQj, onQjKey: this.onQjKey,
      onQjQ: (e) => this.setState({ qjQuery: e.target.value, qjIndex: 0 }),
      qjScrim: (e) => { if (e.target === e.currentTarget) this.closeQj(); }
    });
  }

  render() { return <Template vm={this.renderVals()} />; }
}
