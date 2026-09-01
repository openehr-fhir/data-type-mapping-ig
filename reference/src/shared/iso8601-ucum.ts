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
  { ucum: 'ms', designator: 'S', time: true, description: 'Milliseconds (PT0.001S)' },
];

/** A duration expressed as a UCUM quantity. */
export interface UcumDuration {
  readonly value: number;
  readonly code: string;
  readonly system: 'http://unitsofmeasure.org';
}

const UCUM_SYSTEM = 'http://unitsofmeasure.org' as const;

/** `P` [n]Y [n]M [n]W [n]D [ T [n]H [n]M [n(.n)]S ] */
const ISO_DURATION =
  /^P(?!$)(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?!$)(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

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
  return {
    value: { value: only.value, code: only.unit, system: UCUM_SYSTEM },
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

  if (unit.ucum === 'ms') {
    return {
      value: `PT${duration.value / 1000}S`,
      fidelity: 'lossless',
      issues: [],
    };
  }

  const body = `${duration.value}${unit.designator}`;
  return {
    value: unit.time ? `PT${body}` : `P${body}`,
    fidelity: 'lossless',
    issues: [],
  };
}
