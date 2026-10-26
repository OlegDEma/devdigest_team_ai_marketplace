import React from 'react';
import { t, rich } from './i18n.jsx';

// Presentational template. All user-visible text comes from messages.js via t() / rich().
export default function Template({ vm }) {
  const {
    activeCountLabel,
    ap,
    badPath,
    browse,
    builtLabel,
    cards,
    catalogEmpty,
    chips,
    clearQ,
    closeQj,
    closeSheet,
    contribHref,
    copyLink,
    copyLinkIcon,
    copyLinkLabel,
    dismissBanner,
    facets,
    feedDays,
    feedEmpty,
    feedMore,
    feedShownLabel,
    ghHref,
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
    marketplaceName,
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
    <a className="brand" href="#/"><span className="brand__mark"><svg className="icon"><use href="#plugin"></use></svg></span><span>{t('ui.catalog')}</span><span className="brand__sub">{t('ui.dev_digest')}</span></a>
    <div className="header__search">
      <div className="search" role="search">
        <label className="sr-only" htmlFor="q">{t('ui.search_the_catalog')}</label>
        <svg className="icon search__icon"><use href="#search"></use></svg>
        <input id="q" className="search__input" type="search" autoComplete="off" spellCheck="false" placeholder={t('ui.search_the_catalog_e_g')} value={q} onChange={onQ} onKeyDown={onSearchKey} ref={searchRef} />
        <div className="search__aside">
          {!!(hasQ) && (<React.Fragment><button className="icon-btn search__clear" type="button" aria-label={t('ui.clear_search')} onClick={clearQ}><svg className="icon icon--sm"><use href="#x"></use></svg></button></React.Fragment>)}
          {!!(noQ) && (<React.Fragment><kbd title={t('ui.press_to_search')}>/</kbd></React.Fragment>)}
        </div>
      </div>
    </div>
    <nav className="nav" aria-label={t('ui.main')}>
      {nav.map((n, i_n) => (<React.Fragment key={i_n}><a className={n.cls} href={n.href} aria-current={n.current}>{n.label}</a></React.Fragment>))}
    </nav>
    <div className="header__actions">
      <button className="jump-btn" type="button" onClick={openQj} aria-label={t('ui.quick_jump')} title={t('ui.quick_jump')}><kbd>{modKey}</kbd><kbd>K</kbd></button>
      <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}><svg className="icon"><use href={themeIcon}></use></svg></button>
      <a className="gh-link" href={ghHref} target="_blank" rel="noopener" title={t('ui.requires_repository_access')}><span className="gh-link__label">{t('ui.github')}</span><svg className="icon icon--sm"><use href="#external"></use></svg></a>
      <button className="icon-btn menu-btn" type="button" onClick={toggleMenu} aria-label={t('ui.menu')} aria-expanded={menuExpanded}><svg className="icon"><use href="#menu"></use></svg></button>
    </div>
  </div>
  {!!(menuOpen) && (<React.Fragment><nav className="mobile-nav is-open" aria-label={t('ui.main')}>{nav.map((n, i_n) => (<React.Fragment key={i_n}><a className={n.cls} href={n.href}>{n.label}</a></React.Fragment>))}</nav></React.Fragment>)}
</header>

{!!(isLoading) && (<React.Fragment>
  <div className="layout" aria-busy="true" aria-label={t('ui.loading_catalog')}>
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
    <h1 className="state-page__title">{t('ui.couldn_t_load_the_catalog')}</h1>
    <p className="state-page__text">{rich('ui.catalog_json_didn_t_arrive')}</p>
    <div className="empty__actions"><button className="btn btn--primary" type="button" onClick={retry}><svg className="icon"><use href="#refresh"></use></svg>{t('ui.try_again')}</button></div>
  </div></div>
</React.Fragment>)}

{!!(v.home) && (<React.Fragment>
  <div className="layout">
    <aside className="facets facets--side" aria-label={t('ui.filters')}>
      <div className="facets__head"><span className="eyebrow">{t('ui.filters')}</span>{!!(hasActive) && (<React.Fragment><button className="link-btn" type="button" onClick={resetFilters}>{t('ui.reset')}</button></React.Fragment>)}</div>
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
        <div className="banner" role="region" aria-label={t('ui.onboarding')}>
          <svg className="icon"><use href="#info"></use></svg>
          <p className="banner__text">{rich('ui.first_time_here_connect_the')}</p>
          <a className="btn btn--sm btn--primary" href="#/start">{t('ui.get_started')}<svg className="icon icon--sm"><use href="#arrow-right"></use></svg></a>
          <button className="icon-btn" type="button" aria-label={t('ui.dismiss')} onClick={dismissBanner}><svg className="icon icon--sm"><use href="#x"></use></svg></button>
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
              <span className="health__title">{t('ui.catalog_health')}</span>
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
            <div className="section-head"><h2>{t('ui.latest_updates')}</h2><a className="section-head__aside" href="#/new">{t('ui.all_updates')}<svg className="icon icon--sm"><use href="#arrow-right"></use></svg></a></div>
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
          <h2 className="empty__title">{t('ui.no_plugins_yet')}</h2>
          <p className="empty__text">{rich('ui.the_catalog_builds_itself_from')}</p>
          <div className="empty__actions">
            <a className="btn btn--primary" href={contribHref} target="_blank" rel="noopener"><svg className="icon"><use href="#book"></use></svg>{t('ui.how_to_add_a_plugin')}</a>
            <a className="btn" href={suggestHref} target="_blank" rel="noopener">{t('ui.suggest_a_skill')}</a>
          </div>
          <ol className="fill-steps">
            <li className="fill-step"><span className="fill-step__n">01</span><b>{t('ui.add_a_folder')}</b><span>{rich('ui.plugins_lt_name_gt_with')}</span></li>
            <li className="fill-step"><span className="fill-step__n">02</span><b>{t('ui.open_a_pr')}</b><span>{t('ui.validate_marketplace_checks_names_versions')}</span></li>
            <li className="fill-step"><span className="fill-step__n">03</span><b>{t('ui.merge_to_main')}</b><span>{rich('ui.pages_rebuilds_catalog_json_the')}</span></li>
          </ol>
          <p className="block__note">{rich('ui.connect_prompt', null, { link: (c) => <a href="#/start">{c}</a> })}</p>
        </section>
      </React.Fragment>)}

      {!!(hasCatalog) && (<React.Fragment>
        <section className="main">
          <div className="overview-head">
            <div className="overview-head__title"><h1>{listTitle}</h1><p aria-live="polite">{listCount}</p></div>
            <button className="btn btn--sm filters-btn" type="button" onClick={openSheet}><svg className="icon icon--sm"><use href="#filter"></use></svg>{t('ui.filters_2', { activeCountLabel })}</button>
            <label className="sort">{t('ui.sort')}<select className="select" value={sort} onChange={onSort}>{sortOpts.map((so, i_so) => (<React.Fragment key={i_so}><option value={so.value}>{so.label}</option></React.Fragment>))}</select></label>
          </div>
          {!!(searching) && (<React.Fragment>
            <div className="results-bar">
              <span><span className="results-bar__count">{resultCount}</span> {t('ui.found')}</span>
              {!!(hasActive) && (<React.Fragment><span className="results-bar__sep">·</span><button className="link-btn" type="button" onClick={resetFilters}>{t('ui.reset_filters')}</button></React.Fragment>)}
              <span className="results-bar__sep">·</span>
              <button className="link-btn" type="button" onClick={copyLink}><svg className="icon icon--sm"><use href={copyLinkIcon}></use></svg>{copyLinkLabel}</button>
            </div>
            {!!(hasChips) && (<React.Fragment><div className="chips">{chips.map((ch, i_ch) => (<React.Fragment key={i_ch}><button className="chip is-active" type="button" onClick={ch.remove} aria-label={ch.aria}>{ch.label}{!!(ch.fromQuery) && (<React.Fragment><span className="chip__src">{t('ui.from_query')}</span></React.Fragment>)}<span className="chip__x"><svg className="icon icon--sm"><use href="#x"></use></svg></span></button></React.Fragment>))}</div></React.Fragment>)}
          </React.Fragment>)}

          {!!(hasResults) && (<React.Fragment>
            <div className="grid">
              {cards.map((c, i_c) => (<React.Fragment key={i_c}>
                <article className="card">
                  <div className="card__top"><span className={c.badgeCls}><svg className="icon"><use href={c.icon}></use></svg>{c.typeLabel}</span>{!!(c.isMajor) && (<React.Fragment><span className="bump bump--major" title={t('ui.latest_release_has_breaking_changes')}><svg className="icon"><use href="#alert"></use></svg>{t('ui.major')}</span></React.Fragment>)}<span className="ver">v{c.version}</span></div>
                  <h3 className={c.titleCls}><a className="card__link" href={c.href}>{c.title}</a></h3>
                  <p className={c.descCls}>{c.segs.map((s, i_s) => (<React.Fragment key={i_s}>{!!(s.hit) && (<React.Fragment><mark>{s.t}</mark></React.Fragment>)}{!!(s.plain) && (<React.Fragment>{s.t}</React.Fragment>)}</React.Fragment>))}</p>
                  {!!(c.hasCounts) && (<React.Fragment><div className="card__counts">{c.counts.map((ct, i_ct) => (<React.Fragment key={i_ct}><span className={ct.cls}><svg className="icon"><use href={ct.icon}></use></svg>{ct.label}</span></React.Fragment>))}</div></React.Fragment>)}
                  {!!(c.external) && (<React.Fragment><span className="label" style={{ width: 'fit-content' }}><svg className="icon icon--sm"><use href="#external"></use></svg>{t('ui.external_plugin')}</span></React.Fragment>)}
                  <div className="card__tags">{c.tags.map((tg, i_tg) => (<React.Fragment key={i_tg}><button className={tg.cls} type="button" onClick={tg.onClick} title={t('ui.filter_by_tag')}>{tg.t}</button></React.Fragment>))}</div>
                  <div className="card__foot">
                    <span className="card__meta"><svg className="icon icon--sm"><use href="#plugin"></use></svg><b>{c.plugin}</b><span>· {c.author}</span></span>
                    <div className="card__actions">
                      <button className={c.copyCls} type="button" onClick={c.onCopy} title={c.copyTitle}><svg className="icon icon--sm"><use href={c.copyIcon}></use></svg><span aria-live="polite">{c.copyLabel}</span></button>
                      <a className="btn btn--sm btn--primary" href={c.href}>{t('ui.open')}</a>
                    </div>
                  </div>
                </article>
              </React.Fragment>))}
            </div>
          </React.Fragment>)}

          {!!(noResults) && (<React.Fragment>
            <div className="empty">
              <span className="empty__icon"><svg className="icon icon--lg"><use href="#search"></use></svg></span>
              <h2 className="empty__title">{t('ui.nothing_found')}</h2>
              <p className="empty__text">{noResultsText}</p>
              <div className="empty__actions">
                {!!(hasActive) && (<React.Fragment><button className="btn" type="button" onClick={resetFilters}>{t('ui.reset_filters')}</button></React.Fragment>)}
                <button className="btn" type="button" onClick={clearQ}>{t('ui.clear_search')}</button>
                <a className="btn btn--primary" href={suggestHref} target="_blank" rel="noopener">{t('ui.suggest_a_skill')}</a>
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
    <nav className="crumbs" aria-label={t('ui.breadcrumb')}><a href="#/">{t('ui.catalog')}</a><span className="crumbs__sep">/</span><span aria-current="page">{pp.name}</span></nav>
    <div className="detail">
      <div className="detail__main">
        <header className="hero">
          <div className="hero__title"><span className="badge t-plugin"><svg className="icon"><use href="#plugin"></use></svg>{t('ui.plugin')}</span><h1>{pp.displayName}</h1><code className="hero__name">{pp.name}</code>{!!(pp.external) && (<React.Fragment><span className="label"><svg className="icon icon--sm"><use href="#external"></use></svg>{t('ui.external_plugin')}</span></React.Fragment>)}</div>
          <p className="hero__desc">{pp.description}</p>
          <div className="hero__meta"><span className="ver">v{pp.version}</span>{!!(pp.isMajor) && (<React.Fragment><span className="bump bump--major"><svg className="icon"><use href="#alert"></use></svg>{t('ui.major')}</span></React.Fragment>)}<span className="dot">·</span><span>{t('ui.by', { author: pp.author })}</span><span className="dot">·</span><span>{t('ui.released', { released: pp.released })}</span><span className="dot">·</span><span>{pp.license}</span></div>
        </header>
        <section className="install" aria-label={t('ui.install')}>
          <div className="install__head"><h2 className="block__title">{t('ui.install')}</h2><span className="block__note">{t('ui.needs_the_marketplace')} <a href="#/start">{t('ui.get_started')}</a></span></div>
          <div className="cmd"><span className="cmd__prompt" aria-hidden="true">{pp.cmd.prompt}</span><code className="cmd__text">{pp.cmd.pre}<b className="cmd__hl">{pp.cmd.hl}</b>{pp.cmd.post}</code><button className={pp.cmd.cls} type="button" onClick={pp.cmd.onCopy}><svg className="icon"><use href={pp.cmd.icon}></use></svg><span aria-live="polite">{pp.cmd.label}</span></button></div>
        </section>
        {!!(pp.external) && (<React.Fragment><div className="notice"><svg className="icon"><use href="#info"></use></svg><p>{rich('ui.lives_in_another_repository_its')}</p></div></React.Fragment>)}
        {!!(pp.hasContents) && (<React.Fragment>
          <section className="block">
            <h2 className="block__title">{t('ui.contents')} <span className="count">{pp.contentCount}</span></h2>
            <div className="contents">{pp.groups.map((g, i_g) => (<React.Fragment key={i_g}><div className="contents__group"><h3 className={g.headCls}><svg className="icon icon--sm"><use href={g.icon}></use></svg>{g.label}<span className="count">{g.count}</span></h3>{g.items.map((a, i_a) => (<React.Fragment key={i_a}><a className="art-row" href={a.href}><span className="art-row__name">{a.name}</span><span className={a.descCls}>{a.desc}</span><svg className="icon icon--sm"><use href="#chevron-right"></use></svg></a></React.Fragment>))}</div></React.Fragment>))}</div>
          </section>
        </React.Fragment>)}
        <section className="block">
          <div className="section-head"><h2 className="block__title">{t('ui.changelog')}</h2>{!!(pp.hasChangelog) && (<React.Fragment><a className="section-head__aside" href={pp.changelogHref} target="_blank" rel="noopener">{t('ui.all_versions')}<svg className="icon icon--sm"><use href="#external"></use></svg></a></React.Fragment>)}</div>
          {!!(pp.hasChangelog) && (<React.Fragment>
            <ol className="updates">{pp.changelog.map((u, i_u) => (<React.Fragment key={i_u}><li className={u.cls}><div className="update__head"><span className="update__plugin">{u.version}</span><span className={u.bumpCls}>{!!(u.isMajor) && (<React.Fragment><svg className="icon"><use href="#alert"></use></svg></React.Fragment>)}{u.bumpLabel}</span><time className="update__date" dateTime={u.date}>{u.dateLong}</time></div><ul className="update__items">{u.items.map((it, i_it) => (<React.Fragment key={i_it}><li className="update__item"><span className={it.secCls}>{it.sec}</span><span>{it.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</span></li></React.Fragment>))}</ul></li></React.Fragment>))}</ol>
          </React.Fragment>)}
          {!!(pp.noChangelog) && (<React.Fragment><p className="block__empty">{t('ui.no_changelog_md_yet')}</p></React.Fragment>)}
        </section>
      </div>
      <aside className="detail__aside">
        <dl className="meta">
          <dt>{t('ui.version')}</dt><dd className="mono">{pp.version}</dd>
          <dt>{t('ui.author')}</dt><dd>{pp.author}</dd>
          <dt>{t('ui.license')}</dt><dd className="mono">{pp.license}</dd>
          <dt>{t('ui.category')}</dt><dd><a href={pp.catHref}>{pp.category}</a></dd>
          <dt>{t('ui.released_2')}</dt><dd>{pp.released}</dd>
          <dt>{t('ui.tags')}</dt><dd><div className="card__tags">{pp.tags.map((tg, i_tg) => (<React.Fragment key={i_tg}><a className="tag" href={tg.href}>{tg.t}</a></React.Fragment>))}</div></dd>
        </dl>
        <section className="block">
          <h2 className="block__title">{t('ui.source')}</h2>
          {!!(pp.hasSource) && (<React.Fragment><a className="ext-link" href={pp.sourceHref} target="_blank" rel="noopener"><svg className="icon"><use href="#github"></use></svg>{t('ui.source_on_github')}</a></React.Fragment>)}
          {!!(pp.hasReadme) && (<React.Fragment><a className="ext-link" href={pp.readmeHref} target="_blank" rel="noopener"><svg className="icon"><use href="#book"></use></svg>{t('ui.readme')}</a></React.Fragment>)}
          {!!(pp.noReadme) && (<React.Fragment><span className="ext-link is-disabled"><svg className="icon"><use href="#book"></use></svg>{t('ui.no_readme_yet')}</span></React.Fragment>)}
          <p className="hint"><svg className="icon icon--sm"><use href="#lock"></use></svg>{t('ui.requires_repository_access')}</p>
        </section>
        <section className="block">
          <h2 className="block__title">{t('ui.dependencies')}</h2>
          {!!(pp.hasDeps) && (<React.Fragment><div className="deps">{pp.deps.map((d, i_d) => (<React.Fragment key={i_d}><a className="dep-chip" href={d.href}><svg className="icon"><use href="#plugin"></use></svg>{d.name}<span className="dep-chip__range">{d.range}</span></a></React.Fragment>))}</div></React.Fragment>)}
          {!!(pp.noDeps) && (<React.Fragment><p className="block__empty">{t('ui.none')}</p></React.Fragment>)}
        </section>
        {!!(pp.hasDependents) && (<React.Fragment>
          <section className="block"><h2 className="block__title">{t('ui.depended_on_by')}</h2><div className="deps">{pp.dependents.map((d, i_d) => (<React.Fragment key={i_d}><a className="dep-chip" href={d.href}><svg className="icon"><use href="#plugin"></use></svg>{d.name}</a></React.Fragment>))}</div></section>
        </React.Fragment>)}
      </aside>
    </div>
  </div>
</React.Fragment>)}

{!!(v.artifact) && (<React.Fragment>
  <div className="page">
    <nav className="crumbs" aria-label={t('ui.breadcrumb')}><a href="#/">{t('ui.catalog')}</a><span className="crumbs__sep">/</span><a href={ap.pluginHref}>{ap.plugin}</a><span className="crumbs__sep">/</span><span>{ap.type}</span><span className="crumbs__sep">/</span><span aria-current="page">{ap.name}</span></nav>
    <div className="detail">
      <div className="detail__main">
        <header className="hero">
          <div className="hero__title"><span className={ap.badgeCls}><svg className="icon"><use href={ap.icon}></use></svg>{ap.type}</span><h1 className="mono">{ap.name}</h1></div>
          <p className={ap.descCls}>{ap.desc}</p>
        </header>
        {!!(ap.hasInvoke) && (<React.Fragment>
          <section className="block">
            <h2 className="block__title">{t('ui.invoke_in_claude_code')}</h2>
            <div className="cmd"><span className="cmd__prompt" aria-hidden="true">{ap.invoke.prompt}</span><code className="cmd__text">{ap.invoke.pre}<b className="cmd__hl">{ap.invoke.hl}</b>{ap.invoke.post}</code><button className={ap.invoke.cls} type="button" onClick={ap.invoke.onCopy}><svg className="icon"><use href={ap.invoke.icon}></use></svg><span aria-live="polite">{ap.invoke.label}</span></button></div>
          </section>
        </React.Fragment>)}
        {!!(ap.hasRuns) && (<React.Fragment><section className="block"><h2 className="block__title">{ap.runsTitle}</h2><p className="runs-on">{ap.runsText}</p></section></React.Fragment>)}
        <section className="install" aria-label={t('ui.install')}>
          <div className="install__head"><h2 className="block__title">{t('ui.install')}</h2></div>
          <div className="cmd"><span className="cmd__prompt" aria-hidden="true">{ap.cmd.prompt}</span><code className="cmd__text">{ap.cmd.pre}<b className="cmd__hl">{ap.cmd.hl}</b>{ap.cmd.post}</code><button className={ap.cmd.cls} type="button" onClick={ap.cmd.onCopy}><svg className="icon"><use href={ap.cmd.icon}></use></svg><span aria-live="polite">{ap.cmd.label}</span></button></div>
          <p className="cmd-note"><svg className="icon icon--sm"><use href="#info"></use></svg>{ap.installNote}</p>
        </section>
        {!!(ap.hasSiblings) && (<React.Fragment>
          <section className="block"><h2 className="block__title">{t('ui.also_in', { plugin: ap.plugin })}</h2><div className="contents"><div className="contents__group">{ap.siblings.map((a, i_a) => (<React.Fragment key={i_a}><a className="art-row" href={a.href}><span className="art-row__name">{a.name}</span><span className={a.descCls}>{a.desc}</span><svg className="icon icon--sm"><use href="#chevron-right"></use></svg></a></React.Fragment>))}</div></div></section>
        </React.Fragment>)}
      </div>
      <aside className="detail__aside">
        <section className="block">
          <h2 className="block__title">{t('ui.plugin_2')}</h2>
          <a className="plugin-link" href={ap.pluginHref}><span className="badge t-plugin"><svg className="icon"><use href="#plugin"></use></svg></span><span className="plugin-link__body"><span className="plugin-link__title">{ap.pluginDisplay}</span><span className="plugin-link__desc">{ap.pluginDesc}</span></span><span className="ver">v{ap.version}</span></a>
        </section>
        <section className="block">
          <h2 className="block__title">{t('ui.file')}</h2>
          <a className="ext-link ext-link--mono" href={ap.fileHref} target="_blank" rel="noopener"><svg className="icon"><use href="#file"></use></svg>{ap.path}</a>
          <p className="hint"><svg className="icon icon--sm"><use href="#lock"></use></svg>{t('ui.requires_repository_access')}</p>
        </section>
      </aside>
    </div>
  </div>
</React.Fragment>)}

{!!(v.start) && (<React.Fragment>
  <div className="page page--narrow">
    <header className="page-head"><h1>{t('ui.get_started')}</h1><p>{t('ui.connect_the_marketplace_once_about')}</p></header>
    <div className="start-bar">
      <div className="segmented" role="group" aria-label={t('ui.git_transport')}>{modes.map((m, i_m) => (<React.Fragment key={i_m}><button className={m.cls} type="button" aria-pressed={m.pressed} onClick={m.select}>{m.label}</button></React.Fragment>))}</div>
      <span className="block__note">{modeNote}</span>
    </div>
    <ol className="stepper">
      {steps.map((st, i_st) => (<React.Fragment key={i_st}>
        <li className={st.cls}>
          <span className="step__num">{!!(st.done) && (<React.Fragment><svg className="icon icon--sm"><use href="#check"></use></svg></React.Fragment>)}{!!(st.notDone) && (<React.Fragment>{st.n}</React.Fragment>)}</span>
          <div className="step__body">
            <h2 className="step__title">{st.title}{!!(st.optional) && (<React.Fragment><span className="step__opt">{t('ui.optional')}</span></React.Fragment>)}</h2>
            <p className="step__text">{st.segs.map((sg, i_sg) => (<React.Fragment key={i_sg}>{!!(sg.code) && (<React.Fragment><code>{sg.t}</code></React.Fragment>)}{!!(sg.plain) && (<React.Fragment>{sg.t}</React.Fragment>)}</React.Fragment>))}</p>
            {st.cmds.map((c, i_c) => (<React.Fragment key={i_c}><div className="cmd"><span className="cmd__prompt" aria-hidden="true">{c.prompt}</span><code className="cmd__text">{c.pre}<b className="cmd__hl">{c.hl}</b>{c.post}</code><button className={c.cls} type="button" onClick={c.onCopy}><svg className="icon"><use href={c.icon}></use></svg><span aria-live="polite">{c.label}</span></button></div></React.Fragment>))}
            {!!(st.hasLinks) && (<React.Fragment><div className="step__links">{st.links.map((l, i_l) => (<React.Fragment key={i_l}><a className="btn btn--sm" href={l.href}>{l.label}</a></React.Fragment>))}</div></React.Fragment>)}
          </div>
        </li>
      </React.Fragment>))}
    </ol>
    <details className="troubleshoot">
      <summary className="troubleshoot__summary"><svg className="icon icon--sm health__chev"><use href="#chevron-right"></use></svg>{t('ui.troubleshooting')}</summary>
      <dl className="troubleshoot__body">{trouble.map((tr, i_tr) => (<React.Fragment key={i_tr}><div className="trouble"><dt><code>{tr.err}</code></dt><dd><span>{tr.fix}</span>{!!(tr.hasCmd) && (<React.Fragment><div className="cmd"><span className="cmd__prompt" aria-hidden="true">$</span><code className="cmd__text">{tr.cmd.pre}</code><button className={tr.cmd.cls} type="button" onClick={tr.cmd.onCopy}><svg className="icon"><use href={tr.cmd.icon}></use></svg><span>{tr.cmd.label}</span></button></div></React.Fragment>)}</dd></div></React.Fragment>))}</dl>
    </details>
  </div>
</React.Fragment>)}

{!!(v.news) && (<React.Fragment>
  <div className="page feed">
    <header className="page-head"><h1>{t('ui.what_s_new')}</h1><a className="rss-link" href="feed.xml" title={t('ui.rss_2_0_feed')}><svg className="icon icon--sm"><use href="#rss"></use></svg>{t('ui.rss')}</a><p>{rich('ui.releases_across_all_plugins_newest')}</p></header>
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
      {!!(feedMore) && (<React.Fragment><div className="feed__more"><button className="btn" type="button" onClick={showMore}>{t('ui.show_more')}</button><span className="block__note">{feedShownLabel}</span></div></React.Fragment>)}
    </React.Fragment>)}
    {!!(feedEmpty) && (<React.Fragment>
      <div className="empty">
        <span className="empty__icon"><svg className="icon icon--lg"><use href="#rss"></use></svg></span>
        <h2 className="empty__title">{t('ui.no_releases_yet')}</h2>
        <p className="empty__text">{t('ui.releases_show_up_here_when')}</p>
        <div className="empty__actions"><a className="btn" href="feed.xml"><svg className="icon"><use href="#rss"></use></svg>{t('ui.subscribe_via_rss')}</a><a className="btn btn--ghost" href="#/start">{t('ui.get_started')}</a></div>
      </div>
    </React.Fragment>)}
  </div>
</React.Fragment>)}

{!!(v.notFound) && (<React.Fragment>
  <div className="page"><div className="state-page">
    <p className="state-page__code">404</p>
    <h1 className="state-page__title">{t('ui.this_page_doesn_t_exist')}</h1>
    <p className="state-page__text">{rich('ui.isn_t_in_the_catalog', { badPath })}</p>
    <form className="search search--lg" role="search" onSubmit={nfSubmit}><svg className="icon icon--lg search__icon"><use href="#search"></use></svg><input className="search__input" type="search" placeholder={t('ui.search_the_catalog')} aria-label={t('ui.search_the_catalog')} value={nfQ} onChange={onNfQ} /></form>
    <div className="empty__actions"><a className="btn" href="#/">{t('ui.back_to_catalog')}</a><a className="btn btn--ghost" href="#/new">{t('ui.what_s_new')}</a></div>
  </div></div>
</React.Fragment>)}

<footer className="footer">
  <div className="footer__inner">
    <span className="mono">{marketplaceName}</span>
    <span>{builtLabel}</span>
    <a href="feed.xml"><svg className="icon icon--sm"><use href="#rss"></use></svg>{t('ui.rss')}</a>
    <span className="hint"><svg className="icon icon--sm"><use href="#lock"></use></svg>{t('ui.source_requires_repository_access')}</span>
    <span className="footer__keys">{rich('ui.search_esc_clear_k_jump', { modKey })}</span>
  </div>
</footer>

{!!(sheetVisible) && (<React.Fragment>
  <div className="scrim" onClick={closeSheet}></div>
  <div className="sheet" role="dialog" aria-modal="true" aria-label={t('ui.filters')}>
    <div className="sheet__grip"></div>
    <div className="sheet__head"><h2>{t('ui.filters')}</h2>{!!(hasActive) && (<React.Fragment><button className="link-btn" type="button" onClick={resetFilters}>{t('ui.reset')}</button></React.Fragment>)}<button className="icon-btn" type="button" onClick={closeSheet} aria-label={t('ui.close')}><svg className="icon"><use href="#x"></use></svg></button></div>
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
    <div className="palette" role="dialog" aria-modal="true" aria-label={t('ui.quick_jump')}>
      <div className="palette__search"><svg className="icon icon--lg"><use href="#search"></use></svg><input className="palette__input" ref={qjRef} value={qjQuery} onChange={onQjQ} onKeyDown={onQjKey} placeholder={t('ui.jump_to_a_plugin_skill')} aria-label={t('ui.quick_jump')} role="combobox" aria-expanded="true" aria-controls="qj-list" aria-activedescendant={qjActiveId} /><button className="palette__esc" type="button" onClick={closeQj} aria-label={t('ui.close')}><kbd>{t('ui.esc')}</kbd></button></div>
      <div className="palette__list" id="qj-list" role="listbox">
        {qjGroups.map((g, i_g) => (<React.Fragment key={i_g}>
          <div role="presentation" className="palette__group">{g.label}</div>
          {g.items.map((it, i_it) => (<React.Fragment key={i_it}><button className={it.cls} id={it.domId} type="button" role="option" aria-selected={it.sel} onClick={it.open} onMouseMove={it.hover}><span className={it.iconCls}><svg className="icon icon--sm"><use href={it.icon}></use></svg></span><span className={it.titleCls}>{it.title}</span><span className="palette__sub">{it.sub}</span><span className={it.hintCls}>{it.hint}</span></button></React.Fragment>))}
        </React.Fragment>))}
        {!!(qjEmpty) && (<React.Fragment><p className="palette__empty">{t('ui.nothing_matches', { qjQuery })}</p></React.Fragment>)}
      </div>
      <div className="palette__foot"><span>{rich('ui.move')}</span><span>{rich('ui.open_2')}</span><span>{rich('ui.copy_install', { modKey })}</span><span>{rich('ui.esc_close')}</span></div>
    </div>
  </div>
</React.Fragment>)}

    </>
  );
}
