import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

import { PROVENANCE } from '../src/generated/provenance.ts';

/**
 * The footer is a claim about what the reader is looking at. If it can be
 * wrong, it is worse than absent — a stale deployment would then look current.
 */

const SUSHI_CONFIG = fileURLToPath(new URL('../../sushi-config.yaml', import.meta.url));

test('guideVersion equals the version in sushi-config.yaml', () => {
  const config = parse(readFileSync(SUSHI_CONFIG, 'utf8')) as { version?: unknown };
  assert.equal(PROVENANCE.guideVersion, String(config.version));
  assert.notEqual(PROVENANCE.guideVersion, 'undefined', 'the version was actually read');
});

test('commit is a real short commit, or the honest literal unknown', () => {
  assert.match(PROVENANCE.commit, /^[0-9a-f]{7,40}$|^unknown$/);
});

test('guideBaseUrl is absolute, http or https, and ends with a slash', () => {
  const url = new URL(PROVENANCE.guideBaseUrl);
  assert.ok(['http:', 'https:'].includes(url.protocol), `unexpected protocol ${url.protocol}`);
  assert.ok(PROVENANCE.guideBaseUrl.endsWith('/'), 'a base URL joins by concatenation');
  assert.equal(
    new URL('mapping-quantity.html#mapping-dv-quantity-to-quantity', PROVENANCE.guideBaseUrl).hash,
    '#mapping-dv-quantity-to-quantity',
    'a relative guide href resolves against it without losing its fragment',
  );
});
