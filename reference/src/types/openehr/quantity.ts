/**
 * Minimal structural types for the openEHR quantity data values, in the
 * canonical openEHR JSON form with the `_type` discriminator.
 *
 * **Only the fields the mappings touch.** This is not an openEHR RM library.
 */

/** `DV_QUANTITY` — openEHR RM, Data Types Information Model. */
export interface DvQuantity {
  readonly _type: 'DV_QUANTITY';
  readonly magnitude: number;
  readonly units: string;
  readonly units_system?: string;
  readonly units_display_name?: string;
  readonly precision?: number;
  readonly magnitude_status?: string;
  readonly accuracy?: number;
  readonly accuracy_is_percent?: boolean;
}

/** `DV_COUNT`. */
export interface DvCount {
  readonly _type: 'DV_COUNT';
  readonly magnitude: number;
  readonly magnitude_status?: string;
}

/**
 * `PROPORTION_KIND` — the integer discriminator carried in
 * `DV_PROPORTION.type`.
 */
export const PROPORTION_KIND = {
  pk_ratio: 0,
  pk_unitary: 1,
  pk_percent: 2,
  pk_fraction: 3,
  pk_integer_fraction: 4,
} as const;

export type ProportionKindName = keyof typeof PROPORTION_KIND;

/** `DV_PROPORTION`. */
export interface DvProportion {
  readonly _type: 'DV_PROPORTION';
  readonly numerator: number;
  readonly denominator: number;
  readonly type: number;
  readonly precision?: number;
}

/** `DV_INTERVAL<DV_QUANTITY>` in its canonical JSON form. */
export interface DvIntervalQuantity {
  readonly _type: 'DV_INTERVAL';
  readonly lower?: DvQuantity;
  readonly upper?: DvQuantity;
  readonly lower_unbounded?: boolean;
  readonly upper_unbounded?: boolean;
  readonly lower_included?: boolean;
  readonly upper_included?: boolean;
}
