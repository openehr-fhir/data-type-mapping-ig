/**
 * Minimal structural types for the openEHR primitive data values.
 *
 * **Only the fields the mappings touch.**
 */

/** `DV_BOOLEAN`. */
export interface DvBoolean {
  readonly _type: 'DV_BOOLEAN';
  readonly value: boolean;
}

/**
 * The openEHR Foundation numeric primitives are bare values in canonical JSON,
 * so they are modelled as the JavaScript numbers they serialise to.
 */
export type OpenehrInteger = number;
export type OpenehrInteger64 = number;
export type OpenehrReal = number;
