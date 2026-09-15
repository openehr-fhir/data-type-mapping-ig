/**
 * The public contract a browser consumer of this workspace programs against.
 *
 * Everything here is **plain and JSON-serialisable**. No `Mapping`, no `Row`,
 * no `Verdict`, no `ConverterPair`: a consumer sees the catalogue it can offer,
 * the request it can make, and the answer it gets back, and nothing about how
 * the ledger or the registry are shaped. That boundary is the point — it is
 * what lets the ledger keep evolving without a consuming site being rebuilt
 * around it.
 *
 * Only `Direction` and `Fidelity` cross over from the model, because both are
 * closed vocabularies this guide publishes in its own narrative. Everything
 * else is declared here.
 */

import type { Direction, Fidelity } from '../model/types.ts';

export type { Direction, Fidelity };

/** One direction of one mapping, as a consumer may offer it. */
export interface DirectionEntry {
  readonly direction: Direction;
  /** The label the guide's own tables use, e.g. `→ FHIR`. */
  readonly label: string;
  /**
   * What the **guide claims** for this direction of this mapping as a whole —
   * `aggregateVerdict`, the same value the summary tables publish.
   *
   * Deliberately distinct from the fidelity a given conversion *achieves*: an
   * instance that happens to carry none of the lossy fields converts
   * `lossless` through a mapping the guide declares `lossy`, and a reader
   * needs to be able to see both numbers without one being mistaken for the
   * other.
   */
  readonly declaredFidelity: Fidelity;
}

/** One convertible mapping, as a consumer may list it. */
export interface CatalogueEntry {
  readonly id: string;
  readonly openehrType: string;
  readonly fhirType: string;
  readonly title: string;
  readonly category: string;
  readonly categoryLabel: string;
  /** Where this mapping is published in the guide, relative to the guide root. */
  readonly guideHref: string;
  readonly directions: readonly DirectionEntry[];
}

/** A request to convert one instance through one direction of one mapping. */
export interface ConversionRequest {
  readonly mappingId: string;
  readonly direction: Direction;
  /** A parsed JSON value. Parsing, and reporting a parse failure, is the caller's. */
  readonly value: unknown;
}

/**
 * One thing a conversion could not carry, with the guide row that declares it.
 *
 * `href` comes from `../publish/guide-links.ts`, so a consumer never composes a
 * guide URL of its own, and is relative to the guide root — a consumer that
 * publishes elsewhere prefixes it with wherever the guide actually lives.
 */
export interface LinkedIssue {
  readonly path: string;
  readonly message: string;
  readonly href: string;
  /** The mapping title, for a reader who needs to know where the link goes. */
  readonly label: string;
}

/** What a conversion produced. `value` is absent when nothing could be produced. */
export interface ConversionResponse {
  readonly fidelity: Fidelity;
  readonly value?: unknown;
  readonly issues: readonly LinkedIssue[];
}

/**
 * Why a conversion could not even be attempted.
 *
 * Both cases are **data, not exceptions**, because both are reachable from
 * ordinary browser input: a stale bookmark naming a mapping the ledger no
 * longer holds, and a direction string arriving from a URL or a form rather
 * than from the catalogue. Every registered `ConverterPair` carries both
 * directions, so `invalid-direction` is a guard on runtime input, never a
 * statement about converter coverage.
 */
export interface ConversionFailure {
  readonly error: 'unknown-mapping' | 'invalid-direction';
}

/** A conversion either ran or it did not; both outcomes are values. */
export type ConversionOutcome = ConversionResponse | ConversionFailure;

/** Narrow an outcome to the failure case. */
export function isFailure(outcome: ConversionOutcome): outcome is ConversionFailure {
  return 'error' in outcome;
}
