import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURE_CATALOG } from '../src/generated/fixture-catalog.ts';

/**
 * The anti-staleness gate on the bundled worked examples.
 *
 * A generated module that has drifted from its source is indistinguishable
 * from a correct one by inspection, and this one is what a reader edits in the
 * converter. So the assertion is not "it looks plausible" but "it equals
 * `reference/fixtures/` on disk, payload text included".
 */

const FIXTURES = fileURLToPath(new URL('../../reference/fixtures/', import.meta.url));

function normalise(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

/** Every `(mapping id, stem)` on disk that has both sides. */
function pairsOnDisk(): readonly (readonly [string, string])[] {
  const out: (readonly [string, string])[] = [];
  for (const entry of readdirSync(FIXTURES, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const dir = join(FIXTURES, entry.name);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.openehr.json')) continue;
      const stem = file.slice(0, -'.openehr.json'.length);
      if (existsSync(join(dir, `${stem}.fhir.json`))) out.push([entry.name, stem]);
    }
  }
  return out;
}

test('the generated catalogue names exactly the mapping directories on disk', () => {
  const onDisk = readdirSync(FIXTURES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
  const generated = [...new Set(FIXTURE_CATALOG.map((example) => example.mappingId))].sort();
  assert.deepEqual(generated, onDisk, 'a mapping directory appeared or vanished');
});

test('the entry count equals the number of complete pairs on disk', () => {
  assert.equal(FIXTURE_CATALOG.length, pairsOnDisk().length);
  assert.ok(FIXTURE_CATALOG.length > 0, 'the catalogue is not empty');
  const keys = FIXTURE_CATALOG.map((example) => `${example.mappingId}/${example.name}`);
  assert.equal(new Set(keys).size, keys.length, 'no duplicate example');
  assert.deepEqual(
    [...keys].sort(),
    pairsOnDisk().map(([id, stem]) => `${id}/${stem}`).sort(),
    'the catalogue names exactly the complete pairs',
  );
});

test('every payload equals the file on disk after newline normalisation', () => {
  for (const example of FIXTURE_CATALOG) {
    const dir = join(FIXTURES, example.mappingId);
    for (const [side, text] of [
      ['openehr', example.openehr],
      ['fhir', example.fhir],
    ] as const) {
      const onDisk = normalise(readFileSync(join(dir, `${example.name}.${side}.json`), 'utf8'));
      assert.equal(text, onDisk, `${example.mappingId}/${example.name}.${side}.json drifted`);
      assert.doesNotMatch(text, /\r/, `${example.mappingId}/${example.name}: normalised newlines`);
      assert.doesNotThrow(
        () => JSON.parse(text),
        `${example.mappingId}/${example.name}.${side}: the embedded text is still JSON`,
      );
    }
  }
});

test('every pairing marker’s directions array is reflected', () => {
  let markers = 0;
  for (const example of FIXTURE_CATALOG) {
    const marker = join(FIXTURES, example.mappingId, `${example.name}.pairing.json`);
    if (!existsSync(marker)) {
      assert.deepEqual(
        [...example.directions],
        ['toFhir', 'toOpenehr'],
        `${example.mappingId}/${example.name}: an unmarked pair claims both directions`,
      );
      continue;
    }
    const declared = (JSON.parse(readFileSync(marker, 'utf8')) as { directions: string[] })
      .directions;
    assert.deepEqual(
      [...example.directions],
      declared,
      `${example.mappingId}/${example.name}: the marker's directions are not reflected`,
    );
    markers += 1;
  }
  assert.ok(markers > 0, 'the guard actually inspected pairing markers');
});
