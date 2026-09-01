/**
 * Minimal structural types for the FHIR R5 primitives these mappings touch.
 *
 * FHIR primitives are JSON values, so they are modelled as the JavaScript
 * values they serialise to.
 */

export type FhirBoolean = boolean;
export type FhirInteger = number;
/**
 * FHIR R5 serialises `integer64` as a **JSON String** "due to issues with
 * precision in floating point libraries", so it is modelled as one here.
 * Publishing a bare JSON number would publish a wire format R5 does not have.
 */
export type FhirInteger64 = string;
export type FhirDecimal = number;

/** The inclusive bounds of the 32-bit signed FHIR `integer`. */
export const INT32_MAX = 2_147_483_647;
export const INT32_MIN = -2_147_483_648;
