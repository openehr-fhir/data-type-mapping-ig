/**
 * Preselecting a mapping from an openEHR instance's `_type`, when — and only
 * when — the answer is unambiguous.
 *
 * `DV_QUANTITY` maps to three FHIR types in this guide (`Quantity`, `Money`,
 * `SimpleQuantity`), and guessing one of them would silently convert a reader's
 * instance through a mapping they did not choose. A tool that quietly picks for
 * you is worse than one that asks, so ambiguity returns `undefined` and the
 * reader's own selection stands.
 */

import type { CatalogueEntry } from '../../reference/src/browser/contract.ts';

/** The `_type` discriminator of a parsed openEHR instance, if it has one. */
export function openehrTypeOf(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const type = (value as Record<string, unknown>)['_type'];
  return typeof type === 'string' && type.length > 0 ? type : undefined;
}

/** The one mapping id for this openEHR type, or `undefined` when it is not one. */
export function mappingIdForType(
  type: string,
  catalogue: readonly CatalogueEntry[],
): string | undefined {
  const matches = catalogue.filter((entry) => entry.openehrType === type);
  return matches.length === 1 ? matches[0]?.id : undefined;
}
