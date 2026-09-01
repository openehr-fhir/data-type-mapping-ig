/** Minimal structural types for the openEHR temporal data values. */

/** `DV_DATE`. */
export interface DvDate {
  readonly _type: 'DV_DATE';
  readonly value: string;
}

/** `DV_TIME`. */
export interface DvTime {
  readonly _type: 'DV_TIME';
  readonly value: string;
}

/** `DV_DATE_TIME`, with the `accuracy` it inherits from `DV_TEMPORAL`. */
export interface DvDateTime {
  readonly _type: 'DV_DATE_TIME';
  readonly value: string;
  readonly accuracy?: string;
}

/** `DV_DURATION`. */
export interface DvDuration {
  readonly _type: 'DV_DURATION';
  readonly value: string;
}
