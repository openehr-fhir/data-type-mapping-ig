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
    example: '143000',
    description: 'Full time, compact form',
    openehr: true,
    fhir: false,
    action:
      'SHALL be expanded to `14:30:00`. openEHR writes a compact time as `hhmmss`, with ' +
      'no `T` designator — `T` separates the date from the time in a *date-time* and ' +
      'nowhere else — and FHIR `time` accepts only the extended form.',
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
    example: '1430',
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
    example: '14',
    description: 'Hours only, compact form',
    openehr: true,
    fhir: false,
    action:
      'SHALL be completed to `14:00:00`. `valid_iso8601_time` publishes `hh` as a partial ' +
      'form and FHIR `time` requires both minutes and seconds, so the completion adds two ' +
      'levels of precision the source did not state and is a **named drop** of its own.',
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
    example: '143000+0100',
    description: 'Compact time with a compact UTC offset',
    openehr: true,
    fhir: false,
    action:
      'SHALL be expanded to `14:30:00+01:00` before the offset is separated from the ' +
      'time; FHIR accepts neither the compact time nor the compact offset, and then has ' +
      'no home for the offset at all.',
  },
  {
    kind: 'time',
    example: '143000+01',
    description: 'Compact time with an hours-only UTC offset',
    openehr: true,
    fhir: false,
    action:
      '`valid_iso8601_time` writes the compact offset as `\u00b1hh[mm]`, so the minutes ' +
      'are optional. The value SHALL be expanded to `14:30:00+01:00` before the offset is ' +
      'separated; the offset then has no home on a FHIR `time` and is a **named drop**.',
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
    example: '2026-03-01T14:30:00.123Z',
    description: 'Fractional seconds, 3 digits',
    openehr: true,
    fhir: true,
    action: 'Carried unchanged.',
  },
  {
    kind: 'dateTime',
    example: '2026-03-01T14:30:00.123456789Z',
    description: 'Fractional seconds, up to 9 digits',
    openehr: false,
    fhir: true,
    action:
      'openEHR restricts fractional seconds to 3 digits. Excess precision SHALL be ' +
      'truncated when mapping FHIR → openEHR, and that is a **named drop**. The same ' +
      'rule applies to `time`; `dateTime` is not exempt.',
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
  {
    kind: 'dateTime',
    example: '2026-03-01T14',
    description: 'Date and time to the hour only',
    openehr: true,
    fhir: false,
    action:
      '`valid_iso8601_date_time` publishes `YYYY-MM-DDThh` as a partial form. FHIR ' +
      'requires seconds once a time is present, so the value SHALL be completed to ' +
      '`2026-03-01T14:00:00` and that completion is a **named drop**. The completed value ' +
      'states hours and minutes and no UTC offset, which FHIR also requires and which a ' +
      'data-type conversion never invents, so nothing is produced from it.',
  },
  {
    kind: 'dateTime',
    example: '20260301T14',
    description: 'Compact date and time to the hour only',
    openehr: true,
    fhir: false,
    action:
      'SHALL be expanded to `2026-03-01T14` and then completed to `2026-03-01T14:00:00`, ' +
      'which is a **named drop**. As with the extended form, the completed value states ' +
      'no UTC offset and nothing is produced from it.',
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

/**
 * Normalise a compact UTC offset to the extended form FHIR uses.
 *
 * `valid_iso8601_time` writes the compact offset as `±hh[mm]`, so both `+0100`
 * and `+01` are openEHR-legal and neither is a FHIR offset. An already-extended
 * or absent offset is returned unchanged.
 *
 * **Only ever applied to a time**, or to the time half of a date-time. A bare
 * date ends in `-DD`, which is indistinguishable from an hours-only offset, so
 * `expandCompact` dispatches on the temporal kind before this is reached.
 */
function expandCompactOffset(value: string): string {
  const withMinutes = value.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3');
  return withMinutes.replace(/([+-])(\d{2})$/, '$1$2:00');
}

/** `20260301` → `2026-03-01`, `202603` → `2026-03`; anything else is unchanged. */
function expandCompactDate(value: string): string {
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
 * `143000` → `14:30:00`, `1430` → `14:30`, `14` → `14`, with the offset
 * expanded first so `143000+01` becomes `14:30:00+01:00`.
 *
 * An already-extended time contains `:` where a compact one has a digit, so the
 * leading-digits match simply stops after the hours and the value is returned
 * unchanged.
 */
function expandCompactTime(value: string): string {
  const expanded = expandCompactOffset(value);
  const compact = /^(\d{2})(\d{2})?(\d{2})?([.,]\d+)?(.*)$/.exec(expanded);
  if (compact === null) return expanded;
  const [, h, mi, s, fraction, rest] = compact as unknown as (string | undefined)[];
  if (h === undefined) return expanded;
  const minutes = mi === undefined ? '' : `:${mi}`;
  const seconds = s === undefined ? '' : `:${s}`;
  return `${h}${minutes}${seconds}${fraction ?? ''}${rest ?? ''}`;
}

/**
 * Expand an openEHR compact date, time, or date-time into the FHIR extended form.
 *
 * **The temporal kind is a parameter, not a guess.** openEHR's compact forms are
 * genuinely ambiguous out of context: `143000` and `202603` are the same six
 * digits, and `1430` and `2026` the same four. `valid_iso8601_time` puts no `T`
 * designator on a standalone time — `T` separates the date from the time in
 * `valid_iso8601_date_time` and nowhere else — so there is nothing in the
 * lexical form to dispatch on. Every caller already knows which openEHR type it
 * holds, and passes it.
 *
 * Hour-only forms are **in** scope: `valid_iso8601_time` publishes `hh` and
 * `valid_iso8601_date_time` publishes `YYYY-MM-DDThh` and `YYYYMMDDThh`. They
 * are expanded here and completed by `completeSeconds`, which names the added
 * precision as a drop of its own.
 */
export function expandCompact(input: string, kind: TemporalKind): string {
  if (kind === 'date') return expandCompactDate(input);
  if (kind === 'time') return expandCompactTime(input);

  const separator = input.indexOf('T');
  // A `DV_DATE_TIME` may state precision above the time — `2026`, `2026-03`,
  // `20260301` — in which case there is no time half to expand.
  if (separator < 0) return expandCompactDate(input);
  return `${expandCompactDate(input.slice(0, separator))}T${expandCompactTime(
    input.slice(separator + 1),
  )}`;
}

/** Which precision a completion supplied, or `none` when nothing was completed. */
export type SecondsCompletion = 'none' | 'minute' | 'hour';

/**
 * Complete a minute- or hour-precision time or date-time to the seconds FHIR
 * requires.
 *
 * The FHIR R5 `time` regex makes seconds mandatory, and `dateTime` makes them
 * mandatory once a time is present. openEHR permits `hh:mm` and `hh` in both.
 * Completion is therefore **not** a truncation of partial precision — it is the
 * one place the guide's "truncate, never pad" rule cannot apply, because there
 * is no shorter FHIR form to truncate to. The caller reports the added
 * precision as a named drop, and `completed` says **which** drop: an hour-only
 * source loses two levels of precision, not one, and the two are separate rows.
 * Nothing else is invented, and in particular no UTC offset is supplied.
 */
export function completeSeconds(value: string): {
  readonly value: string;
  readonly completed: SecondsCompletion;
} {
  const match = /^(\d{4}-\d{2}-\d{2}T)?(\d{2})(:\d{2})?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (match === null) return { value, completed: 'none' };
  const [, date, hour, minute, zone] = match as unknown as (string | undefined)[];
  if (hour === undefined) return { value, completed: 'none' };
  return {
    value: `${date ?? ''}${hour}${minute ?? ':00'}:00${zone ?? ''}`,
    completed: minute === undefined ? 'hour' : 'minute',
  };
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
 *
 * Both halves are deliberately wider than the extended forms: openEHR states a
 * partial date-time as `…Thh` as well as `…Thh:mm`, and writes a compact offset
 * as `±hh` as well as `±hhmm`, so a narrower test would read a stated offset as
 * absent and an hour-only time as no time at all.
 */
export function hasTimeWithoutOffset(value: string): boolean {
  if (!/T\d{2}/.test(value)) return false;
  return !/(Z|[+-]\d{2}(:?\d{2})?)$/.test(value);
}
