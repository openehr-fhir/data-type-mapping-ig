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
      'adds a precision the source did not state and is a **named drop**.',
  },
  {
    kind: 'time',
    example: 'T1430',
    description: 'Compact time, hours and minutes only',
    openehr: true,
    fhir: false,
    action:
      'SHALL be expanded to `14:30` and then completed to `14:30:00`. Neither the compact ' +
      'form nor a seconds-less time is a FHIR `time`, and the completion adds a precision ' +
      'the source did not state, so it is a **named drop**.',
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
      'FHIR `time` **cannot** carry a time zone, and no extension rescues it: the ' +
      '`timezone` extension is a `code` required-bound to the IANA zone names, and a UTC ' +
      'offset is neither a zone name nor derivable from one. The time of day is carried ' +
      'and the offset is a **named drop**. Where the offset matters, the value SHOULD be ' +
      'mapped to a `dateTime`, which carries one directly.',
  },
  {
    kind: 'time',
    example: 'T143000+0100',
    description: 'Compact time with a compact UTC offset',
    openehr: true,
    fhir: false,
    action:
      'SHALL be expanded to `14:30:00+01:00` before the offset is separated from the ' +
      'time; FHIR accepts neither the compact time nor the compact offset, and then has ' +
      'no home for the offset at all.',
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
      'completed to `2026-03-01T14:30:00`, which adds a precision the source did not ' +
      'state and is a **named drop**. FHIR additionally requires a UTC offset alongside ' +
      'the time: that offset SHALL come from the source or its context and is never ' +
      'invented by a data-type conversion.',
  },
  {
    kind: 'dateTime',
    example: '20260301T1430',
    description: 'Compact date and time without seconds',
    openehr: true,
    fhir: false,
    action:
      'SHALL be expanded to `2026-03-01T14:30` and then completed to ' +
      '`2026-03-01T14:30:00`, which is a **named drop**. This form also states no UTC ' +
      'offset, which FHIR requires once hours and minutes are present and which a ' +
      'data-type conversion never invents, so nothing is produced from it.',
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

/** `+0100` → `+01:00`. An already-extended or absent offset is returned unchanged. */
function expandCompactOffset(value: string): string {
  return value.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3');
}

/**
 * Expand an openEHR compact date, time, or date-time into the FHIR extended form.
 *
 * The time groups accept `hhmm` as well as `hhmmss`, because openEHR permits a
 * compact minute-precision time and `completeSeconds` — which requires the
 * extended `hh:mm` — is what supplies the seconds afterwards. **Hour-only
 * compact (`T14`) is deliberately out of scope:** `ISO8601_FORMS` has no
 * hour-only row, and expanding one here would implement a rule the guide does
 * not publish.
 */
export function expandCompact(input: string): string {
  const value = expandCompactOffset(input);
  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(.*)$/.exec(value);
  if (dateTime !== null) {
    const [, y, mo, d, h, mi, s, rest] = dateTime as unknown as (string | undefined)[];
    const seconds = s === undefined ? '' : `:${s}`;
    return `${y}-${mo}-${d}T${h}:${mi}${seconds}${rest ?? ''}`;
  }
  const time = /^T(\d{2})(\d{2})(\d{2})?(.*)$/.exec(value);
  if (time !== null) {
    const [, h, mi, s, rest] = time as unknown as (string | undefined)[];
    const seconds = s === undefined ? '' : `:${s}`;
    return `${h}:${mi}${seconds}${rest ?? ''}`;
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

/**
 * Complete a minute-precision time or date-time to the seconds FHIR requires.
 *
 * The FHIR R5 `time` regex makes seconds mandatory, and `dateTime` makes them
 * mandatory once a time is present. openEHR permits both without. Completion is
 * therefore **not** a truncation of partial precision — it is the one place the
 * guide's "truncate, never pad" rule cannot apply, because there is no shorter
 * FHIR form to truncate to. The caller reports the added precision as a named
 * drop; nothing else is invented, and in particular no UTC offset is supplied.
 */
export function completeSeconds(value: string): {
  readonly value: string;
  readonly completed: boolean;
} {
  const match = /^(\d{4}-\d{2}-\d{2}T)?(\d{2}:\d{2})(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (match === null) return { value, completed: false };
  const [, date, hourMinute, zone] = match as unknown as (string | undefined)[];
  return { value: `${date ?? ''}${hourMinute ?? ''}:00${zone ?? ''}`, completed: true };
}

/** Truncate fractional seconds to the three digits openEHR permits. */export function truncateFractionalSeconds(value: string): {
  readonly value: string;
  readonly truncated: boolean;
} {
  const match = /^(.*\.\d{3})(\d+)(.*)$/.exec(value);
  if (match === null) return { value, truncated: false };
  const [, head, , tail] = match as unknown as string[];
  return { value: `${head ?? ''}${tail ?? ''}`, truncated: true };
}

/**
 * True when a `dateTime` lexical form states a time of day and no UTC offset.
 *
 * **The lexical form is not what forbids this.** R5's published `dateTime`
 * regex makes the zone group optional; the rule is the normative sentence
 * beside it — *"If hours and minutes are specified, a timezone offset SHALL be
 * populated"* (`datatypes.html`). The offset has to come from the source or
 * from the enclosing template, and a data-type conversion sees neither, so the
 * caller refuses rather than inventing `Z`.
 */
export function hasTimeWithoutOffset(value: string): boolean {
  if (!/T\d{2}:\d{2}/.test(value)) return false;
  return !/(Z|[+-]\d{2}:\d{2})$/.test(value);
}
