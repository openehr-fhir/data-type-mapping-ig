import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  endpointsOf,
  isNoCounterpart,
  type Direction,
  type Mapping,
} from '../src/model/types.ts';
import { converterFor } from '../src/convert/index.ts';
import { fixturePairs, testableMappings } from './coverage.test.ts';

/**
 * A fixture **pair** is a claim that the reference implementation can produce
 * one side from the other. Nothing asserted that before this file existed: the
 * round-trip matrix reads one side at a time, so a published pair the
 * converters cannot produce was invisible to it — and 40 of the fixture files
 * are published verbatim into the guide as worked examples.
 *
 * The comparison is **modulo the ledger's declared drops**. Before comparing,
 * every path that direction declares as dropped — and every target path of a
 * row that direction declares `unmapped` — is deleted from both sides, so the
 * assertion is exactly "everything the ledger says survives, survives".
 *
 * A pair that is deliberately **not** a pair in some direction carries a
 * sibling `NN-<name>.pairing.json` naming the directions it does claim and the
 * reason. The marker is itself checked: a direction it does not name must
 * genuinely fail to produce the partner, so a marker cannot outlive the defect
 * it documents.
 */

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));

/** The one-directional marker, as authored beside a pair. */
interface Pairing {
  readonly directions: readonly Direction[];
  readonly reason: string;
}

const BOTH: readonly Direction[] = ['toFhir', 'toOpenehr'];

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readPairing(mappingId: string, stem: string): Pairing | undefined {
  const path = join(FIXTURES, mappingId, `${stem}.pairing.json`);
  if (!existsSync(path)) return undefined;
  return readJson(path) as Pairing;
}

// ── comparison modulo the declared drops ─────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Delete a ledger path from an instance, in place.
 *
 * The first segment is the type name and is dropped, as in `roundtrip.test.ts`.
 * A segment of the form `extension[name]` removes the matching extension entry.
 * Any other bracket qualifier names a **sub-case** of a field rather than a
 * place in the instance, and deletes nothing. Arrays are descended into, so
 * `CodeableConcept.coding.userSelected` clears the flag on every coding.
 */
function deleteAtPath(instance: unknown, path: string): void {
  const segments = path.split('.').slice(1);
  if (segments.length === 0) return;
  removeSegments(instance, segments);
}

function removeSegments(node: unknown, segments: readonly string[]): void {
  const [head, ...rest] = segments;
  if (head === undefined) return;

  if (Array.isArray(node)) {
    for (const item of node) removeSegments(item, segments);
    return;
  }
  if (!isRecord(node)) return;

  const bracket = /^(.+)\[(.+)\]$/.exec(head);
  if (bracket !== null) {
    const [, name, qualifier] = bracket as unknown as [string, string, string];
    // Only `extension[name]` names a real place; anything else is a sub-case.
    if (name !== 'extension') return;
    const list = node['extension'];
    if (!Array.isArray(list)) return;
    node['extension'] = list.filter(
      (entry) =>
        !(isRecord(entry) && String(entry['url'] ?? '').endsWith(`/${qualifier}`)),
    );
    if ((node['extension'] as unknown[]).length === 0) delete node['extension'];
    return;
  }

  if (rest.length === 0) {
    delete node[head];
    return;
  }
  removeSegments(node[head], rest);
}

/**
 * Every path the ledger says does not survive **this** direction of this
 * mapping: the `drops[].path` of every `lossy` row, plus the target path of
 * every row this direction declares `unmapped`, where nothing may be produced.
 *
 * Deliberately **only** this direction. Widening it to the reverse direction's
 * drops as well would make several comparisons vacuous — `DV_DURATION.value`
 * and `time.value` are whole values, not fields beside them — and a pair that
 * genuinely holds in one direction only is better said out loud, in a pairing
 * marker with a reason, than hidden behind a broader exclusion.
 *
 * `archetype`-scope rows are included, unlike in the round-trip matrix: they
 * name real facts a data-type conversion does not carry, and a fixture that
 * carries one is not evidence of a defect in the converter.
 */
function droppedPaths(mapping: Mapping, direction: Direction): readonly string[] {
  const paths = new Set<string>();
  for (const row of mapping.rows) {
    const verdict = row[direction];
    if (verdict.fidelity === 'lossy') {
      for (const drop of verdict.drops) paths.add(drop.path);
    }
    if (verdict.fidelity === 'unmapped') {
      const target = direction === 'toFhir' ? row.fhir : row.openehr;
      if (isNoCounterpart(target)) continue;
      for (const endpoint of endpointsOf(target)) paths.add(endpoint.path);
    }
  }
  return [...paths];
}

/** A deep copy with every declared drop removed. */
function comparable(value: unknown, dropped: readonly string[]): unknown {
  if (value === undefined) return undefined;
  const copy: unknown = JSON.parse(JSON.stringify(value));
  for (const path of dropped) deleteAtPath(copy, path);
  return copy;
}

// ── the gate ─────────────────────────────────────────────────────────────────

let asserted = 0;

for (const mapping of testableMappings()) {
  const dropped: Readonly<Record<Direction, readonly string[]>> = {
    toFhir: droppedPaths(mapping, 'toFhir'),
    toOpenehr: droppedPaths(mapping, 'toOpenehr'),
  };

  for (const stem of fixturePairs(mapping.id)) {
    const pairing = readPairing(mapping.id, stem);
    const claimed = pairing?.directions ?? BOTH;

    test(`${mapping.id}/${stem}: the two files are a pair`, () => {
      if (pairing !== undefined) {
        assert.ok(
          pairing.reason.trim().length > 0,
          `${mapping.id}/${stem}: a pairing marker must say why`,
        );
        for (const direction of claimed) {
          assert.ok(
            BOTH.includes(direction),
            `${mapping.id}/${stem}: '${direction}' is not a direction`,
          );
        }
      }

      const pair = converterFor(mapping.id);
      assert.ok(pair, `no converter registered for '${mapping.id}'`);

      const openehr = readJson(join(FIXTURES, mapping.id, `${stem}.openehr.json`));
      const fhir = readJson(join(FIXTURES, mapping.id, `${stem}.fhir.json`));

      for (const direction of BOTH) {
        const produced =
          direction === 'toFhir' ? pair.toFhir(openehr).value : pair.toOpenehr(fhir).value;
        const partner = direction === 'toFhir' ? fhir : openehr;

        const left = comparable(produced, dropped[direction]);
        const right = comparable(partner, dropped[direction]);
        const equal = JSON.stringify(left) === JSON.stringify(right);

        if (claimed.includes(direction)) {
          assert.deepEqual(
            left,
            right,
            `${mapping.id}/${stem} ${direction}: the converter does not produce its ` +
              'partner, modulo the drops the ledger declares',
          );
          asserted += 1;
        } else {
          assert.ok(
            !equal,
            `${mapping.id}/${stem} ${direction}: the pairing marker says this direction ` +
              'is not a pair, but the converter now produces the partner exactly — remove ' +
              'the marker',
          );
        }
      }
    });
  }
}

test('the pairing gate covers every fixture pair', () => {
  const pairs = testableMappings().reduce(
    (total, mapping) => total + fixturePairs(mapping.id).length,
    0,
  );
  assert.ok(pairs > 0, 'no fixture pairs — the gate is inert');
  assert.ok(
    asserted > 0,
    'no direction was asserted — every pair cannot be one-directional',
  );
});
