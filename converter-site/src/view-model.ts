/**
 * The presentation model, derived purely from state.
 *
 * A discriminated union the DOM layer renders verbatim and adds nothing to.
 * The distinction that matters most is between `invalid-json` and a `lossy`
 * result: "this is not JSON" and "this converted, but something was left
 * behind" are entirely different facts about the reader's instance, and a tool
 * that renders them in the same banner teaches the reader to ignore both.
 */

import { runConversion } from '../../reference/src/browser/convert.ts';
import {
  isFailure,
  type CatalogueEntry,
  type Fidelity,
} from '../../reference/src/browser/contract.ts';
import { PROVENANCE } from './generated/provenance.ts';
import type { State } from './state.ts';

export interface IssueLine {
  readonly text: string;
  /** Absolute: the guide base URL plus the relative href the facade produced. */
  readonly href: string;
  readonly label: string;
}

export type ViewModel =
  | { readonly kind: 'idle' }
  | { readonly kind: 'invalid-json'; readonly message: string }
  | {
      readonly kind: 'result';
      readonly fidelity: Fidelity;
      readonly banner: string;
      /** Absent when nothing could be produced. */
      readonly output?: string;
      readonly issues: readonly IssueLine[];
    }
  /** The request could not be run at all — a stale selection, not a bad instance. */
  | { readonly kind: 'unavailable'; readonly message: string };

/** The catalogue entry the state selects, if it still exists. */
export function selectedEntry(state: State): CatalogueEntry | undefined {
  return state.catalogue.find((entry) => entry.id === state.mappingId);
}

const BANNER: Readonly<Record<Fidelity, string>> = {
  lossless: 'LOSSLESS — everything in this instance was carried across.',
  lossy: 'LOSSY — converted, but the fields below were not carried.',
  unmapped: 'UNMAPPED — nothing could be produced.',
};

/** An absolute link into the published guide. */
function absolute(href: string): string {
  return new URL(href, PROVENANCE.guideBaseUrl).toString();
}

export function viewModelFor(state: State): ViewModel {
  if (!state.converted) return { kind: 'idle' };

  let value: unknown;
  try {
    value = JSON.parse(state.input);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { kind: 'invalid-json', message: `That is not valid JSON: ${detail}` };
  }

  const outcome = runConversion({
    mappingId: state.mappingId,
    direction: state.direction,
    value,
  });

  if (isFailure(outcome)) {
    return {
      kind: 'unavailable',
      message:
        outcome.error === 'unknown-mapping'
          ? `No mapping named '${state.mappingId}' is published in this guide.`
          : `'${String(state.direction)}' is not a direction this guide maps.`,
    };
  }

  const issues: readonly IssueLine[] = outcome.issues.map((issue) => ({
    text: `${issue.path} — ${issue.message}`,
    href: absolute(issue.href),
    label: issue.label,
  }));

  // An empty output pane is never left unexplained: when nothing was produced,
  // the banner names the source path the ledger says has nowhere to land.
  const missing = outcome.issues[0]?.path;
  const banner =
    outcome.fidelity === 'unmapped' && missing !== undefined
      ? `${BANNER.unmapped} ${missing} has no counterpart in this direction.`
      : BANNER[outcome.fidelity];

  const base = { kind: 'result', fidelity: outcome.fidelity, banner, issues } as const;
  return outcome.value === undefined
    ? base
    : { ...base, output: `${JSON.stringify(outcome.value, null, 2)}\n` };
}
