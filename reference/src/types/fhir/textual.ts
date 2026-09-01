/**
 * The logical form of a FHIR primitive **together with its `_`-sibling**.
 *
 * In FHIR JSON a primitive is a bare value and its `id` and `extension` live in
 * an implicitly declared sibling property — `"note"` alongside
 * `"_note": { "extension": [...] }`. The two halves are one logical element, and
 * that is what these mappings convert, so they are modelled together here.
 */

import type { Extension } from './quantity.ts';

export type { Extension };

/** A FHIR `string` (or `markdown`) with its extensions. */
export interface FhirStringElement {
  readonly value?: string;
  readonly extension?: readonly Extension[];
}

/** Canonical URLs of the extensions the textual mappings target. */
export const TEXT_EXT = {
  renderingMarkdown: 'http://hl7.org/fhir/StructureDefinition/rendering-markdown',
  renderingXhtml: 'http://hl7.org/fhir/StructureDefinition/rendering-xhtml',
  language: 'http://hl7.org/fhir/StructureDefinition/language',
  translation: 'http://hl7.org/fhir/StructureDefinition/translation',
  mimeType: 'http://hl7.org/fhir/StructureDefinition/mimeType',
} as const;
