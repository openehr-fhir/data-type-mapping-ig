/**
 * Minimal structural types for the FHIR R5 primitives these mappings touch.
 *
 * FHIR primitives are JSON values, so they are modelled as the JavaScript
 * values they serialise to.
 */

export type FhirBoolean = boolean;
export type FhirInteger = number;
export type FhirInteger64 = number;
export type FhirDecimal = number;

/** The inclusive bounds of the 32-bit signed FHIR `integer`. */
export const INT32_MAX = 2_147_483_647;
export const INT32_MIN = -2_147_483_648;
