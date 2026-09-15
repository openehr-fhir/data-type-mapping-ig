import test from 'node:test';
import assert from 'node:assert/strict';

import { converterCatalogue } from '../../reference/src/browser/convert.ts';
import { FIXTURE_CATALOG } from '../src/generated/fixture-catalog.ts';
import { PROVENANCE } from '../src/generated/provenance.ts';
import { initialState, reduce, type State } from '../src/state.ts';
import { viewModelFor } from '../src/view-model.ts';

/**
 * The four states the request asks to be legible at a glance, asserted through
 * the **real** facade and **real** published fixtures rather than a stub — so
 * this breaks when the contract changes, which is the whole point of having it.
 */

const CATALOGUE = converterCatalogue();

function stateFor(mappingId: string, direction: 'toFhir' | 'toOpenehr', input: string): State {
  const base = initialState(CATALOGUE, FIXTURE_CATALOG);
  let state = reduce(base, { kind: 'select-direction', direction });
  state = reduce(state, { kind: 'select-mapping', mappingId });
  state = reduce(state, { kind: 'edit-input', text: input });
  return reduce(state, { kind: 'convert' });
}

function fixture(mappingId: string, name: string, side: 'openehr' | 'fhir'): string {
  const example = FIXTURE_CATALOG.find(
    (candidate) => candidate.mappingId === mappingId && candidate.name === name,
  );
  assert.ok(example !== undefined, `no published fixture ${mappingId}/${name}`);
  return side === 'openehr' ? example.openehr : example.fhir;
}

test('nothing is asserted before the reader converts', () => {
  assert.deepEqual(viewModelFor(initialState(CATALOGUE, FIXTURE_CATALOG)), { kind: 'idle' });
});

test('malformed JSON is reported as malformed, not as a conversion verdict', () => {
  const view = viewModelFor(stateFor('dv-boolean-to-boolean', 'toFhir', '{'));
  assert.equal(view.kind, 'invalid-json');
  assert.ok(view.kind === 'invalid-json' && view.message.startsWith('That is not valid JSON:'));
  // It is a distinct kind, so the DOM layer cannot render it in a verdict
  // banner by accident.
  assert.notEqual(view.kind, 'result');
});

test('a lossless conversion produces an output document and no issue lines', () => {
  const view = viewModelFor(
    stateFor('dv-boolean-to-boolean', 'toFhir', fixture('dv-boolean-to-boolean', '01-smoker', 'openehr')),
  );
  assert.equal(view.kind, 'result');
  if (view.kind !== 'result') return;
  assert.equal(view.fidelity, 'lossless');
  assert.deepEqual(view.issues, []);
  assert.ok(view.output !== undefined && view.output.trim().length > 0, 'an output document');
  assert.match(view.banner, /^LOSSLESS/);
});

test('a lossy conversion lines up one linked issue per declared drop', () => {
  const view = viewModelFor(
    stateFor(
      'dv-quantity-to-quantity',
      'toFhir',
      fixture('dv-quantity-to-quantity', '03-approximate-and-percent-accuracy', 'openehr'),
    ),
  );
  assert.equal(view.kind, 'result');
  if (view.kind !== 'result') return;
  assert.equal(view.fidelity, 'lossy');
  assert.ok(view.issues.length > 0, 'at least one issue line');
  assert.ok(view.output !== undefined, 'a lossy conversion still produces a document');
  assert.match(view.banner, /^LOSSY/);

  for (const issue of view.issues) {
    assert.match(issue.text, / — /, 'the line names the path and the reason');
    const href = new URL(issue.href);
    assert.ok(
      issue.href.startsWith(PROVENANCE.guideBaseUrl),
      `${issue.href} is not under the guide base URL`,
    );
    assert.ok(href.hash.startsWith('#'), 'the link carries a fragment into the guide');
    assert.ok(issue.label.length > 0, 'the link says where it goes');
  }
});

