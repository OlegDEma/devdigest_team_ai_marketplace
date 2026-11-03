import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../src/report.js';

test('buildReport keeps id, customer and total', () => {
  const rows = buildReport([{ id: 1, customer: 'Ada', total: 10, note: 'x' }]);
  assert.deepEqual(rows, [{ id: 1, customer: 'Ada', total: 10 }]);
});
