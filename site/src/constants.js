import { t } from './i18n.jsx';

// Shared constants. `cfg` is filled from catalog.json once it is loaded.
export const TYPES = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];
export const FK = ['type', 'category', 'plugin', 'tag'];

export const SP = '#';
export const cfg = { MP: '', REPO: '', GH: '' };
export const TL = Object.fromEntries(TYPES.map((k) => [k, t(`type.${k}.one`)]));
export const TP = Object.fromEntries(TYPES.map((k) => [k, t(`type.${k}.other`)]));
