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

/**
 * The four `TERM_MAPPING.match` codes the Reference Model publishes.
 *
 * RM § 5.2.2 declares `match: char` `1..1` and enumerates the results:
 * `'>'` broader, `'='` "(supposedly) equivalent", `'<'` narrower, and — the one
 * that matters most to a converter — `'?'`, *"the kind of mapping is
 * unknown"*. The RM ships a designated unknown value, so a conversion with no
 * source for the attribute has something to write that asserts nothing.
 *
 * `is_valid_match_code` and the `Match_valid` invariant are declared in the
 * same section.
 *
 * @see https://specifications.openehr.org/releases/RM/latest/data_types.html#_term_mapping_class
 */
export const TERM_MAPPING_MATCH = {
  broader: '>',
  equivalent: '=',
  narrower: '<',
  unknown: '?',
} as const;

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
