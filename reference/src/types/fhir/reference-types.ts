/** Minimal structural types for the FHIR R5 reference and identifier types. */

import type { CodeableConcept } from './coded.ts';

export type { CodeableConcept };

/** `Reference`. */
export interface Reference {
  readonly reference?: string;
  readonly type?: string;
  readonly display?: string;
  readonly identifier?: Identifier;
}

/** `Identifier`. */
export interface Identifier {
  readonly use?: string;
  readonly type?: CodeableConcept;
  readonly system?: string;
  readonly value?: string;
  readonly period?: { readonly start?: string; readonly end?: string };
  readonly assigner?: Reference;
}

/** `CodeableReference`. */
export interface CodeableReference {
  readonly concept?: CodeableConcept;
  readonly reference?: Reference;
}

/** A FHIR `uri` or `url` primitive. */
export type FhirUri = string;

/**
 * The prefix this guide uses to construct a `system` from a free-text openEHR
 * issuer, assigner, or type. **Whether it is a real definition or a placeholder
 * is not decided** — see the ledger note on `DV_IDENTIFIER.issuer`.
 */
export const OPENEHR_IDENTIFIER_PREFIX = 'http://openehr.org/identifier/';

/** Split a `system::value` string on its **last** `::`, so no escaping is needed. */
export function splitSystemValue(
  encoded: string,
): { readonly system?: string; readonly value: string } {
  const at = encoded.lastIndexOf('::');
  if (at < 0) return { value: encoded };
  return { system: encoded.slice(0, at), value: encoded.slice(at + 2) };
}

/** Join a system and value into the `system::value` convention. */
export function joinSystemValue(system: string | undefined, value: string): string {
  return system === undefined ? value : `${system}::${value}`;
}
