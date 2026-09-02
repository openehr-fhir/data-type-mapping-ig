/** Minimal structural types for the openEHR textual data values. */

import type { CodePhrase, TermMapping } from './coded.ts';

/** `DV_TEXT`. */
export interface DvText {
  readonly _type: 'DV_TEXT';
  readonly value: string;
  readonly formatting?: string;
  readonly hyperlink?: { readonly _type: 'DV_URI'; readonly value: string };
  readonly language?: CodePhrase;
  readonly encoding?: CodePhrase;
  readonly mappings?: readonly TermMapping[];
}

/**
 * The `formatting` values the Reference Model enumerates.
 *
 * RM § 5.1.7 *Formatting and Hyperlinking* lists them exhaustively: `Void`,
 * `"markdown"`, `"plain"`, `"plain_no_newlines"`, and — *"(legacy -
 * deprecated)"* — a `name:value;` CSS string. `"html"` is **not** among them,
 * and the same section rejects the idea explicitly, concluding that conversion
 * to rendering form "is assumed to be done by an industry-standard
 * markdown-to-HTML or other such converter. **This is the approach taken by
 * this specification.**"
 *
 * The legacy CSS string is a free-form value rather than a named constant, so
 * it has no entry here; a `formatting` outside this set falls into the
 * converter's "no FHIR representation" branch and is reported.
 *
 * @see https://specifications.openehr.org/releases/RM/latest/data_types.html#_formatting_and_hyperlinking
 */
export const TEXT_FORMATTING = {
  plain: 'plain',
  plainNoNewlines: 'plain_no_newlines',
  markdown: 'markdown',
} as const;
