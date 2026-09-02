/**
 * ISO 8601 duration ↔ UCUM conversion.
 *
 * The table below is transcribed from the working group's own conversion table,
 * which is anchored in the FHIR duration-units value set. It is deliberately
 * **data, not prose**, so the guide can render exactly what the code implements.
 *
 * Non-convertible cases are reported as `Issue`s rather than thrown, because an
 * unconvertible duration is data, not an exception.
 *
 * A standalone conversion library was planned by the working group. If one is
 * published it **supersedes** this helper rather than conflicting with it: this
 * is a reference implementation of the mapping, not a general-purpose date
 * library.
 */

import type { Issue, MappingResult } from '../result.ts';

/** One row of the ISO 8601 ↔ UCUM correspondence. */
export interface DurationUnit {
  /** The UCUM code, from the FHIR duration-units value set. */
  readonly ucum: string;
  /** The ISO 8601 designator letter. */
  readonly designator: string;
  /** True when the designator sits after the `T` separator. */
  readonly time: boolean;
  readonly description: string;
}

/**
 * The correspondence, longest period first. `mo` and `min` share the designator
 * `M`, which is exactly why the `T` separator matters and why `time` is here.
 */
export const DURATION_UNITS: readonly DurationUnit[] = [
  { ucum: 'a', designator: 'Y', time: false, description: 'Years' },
  { ucum: 'mo', designator: 'M', time: false, description: 'Months' },
  { ucum: 'wk', designator: 'W', time: false, description: 'Weeks' },
  { ucum: 'd', designator: 'D', time: false, description: 'Days' },
  { ucum: 'h', designator: 'H', time: true, description: 'Hours' },
  { ucum: 'min', designator: 'M', time: true, description: 'Minutes' },
  { ucum: 's', designator: 'S', time: true, description: 'Seconds' },
  { ucum: 'ms', designator: 'S', time: true, description: 'Milliseconds (PT{n/1000}S)' },
];

/** A duration expressed as a UCUM quantity. */
export interface UcumDuration {
  readonly value: number;
  readonly code: string;
  readonly system: 'http://unitsofmeasure.org';
}

const UCUM_SYSTEM = 'http://unitsofmeasure.org' as const;

/**
 * `[-] P` [n]Y [n]M [n]W [n]D [ T [n]H [n]M [n(.n)]S ]
 *
 * The leading `-` is deliberate. openEHR's `Iso8601_duration` supports negative
 * durations — its own worked example is `-P3M`, "minus 3 months" for a very
 * premature newborn — but its `Years_valid` … `Seconds_valid` invariants all
 * require the individual components to be non-negative, so **the sign precedes
 * `P`**. It is matched here rather than captured, because adding a group would
 * shift every index `GROUP_UNITS` depends on.
 */
const ISO_DURATION =
  /^-?P(?!$)(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?!$)(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

/** The order the capture groups appear in, as UCUM codes. */
const GROUP_UNITS: readonly string[] = ['a', 'mo', 'wk', 'd', 'h', 'min', 's'];

/**
 * Parse an ISO 8601 duration into a single UCUM quantity.
 *
 * A duration naming **exactly one** component converts cleanly. A duration
 * naming several — `P1Y6M` — has no single UCUM unit, and that is reported
 * rather than approximated, because the number of days in a month is not fixed.
 */
export function iso8601ToUcum(iso: string): MappingResult<UcumDuration> {
  const match = ISO_DURATION.exec(iso);
  if (match === null) {
    return {
      fidelity: 'unmapped',
      issues: [
        {
          path: 'DV_DURATION.value',
          message: `'${iso}' is not an ISO 8601 duration this mapping recognises`,
        },
      ],
    };
  }

  const present: { readonly unit: string; readonly value: number }[] = [];
  for (let index = 0; index < GROUP_UNITS.length; index += 1) {
    const raw = match[index + 1];
    if (raw === undefined) continue;
    present.push({ unit: GROUP_UNITS[index] as string, value: Number(raw) });
  }

  if (present.length === 0) {
    return {
      fidelity: 'unmapped',
      issues: [
        { path: 'DV_DURATION.value', message: `'${iso}' names no duration components` },
      ],
    };
  }

  if (present.length > 1) {
    return {
      fidelity: 'unmapped',
      issues: [
        {
          path: 'DV_DURATION.value',
          message:
            `'${iso}' combines ${present.length} components and has no single UCUM unit; ` +
            'the number of days in a month and in a year is not fixed, so combining them ' +
            'would invent a precision the source does not have',
        },
      ],
    };
  }

  const only = present[0] as { unit: string; value: number };
  const magnitude = iso.startsWith('-') ? -only.value : only.value;
  return {
    value: { value: magnitude, code: only.unit, system: UCUM_SYSTEM },
    fidelity: 'lossless',
    issues: [],
  };
}

/** Render a UCUM duration quantity back as an ISO 8601 duration. */
export function ucumToIso8601(duration: UcumDuration): MappingResult<string> {
  const unit = DURATION_UNITS.find((u) => u.ucum === duration.code);
  if (unit === undefined) {
    const issue: Issue = {
      path: 'Duration.code',
      message:
        `'${duration.code}' is not one of the UCUM duration units the FHIR ` +
        'duration-units value set names, so it has no ISO 8601 form here',
    };
    return { fidelity: 'unmapped', issues: [issue] };
  }

  // openEHR's `Iso8601_duration` places the sign **before** `P`: every
  // component invariant (`Years_valid` … `Seconds_valid`) requires a
  // non-negative value, so `P-3M` violates a published openEHR invariant while
  // `-P3M` is the form the specification's own example uses. A negative
  // `Duration.value` is legal FHIR — `drt-1` constrains only the code.
  const sign = duration.value < 0 ? '-' : '';
  const magnitude = Math.abs(duration.value);

  if (unit.ucum === 'ms') {
    // `GROUP_UNITS` has no `ms` capture, so `PT0.001S` parses back as seconds:
    // the unit provably does not survive the return trip, and claiming
    // `lossless` here would be the same defect the mandatory-attribute rule
    // exists to stop. **The magnitude does not survive either** — 5 ms is
    // written `PT0.005S` and reads back as 0.005 s — so the rescale is its own
    // named drop rather than something the unit drop can be read as covering.
    return {
      value: `${sign}PT${magnitude / 1000}S`,
      fidelity: 'lossy',
      issues: [
        {
          path: 'Duration.code',
          message:
            `'ms' has no ISO 8601 designator of its own, so ${magnitude} ms is ` +
            `written as ${sign}PT${magnitude / 1000}S; the unit is not carried — the same ` +
            'duration read back names seconds, not milliseconds',
        },
        {
          path: 'Duration.value[ms]',
          message:
            `the magnitude is rescaled with the unit: Duration.value ${duration.value} ` +
            `becomes ${magnitude / 1000} seconds, so the number a receiving Duration ` +
            'would state is not the number this one states',
        },
      ],
    };
  }

  const body = `${magnitude}${unit.designator}`;
  return {
    value: unit.time ? `${sign}PT${body}` : `${sign}P${body}`,
    fidelity: 'lossless',
    issues: [],
  };
}
