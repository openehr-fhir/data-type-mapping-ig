/**
 * Minimal structural types for the FHIR R5 quantitative data types.
 *
 * **Only the fields the mappings touch.** This is not a FHIR type library.
 */

/** A FHIR element extension, restricted to the value types these mappings use. */
export interface Extension {
  readonly url: string;
  readonly valueInteger?: number;
  readonly valueDecimal?: number;
  readonly valueString?: string;
  readonly valueBoolean?: boolean;
}

/** `Quantity`. */
export interface Quantity {
  readonly value?: number;
  readonly comparator?: string;
  readonly unit?: string;
  readonly system?: string;
  readonly code?: string;
  readonly extension?: readonly Extension[];
}

/** `Count` — a `Quantity` profile requiring UCUM `1`. */
export type Count = Quantity;

/** `SimpleQuantity` — a `Quantity` profile that forbids `comparator`. */
export type SimpleQuantity = Omit<Quantity, 'comparator'>;

/** `Ratio`. */
export interface Ratio {
  readonly numerator?: Quantity;
  readonly denominator?: Quantity;
}

/** `Range` — bounds are `SimpleQuantity`, so neither carries a comparator. */
export interface Range {
  readonly low?: SimpleQuantity;
  readonly high?: SimpleQuantity;
}

/** `Money`. */
export interface Money {
  readonly value?: number;
  readonly currency?: string;
}

/** Canonical URLs of the extensions these mappings target. */
export const EXT = {
  quantityPrecision: 'http://hl7.org/fhir/StructureDefinition/quantity-precision',
  quantityAccuracy: 'http://hl7.org/fhir/StructureDefinition/quantity-accuracy',
} as const;

/** UCUM, the unit system FHIR assumes when a `Quantity` carries a `code`. */
export const UCUM = 'http://unitsofmeasure.org';

/** ISO 4217, the currency system `Money` uses. */
export const ISO_4217 = 'urn:iso:std:iso:4217';

/** Read one extension's value from an element, by canonical URL. */
export function extensionValue(
  element: { readonly extension?: readonly Extension[] } | undefined,
  url: string,
): Extension | undefined {
  return element?.extension?.find((e) => e.url === url);
}
