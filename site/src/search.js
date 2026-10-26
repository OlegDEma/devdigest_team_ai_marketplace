import { FK } from './constants.js';

/* ---------- search (KeywordProvider) ---------- */
export const norm = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/[’ʼ`]/g, "'");
export const words = (s) => norm(s).match(/[\p{L}\p{N}][\p{L}\p{N}'._|-]*/gu) || [];
export function terms(s) { const o = []; words(s).forEach((w) => { w = w.replace(/[.'_|-]+$/, ''); if (!w) return; o.push(w); if (/[-._|]/.test(w)) w.split(/[-._|]+/).forEach((p) => p && o.push(p)); }); return o; }
export function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; let p = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; }
export function tscore(q, d) { if (q === d) return 1; if (q.length >= 3 && d.startsWith(q)) return 0.8; if (q.length >= 4 && lev(q, d) <= 1) return 0.5; if (q.length >= 4 && d.length > q.length && lev(q, d.slice(0, q.length)) <= 1) return 0.4; return 0; }
export const STOP = new Set("i me my need want a an the for to of with and or some something that find tool please can я мені треба потрібно для з і й що на щоб".split(' '));
export const SYN = { review: ['code-review', 'pr'], pr: ['pull-request', 'review'], prs: ['pr', 'pull-request'], test: ['testing', 'tests'], testing: ['test'], docs: ['documentation', 'doc'], doc: ['documentation', 'docs'], db: ['postgres', 'sql', 'database'], database: ['postgres', 'sql'], secret: ['secrets', 'security'], jira: ['ticket', 'tickets'], ticket: ['jira'], spec: ['sdd', 'specs'], commit: ['commits', 'git'], "рев'ю": ['review', 'code-review'], 'ревю': ['review', 'code-review'], 'тест': ['test', 'testing'], 'тести': ['test', 'testing'], 'документація': ['documentation', 'docs'], 'безпека': ['security'], 'коміт': ['commit', 'git'] };
export function qtype(w) { if (/^(skill|скіл)/.test(w)) return 'skill'; if (/^(agent|агент)/.test(w)) return 'agent'; if (/^(command|команд)/.test(w)) return 'command'; if (/^(hook|хук)/.test(w)) return 'hook'; if (w === 'mcp') return 'mcp'; if (/^(plugin|плагін)/.test(w)) return 'plugin'; return null; }
export function stem(w) { if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3); if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1); return w; }
export function parseQ(q) { const types = [], groups = []; words(q).forEach((w) => { w = w.replace(/[.'_|-]+$/, ''); if (!w) return; const t = qtype(w); if (t) { if (!types.includes(t)) types.push(t); return; } if (STOP.has(w)) return; const s = stem(w); groups.push([...new Set([w, s, ...(SYN[w] || []), ...(SYN[s] || [])])]); }); return { types, groups }; }
export function runSearch(docs, groups) {
  if (!groups.length) return docs.map((d) => ({ d, score: 0, hits: new Set() }));
  const go = (and) => { const out = []; docs.forEach((d) => { let total = 0, ok = true; const hits = new Set(); groups.forEach((g) => { let gs = 0; d.fields.forEach(([ts, w, hl]) => { let b = 0; g.forEach((v) => ts.forEach((t) => { const s = tscore(v, t); if (s > 0) { if (s > b) b = s; if (hl) hits.add(t); } })); gs += b * w; }); if (gs === 0) ok = false; total += gs; }); if ((and && ok) || (!and && total > 0)) out.push({ d, score: total, hits }); }); return out.sort((a, b) => b.score - a.score); };
  let r = go(true); if (!r.length && groups.length > 1) r = go(false); return r;
}
export function buildDocs(plugins, arts) {
  const by = {}; plugins.forEach((p) => (by[p.name] = p)); const docs = [];
  plugins.forEach((p) => docs.push({ id: 'plugin:' + p.name, type: 'plugin', plugin: p.name, name: p.name, title: p.displayName, description: p.description, tags: p.tags, category: p.category, date: p.lastReleasedAt, fields: [[terms(p.name + ' ' + p.displayName), 4, 1], [terms(p.tags.concat(p.keywords).join(' ')), 3, 1], [terms(p.description), 2, 1], [terms(p.category), 1, 0]] }));
  arts.forEach((a) => { const p = by[a.plugin]; docs.push({ id: a.id, type: a.type, plugin: a.plugin, name: a.name, title: a.name, description: a.description, tags: p.tags, category: p.category, date: p.lastReleasedAt, fields: [[terms(a.name), 4, 1], [terms(p.tags.concat(p.keywords).join(' ')), 3, 1], [terms(a.description), 2, 1], [terms(a.plugin + ' ' + p.category), 1, 0]] }); });
  return docs;
}
export function segs(text, hits) { if (!text) return []; return text.split(/([\p{L}\p{N}][\p{L}\p{N}'_-]*)/u).filter((x) => x !== '').map((x) => { const hit = !!(hits && hits.size && terms(x).some((t) => hits.has(t))); return { t: x, hit, plain: !hit }; }); }
export const md = (t) => String(t).split('`').map((x, i) => ({ t: x, code: i % 2 === 1, plain: i % 2 === 0 })).filter((x) => x.t);

