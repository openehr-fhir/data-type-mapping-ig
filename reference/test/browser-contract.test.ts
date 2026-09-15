import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ledger, mappingById } from '../src/model/load.ts';
import { converterFor, registered } from '../src/convert/index.ts';
import {
  endpointsOf,
  isNoCounterpart,
  type Direction,
  type Mapping,
  type Row,
} from '../src/model/types.ts';
import type { MappingResult } from '../src/result.ts';
import {
  hasFieldTable,
  mappingAnchorId,
  mappingHref,
  rowAnchorId,
} from '../src/publish/guide-links.ts';
import { converterCatalogue, issueLinksFor, runConversion } from '../src/browser/convert.ts';
import { isFailure, type ConversionRequest } from '../src/browser/contract.ts';
import { fixturePairs } from './coverage.test.ts';

/**
 * The gate on the **one contract** a browser consumer programs against.
 *
 * Two things can go silently wrong behind a facade, and both are checked here.
 * The catalogue can drift from the registry — in *either* direction, so a
 * mapping quietly vanishing from the tool is as loud a failure as one arriving
 * without a converter. And an issue can link to a row that has nothing to do
 * with it, which looks exactly like a working link until a reader follows it.
 */

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));
const DIRECTIONS: readonly Direction[] = ['toFhir', 'toOpenehr'];

function readFixture(mappingId: string, stem: string, direction: Direction): unknown {
  const side = direction === 'toFhir' ? 'openehr' : 'fhir';
  return JSON.parse(readFileSync(join(FIXTURES, mappingId, `${stem}.${side}.json`), 'utf8'));
}

/** Every fixture pair in the catalogue, as `(mapping id, stem)`. */
function cataloguedPairs(): readonly (readonly [string, string])[] {
  return converterCatalogue().flatMap((entry) =>
    fixturePairs(entry.id).map((stem) => [entry.id, stem] as const),
  );
}

test('every catalogue entry has a registered converter pair', () => {
  const missing = converterCatalogue()
    .filter((entry) => converterFor(entry.id) === undefined)
    .map((entry) => entry.id);
  assert.deepEqual(missing, [], `catalogue entries with no converter: ${missing.join(', ')}`);
  assert.ok(converterCatalogue().length > 0, 'the catalogue is not empty');
});

test('archetype-scope mappings are absent from the catalogue', () => {
  const listed = new Set(converterCatalogue().map((entry) => entry.id));
  const archetype = ledger().filter((mapping) => mapping.scope === 'archetype');
  assert.ok(archetype.length > 0, 'the ledger holds archetype-scope mappings to exclude');
  const leaked = archetype.map((mapping) => mapping.id).filter((id) => listed.has(id));
  assert.deepEqual(leaked, [], `archetype-scope mappings in the catalogue: ${leaked.join(', ')}`);
});

test('the catalogue covers every registered datatype mapping', () => {
  const listed = new Set(converterCatalogue().map((entry) => entry.id));
  const expected = ledger()
    .filter((mapping) => mapping.scope === 'datatype' && registered().has(mapping.id))
    .map((mapping) => mapping.id);
  assert.deepEqual(
    expected.filter((id) => !listed.has(id)),
    [],
    'the catalogue silently shrank: a registered datatype mapping is not offered',
  );
  assert.deepEqual([...listed].sort(), [...expected].sort(), 'the catalogue is exactly the set');
});

test('a catalogue entry names both directions, each with the guide’s declared fidelity', () => {
  for (const entry of converterCatalogue()) {
    assert.deepEqual(
      entry.directions.map((d) => d.direction),
      DIRECTIONS,
      `${entry.id}: both directions, in order`,
    );
    const mapping = mappingById(entry.id) as Mapping;
    assert.equal(entry.guideHref, mappingHref(mapping), `${entry.id}: the guide's own href`);
    assert.ok(hasFieldTable(mapping), `${entry.id}: an offered mapping has a published table`);
    for (const direction of entry.directions) {
      assert.ok(
        ['lossless', 'lossy', 'unmapped'].includes(direction.declaredFidelity),
        `${entry.id}: ${direction.direction} declares a real fidelity`,
      );
      assert.ok(direction.label.length > 0, `${entry.id}: ${direction.direction} has a label`);
    }
  }
});

