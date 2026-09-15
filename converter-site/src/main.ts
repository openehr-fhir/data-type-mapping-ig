/**
 * The entry point: DOM wiring only.
 *
 * It owns no mapping knowledge. The catalogue comes from the reference facade,
 * the examples and provenance from the generated modules, the transitions from
 * `state.ts`, and what to show from `view-model.ts`. This file's whole job is
 * to turn events into actions and view models into DOM.
 */

import { converterCatalogue } from '../../reference/src/browser/convert.ts';
import type { Direction } from '../../reference/src/browser/contract.ts';
import { exampleLabel, fillSelect, mappingLabel, render, renderProvenance, shell } from './dom.ts';
import { FIXTURE_CATALOG } from './generated/fixture-catalog.ts';
import { PROVENANCE } from './generated/provenance.ts';
import { examplesFor, initialState, reduce, suggestedMappingId, type Action, type State } from './state.ts';
import { selectedEntry, viewModelFor } from './view-model.ts';

const parts = shell();
let state: State = initialState(converterCatalogue(), FIXTURE_CATALOG);

function refreshPickers(): void {
  fillSelect(
    parts.mapping,
    state.catalogue.map((entry) => ({
      value: entry.id,
      label: mappingLabel(entry, state.direction),
    })),
    state.mappingId,
  );
  fillSelect(
    parts.example,
    examplesFor(state).map((example) => ({
      value: example.name,
      label: exampleLabel(example),
    })),
    state.exampleName,
  );
  // An edited input is no longer any published example, and the picker says so
  // rather than continuing to point at the one it started from.
  if (state.exampleName === undefined) parts.example.selectedIndex = -1;

  const entry = selectedEntry(state);
  parts.guideLink.href =
    entry === undefined ? PROVENANCE.guideBaseUrl : new URL(entry.guideHref, PROVENANCE.guideBaseUrl).toString();
}

function apply(action: Action): void {
  const next = reduce(state, action);
  if (next === state) return;
  state = next;
  if (parts.input.value !== state.input) parts.input.value = state.input;
  refreshPickers();
  render(viewModelFor(state), parts);
}

parts.direction.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.name !== 'direction') return;
  apply({ kind: 'select-direction', direction: target.value as Direction });
});

parts.mapping.addEventListener('change', () => {
  apply({ kind: 'select-mapping', mappingId: parts.mapping.value });
});

parts.example.addEventListener('change', () => {
  apply({ kind: 'select-example', name: parts.example.value });
});

parts.input.addEventListener('input', () => {
  apply({ kind: 'edit-input', text: parts.input.value });
  // A pasted instance that names exactly one mapping moves the picker for the
  // reader; an ambiguous `_type` deliberately moves nothing.
  const suggestion = suggestedMappingId(state);
  if (suggestion !== undefined) {
    const carried = state.input;
    apply({ kind: 'select-mapping', mappingId: suggestion });
    if (state.input !== carried) apply({ kind: 'edit-input', text: carried });
  }
});

parts.convert.addEventListener('click', () => {
  // Converting the same text twice must still answer, so the flag is re-armed
  // rather than latched.
  state = { ...state, converted: false };
  apply({ kind: 'convert' });
});

parts.input.value = state.input;
refreshPickers();
renderProvenance(parts.provenance);
render(viewModelFor(state), parts);
