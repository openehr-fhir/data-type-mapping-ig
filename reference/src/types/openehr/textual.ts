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

/** The `formatting` values the Reference Model defines. */
export const TEXT_FORMATTING = {
  plain: 'plain',
  plainNoNewlines: 'plain_no_newlines',
  markdown: 'markdown',
  html: 'html',
} as const;