test('a conversion preserves the converter’s MappingResult semantics', () => {
  let checked = 0;
  for (const entry of converterCatalogue()) {
    const [stem] = fixturePairs(entry.id);
    assert.ok(stem !== undefined, `${entry.id}: at least one fixture pair`);
    const pair = converterFor(entry.id);
    assert.ok(pair !== undefined, `${entry.id}: a registered pair`);

    for (const direction of DIRECTIONS) {
      const instance = readFixture(entry.id, stem, direction);
      const direct: MappingResult<unknown> =
        direction === 'toFhir' ? pair.toFhir(instance) : pair.toOpenehr(instance);
      const outcome = runConversion({ mappingId: entry.id, direction, value: instance });
      assert.ok(!isFailure(outcome), `${entry.id} ${direction}: a real conversion`);

      assert.equal(outcome.fidelity, direct.fidelity, `${entry.id} ${direction}: same fidelity`);
      assert.deepEqual(
        outcome.issues.map((issue) => issue.path),
        direct.issues.map((issue) => issue.path),
        `${entry.id} ${direction}: same issue paths, in order`,
      );
      assert.deepEqual(outcome.value, direct.value, `${entry.id} ${direction}: same value`);
      assert.equal(
        'value' in outcome,
        direct.value !== undefined,
        `${entry.id} ${direction}: an absent value stays absent`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'the guard actually converted something');
});

// ── issue-to-row resolution ──────────────────────────────────────────────────

/** True when `path` names the anchor itself or something beneath it. */
function isUnderAnchor(path: string, anchor: string): boolean {
  return path === anchor || path.startsWith(`${anchor}.`) || path.startsWith(`${anchor}[`);
}

/** Every endpoint path a row accounts for, its delegates' included. */
function anchorsOf(row: Row, byId: ReadonlyMap<string, Mapping>): readonly string[] {
  const paths: string[] = [];
  if (!isNoCounterpart(row.openehr)) paths.push(row.openehr.path);
  for (const endpoint of endpointsOf(row.fhir)) paths.push(endpoint.path);
  for (const id of row.delegates ?? []) {
    for (const inner of byId.get(id)?.rows ?? []) paths.push(...anchorsOf(inner, byId));
  }
  return paths;
}

/** True when this row genuinely accounts for this issue path in this direction. */
function accountsFor(row: Row, direction: Direction, path: string, byId: ReadonlyMap<string, Mapping>): boolean {
  const verdict = row[direction];
  if (verdict.fidelity === 'lossy' && verdict.drops.some((drop) => drop.path === path)) return true;
  return anchorsOf(row, byId).some((anchor) => isUnderAnchor(path, anchor));
}

test('every issue links to a row the ledger declares', () => {
  const byId = new Map(ledger().map((mapping) => [mapping.id, mapping]));
  let linked = 0;
  for (const [mappingId, stem] of cataloguedPairs()) {
    const mapping = byId.get(mappingId) as Mapping;

    const valid = new Set([
      mappingAnchorId(mapping.id),
      ...mapping.rows.map((row) => rowAnchorId(mapping.id, row.id)),
    ]);

    for (const direction of DIRECTIONS) {
      const instance = readFixture(mappingId, stem, direction);
      const outcome = runConversion({ mappingId, direction, value: instance });
      assert.ok(!isFailure(outcome), `${mappingId} ${direction}: a real conversion`);

      for (const issue of outcome.issues) {
        const where = `${mappingId}/${stem} ${direction} '${issue.path}'`;
        const [page, fragment] = issue.href.split('#');
        assert.equal(page, mappingHref(mapping).split('#')[0], `${where}: the mapping's own page`);
        assert.ok(fragment !== undefined, `${where}: an offered mapping always links to an anchor`);
        assert.ok(valid.has(fragment), `${where}: '${fragment}' is not an anchor the renderer emits`);
        assert.equal(issue.label, mapping.title, `${where}: the mapping title`);
        assert.ok(issue.message.length > 0, `${where}: the converter's own message`);

        if (fragment !== mappingAnchorId(mapping.id)) {
          const row = mapping.rows.find(
            (candidate) => rowAnchorId(mapping.id, candidate.id) === fragment,
          );
          assert.ok(row !== undefined, `${where}: the fragment names a real row`);
          assert.ok(
            accountsFor(row, direction, issue.path, byId),
            `${where}: row '${row.id}' neither declares this drop nor anchors this path`,
          );
        }
        linked += 1;
      }
    }
  }
  assert.ok(linked > 0, 'the guard actually inspected linked issues');
});

test('no linked issue carries a fragment for a mapping with no field table', () => {
  const unpublished = ledger().filter((mapping) => !hasFieldTable(mapping));
  assert.ok(unpublished.length > 0, 'the ledger holds mappings with no published field table');
  for (const mapping of unpublished) {
    assert.ok(
      !mappingHref(mapping).includes('#'),
      `${mapping.id}: a mapping with no field table must link bare`,
    );
    const links = issueLinksFor(mapping.id, 'toFhir', [{ path: 'anything', message: 'synthetic' }]);
    assert.deepEqual(
      links.map((link) => link.href),
      [mappingHref(mapping)],
      `${mapping.id}: a fragment here would dead-link`,
    );
  }
});

test('an unknown mapping id, and an invalid direction, return data rather than throwing', () => {
  assert.deepEqual(
    runConversion({ mappingId: 'no-such-mapping', direction: 'toFhir', value: {} }),
    { error: 'unknown-mapping' },
  );
  // A direction arriving from a URL or a form is a runtime string, so the guard
  // is on the value rather than on the type. Every registered pair carries both
  // directions, so this says nothing about converter coverage.
  const sideways = { mappingId: 'dv-boolean-to-boolean', direction: 'sideways', value: {} };
  assert.deepEqual(runConversion(sideways as unknown as ConversionRequest), {
    error: 'invalid-direction',
  });
  // The direction is checked first: a request wrong in both ways says so once.
  const both = { mappingId: 'no-such-mapping', direction: 'sideways', value: {} };
  assert.deepEqual(runConversion(both as unknown as ConversionRequest), {
    error: 'invalid-direction',
  });
  assert.deepEqual(issueLinksFor('no-such-mapping', 'toFhir', [{ path: 'x', message: 'y' }]), []);
});

test('issue-to-row resolution is segment-aware', () => {
  const mapping = mappingById('code-phrase-to-coding') as Mapping;
  const versionRow = rowAnchorId(mapping.id, 'fhir:coding.version');

  const [exact] = issueLinksFor(mapping.id, 'toOpenehr', [
    { path: 'Coding.version', message: 'synthetic' },
  ]);
  assert.equal(
    exact?.href,
    `${mappingHref(mapping).split('#')[0]}#${versionRow}`,
    'the row anchored at Coding.version resolves the path it anchors',
  );

  const [sibling] = issueLinksFor(mapping.id, 'toOpenehr', [
    { path: 'Coding.versionable', message: 'synthetic' },
  ]);
  assert.ok(sibling !== undefined, 'a link is still produced');
  assert.ok(
    !sibling.href.endsWith(versionRow),
    'a sibling attribute must not resolve to Coding.version — the rule validate.ts enforces',
  );
  assert.equal(sibling.href, mappingHref(mapping), 'an unresolvable path falls back to the mapping');

  // A descendant, by contrast, does resolve: the rule is containment, not
  // string prefixing.
  const [descendant] = issueLinksFor(mapping.id, 'toOpenehr', [
    { path: 'Coding.version.id', message: 'synthetic' },
  ]);
  assert.ok(descendant?.href.endsWith(versionRow), 'a real descendant resolves to its anchor');
});

test('a delegated drop resolves to the composing row that re-declares it', () => {
  const mapping = mappingById('dv-coded-text-to-codeable-concept') as Mapping;
  const composing = mapping.rows.find((row) => (row.delegates ?? []).length > 0);
  assert.ok(composing !== undefined, 'the mapping composes another converter');
  const verdict = composing.toOpenehr;
  assert.equal(verdict.fidelity, 'lossy', 'the composing row carries the inner drop forward');
  const delegated = verdict.fidelity === 'lossy' ? verdict.drops[0] : undefined;
  assert.ok(delegated !== undefined, 'the composing row declares at least one drop');

  const [link] = issueLinksFor(mapping.id, 'toOpenehr', [
    { path: delegated.path, message: 'synthetic' },
  ]);
  assert.equal(
    link?.href,
    `${mappingHref(mapping).split('#')[0]}#${rowAnchorId(mapping.id, composing.id)}`,
    'the exact declaration wins over any anchor match',
  );
});
