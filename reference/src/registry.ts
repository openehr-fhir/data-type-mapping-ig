/**
 * The converter registry, keyed by **mapping id**.
 *
 * A converter module registers itself as an import side effect at module
 * scope; `src/convert/index.ts` is the single module that imports them all, so
 * importing it is what populates this registry. `test/coverage.test.ts` then
 * checks the registry against the ledger in both directions: a mapping with a
 * mappable row must have a converter, and a converter must have a mapping.
 */

import type { MappingResult } from './result.ts';

/** A bidirectional converter pair for one mapping id. */
export interface ConverterPair<O = unknown, F = unknown> {
  readonly toFhir: (source: O) => MappingResult<F>;
  readonly toOpenehr: (source: F) => MappingResult<O>;
}

const REGISTRY = new Map<string, ConverterPair>();

/**
 * Register the converter pair for a mapping id.
 *
 * @throws if the id is already registered — a duplicate registration means two
 * modules claim the same mapping, which the ledger cannot express.
 */
export function register<O, F>(id: string, pair: ConverterPair<O, F>): void {
  if (REGISTRY.has(id)) {
    throw new Error(`A converter pair is already registered for mapping '${id}'`);
  }
  REGISTRY.set(id, pair as ConverterPair);
}

/** Every registered pair, keyed by mapping id. */
export function registered(): ReadonlyMap<string, ConverterPair> {
  return REGISTRY;
}

/** The pair for one mapping id, or `undefined`. */
export function converterFor(id: string): ConverterPair | undefined {
  return REGISTRY.get(id);
}
