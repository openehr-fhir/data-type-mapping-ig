/** Minimal structural types for the FHIR R5 temporal types. */

import type { Extension } from './quantity.ts';

export type { Extension };

/** A FHIR `date` or `dateTime` primitive. */
export type FhirDate = string;
export type FhirDateTime = string;

/** A FHIR `time` together with its `_`-sibling, which carries the time zone. */
export interface FhirTimeElement {
  readonly value?: string;
  readonly extension?: readonly Extension[];
}

/** `Duration` — a `Quantity` profile constrained to UCUM time units. */
export interface FhirDuration {
  readonly value?: number;
  readonly unit?: string;
  readonly system?: string;
  readonly code?: string;
}

/** Canonical URL of the time-zone extension. */
export const TIMEZONE_EXTENSION = 'http://hl7.org/fhir/StructureDefinition/timezone';
