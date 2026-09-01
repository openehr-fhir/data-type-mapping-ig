/**
 * Assembles the ledger from its content modules and validates it.
 *
 * The import list below is **static and explicit**, never a glob or a dynamic
 * import. That is not a style preference: contextual typing is what makes the
 * discriminated unions in `types.ts` bite, and a dynamically assembled ledger
 * cannot be contextually typed. Each content phase adds exactly one line.
 *
 * `aggregateVerdict` is declared here, once, and is read by **both** the
 * `summary:` renderers and the round-trip tests, so the tables and the tests
 * cannot disagree about what a mapping-level verdict means.
 */

import {
  type Category,
  type Direction,
  type Fidelity,
  type Mapping,
  type Row,
} from './types.ts';
import { validateLedger } from './validate.ts';

// ── Ledger content modules ───────────────────────────────────────────────────
// One line per `reference/ledger/*.ts`, appended by the phase that lands it.
import boolean_ from '../../ledger/boolean.ts';
import coded from '../../ledger/coded.ts';
import gaps from '../../ledger/gaps.ts';
import numeric from '../../ledger/numeric.ts';
import referenceTypes from '../../ledger/reference-types.ts';
import temporal from '../../ledger/temporal.ts';
import textual from '../../ledger/textual.ts';
import other from '../../ledger/other.ts';
import quantity from '../../ledger/quantity.ts';

const MODULES: readonly (readonly Mapping[])[] = [quantity, coded, boolean_, numeric, textual, referenceTypes, temporal, other, gaps];

let cached: readonly Mapping[] | undefined;

/**
 * The whole validated ledger.
 *
 * @throws if `validateLedger` reports any violation. A ledger that does not
 * validate is not published, rendered, or tested against.
 */
export function ledger(): readonly Mapping[] {
  if (cached !== undefined) return cached;
  const all = MODULES.flat();
  const problems = validateLedger(all);
  if (problems.length > 0) {
    throw new Error(
      `The mapping ledger is invalid (${problems.length} problem(s)):\n` +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
  }
  cached = all;
  return cached;
}

/** One mapping by id, or `undefined`. */
export function mappingById(id: string): Mapping | undefined {
  return ledger().find((m) => m.id === id);
}

/** Every mapping in a category, in ledger order. */
export function mappingsFor(category: Category): readonly Mapping[] {
  return ledger().filter((m) => m.category === category);
}

/** Every row of every mapping in a category, in ledger order. */
export function rowsFor(category: Category): readonly Row[] {
  return mappingsFor(category).flatMap((m) => m.rows);
}

/** Every category present in the ledger, in first-seen order. */
export function categories(): readonly Category[] {
  const seen: Category[] = [];
  for (const mapping of ledger()) {
    if (!seen.includes(mapping.category)) seen.push(mapping.category);
  }
  return seen;
}

/**
 * The mapping-level verdict for one direction, used **only** by the `summary:`
 * renderers and by the tests that check them.
 *
 * `lossless` when every row in that direction is `lossless`; `unmapped` when
 * every row is `unmapped`; `lossy` otherwise. A mapping with no rows is
 * reported `unmapped`, because it asserts nothing.
 */
export function aggregateVerdict(mapping: Mapping, direction: Direction): Fidelity {
  const verdicts = mapping.rows.map((row) => row[direction].fidelity);
  if (verdicts.length === 0) return 'unmapped';
  if (verdicts.every((f) => f === 'lossless')) return 'lossless';
  if (verdicts.every((f) => f === 'unmapped')) return 'unmapped';
  return 'lossy';
}

/** True when every row of the mapping is `unmapped` in **both** directions. */
export function isEntirelyUnmapped(mapping: Mapping): boolean {
  return (
    aggregateVerdict(mapping, 'toFhir') === 'unmapped' &&
    aggregateVerdict(mapping, 'toOpenehr') === 'unmapped'
  );
}
