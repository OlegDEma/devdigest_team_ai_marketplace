import React from 'react';
import { messages } from './messages.js';

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));

function lookup(key) {
  const s = messages[key];
  if (s === undefined) {
    if (typeof console !== 'undefined') console.warn(`[i18n] missing message: ${key}`);
    return key;
  }
  return s;
}

/** Plain message with {variables}. */
export function t(key, vars) {
  return fill(lookup(key), vars);
}

/** Message with a count: uses key.one for 1 and key.other otherwise; {count} is filled in. */
export function plural(key, count, vars) {
  return t(`${key}.${count === 1 ? 'one' : 'other'}`, Object.assign({ count }, vars));
}

/** Array-valued message (month and weekday names). */
export function list(key) {
  return messages[key] || [];
}

const TAGS = new Set(['b', 'i', 'em', 'strong', 'code', 'kbd', 'mark', 'link']);

/**
 * Message with inline markup rendered as React nodes. Known tags are <b>, <i>, <code>, <kbd>, <mark>;
 * any other tag name (for example <link>) is looked up in `components` as (children) => node.
 * Variables are substituted into text only, never parsed as markup.
 */
export function rich(key, vars, components) {
  const src = lookup(key);
  const root = { children: [] };
  const stack = [{ tag: null, children: root.children }];
  const re = /<(\/?)(\w+)>/g;
  let last = 0;
  let m;
  const pushText = (s) => s && stack[stack.length - 1].children.push(fill(s, vars));
  while ((m = re.exec(src))) {
    if (!TAGS.has(m[2])) continue;
    pushText(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) {
      const node = stack.pop();
      const render = components && components[node.tag];
      const kids = node.children.map((c, i) => (typeof c === 'string' ? <React.Fragment key={i}>{c}</React.Fragment> : c));
      stack[stack.length - 1].children.push(render ? <React.Fragment key={stack[stack.length - 1].children.length}>{render(kids)}</React.Fragment> : React.createElement(node.tag, { key: stack[stack.length - 1].children.length }, ...kids));
    } else {
      stack.push({ tag: m[2], children: [] });
    }
  }
  pushText(src.slice(last));
  return root.children.map((c, i) => (typeof c === 'string' ? <React.Fragment key={i}>{c}</React.Fragment> : c));
}
