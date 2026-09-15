/**
 * The converter's whole state, and the only thing that changes it.
 *
 * Pure: no DOM, no `window`, no `document`, no import of either. That is what
 * makes the interesting behaviour — which example loads into which pane, when
 * the "this is the published example" marker survives an edit, what a direction
 * change does to an input the reader has typed — testable under `node --test`
 * with no browser at all.
 */

import type { CatalogueEntry, Direction } from '../../reference/src/browser/contract.ts';
import type { FixtureExample } from './generated/fixture-catalog.ts';
import { mappingIdForType, openehrTypeOf } from './preselect.ts';

export interface State {
  readonly catalogue: readonly CatalogueEntry[];
  readonly examples: readonly FixtureExample[];
  readonly direction: Direction;
  readonly mappingId: string;
  /** The example whose text is currently loaded, or `undefined` once edited. */
  readonly exampleName: string | undefined;
  readonly input: string;
  /** Set by `convert`; cleared by anything that invalidates the answer. */
  readonly converted: boolean;
}

export type Action =
  | { readonly kind: 'select-direction'; readonly direction: Direction }
  | { readonly kind: 'select-mapping'; readonly mappingId: string }
  | { readonly kind: 'select-example'; readonly name: string }
  | { readonly kind: 'edit-input'; readonly text: string }
  | { readonly kind: 'convert' };

/** Every example that belongs to one mapping, in generated order. */
export function examplesFor(
  state: State,
  mappingId: string = state.mappingId,
): readonly FixtureExample[] {
  return state.examples.filter((example) => example.mappingId === mappingId);
}

/** The side of an example a direction reads from. */
function sideFor(example: FixtureExample, direction: Direction): string {
  return direction === 'toFhir' ? example.openehr : example.fhir;
}

export function initialState(
  catalogue: readonly CatalogueEntry[],
  examples: readonly FixtureExample[],
): State {
  const first = catalogue[0];
  const mappingId = first?.id ?? '';
  const example = examples.find((candidate) => candidate.mappingId === mappingId);
  return {
    catalogue,
    examples,
    direction: 'toFhir',
    mappingId,
    exampleName: example?.name,
    input: example === undefined ? '' : sideFor(example, 'toFhir'),
    converted: false,
  };
}

export function reduce(state: State, action: Action): State {
  switch (action.kind) {
    case 'select-direction': {
      if (action.direction === state.direction) return state;
      // The loaded example follows the direction: the reader asked to see the
      // other side of the *same* worked example, not to keep an instance that
      // is now on the wrong side of the arrow. A hand-typed input is left
      // alone, because nothing else could be meant by it.
      const example = state.examples.find(
        (candidate) =>
          candidate.mappingId === state.mappingId && candidate.name === state.exampleName,
      );
      return {
        ...state,
        direction: action.direction,
        input: example === undefined ? state.input : sideFor(example, action.direction),
        converted: false,
      };
    }

    case 'select-mapping': {
      if (action.mappingId === state.mappingId) return state;
      const example = state.examples.find(
        (candidate) => candidate.mappingId === action.mappingId,
      );
      return {
        ...state,
        mappingId: action.mappingId,
        exampleName: example?.name,
        input: example === undefined ? state.input : sideFor(example, state.direction),
        converted: false,
      };
    }

    case 'select-example': {
      const example = state.examples.find(
        (candidate) =>
          candidate.mappingId === state.mappingId && candidate.name === action.name,
      );
      if (example === undefined) return state;
      return {
        ...state,
        exampleName: example.name,
        input: sideFor(example, state.direction),
        converted: false,
      };
    }

    case 'edit-input': {
      if (action.text === state.input) return state;
      // Editing makes this no longer the published example, whatever it started
      // as, so the marker is cleared rather than left to mislead.
      return { ...state, input: action.text, exampleName: undefined, converted: false };
    }

    case 'convert':
      return state.converted ? state : { ...state, converted: true };
  }
}

/**
 * The mapping an instance preselects, when the reader has pasted rather than
 * chosen — and only when the `_type` names exactly one mapping.
 *
 * Returns `undefined` when nothing should move, so a caller never has to
 * distinguish "no suggestion" from "the current selection".
 */
export function suggestedMappingId(state: State): string | undefined {
  if (state.direction !== 'toFhir') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(state.input);
  } catch {
    return undefined;
  }
  const type = openehrTypeOf(parsed);
  if (type === undefined) return undefined;
  const suggestion = mappingIdForType(type, state.catalogue);
  return suggestion === state.mappingId ? undefined : suggestion;
}
