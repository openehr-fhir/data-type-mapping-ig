/** Minimal structural types for the remaining openEHR data values. */

import type { CodePhrase, DvCodedText } from './coded.ts';
import type { DvUri } from './reference-types.ts';

/** `DV_MULTIMEDIA`. */
export interface DvMultimedia {
  readonly _type: 'DV_MULTIMEDIA';
  readonly media_type: CodePhrase;
  readonly size: number;
  readonly data?: string;
  readonly uri?: DvUri;
  readonly alternate_text?: string;
  readonly integrity_check?: string;
  readonly integrity_check_algorithm?: CodePhrase;
  readonly compression_algorithm?: CodePhrase;
  readonly charset?: CodePhrase;
  readonly thumbnail?: DvMultimedia;
}

/** `DV_PARSABLE`. */
export interface DvParsable {
  readonly _type: 'DV_PARSABLE';
  readonly value: string;
  readonly formalism: string;
}

/** `DV_STATE`. */
export interface DvState {
  readonly _type: 'DV_STATE';
  readonly value: DvCodedText;
  readonly is_terminal: boolean;
}
