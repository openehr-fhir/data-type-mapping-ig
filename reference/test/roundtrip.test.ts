import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  endpointsOf,
  isNoCounterpart,
  type Direction,
  type Endpoint,
  type Mapping,
  type Row,
} from '../src/model/types.ts';
import type { Issue, MappingResult } from '../src/result.ts';
import { converterFor } from '../src/convert/index.ts';
import { fixturePairs, testableMappings } from './coverage.test.ts';

/**
 * The round-trip matrix: the tests that turn the guide's fidelity claims from
 * assertions into checked statements.
 *
 * The matrix is **per row and per direction**, because a `Verdict` lives on a
 * `Row`, not on a `Mapping`, and almost every real mapping is mixed.
 *
 * - `lossless` — the value at that row's source path survives the round trip
 *   unchanged, and no issue names that path.
 * - `lossy` — **no over-claim**: every emitted issue path is one the ledger
 *   declared for that direction. **No under-claim**: the union of emitted issue
 *   paths across *all* of a mapping's fixtures equals the declared set exactly.
 *   The union form is what lets one fixture legitimately leave an optional
 *   field unpopulated.
 * - `unmapped` — the converter reports the source path in `issues` and produces
 *   no value at the target path.
 *
 * Two scoping rules, both deliberate:
 *
 * 1. Only `datatype`-scope rows are in the matrix. An `archetype`-scope row's
 *    FHIR home is a resource element, and a data-type converter never sees a
 *    resource.
 * 2. A row whose **source** side is `NoCounterpart` in the direction under test
 *    is skipped: there is nothing to convert from, so the converter is free to
 *    supply a constant the target's invariants require.
 */

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));

function readFixture(mappingId: string, stem: string, side: 'openehr' | 'fhir'): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, mappingId, `${stem}.${side}.json`), 'utf8'));
}

// ── path resolution ──────────────────────────────────────────────────────────

/**
 * Resolve a ledger path against an instance.
 *
 * The first segment is the type name and is dropped. A segment of the form
 * `extension[name]` selects the extension whose canonical URL ends in `/name`
 * and returns its `value[x]`. A segment carrying any other `[qualifier]` is a
 * value selector, not a lookup, and is never resolved — only `unmapped` rows
 * use one, and those are checked by their issue paths instead.
 */
export function valueAtPath(instance: unknown, path: string): unknown {
  const segments = path.split('.').slice(1);
  let node: unknown = instance;
  for (const segment of segments) {
    if (node === null || node === undefined || typeof node !== 'object') return undefined;
    const bracket = /^(.+)\[(.+)\]$/.exec(segment);
    if (bracket === null) {
      node = (node as Record<string, unknown>)[segment];
      continue;
    }
    const [, name, qualifier] = bracket as unknown as [string, string, string];
    if (name !== 'extension') return undefined;
    const list = (node as Record<string, unknown>)['extension'];
    if (!Array.isArray(list)) return undefined;
    const found = list.find(
      (e) => typeof e === 'object' && e !== null && String((e as { url?: string }).url).endsWith(`/${qualifier}`),
    ) as Record<string, unknown> | undefined;
    if (found === undefined) return undefined;
    const valueKey = Object.keys(found).find((k) => k.startsWith('value'));
    node = valueKey === undefined ? undefined : found[valueKey];
  }
  return node;
}

/** True when `candidate` is `base` itself or something beneath it. */
function isUnder(candidate: string, base: string): boolean {
  return candidate === base || candidate.startsWith(`${base}.`) || candidate.startsWith(`${base}[`);
}

// ── direction helpers ────────────────────────────────────────────────────────

/** The source side of a row for one direction. */
function sourceSide(row: Row, direction: Direction): Endpoint | readonly Endpoint[] | undefined {
  const side = direction === 'toFhir' ? row.openehr : row.fhir;
  return isNoCounterpart(side) ? undefined : (side as Endpoint | readonly Endpoint[]);
}

/** The target side of a row for one direction. */
function targetSide(row: Row, direction: Direction): readonly Endpoint[] | undefined {
  const side = direction === 'toFhir' ? row.fhir : row.openehr;
  return isNoCounterpart(side) ? undefined : endpointsOf(side);
}

/** Rows the matrix applies to. */
function matrixRows(mapping: Mapping): readonly Row[] {
  return mapping.rows.filter((row) => row.scope === 'datatype');
}

/**
 * Every issue path the ledger declares for one direction: the `drops[].path` of
 * every `lossy` row, plus the source path of every `unmapped` row that has a
 * source to convert from.
 */
function declaredPaths(mapping: Mapping, direction: Direction): ReadonlySet<string> {
  const declared = new Set<string>();
  for (const row of matrixRows(mapping)) {
    const verdict = row[direction];
    if (verdict.fidelity === 'lossy') {
      for (const drop of verdict.drops) declared.add(drop.path);
    }
    if (verdict.fidelity === 'unmapped') {
      const source = sourceSide(row, direction);
      if (source === undefined) continue;
      for (const endpoint of endpointsOf(source)) declared.add(endpoint.path);
    }
  }
  return declared;
}

