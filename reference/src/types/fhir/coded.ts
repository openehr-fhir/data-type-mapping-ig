/**
 * Minimal structural types for the FHIR R5 coded data types.
 *
 * **Only the fields the mappings touch.**
 */

import type { Extension } from './quantity.ts';

export type { Extension };

/** `Coding`. */
export interface Coding {
  readonly system?: string;
  readonly version?: string;
  readonly code?: string;
  readonly display?: string;
  readonly userSelected?: boolean;
  readonly extension?: readonly Extension[];
}

/** `CodeableConcept`. */
export interface CodeableConcept {
  readonly coding?: readonly Coding[];
  readonly text?: string;
}

/** Terminology systems these mappings name. */
export const SYSTEM = {
  dataAbsentReason: 'http://terminology.hl7.org/CodeSystem/data-absent-reason',
  nullFlavor: 'http://terminology.hl7.org/CodeSystem/v3-NullFlavor',
} as const;

/** Canonical URLs of the extensions these mappings target. */
export const CODED_EXT = {
  codingPurpose: 'http://hl7.org/fhir/StructureDefinition/coding-purpose',
  alternateCodes: 'http://hl7.org/fhir/StructureDefinition/alternate-codes',
  dataAbsentReason: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason',
  iso21090NullFlavor: 'http://hl7.org/fhir/StructureDefinition/iso21090-nullFlavor',
} as const;
