import React from 'react';

// Presentational template. Generated once from the Claude Design prototype, then maintained by hand.
export default function Template({ vm }) {
  const {
    builtLabel,
    contribHref,
    ghHref,
    activeCountLabel,
    ap,
    badPath,
    browse,
    cards,
    catalogEmpty,
    chips,
    clearQ,
    closeQj,
    closeSheet,
    copyLink,
    copyLinkIcon,
    copyLinkLabel,
    dismissBanner,
    facets,
    feedDays,
    feedEmpty,
    feedMore,
    feedShownLabel,
    hasActive,
    hasCatalog,
    hasChips,
    hasFeed,
    hasLatest,
    hasQ,
    hasResults,
    health,
    isError,
    isLoading,
    latest,
    listCount,
    listTitle,
    menuExpanded,
    menuOpen,
    modKey,
    modeNote,
    modes,
    nav,
    nfQ,
    nfSubmit,
    noQ,
    noResults,
    noResultsText,
    onNfQ,
    onQ,
    onQjKey,
    onQjQ,
    onSearchKey,
    onSort,
    openQj,
    openSheet,
    pp,
    q,
    qjActiveId,
    qjEmpty,
    qjGroups,
    qjOpen,
    qjQuery,
    qjRef,
    qjScrim,
    resetFilters,
    resultCount,
    retry,
    searchRef,
    searching,
    sheetCta,
    sheetVisible,
    showBanner,
    showHealth,
    showMore,
    sk,
    sort,
    sortOpts,
    stats,
    steps,
    suggestHref,
    themeIcon,
    themeLabel,
    toggleMenu,
    toggleTheme,
    trouble,
    v
  } = vm;
  return (
    <>

<header className="header">
  <div className="header__inner">
    <a className="brand" href="#/"><span className="brand__mark"><svg className="icon"><use href="#plugin"></use></svg></span><span>Catalog</span><span className="brand__sub">dev-digest</span></a>
    <div className="header__search">
      <div className="search" role="search">
        <label className="sr-only" htmlFor="q">Search the catalog</label>
        <svg className="icon search__icon"><use href="#search"></use></svg>
        <input id="q" className="search__input" type="search" autoComplete="off" spellCheck="false" placeholder="Search the catalog — e.g. a skill for PR review" value={q} onChange={onQ} onKeyDown={onSearchKey} ref={searchRef} />
        <div className="search__aside">
          {!!(hasQ) && (<React.Fragment><button className="icon-btn search__clear" type="button" aria-label="Clear search" onClick={clearQ}><svg className="icon icon--sm"><use href="#x"></use></svg></button></React.Fragment>)}
          {!!(noQ) && (<React.Fragment><kbd title="Press / to search">/</kbd></React.Fragment>)}
        </div>
      </div>
    </div>
    <nav className="nav" aria-label="Main">
      {nav.map((n, i_n) => (<React.Fragment key={i_n}><a className={n.cls} href={n.href} aria-current={n.current}>{n.label}</a></React.Fragment>))}
    </nav>
    <div className="header__actions">
      <button className="jump-btn" type="button" onClick={openQj} aria-label="Quick jump" title="Quick jump"><kbd>{modKey}</kbd><kbd>K</kbd></button>
      <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}><svg className="icon"><use href={themeIcon}></use></svg></button>
      <a className="gh-link" href={ghHref} target="_blank" rel="noopener" title="Requires repository access"><span className="gh-link__label">GitHub</span><svg className="icon icon--sm"><use href="#external"></use></svg></a>
      <button className="icon-btn menu-btn" type="button" onClick={toggleMenu} aria-label="Menu" aria-expanded={menuExpanded}><svg className="icon"><use href="#menu"></use></svg></button>
    </div>
  </div>
  {!!(menuOpen) && (<React.Fragment><nav className="mobile-nav is-open" aria-label="Main">{nav.map((n, i_n) => (<React.Fragment key={i_n}><a className={n.cls} href={n.href}>{n.label}</a></React.Fragment>))}</nav></React.Fragment>)}
</header>

{!!(isLoading) && (<React.Fragment>
  <div className="layout" aria-busy="true" aria-label="Loading catalog">
    <div className="facets facets--side"><div className="skeleton sk-line sk-w50"></div><div className="skeleton sk-line sk-w90"></div><div className="skeleton sk-line sk-w70"></div><div className="skeleton sk-line sk-w90"></div><div className="skeleton sk-line sk-w50"></div></div>
    <div className="main">
      <div className="skeleton sk-line sk-lg sk-w30"></div>
      <div className="skeleton sk-stats"></div>
      <div className="grid">{sk.map((x, i_x) => (<React.Fragment key={i_x}><div className="sk-card"><div className="skeleton sk-badge"></div><div className="skeleton sk-line sk-line--lg sk-w50"></div><div className="skeleton sk-line sk-w90"></div><div className="skeleton sk-line sk-w70"></div><div className="skeleton sk-line sk-w30"></div></div></React.Fragment>))}</div>
    </div>
  </div>
</React.Fragment>)}

{!!(isError) && (<React.Fragment>
  <div className="page"><div className="state-page">
    <span className="empty__icon empty--error"><svg className="icon icon--lg"><use href="#alert"></use></svg></span>
    <h1 className="state-page__title">Couldn't load the catalog</h1>
    <p className="state-page__text"><code>catalog.json</code> didn't arrive. The site is static files, so a retry usually fixes it.</p>
    <div className="empty__actions"><button className="btn btn--primary" type="button" onClick={retry}><svg className="icon"><use href="#refresh"></use></svg>Try again</button></div>
  </div></div>
</React.Fragment>)}

{!!(v.home) && (<React.Fragment>
  <div className="layout">
    <aside className="facets facets--side" aria-label="Filters">
      <div className="facets__head"><span className="eyebrow">Filters</span>{!!(hasActive) && (<React.Fragment><button className="link-btn" type="button" onClick={resetFilters}>Reset</button></React.Fragment>)}</div>
      {facets.map((fg, i_fg) => (<React.Fragment key={i_fg}>
        <section className="facet">
          <h2 className="facet__title">{fg.title}</h2>
          {!!(fg.rows) && (<React.Fragment><div className="facet__list">{fg.opts.map((o, i_o) => (<React.Fragment key={i_o}><button className={o.cls} type="button" aria-pressed={o.pressed} onClick={o.toggle}>{!!(o.dot) && (<React.Fragment><span className={o.dotCls}></span></React.Fragment>)}<span className="facet__label">{o.label}</span><span className="facet__count">{o.count}</span></button></React.Fragment>))}</div></React.Fragment>)}
          {!!(fg.chips) && (<React.Fragment><div className="facet__chips">{fg.opts.map((o, i_o) => (<React.Fragment key={i_o}><button className={o.cls} type="button" aria-pressed={o.pressed} onClick={o.toggle}>{o.label}</button></React.Fragment>))}</div></React.Fragment>)}
        </section>
      </React.Fragment>))}
    </aside>

    <div className="main">
      {!!(showBanner) && (<React.Fragment>
        <div className="banner" role="region" aria-label="Onboarding">
          <svg className="icon"><use href="#info"></use></svg>
          <p className="banner__text"><b>First time here?</b> Connect the marketplace in 30 seconds.</p>
          <a className="btn btn--sm btn--primary" href="#/start">Get started<svg className="icon icon--sm"><use href="#arrow-right"></use></svg></a>
          <button className="icon-btn" type="button" aria-label="Dismiss" onClick={dismissBanner}><svg className="icon icon--sm"><use href="#x"></use></svg></button>
        </div>
      </React.Fragment>)}

      {!!(browse) && (<React.Fragment>
        <div className="stats">
          {stats.map((st, i_st) => (<React.Fragment key={i_st}><a className={st.cls} href={st.href}><span className="stat__value">{st.value}</span><span className="stat__label"><svg className="icon icon--sm"><use href={st.icon}></use></svg>{st.label}</span></a></React.Fragment>))}
        </div>
        {!!(showHealth) && (<React.Fragment>
          <details className="health">
            <summary className="health__summary">
              <svg className="icon icon--sm health__chev"><use href="#chevron-right"></use></svg>
              <span className="health__title">Catalog health</span>
              {health.metrics.map((m, i_m) => (<React.Fragment key={i_m}><span className="metric">{m.label} <span className={m.meterCls}><span className="meter__fill" style={{ width: m.pct + '%' }}></span></span><b>{m.pct}%</b></span></React.Fragment>))}
              <span className="health__issues"><svg className="icon icon--sm"><use href="#alert"></use></svg>{health.issueLabel}</span>
            </summary>
            <ul className="health__body">
              {health.issues.map((is, i_is) => (<React.Fragment key={i_is}><li className="issue"><span className="issue__kind">{is.kind}</span><a className="issue__plugin" href={is.href}>{is.plugin}</a><span className="issue__msg">{is.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</span></li></React.Fragment>))}
            </ul>
          </details>
        </React.Fragment>)}
        {!!(hasLatest) && (<React.Fragment>
          <section>
            <div className="section-head"><h2>Latest updates</h2><a className="section-head__aside" href="#/new">All updates<svg className="icon icon--sm"><use href="#arrow-right"></use></svg></a></div>
            <ol className="updates">
              {latest.map((u, i_u) => (<React.Fragment key={i_u}>
                <li className={u.cls}>
                  <div className="update__head"><a className="update__plugin" href={u.href}>{u.plugin}</a><span className="ver">{u.version}</span><span className={u.bumpCls}>{!!(u.isMajor) && (<React.Fragment><svg className="icon"><use href="#alert"></use></svg></React.Fragment>)}{u.bumpLabel}</span><time className="update__date" dateTime={u.date}>{u.dateShort}</time></div>
                  <ul className="update__items">{u.items.map((it, i_it) => (<React.Fragment key={i_it}><li className="update__item"><span className={it.secCls}>{it.sec}</span><span>{it.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</span></li></React.Fragment>))}</ul>
                </li>
              </React.Fragment>))}
            </ol>
          </section>
        </React.Fragment>)}
      </React.Fragment>)}

      {!!(catalogEmpty) && (<React.Fragment>
        <section className="empty">
          <span className="empty__icon"><svg className="icon icon--lg"><use href="#inbox"></use></svg></span>
          <h2 className="empty__title">No plugins yet</h2>
          <p className="empty__text">The catalog builds itself from <code>plugins/</code> in the repository. Merge the first plugin into <code>main</code> and it shows up here after the next deploy — no manual steps.</p>
          <div className="empty__actions">
            <a className="btn btn--primary" href={contribHref} target="_blank" rel="noopener"><svg className="icon"><use href="#book"></use></svg>How to add a plugin</a>
            <a className="btn" href={suggestHref} target="_blank" rel="noopener">Suggest a skill</a>
          </div>
          <ol className="fill-steps">
            <li className="fill-step"><span className="fill-step__n">01</span><b>Add a folder</b><span><code>plugins/&lt;name&gt;/</code> with <code>plugin.json</code>, skills and a CHANGELOG</span></li>
            <li className="fill-step"><span className="fill-step__n">02</span><b>Open a PR</b><span>validate-marketplace checks names, versions and the changelog format</span></li>
            <li className="fill-step"><span className="fill-step__n">03</span><b>Merge to main</b><span>Pages rebuilds <code>catalog.json</code>; the plugin appears here and in What's new</span></li>
          </ol>
          <p className="block__note">You can already <a href="#/start">connect the marketplace</a> — new plugins arrive with auto-update.</p>
        </section>
      </React.Fragment>)}

      {!!(hasCatalog) && (<React.Fragment>
        <section className="main">
          <div className="overview-head">
            <div className="overview-head__title"><h1>{listTitle}</h1><p aria-live="polite">{listCount}</p></div>
            <button className="btn btn--sm filters-btn" type="button" onClick={openSheet}><svg className="icon icon--sm"><use href="#filter"></use></svg>Filters {activeCountLabel}</button>
            <label className="sort">Sort<select className="select" value={sort} onChange={onSort}>{sortOpts.map((so, i_so) => (<React.Fragment key={i_so}><option value={so.value}>{so.label}</option></React.Fragment>))}</select></label>
          </div>
          {!!(searching) && (<React.Fragment>
            <div className="results-bar">
              <span><span className="results-bar__count">{resultCount}</span> found</span>
              {!!(hasActive) && (<React.Fragment><span className="results-bar__sep">·</span><button className="link-btn" type="button" onClick={resetFilters}>Reset filters</button></React.Fragment>)}
              <span className="results-bar__sep">·</span>
              <button className="link-btn" type="button" onClick={copyLink}><svg className="icon icon--sm"><use href={copyLinkIcon}></use></svg>{copyLinkLabel}</button>
            </div>
            {!!(hasChips) && (<React.Fragment><div className="chips">{chips.map((ch, i_ch) => (<React.Fragment key={i_ch}><button className="chip is-active" type="button" onClick={ch.remove} aria-label={ch.aria}>{ch.label}{!!(ch.fromQuery) && (<React.Fragment><span className="chip__src">from query</span></React.Fragment>)}<span className="chip__x"><svg className="icon icon--sm"><use href="#x"></use></svg></span></button></React.Fragment>))}</div></React.Fragment>)}
          </React.Fragment>)}

          {!!(hasResults) && (<React.Fragment>
            <div className="grid">
              {cards.map((c, i_c) => (<React.Fragment key={i_c}>
                <article className="card">
                  <div className="card__top"><span className={c.badgeCls}><svg className="icon"><use href={c.icon}></use></svg>{c.typeLabel}</span>{!!(c.isMajor) && (<React.Fragment><span className="bump bump--major" title="Latest release has breaking changes"><svg className="icon"><use href="#alert"></use></svg>Major</span></React.Fragment>)}<span className="ver">v{c.version}</span></div>
                  <h3 className={c.titleCls}><a className="card__link" href={c.href}>{c.title}</a></h3>
                  <p className={c.descCls}>{c.segs.map((s, i_s) => (<React.Fragment key={i_s}>{!!(s.hit) && (<React.Fragment><mark>{s.t}</mark></React.Fragment>)}{!!(s.plain) && (<React.Fragment>{s.t}</React.Fragment>)}</React.Fragment>))}</p>
                  {!!(c.hasCounts) && (<React.Fragment><div className="card__counts">{c.counts.map((ct, i_ct) => (<React.Fragment key={i_ct}><span className={ct.cls}><svg className="icon"><use href={ct.icon}></use></svg>{ct.label}</span></React.Fragment>))}</div></React.Fragment>)}
                  {!!(c.external) && (<React.Fragment><span className="label" style={{ width: 'fit-content' }}><svg className="icon icon--sm"><use href="#external"></use></svg>External plugin</span></React.Fragment>)}
                  <div className="card__tags">{c.tags.map((tg, i_tg) => (<React.Fragment key={i_tg}><button className={tg.cls} type="button" onClick={tg.onClick} title="Filter by tag">{tg.t}</button></React.Fragment>))}</div>
                  <div className="card__foot">
                    <span className="card__meta"><svg className="icon icon--sm"><use href="#plugin"></use></svg><b>{c.plugin}</b><span>· {c.author}</span></span>
                    <div className="card__actions">
                      <button className={c.copyCls} type="button" onClick={c.onCopy} title={c.copyTitle}><svg className="icon icon--sm"><use href={c.copyIcon}></use></svg><span aria-live="polite">{c.copyLabel}</span></button>
                      <a className="btn btn--sm btn--primary" href={c.href}>Open</a>
                    </div>
                  </div>
                </article>
              </React.Fragment>))}
            </div>
          </React.Fragment>)}

          {!!(noResults) && (<React.Fragment>
            <div className="empty">
              <span className="empty__icon"><svg className="icon icon--lg"><use href="#search"></use></svg></span>
              <h2 className="empty__title">Nothing found</h2>
              <p className="empty__text">{noResultsText}</p>
              <div className="empty__actions">
                {!!(hasActive) && (<React.Fragment><button className="btn" type="button" onClick={resetFilters}>Reset filters</button></React.Fragment>)}
                <button className="btn" type="button" onClick={clearQ}>Clear search</button>
                <a className="btn btn--primary" href={suggestHref} target="_blank" rel="noopener">Suggest a skill</a>
              </div>
            </div>
          </React.Fragment>)}
        </section>
      </React.Fragment>)}
    </div>
  </div>
</React.Fragment>)}

{!!(v.plugin) && (<React.Fragment>
  <div className="page">
    <nav className="crumbs" aria-label="Breadcrumb"><a href="#/">Catalog</a><span className="crumbs__sep">/</span><span aria-current="page">{pp.name}</span></nav>
    <div className="detail">
      <div className="detail__main">
        <header className="hero">
          <div className="hero__title"><span className="badge t-plugin"><svg className="icon"><use href="#plugin"></use></svg>plugin</span><h1>{pp.displayName}</h1><code className="hero__name">{pp.name}</code>{!!(pp.external) && (<React.Fragment><span className="label"><svg className="icon icon--sm"><use href="#external"></use></svg>External plugin</span></React.Fragment>)}</div>
          <p className="hero__desc">{pp.description}</p>
          <div className="hero__meta"><span className="ver">v{pp.version}</span>{!!(pp.isMajor) && (<React.Fragment><span className="bump bump--major"><svg className="icon"><use href="#alert"></use></svg>Major</span></React.Fragment>)}<span className="dot">·</span><span>by {pp.author}</span><span className="dot">·</span><span>released {pp.released}</span><span className="dot">·</span><span>{pp.license}</span></div>
        </header>
        <section className="install" aria-label="Install">
          <div className="install__head"><h2 className="block__title">Install</h2><span className="block__note">Needs the marketplace — <a href="#/start">Get started</a></span></div>
          <div className="cmd"><span className="cmd__prompt" aria-hidden="true">{pp.cmd.prompt}</span><code className="cmd__text">{pp.cmd.pre}<b className="cmd__hl">{pp.cmd.hl}</b>{pp.cmd.post}</code><button className={pp.cmd.cls} type="button" onClick={pp.cmd.onCopy}><svg className="icon"><use href={pp.cmd.icon}></use></svg><span aria-live="polite">{pp.cmd.label}</span></button></div>
        </section>
        {!!(pp.external) && (<React.Fragment><div className="notice"><svg className="icon"><use href="#info"></use></svg><p><b>Lives in another repository.</b> Its skills, agents and hooks aren't indexed here. Install works the same way.</p></div></React.Fragment>)}
        {!!(pp.hasContents) && (<React.Fragment>
          <section className="block">
            <h2 className="block__title">Contents <span className="count">{pp.contentCount}</span></h2>
            <div className="contents">{pp.groups.map((g, i_g) => (<React.Fragment key={i_g}><div className="contents__group"><h3 className={g.headCls}><svg className="icon icon--sm"><use href={g.icon}></use></svg>{g.label}<span className="count">{g.count}</span></h3>{g.items.map((a, i_a) => (<React.Fragment key={i_a}><a className="art-row" href={a.href}><span className="art-row__name">{a.name}</span><span className={a.descCls}>{a.desc}</span><svg className="icon icon--sm"><use href="#chevron-right"></use></svg></a></React.Fragment>))}</div></React.Fragment>))}</div>
          </section>
        </React.Fragment>)}
        <section className="block">
          <div className="section-head"><h2 className="block__title">Changelog</h2>{!!(pp.hasChangelog) && (<React.Fragment><a className="section-head__aside" href={pp.changelogHref} target="_blank" rel="noopener">All versions<svg className="icon icon--sm"><use href="#external"></use></svg></a></React.Fragment>)}</div>
          {!!(pp.hasChangelog) && (<React.Fragment>
            <ol className="updates">{pp.changelog.map((u, i_u) => (<React.Fragment key={i_u}><li className={u.cls}><div className="update__head"><span className="update__plugin">{u.version}</span><span className={u.bumpCls}>{!!(u.isMajor) && (<React.Fragment><svg className="icon"><use href="#alert"></use></svg></React.Fragment>)}{u.bumpLabel}</span><time className="update__date" dateTime={u.date}>{u.dateLong}</time></div><ul className="update__items">{u.items.map((it, i_it) => (<React.Fragment key={i_it}><li className="update__item"><span className={it.secCls}>{it.sec}</span><span>{it.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</span></li></React.Fragment>))}</ul></li></React.Fragment>))}</ol>
          </React.Fragment>)}
          {!!(pp.noChangelog) && (<React.Fragment><p className="block__empty">No CHANGELOG.md yet.</p></React.Fragment>)}
        </section>
      </div>
      <aside className="detail__aside">
        <dl className="meta">
          <dt>Version</dt><dd className="mono">{pp.version}</dd>
          <dt>Author</dt><dd>{pp.author}</dd>
          <dt>License</dt><dd className="mono">{pp.license}</dd>
          <dt>Category</dt><dd><a href={pp.catHref}>{pp.category}</a></dd>
          <dt>Released</dt><dd>{pp.released}</dd>
          <dt>Tags</dt><dd><div className="card__tags">{pp.tags.map((tg, i_tg) => (<React.Fragment key={i_tg}><a className="tag" href={tg.href}>{tg.t}</a></React.Fragment>))}</div></dd>
        </dl>
        <section className="block">
          <h2 className="block__title">Source</h2>
          {!!(pp.hasSource) && (<React.Fragment><a className="ext-link" href={pp.sourceHref} target="_blank" rel="noopener"><svg className="icon"><use href="#github"></use></svg>Source on GitHub</a></React.Fragment>)}
          {!!(pp.hasReadme) && (<React.Fragment><a className="ext-link" href={pp.readmeHref} target="_blank" rel="noopener"><svg className="icon"><use href="#book"></use></svg>README</a></React.Fragment>)}
          {!!(pp.noReadme) && (<React.Fragment><span className="ext-link is-disabled"><svg className="icon"><use href="#book"></use></svg>No README yet</span></React.Fragment>)}
          <p className="hint"><svg className="icon icon--sm"><use href="#lock"></use></svg>Requires repository access</p>
        </section>
        <section className="block">
          <h2 className="block__title">Dependencies</h2>
          {!!(pp.hasDeps) && (<React.Fragment><div className="deps">{pp.deps.map((d, i_d) => (<React.Fragment key={i_d}><a className="dep-chip" href={d.href}><svg className="icon"><use href="#plugin"></use></svg>{d.name}<span className="dep-chip__range">{d.range}</span></a></React.Fragment>))}</div></React.Fragment>)}
          {!!(pp.noDeps) && (<React.Fragment><p className="block__empty">None</p></React.Fragment>)}
        </section>
        {!!(pp.hasDependents) && (<React.Fragment>
          <section className="block"><h2 className="block__title">Depended on by</h2><div className="deps">{pp.dependents.map((d, i_d) => (<React.Fragment key={i_d}><a className="dep-chip" href={d.href}><svg className="icon"><use href="#plugin"></use></svg>{d.name}</a></React.Fragment>))}</div></section>
        </React.Fragment>)}
      </aside>
    </div>
  </div>
</React.Fragment>)}

{!!(v.artifact) && (<React.Fragment>
  <div className="page">
    <nav className="crumbs" aria-label="Breadcrumb"><a href="#/">Catalog</a><span className="crumbs__sep">/</span><a href={ap.pluginHref}>{ap.plugin}</a><span className="crumbs__sep">/</span><span>{ap.type}</span><span className="crumbs__sep">/</span><span aria-current="page">{ap.name}</span></nav>
    <div className="detail">
      <div className="detail__main">
        <header className="hero">
          <div className="hero__title"><span className={ap.badgeCls}><svg className="icon"><use href={ap.icon}></use></svg>{ap.type}</span><h1 className="mono">{ap.name}</h1></div>
          <p className={ap.descCls}>{ap.desc}</p>
        </header>
        {!!(ap.hasInvoke) && (<React.Fragment>
          <section className="block">
            <h2 className="block__title">Invoke in Claude Code</h2>
            <div className="cmd"><span className="cmd__prompt" aria-hidden="true">{ap.invoke.prompt}</span><code className="cmd__text">{ap.invoke.pre}<b className="cmd__hl">{ap.invoke.hl}</b>{ap.invoke.post}</code><button className={ap.invoke.cls} type="button" onClick={ap.invoke.onCopy}><svg className="icon"><use href={ap.invoke.icon}></use></svg><span aria-live="polite">{ap.invoke.label}</span></button></div>
          </section>
        </React.Fragment>)}
        {!!(ap.hasRuns) && (<React.Fragment><section className="block"><h2 className="block__title">{ap.runsTitle}</h2><p className="runs-on">{ap.runsText}</p></section></React.Fragment>)}
        <section className="install" aria-label="Install">
          <div className="install__head"><h2 className="block__title">Install</h2></div>
          <div className="cmd"><span className="cmd__prompt" aria-hidden="true">{ap.cmd.prompt}</span><code className="cmd__text">{ap.cmd.pre}<b className="cmd__hl">{ap.cmd.hl}</b>{ap.cmd.post}</code><button className={ap.cmd.cls} type="button" onClick={ap.cmd.onCopy}><svg className="icon"><use href={ap.cmd.icon}></use></svg><span aria-live="polite">{ap.cmd.label}</span></button></div>
          <p className="cmd-note"><svg className="icon icon--sm"><use href="#info"></use></svg>{ap.installNote}</p>
        </section>
        {!!(ap.hasSiblings) && (<React.Fragment>
          <section className="block"><h2 className="block__title">Also in {ap.plugin}</h2><div className="contents"><div className="contents__group">{ap.siblings.map((a, i_a) => (<React.Fragment key={i_a}><a className="art-row" href={a.href}><span className="art-row__name">{a.name}</span><span className={a.descCls}>{a.desc}</span><svg className="icon icon--sm"><use href="#chevron-right"></use></svg></a></React.Fragment>))}</div></div></section>
        </React.Fragment>)}
      </div>
      <aside className="detail__aside">
        <section className="block">
          <h2 className="block__title">Plugin</h2>
          <a className="plugin-link" href={ap.pluginHref}><span className="badge t-plugin"><svg className="icon"><use href="#plugin"></use></svg></span><span className="plugin-link__body"><span className="plugin-link__title">{ap.pluginDisplay}</span><span className="plugin-link__desc">{ap.pluginDesc}</span></span><span className="ver">v{ap.version}</span></a>
        </section>
        <section className="block">
          <h2 className="block__title">File</h2>
          <a className="ext-link ext-link--mono" href={ap.fileHref} target="_blank" rel="noopener"><svg className="icon"><use href="#file"></use></svg>{ap.path}</a>
          <p className="hint"><svg className="icon icon--sm"><use href="#lock"></use></svg>Requires repository access</p>
        </section>
      </aside>
    </div>
  </div>
</React.Fragment>)}

{!!(v.start) && (<React.Fragment>
  <div className="page page--narrow">
    <header className="page-head"><h1>Get started</h1><p>Connect the marketplace once. About 30 seconds.</p></header>
    <div className="start-bar">
      <div className="segmented" role="group" aria-label="Git transport">{modes.map((m, i_m) => (<React.Fragment key={i_m}><button className={m.cls} type="button" aria-pressed={m.pressed} onClick={m.select}>{m.label}</button></React.Fragment>))}</div>
      <span className="block__note">{modeNote}</span>
    </div>
    <ol className="stepper">
      {steps.map((st, i_st) => (<React.Fragment key={i_st}>
        <li className={st.cls}>
          <span className="step__num">{!!(st.done) && (<React.Fragment><svg className="icon icon--sm"><use href="#check"></use></svg></React.Fragment>)}{!!(st.notDone) && (<React.Fragment>{st.n}</React.Fragment>)}</span>
          <div className="step__body">
            <h2 className="step__title">{st.title}{!!(st.optional) && (<React.Fragment><span className="step__opt">Optional</span></React.Fragment>)}</h2>
            <p className="step__text">{st.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</p>
            {st.cmds.map((c, i_c) => (<React.Fragment key={i_c}><div className="cmd"><span className="cmd__prompt" aria-hidden="true">{c.prompt}</span><code className="cmd__text">{c.pre}<b className="cmd__hl">{c.hl}</b>{c.post}</code><button className={c.cls} type="button" onClick={c.onCopy}><svg className="icon"><use href={c.icon}></use></svg><span aria-live="polite">{c.label}</span></button></div></React.Fragment>))}
            {!!(st.hasLinks) && (<React.Fragment><div className="step__links">{st.links.map((l, i_l) => (<React.Fragment key={i_l}><a className="btn btn--sm" href={l.href}>{l.label}</a></React.Fragment>))}</div></React.Fragment>)}
          </div>
        </li>
      </React.Fragment>))}
    </ol>
    <details className="troubleshoot">
      <summary className="troubleshoot__summary"><svg className="icon icon--sm health__chev"><use href="#chevron-right"></use></svg>Troubleshooting</summary>
      <dl className="troubleshoot__body">{trouble.map((tr, i_tr) => (<React.Fragment key={i_tr}><div className="trouble"><dt><code>{tr.err}</code></dt><dd><span>{tr.fix}</span>{!!(tr.hasCmd) && (<React.Fragment><div className="cmd"><span className="cmd__prompt" aria-hidden="true">$</span><code className="cmd__text">{tr.cmd.pre}</code><button className={tr.cmd.cls} type="button" onClick={tr.cmd.onCopy}><svg className="icon"><use href={tr.cmd.icon}></use></svg><span>{tr.cmd.label}</span></button></div></React.Fragment>)}</dd></div></React.Fragment>))}</dl>
    </details>
  </div>
</React.Fragment>)}

{!!(v.news) && (<React.Fragment>
  <div className="page feed">
    <header className="page-head"><h1>What's new</h1><a className="rss-link" href="feed.xml" title="RSS 2.0 feed"><svg className="icon icon--sm"><use href="#rss"></use></svg>RSS</a><p>Releases across all plugins, newest first. <b>Major</b> means breaking changes — read before updating.</p></header>
    {!!(hasFeed) && (<React.Fragment>
      {feedDays.map((day, i_day) => (<React.Fragment key={i_day}>
        <section className="feed-day">
          <h2 className="feed-day__date"><b>{day.label}</b>{day.weekday}</h2>
          <div className="feed-day__list">
            {day.entries.map((u, i_u) => (<React.Fragment key={i_u}>
              <article className={u.entryCls}>
                <div className="update__head"><a className="feed-entry__title" href={u.href}>{u.displayName}</a><span className="update__plugin ver">{u.plugin}</span><span className="ver">v{u.version}</span><span className={u.bumpCls}>{!!(u.isMajor) && (<React.Fragment><svg className="icon"><use href="#alert"></use></svg></React.Fragment>)}{u.bumpLabel}</span></div>
                <ul className="update__items">{u.items.map((it, i_it) => (<React.Fragment key={i_it}><li className="update__item"><span className={it.secCls}>{it.sec}</span><span>{it.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</span></li></React.Fragment>))}</ul>
              </article>
            </React.Fragment>))}
          </div>
        </section>
      </React.Fragment>))}
      {!!(feedMore) && (<React.Fragment><div className="feed__more"><button className="btn" type="button" onClick={showMore}>Show more</button><span className="block__note">{feedShownLabel}</span></div></React.Fragment>)}
    </React.Fragment>)}
    {!!(feedEmpty) && (<React.Fragment>
      <div className="empty">
        <span className="empty__icon"><svg className="icon icon--lg"><use href="#rss"></use></svg></span>
        <h2 className="empty__title">No releases yet</h2>
        <p className="empty__text">Releases show up here when a plugin's CHANGELOG.md gets a new version on main. The RSS feed already works — subscribe now and the first release will reach you.</p>
        <div className="empty__actions"><a className="btn" href="feed.xml"><svg className="icon"><use href="#rss"></use></svg>Subscribe via RSS</a><a className="btn btn--ghost" href="#/start">Get started</a></div>
      </div>
    </React.Fragment>)}
  </div>
</React.Fragment>)}

{!!(v.notFound) && (<React.Fragment>
  <div className="page"><div className="state-page">
    <p className="state-page__code">404</p>
    <h1 className="state-page__title">This page doesn't exist</h1>
    <p className="state-page__text"><code>{badPath}</code> isn't in the catalog. It may have been renamed — try searching.</p>
    <form className="search search--lg" role="search" onSubmit={nfSubmit}><svg className="icon icon--lg search__icon"><use href="#search"></use></svg><input className="search__input" type="search" placeholder="Search the catalog" aria-label="Search the catalog" value={nfQ} onChange={onNfQ} /></form>
    <div className="empty__actions"><a className="btn" href="#/">Back to catalog</a><a className="btn btn--ghost" href="#/new">What's new</a></div>
  </div></div>
</React.Fragment>)}

<footer className="footer">
  <div className="footer__inner">
    <span className="mono">dev-digest-ai-marketplace</span>
    <span>{builtLabel}</span>
    <a href="feed.xml"><svg className="icon icon--sm"><use href="#rss"></use></svg>RSS</a>
    <span className="hint"><svg className="icon icon--sm"><use href="#lock"></use></svg>Source requires repository access</span>
    <span className="footer__keys"><kbd>/</kbd> search <kbd>Esc</kbd> clear <kbd>{modKey}</kbd><kbd>K</kbd> jump</span>
  </div>
</footer>

{!!(sheetVisible) && (<React.Fragment>
  <div className="scrim" onClick={closeSheet}></div>
  <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
    <div className="sheet__grip"></div>
    <div className="sheet__head"><h2>Filters</h2>{!!(hasActive) && (<React.Fragment><button className="link-btn" type="button" onClick={resetFilters}>Reset</button></React.Fragment>)}<button className="icon-btn" type="button" onClick={closeSheet} aria-label="Close"><svg className="icon"><use href="#x"></use></svg></button></div>
    <div className="sheet__body">
      {facets.map((fg, i_fg) => (<React.Fragment key={i_fg}>
        <section className="facet">
          <h3 className="facet__title">{fg.title}</h3>
          {!!(fg.rows) && (<React.Fragment><div className="facet__list">{fg.opts.map((o, i_o) => (<React.Fragment key={i_o}><button className={o.cls} type="button" aria-pressed={o.pressed} onClick={o.toggle}>{!!(o.dot) && (<React.Fragment><span className={o.dotCls}></span></React.Fragment>)}<span className="facet__label">{o.label}</span><span className="facet__count">{o.count}</span></button></React.Fragment>))}</div></React.Fragment>)}
          {!!(fg.chips) && (<React.Fragment><div className="facet__chips">{fg.opts.map((o, i_o) => (<React.Fragment key={i_o}><button className={o.cls} type="button" aria-pressed={o.pressed} onClick={o.toggle}>{o.label}</button></React.Fragment>))}</div></React.Fragment>)}
        </section>
      </React.Fragment>))}
    </div>
    <div className="sheet__foot"><button className="btn btn--primary" type="button" onClick={closeSheet}>{sheetCta}</button></div>
  </div>
</React.Fragment>)}

{!!(qjOpen) && (<React.Fragment>
  <div className="palette-scrim" onMouseDown={qjScrim}>
    <div className="palette" role="dialog" aria-modal="true" aria-label="Quick jump">
      <div className="palette__search"><svg className="icon icon--lg"><use href="#search"></use></svg><input className="palette__input" ref={qjRef} value={qjQuery} onChange={onQjQ} onKeyDown={onQjKey} placeholder="Jump to a plugin, skill, agent or page…" aria-label="Quick jump" role="combobox" aria-expanded="true" aria-controls="qj-list" aria-activedescendant={qjActiveId} /><button className="palette__esc" type="button" onClick={closeQj} aria-label="Close"><kbd>Esc</kbd></button></div>
      <div className="palette__list" id="qj-list" role="listbox">
        {qjGroups.map((g, i_g) => (<React.Fragment key={i_g}>
          <div role="presentation" className="palette__group">{g.label}</div>
          {g.items.map((it, i_it) => (<React.Fragment key={i_it}><button className={it.cls} id={it.domId} type="button" role="option" aria-selected={it.sel} onClick={it.open} onMouseMove={it.hover}><span className={it.iconCls}><svg className="icon icon--sm"><use href={it.icon}></use></svg></span><span className={it.titleCls}>{it.title}</span><span className="palette__sub">{it.sub}</span><span className={it.hintCls}>{it.hint}</span></button></React.Fragment>))}
        </React.Fragment>))}
        {!!(qjEmpty) && (<React.Fragment><p className="palette__empty">Nothing matches “{qjQuery}”</p></React.Fragment>)}
      </div>
      <div className="palette__foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>{modKey}</kbd><kbd>↵</kbd> copy install</span><span><kbd>Esc</kbd> close</span></div>
    </div>
  </div>
</React.Fragment>)}

    </>
  );
}