test('an unmapped direction produces no output and names the missing source path', () => {
  // The ledger declares `CODE_PHRASE ↔ Coding` unmapped nowhere, so the state
  // is found rather than assumed: any catalogue entry the guide itself calls
  // unmapped in one direction demonstrates it.
  const entry = CATALOGUE.find((candidate) =>
    candidate.directions.some((direction) => direction.declaredFidelity === 'unmapped'),
  );
  assert.ok(entry !== undefined, 'the guide declares at least one unmapped direction');
  const direction = entry.directions.find((d) => d.declaredFidelity === 'unmapped');
  assert.ok(direction !== undefined);

  const example = FIXTURE_CATALOG.find((candidate) => candidate.mappingId === entry.id);
  assert.ok(example !== undefined, `${entry.id} publishes a worked example`);
  const input = direction.direction === 'toFhir' ? example.openehr : example.fhir;

  const view = viewModelFor(stateFor(entry.id, direction.direction, input));
  assert.equal(view.kind, 'result');
  if (view.kind !== 'result') return;
  assert.equal(view.fidelity, 'unmapped', `${entry.id} ${direction.direction}`);
  assert.equal(view.output, undefined, 'nothing was produced, so no output document');
  assert.match(view.banner, /^UNMAPPED/);
  assert.match(view.banner, /has no counterpart in this direction\.$/);
  assert.ok(
    view.issues.length > 0 && view.banner.includes(view.issues[0]?.text.split(' — ')[0] ?? '\u0000'),
    'the banner names the path the first issue reports',
  );
});

test('a stale mapping selection is reported as unavailable, not as a verdict', () => {
  const base = initialState(CATALOGUE, FIXTURE_CATALOG);
  const stale: State = { ...base, mappingId: 'no-such-mapping', input: '{}', converted: true };
  const view = viewModelFor(stale);
  assert.equal(view.kind, 'unavailable');
  assert.ok(view.kind === 'unavailable' && view.message.includes('no-such-mapping'));
});

// ── the state transitions the panes depend on ────────────────────────────────

test('selecting an example loads the side that matches the direction', () => {
  const base = initialState(CATALOGUE, FIXTURE_CATALOG);
  const chosen = reduce(base, { kind: 'select-mapping', mappingId: 'dv-quantity-to-quantity' });
  const loaded = reduce(chosen, { kind: 'select-example', name: '02-comparator-and-accuracy' });
  assert.equal(loaded.input, fixture('dv-quantity-to-quantity', '02-comparator-and-accuracy', 'openehr'));

  const flipped = reduce(loaded, { kind: 'select-direction', direction: 'toOpenehr' });
  assert.equal(flipped.input, fixture('dv-quantity-to-quantity', '02-comparator-and-accuracy', 'fhir'));
  assert.equal(flipped.exampleName, '02-comparator-and-accuracy', 'still the same worked example');
});

test('editing the input clears the published-example marker', () => {
  const base = initialState(CATALOGUE, FIXTURE_CATALOG);
  assert.ok(base.exampleName !== undefined, 'an example is loaded to begin with');
  const edited = reduce(base, { kind: 'edit-input', text: '{"_type":"DV_BOOLEAN"}' });
  assert.equal(edited.exampleName, undefined);
  assert.equal(edited.input, '{"_type":"DV_BOOLEAN"}');
  assert.equal(edited.converted, false, 'an edit invalidates the previous answer');
});

test('an edit that changes nothing changes no state', () => {
  const base = initialState(CATALOGUE, FIXTURE_CATALOG);
  assert.equal(reduce(base, { kind: 'edit-input', text: base.input }), base);
  assert.equal(reduce(base, { kind: 'select-direction', direction: base.direction }), base);
  assert.equal(reduce(base, { kind: 'select-mapping', mappingId: base.mappingId }), base);
  assert.equal(reduce(base, { kind: 'select-example', name: 'no-such-example' }), base);
});
