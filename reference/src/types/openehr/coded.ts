/**
 * Minimal structural types for the openEHR coded data values, in the canonical
 * openEHR JSON form.
 *
 * **Only the fields the mappings touch.**
 */

/** `TERMINOLOGY_ID` — carried as an object with a `value` in canonical JSON. */
export interface TerminologyId {
  readonly value: string;
}

/** `CODE_PHRASE`. */
export interface CodePhrase {
  readonly _type: 'CODE_PHRASE';
  readonly terminology_id: TerminologyId;
  readonly code_string: string;
  readonly preferred_term?: string;
}

/** `TERM_MAPPING`. */
export interface TermMapping {
  readonly _type: 'TERM_MAPPING';
  readonly match: string;
  readonly purpose?: DvCodedText;
  readonly target: CodePhrase;
}

/** `DV_CODED_TEXT`. */
export interface DvCodedText {
  readonly _type: 'DV_CODED_TEXT';
  readonly value: string;
  readonly defining_code: CodePhrase;
  readonly mappings?: readonly TermMapping[];
}

/**
 * A null flavour, which the RM carries as a `DV_CODED_TEXT` on
 * `ELEMENT.null_flavour` bound to openEHR's own `null flavours` code system.
 */
export type NullFlavour = DvCodedText;

/** openEHR's null-flavour codes, as published in its Support Terminology. */
export const NULL_FLAVOUR = {
  noInformation: '271',
  unknown: '253',
  masked: '272',
  notApplicable: '273',
} as const;

/** The terminology id openEHR uses for its own published terminology. */
export const OPENEHR_TERMINOLOGY = 'openehr';
