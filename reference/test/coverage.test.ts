import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isNoCounterpart, type Mapping } from '../src/model/types.ts';
import { ledger } from '../src/model/load.ts';
import { registered } from '../src/convert/index.ts';

/**
 * The ledger, the converters, and the fixtures must agree about which mappings
 * are testable at all.
 *
 * A **`datatype`-scope** mapping with at least one non-`unmapped` row must have
 * a converter pair *and* a fixture pair: it makes a claim that something can be
 * carried, and that claim has to be exercised. A mapping whose rows are all
 * `unmapped` must have neither — there is nothing to convert.
 *
 * An **`archetype`-scope** mapping is exempt in both directions. Its FHIR home
 * is a resource element, and a data-type converter never sees a resource; the
 * claim is substantiated by the narrative, not by the harness. That exemption
 * is stated here rather than assumed.
 */

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));

/** True when every row of the mapping is `unmapped` in both directions. */
function allUnmapped(mapping: Mapping): boolean {
  return mapping.rows.every(
    (row) => row.toFhir.fidelity === 'unmapped' && row.toOpenehr.fidelity === 'unmapped',
  );
}

/** The `NN-name` stems of a mapping's paired fixtures. */
export function fixturePairs(mappingId: string): readonly string[] {
  const dir = join(FIXTURES, mappingId);
  if (!existsSync(dir)) return [];
  const openehr = readdirSync(dir).filter((f) => f.endsWith('.openehr.json'));
  return openehr
    .map((f) => f.slice(0, -'.openehr.json'.length))
    .filter((stem) => existsSync(join(dir, `${stem}.fhir.json`)));
}

test('every pairing marker names a direction set and a reason', () => {
  const problems: string[] = [];
  for (const mapping of ledger()) {
    const dir = join(FIXTURES, mapping.id);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.pairing.json')) continue;
      const marker = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
        directions?: unknown;
        reason?: unknown;
      };
      if (!Array.isArray(marker.directions)) {
        problems.push(`${mapping.id}/${file}: no 'directions' array`);
      } else {
        for (const direction of marker.directions) {
          if (direction !== 'toFhir' && direction !== 'toOpenehr') {
            problems.push(`${mapping.id}/${file}: '${String(direction)}' is not a direction`);
          }
        }
      }
      if (typeof marker.reason !== 'string' || marker.reason.trim() === '') {
        problems.push(`${mapping.id}/${file}: a marker with no reason is not a decision`);
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

/** Mappings the harness is expected to exercise. */
export function testableMappings(): readonly Mapping[] {
  return ledger().filter((m) => m.scope === 'datatype' && !allUnmapped(m));
}

test('every testable mapping has a registered converter pair', () => {
  const missing = testableMappings()
    .filter((m) => !registered().has(m.id))
    .map((m) => m.id);
  assert.deepEqual(missing, [], `mappings with no converter: ${missing.join(', ')}`);
});

test('every registered converter pair has a ledger mapping', () => {
  const ids = new Set(ledger().map((m) => m.id));
  const orphans = [...registered().keys()].filter((id) => !ids.has(id));
  assert.deepEqual(orphans, [], `converters with no ledger mapping: ${orphans.join(', ')}`);
});

test('every testable mapping has at least one fixture pair', () => {
  const missing = testableMappings()
    .filter((m) => fixturePairs(m.id).length === 0)
    .map((m) => m.id);
  assert.deepEqual(missing, [], `mappings with no fixture pair: ${missing.join(', ')}`);
});

test('an all-unmapped mapping has neither a converter nor a fixture', () => {
  const offenders: string[] = [];
  for (const mapping of ledger()) {
    if (!allUnmapped(mapping)) continue;
    if (registered().has(mapping.id)) offenders.push(`${mapping.id}: has a converter`);
    if (fixturePairs(mapping.id).length > 0) offenders.push(`${mapping.id}: has a fixture`);
  }
  assert.deepEqual(offenders, [], offenders.join('\n'));
});

test('an archetype-scope mapping has no converter, because there is no resource to convert', () => {
  const offenders = ledger()
    .filter((m) => m.scope === 'archetype' && registered().has(m.id))
    .map((m) => m.id);
  assert.deepEqual(offenders, [], `archetype-scope mappings with a converter: ${offenders.join(', ')}`);
});

test('every fixture directory belongs to a mapping', () => {
  if (!existsSync(FIXTURES)) return;
  const ids = new Set(ledger().map((m) => m.id));
  const orphans = readdirSync(FIXTURES, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .filter((name) => !ids.has(name));
  assert.deepEqual(orphans, [], `fixture directories with no mapping: ${orphans.join(', ')}`);
});

test('every openEHR fixture has a FHIR partner and every fixture is well-formed JSON', async () => {
  const problems: string[] = [];
  for (const mapping of ledger()) {
    const dir = join(FIXTURES, mapping.id);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) {
        problems.push(`${mapping.id}/${file}: not a .json file`);
        continue;
      }
      // A `NN-name.pairing.json` marker declares which directions of a pair
      // `pairs.test.ts` asserts, and why. It has no partner of its own.
      if (file.endsWith('.pairing.json')) {
        const stem = file.slice(0, -'.pairing.json'.length);
        if (!existsSync(join(dir, `${stem}.openehr.json`))) {
          problems.push(`${mapping.id}/${file}: no pair ${stem}.openehr.json to mark`);
        }
        continue;
      }
      if (!file.endsWith('.openehr.json') && !file.endsWith('.fhir.json')) {
        problems.push(`${mapping.id}/${file}: must end .openehr.json or .fhir.json`);
        continue;
      }
      const partner = file.endsWith('.openehr.json')
        ? file.replace('.openehr.json', '.fhir.json')
        : file.replace('.fhir.json', '.openehr.json');
      if (!existsSync(join(dir, partner))) {
        problems.push(`${mapping.id}/${file}: no partner ${partner}`);
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('every openEHR fixture that is an object declares its _type', async () => {
  const problems: string[] = [];
  for (const mapping of ledger()) {
    for (const stem of fixturePairs(mapping.id)) {
      const path = join(FIXTURES, mapping.id, `${stem}.openehr.json`);
      const instance = (await import(`file://${path.replace(/\\/g, '/')}`, {
        with: { type: 'json' },
      })) as { default: Record<string, unknown> };
      const body = instance.default as unknown;
      if (body === null || typeof body !== 'object' || Array.isArray(body)) continue;
      if (typeof (body as Record<string, unknown>)['_type'] !== 'string') {
        problems.push(`${mapping.id}/${stem}: openEHR fixture has no _type discriminator`);
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('every mapping with a NoCounterpart side still cites both specifications', () => {
  const problems: string[] = [];
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (isNoCounterpart(row.openehr) && row.openehr.cite.url === '') {
        problems.push(`${mapping.id}/${row.id}: no-counterpart openEHR side has no citation`);
      }
      if (isNoCounterpart(row.fhir) && row.fhir.cite.url === '') {
        problems.push(`${mapping.id}/${row.id}: no-counterpart FHIR side has no citation`);
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});
