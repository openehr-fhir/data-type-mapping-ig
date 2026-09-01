/**
 * Which ISO 8601 forms each standard accepts.
 *
 * Both openEHR and FHIR use ISO 8601, which makes the temporal category look
 * easier than it is: **the two subsets are not the same subset**. This module
 * is the comparison, as a **capability table** — data, not prose — so the guide
 * renders exactly what the code implements and the two cannot disagree.
 *
 * Verified against `datatypes.html` in the FHIR R5 specification and the
 * *Foundation Types* specification in openEHR BASE.
 */

/** Which of the three temporal kinds a form belongs to. */
export type TemporalKind = 'date' | 'time' | 'dateTime';

/** One row of the subset comparison. */
export interface Iso8601Form {
  readonly kind: TemporalKind;
  /** A representative instance of the form. */
  readonly example: string;
  readonly description: string;
  readonly openehr: boolean;
  readonly fhir: boolean;
  /** What a mapping engine must do, when the two differ. */
  readonly action: string;
}

/**
 * The comparison. Where `openehr` and `fhir` differ, `action` is the mapping
 * rule, and it is the same rule the converters implement.
 */
export const ISO8601_FORMS: readonly Iso8601Form[] = [
  {
    kind: 'date',
    example: '2026-03-01',
    description: 'Full date, extended form',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged.',
  },
  {
    kind: 'date',
    example: '20260301',
    description: 'Full date, compact form',
    openehr: true,
    fhir: false,
    action: 'SHALL be expanded to the extended form before mapping to FHIR.',
  },
  {
    kind: 'date',
    example: '2026-03',
    description: 'Year and month only',
    openehr: true,
    fhir: true,
    action:
      'Carried unchanged. The FHIR lexical form is **truncated** to match the source ' +
      'precision, never padded — padding invents a day the source did not record.',
  },
  {
    kind: 'date',
    example: '202603',
    description: 'Year and month, compact form',
    openehr: true,
    fhir: false,
    action: 'SHALL be expanded to `2026-03`.',
  },
  {
    kind: 'date',
    example: '2026',
    description: 'Year only',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged.',
  },
  {
    kind: 'time',
    example: '14:30:00',
    description: 'Full time, extended form',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged.',
  },
  {
    kind: 'time',
    example: 'T143000',
    description: 'Full time, compact form with the `T` designator',
    openehr: true,
    fhir: false,
    action: 'SHALL be expanded to `14:30:00`; FHIR `time` carries no `T` prefix.',
  },
  {
    kind: 'time',
    example: '14:30',
    description: 'Hours and minutes only',
    openehr: true,
    fhir: false,
    action:
      'FHIR `time` requires seconds. The value SHALL be completed to `14:30:00`, which ' +
      'adds a precision the source did not state.',
  },
  {
    kind: 'time',
    example: '14:30:00.123',
    description: 'Fractional seconds, 3 digits',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged.',
  },
  {
    kind: 'time',
    example: '14:30:00.123456789',
    description: 'Fractional seconds, up to 9 digits',
    openehr: false,
    fhir: true,
    action:
      'openEHR restricts fractional seconds to 3 digits. Excess precision SHALL be ' +
      'truncated when mapping FHIR → openEHR, and that is a **named drop**.',
  },
  {
    kind: 'time',
    example: '14:30:00+01:00',
    description: 'Time with a UTC offset',
    openehr: true,
    fhir: false,
    action:
      'FHIR `time` **cannot** carry a time zone. The offset SHALL be carried in the ' +
      '`timezone` extension on the element.',
  },
  {
    kind: 'dateTime',
    example: '2026-03-01T14:30:00Z',
    description: 'Full date and time in UTC',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged. A fully precise UTC value MAY use FHIR `instant`.',
  },
  {
    kind: 'dateTime',
    example: '20260301T143000Z',
    description: 'Full date and time, compact form',
    openehr: true,
    fhir: false,
    action: 'SHALL be expanded to the extended form before mapping to FHIR.',
  },
  {
    kind: 'dateTime',
    example: '2026-03-01T14:30:00+01:00',
    description: 'Full date and time with a UTC offset',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged. Unlike `time`, `dateTime` does carry an offset.',
  },
  {
    kind: 'dateTime',
    example: '2026-03-01T14:30',
    description: 'Date and time without seconds',
    openehr: true,
    fhir: false,
    action:
      'FHIR `dateTime` requires seconds once a time is present. The value SHALL be ' +
      'completed to `2026-03-01T14:30:00`, with a time zone, which adds precision the ' +
      'source did not state.',
  },
];

/** Forms both standards accept unchanged. */
export function sharedForms(): readonly Iso8601Form[] {
  return ISO8601_FORMS.filter((f) => f.openehr && f.fhir);
}

/** Forms one standard accepts and the other does not. */
export function divergentForms(): readonly Iso8601Form[] {
  return ISO8601_FORMS.filter((f) => f.openehr !== f.fhir);
}

/** Expand an openEHR compact date, time, or date-time into the FHIR extended form. */
export function expandCompact(value: string): string {
  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(.*)$/.exec(value);
  if (dateTime !== null) {
    const [, y, mo, d, h, mi, s, rest] = dateTime as unknown as string[];
    return `${y}-${mo}-${d}T${h}:${mi}:${s}${rest ?? ''}`;
  }
  const time = /^T(\d{2})(\d{2})(\d{2})(.*)$/.exec(value);
  if (time !== null) {
    const [, h, mi, s, rest] = time as unknown as string[];
    return `${h}:${mi}:${s}${rest ?? ''}`;
  }
  const fullDate = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (fullDate !== null) {
    const [, y, mo, d] = fullDate as unknown as string[];
    return `${y}-${mo}-${d}`;
  }
  const yearMonth = /^(\d{4})(\d{2})$/.exec(value);
  if (yearMonth !== null) {
    const [, y, mo] = yearMonth as unknown as string[];
    return `${y}-${mo}`;
  }
  return value;
}

/** Truncate fractional seconds to the three digits openEHR permits. */
export function truncateFractionalSeconds(value: string): {
  readonly value: string;
  readonly truncated: boolean;
} {
  const match = /^(.*\.\d{3})(\d+)(.*)$/.exec(value);
  if (match === null) return { value, truncated: false };
  const [, head, , tail] = match as unknown as string[];
  return { value: `${head ?? ''}${tail ?? ''}`, truncated: true };
}
