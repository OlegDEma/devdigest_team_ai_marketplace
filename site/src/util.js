import { FK, cfg } from './constants.js';
import { t, list } from './i18n.jsx';

/* ---------- utils ---------- */
export const MON = list('date.months');
export const WD = list('date.weekdays');
export const pd = (d) => { const [y, m, dd] = d.split('-').map(Number); return { y, m, dd }; };
export const fShort = (d) => { const x = pd(d); return MON[x.m - 1] + ' ' + x.dd; };
export const fLong = (d) => fShort(d) + ', ' + pd(d).y;
export const ago = (d) => { const x = pd(d); const n = Math.round((Date.now() - Date.UTC(x.y, x.m - 1, x.dd)) / 864e5); return n <= 0 ? t('time.today') : n === 1 ? t('time.yesterday') : n < 30 ? t('time.days_ago', { count: n }) : fShort(d); };
export const install = (p) => 'claude plugin install ' + p + '@' + cfg.MP;
export const artHref = (a) => '#/plugin/' + a.plugin + '/' + a.type + '/' + encodeURIComponent(a.id.split('/')[2]);
export const depName = (d) => (typeof d === 'string' ? d : d.name);
export const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
export const BUMP = Object.fromEntries(['new', 'major', 'minor', 'patch'].map((k) => [k, t(`bump.${k}`)]));
export const SECS = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

export function readHash() {
  const h = (location.hash || '#/').slice(1) || '/'; const i = h.indexOf('?');
  const path = i < 0 ? h : h.slice(0, i); const qs = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
  const parts = path.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  const f = {}; FK.forEach((k) => { const v = qs.get(k); f[k] = v ? v.split(',').filter(Boolean) : []; });
  return { parts, q: qs.get('q') || '', f, sort: qs.get('sort') || '' };
}
export function homeHash(q, f, sort) { const qs = new URLSearchParams(); if (q) qs.set('q', q); FK.forEach((k) => { if (f[k].length) qs.set(k, f[k].join(',')); }); if (sort) qs.set('sort', sort); const s = qs.toString().replace(/%2C/g, ','); return '#/' + (s ? '?' + s : ''); }