/** Run one direction of one fixture through the converter and back. */
function roundTrip(
  mappingId: string,
  direction: Direction,
  instance: unknown,
): { readonly out: MappingResult<unknown>; readonly back: unknown } {
  const pair = converterFor(mappingId);
  assert.ok(pair, `no converter registered for '${mappingId}'`);
  const out =
    direction === 'toFhir' ? pair.toFhir(instance) : pair.toOpenehr(instance);
  const back =
    out.value === undefined
      ? undefined
      : direction === 'toFhir'
        ? pair.toOpenehr(out.value).value
        : pair.toFhir(out.value).value;
  return { out, back };
}

// ── the matrix ───────────────────────────────────────────────────────────────

for (const mapping of testableMappings()) {
  const stems = fixturePairs(mapping.id);

  for (const direction of ['toFhir', 'toOpenehr'] as const) {
    const label = direction === 'toFhir' ? 'openEHR → FHIR' : 'FHIR → openEHR';
    const side = direction === 'toFhir' ? 'openehr' : 'fhir';
    const declared = declaredPaths(mapping, direction);

    test(`${mapping.id} ${label}: lossless rows survive the round trip`, () => {
      for (const stem of stems) {
        const instance = readFixture(mapping.id, stem, side);
        const { out, back } = roundTrip(mapping.id, direction, instance);
        const issuePaths = out.issues.map((i: Issue) => i.path);

        for (const row of matrixRows(mapping)) {
          if (row[direction].fidelity !== 'lossless') continue;
          const source = sourceSide(row, direction);
          if (source === undefined) continue;

          for (const endpoint of endpointsOf(source)) {
            assert.ok(
              !issuePaths.includes(endpoint.path),
              `${mapping.id}/${stem} ${label}: row '${row.id}' claims lossless but the ` +
                `converter reported an issue at '${endpoint.path}'`,
            );

            // A sibling row may cover an exceptional sub-case of this field
            // (`magnitude_status[~]`); when the converter reported one, this
            // row's claim does not apply to this instance.
            if (issuePaths.some((p) => isUnder(p, endpoint.path))) continue;

            const before = valueAtPath(instance, endpoint.path);
            if (before === undefined) continue;
            const after = valueAtPath(back, endpoint.path);
            assert.deepEqual(
              after,
              before,
              `${mapping.id}/${stem} ${label}: row '${row.id}' claims lossless but ` +
                `'${endpoint.path}' did not survive the round trip`,
            );
            break;
          }
        }
      }
    });

    test(`${mapping.id} ${label}: no over-claim — every reported drop is declared`, () => {
      for (const stem of stems) {
        const instance = readFixture(mapping.id, stem, side);
        const { out } = roundTrip(mapping.id, direction, instance);
        for (const issue of out.issues) {
          assert.ok(
            declared.has(issue.path),
            `${mapping.id}/${stem} ${label}: the converter reported '${issue.path}', which ` +
              `the ledger does not declare. Declared: ${[...declared].join(', ') || '(none)'}`,
          );
        }
      }
    });

    test(`${mapping.id} ${label}: no under-claim — every declared drop is reported`, () => {
      const emitted = new Set<string>();
      for (const stem of stems) {
        const instance = readFixture(mapping.id, stem, side);
        const { out } = roundTrip(mapping.id, direction, instance);
        for (const issue of out.issues) emitted.add(issue.path);
      }
      assert.deepEqual(
        [...emitted].sort(),
        [...declared].sort(),
        `${mapping.id} ${label}: the union of reported issue paths across every fixture ` +
          `must equal the set the ledger declares`,
      );
    });

    test(`${mapping.id} ${label}: unmapped rows report their path and produce no value`, () => {
      for (const stem of stems) {
        const instance = readFixture(mapping.id, stem, side);
        const { out } = roundTrip(mapping.id, direction, instance);
        const issuePaths = out.issues.map((i: Issue) => i.path);

        for (const row of matrixRows(mapping)) {
          if (row[direction].fidelity !== 'unmapped') continue;
          const source = sourceSide(row, direction);
          if (source === undefined) continue;

          const paths = endpointsOf(source).map((e) => e.path);
          const present = paths.some((p) => valueAtPath(instance, p) !== undefined);
          const reported = paths.some((p) => issuePaths.includes(p));
          if (!present && !reported) continue;

          assert.ok(
            reported,
            `${mapping.id}/${stem} ${label}: row '${row.id}' is unmapped and the source ` +
              `carries a value, but the converter reported nothing`,
          );

          const target = targetSide(row, direction);
          if (target === undefined) continue;
          for (const endpoint of target) {
            assert.equal(
              valueAtPath(out.value, endpoint.path),
              undefined,
              `${mapping.id}/${stem} ${label}: row '${row.id}' is unmapped but the ` +
                `converter produced a value at '${endpoint.path}'`,
            );
          }
        }
      }
    });
  }
}

test('the matrix covers at least one mapping', () => {
  assert.ok(testableMappings().length > 0, 'no testable mappings — the harness is inert');
});
