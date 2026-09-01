/** Minimal structural types for the openEHR resource-locator data values. */

import type { DvText } from './textual.ts';

/** `DV_IDENTIFIER`. */
export interface DvIdentifier {
  readonly _type: 'DV_IDENTIFIER';
  readonly id: string;
  readonly issuer?: string;
  readonly assigner?: string;
  readonly type?: string;
}

/** `DV_URI`, and `DV_EHR_URI` which constrains the scheme to `ehr:`. */
export interface DvUri {
  readonly _type: 'DV_URI' | 'DV_EHR_URI';
  readonly value: string;
}

/** `LINK`, defined in the Common Information Model. */
export interface Link {
  readonly _type: 'LINK';
  readonly meaning: DvText;
  readonly type: DvText;
  readonly target: DvUri;
}
