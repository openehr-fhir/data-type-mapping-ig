/**
 * Reference converters for the temporal category.
 *
 * The two genuinely algorithmic conversions live in `src/shared/`: the ISO 8601
 * ↔ UCUM duration table and the ISO 8601 subset comparison. These converters
 * are the mapping around them.
 */

import { register } from '../registry.ts';
import { issuesOf, resultFor, unmapped, type Issue, type MappingResult } from '../result.ts';
import { iso8601ToUcum, ucumToIso8601 } from '../shared/iso8601-ucum.ts';
import {
  completeSeconds,
  expandCompact,
  hasTimeWithoutOffset,
  truncateFractionalSeconds,
} from '../shared/iso8601-subset.ts';
import type {
  DvDate,
  DvDateTime,
  DvDuration,
  DvTime,
} from '../types/openehr/temporal.ts';
import {
  type FhirDate,
  type FhirDateTime,
  type FhirDuration,
  type FhirTimeElement,
} from '../types/fhir/temporal.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const TEMPORAL_PATH = {
  timeValue: 'time.value[fractional-seconds]',
  dateTimeFractional: 'dateTime[fractional-seconds]',
  temporalAccuracy: 'DV_DATE_TIME.accuracy',
  durationValue: 'DV_DURATION.value',
  durationCode: 'Duration.code',
  timeMinutePrecision: 'DV_TIME.value[minute-precision]',
  timeHourPrecision: 'DV_TIME.value[hour-precision]',
  dateTimeMinutePrecision: 'DV_DATE_TIME.value[minute-precision]',
  dateTimeHourPrecision: 'DV_DATE_TIME.value[hour-precision]',
  dateTimeNoOffset: 'DV_DATE_TIME.value[no-offset]',
  durationValueAbsent: 'Duration.value[absent]',
  durationCodeAbsent: 'Duration.code[absent]',
  timeOffset: 'DV_TIME.value[timezone]',
  timeValueAbsent: 'time.value[absent]',
  durationMultiComponent: 'DV_DURATION.value[multi-component]',
} as const;

/** Why a completed value is a drop, in the words the ledger row uses. */
const COMPLETED_SECONDS =
  'the source stated minute precision and the FHIR lexical form requires seconds, so ' +
  '`:00` is added and the FHIR value claims a precision the source did not state. This ' +
  'is the one case the guide\u2019s "truncate, never pad" rule cannot cover, because ' +
  'FHIR has no shorter form to truncate to';

/** The same rule at the hour, where **two** levels of precision are added. */
const COMPLETED_HOUR =
  'the source stated hour precision \u2014 a partial form `valid_iso8601_time` and ' +
  '`valid_iso8601_date_time` both publish \u2014 and the FHIR lexical form requires ' +
  'minutes and seconds, so `:00:00` is added and the FHIR value claims two levels of ' +
  'precision the source did not state. As with minute precision, FHIR has no shorter ' +
  'form to truncate to';

function compact<T extends object>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[key] = v;
  }
  return out as T;
}

// ── DV_DATE ↔ date ───────────────────────────────────────────────────────────

export function dvDateToDate(source: DvDate): MappingResult<FhirDate> {
  return resultFor(expandCompact(source.value, 'date'), []);
}

export function dateToDvDate(source: FhirDate): MappingResult<DvDate> {
  return resultFor({ _type: 'DV_DATE' as const, value: source }, []);
}

register<DvDate, FhirDate>('dv-date-to-date', {
  toFhir: dvDateToDate,
  toOpenehr: dateToDvDate,
});

// ── DV_TIME ↔ time ───────────────────────────────────────────────────────────

/** `14:30:00+01:00` → `{ time: '14:30:00', offset: '+01:00' }`. */
function splitOffset(value: string): { readonly time: string; readonly offset?: string } {
  const match = /^(.*?)(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (match === null) return { time: value };
  return { time: match[1] as string, offset: match[2] as string };
}

export function dvTimeToTime(source: DvTime): MappingResult<FhirTimeElement> {
  const issues: Issue[] = [];
  const completed = completeSeconds(expandCompact(source.value, 'time'));
  if (completed.completed === 'minute') {
    issues.push({ path: TEMPORAL_PATH.timeMinutePrecision, message: COMPLETED_SECONDS });
  } else if (completed.completed === 'hour') {
    issues.push({ path: TEMPORAL_PATH.timeHourPrecision, message: COMPLETED_HOUR });
  }

  const { time, offset } = splitOffset(completed.value);
  if (offset !== undefined) {
    // The `timezone` extension is a `code` **required**-bound to the IANA zone
    // names, and an offset is not a zone name, so nothing in FHIR can carry it
    // on a `time`. The offset is dropped, and said to be dropped.
    issues.push({
      path: TEMPORAL_PATH.timeOffset,
      message:
        'FHIR time has no home for a UTC offset: the timezone extension is a code bound ' +
        'to the IANA zone names, and an offset is not a zone name, so the offset is not ' +
        'carried at all',
    });
  }
  return resultFor(compact({ value: time }), issues);
}

export function timeToDvTime(source: FhirTimeElement): MappingResult<DvTime> {
  // `DV_TIME.value` is mandatory (1..1) while a FHIR primitive element may carry
  // extensions and no value at all. The empty string is not a time, so nothing
  // is produced rather than an invalid `DV_TIME` reported `lossless` —
  // `stringToDvText` refuses the same shape on the same ground.
  if (source.value === undefined) {
    return unmapped([
      {
        path: TEMPORAL_PATH.timeValueAbsent,
        message:
          'DV_TIME.value is mandatory (1..1) and this time element carries no value, only ' +
          'extensions; the mandatory-attribute rule forbids inventing one, so nothing is ' +
          'produced',
      },
    ]);
  }

  const issues: Issue[] = [];
  const { value, truncated } = truncateFractionalSeconds(source.value);

  if (truncated) {
    issues.push({
      path: TEMPORAL_PATH.timeValue,
      message:
        'FHIR permits up to nine fractional-second digits and openEHR restricts to three, ' +
        'so anything finer than a millisecond is truncated',
    });
  }

  return resultFor({ _type: 'DV_TIME' as const, value }, issues);
}

register<DvTime, FhirTimeElement>('dv-time-to-time', {
  toFhir: dvTimeToTime,
  toOpenehr: timeToDvTime,
});

// ── DV_DATE_TIME ↔ dateTime ──────────────────────────────────────────────────

export function dvDateTimeToDateTime(source: DvDateTime): MappingResult<FhirDateTime> {
  const issues: Issue[] = [];

  if (source.accuracy !== undefined) {
    issues.push({
      path: TEMPORAL_PATH.temporalAccuracy,
      message:
        'no FHIR temporal primitive carries an accuracy; precision is expressed by ' +
        'the lexical form itself, not by a separate field',
    });
  }

  const completed = completeSeconds(expandCompact(source.value, 'dateTime'));
  if (completed.completed === 'minute') {
    issues.push({ path: TEMPORAL_PATH.dateTimeMinutePrecision, message: COMPLETED_SECONDS });
  } else if (completed.completed === 'hour') {
    issues.push({ path: TEMPORAL_PATH.dateTimeHourPrecision, message: COMPLETED_HOUR });
  }

  // R5 requires a `dateTime` carrying hours and minutes to state a UTC offset.
  // A data-type conversion never sees the source system or the enclosing
  // template that could supply one, so it has nothing to populate the offset
  // from: returning the value anyway would publish an invalid FHIR primitive as
  // a faithful conversion, and adding `Z` would state a time zone the source
  // did not.
  if (hasTimeWithoutOffset(completed.value)) {
    return unmapped([
      {
        path: TEMPORAL_PATH.dateTimeNoOffset,
        message:
          'FHIR R5 requires a UTC offset once a dateTime states hours and minutes, and ' +
          'the offset can only come from the source or its surrounding template, neither ' +
          'of which a data-type conversion sees; nothing is produced rather than an ' +
          'offset being invented',
      },
      ...issues,
    ]);
  }

  return resultFor(completed.value, issues);
}

export function dateTimeToDvDateTime(source: FhirDateTime): MappingResult<DvDateTime> {
  // Same precision rule as `timeToDvTime`: FHIR permits up to nine fractional-
  // second digits and openEHR's `Iso8601_date_time` restricts to three. Excess
  // precision is truncated and named, not passed through as a lossless claim.
  const issues: Issue[] = [];
  const { value, truncated } = truncateFractionalSeconds(source);

  if (truncated) {
    issues.push({
      path: TEMPORAL_PATH.dateTimeFractional,
      message:
        'FHIR permits up to nine fractional-second digits and openEHR restricts to three, ' +
        'so anything finer than a millisecond is truncated',
    });
  }

  return resultFor({ _type: 'DV_DATE_TIME' as const, value }, issues);
}

register<DvDateTime, FhirDateTime>('dv-date-time-to-date-time', {
  toFhir: dvDateTimeToDateTime,
  toOpenehr: dateTimeToDvDateTime,
});

// ── DV_DURATION ↔ Duration ───────────────────────────────────────────────────

export function dvDurationToDuration(source: DvDuration): MappingResult<FhirDuration> {
  const converted = iso8601ToUcum(source.value);
  if (converted.value === undefined) {
    // An empty `Duration` labelled `lossy` is an invalid FHIR instance claiming
    // to be a partial success. Nothing is produced instead, and the helper's own
    // diagnostic — which names *why* the duration has no single UCUM unit — is
    // carried rather than replaced by a generic message. The path is the
    // sub-case the ledger declares, not the whole value: a single-component
    // duration converts cleanly and that row stays `lossless`.
    const messages = converted.issues.map((issue) => issue.message);
    return unmapped([
      {
        path: TEMPORAL_PATH.durationMultiComponent,
        message:
          messages.length > 0
            ? messages.join('; ')
            : 'the duration has no single UCUM unit, so no FHIR Duration is produced',
      },
    ]);
  }
  return resultFor(
    {
      value: converted.value.value,
      system: converted.value.system,
      code: converted.value.code,
    },
    [],
  );
}

export function durationToDvDuration(source: FhirDuration): MappingResult<DvDuration> {
  // The unit is always folded back into the ISO 8601 lexical form rather than
  // carried as a field of its own, which is what the ledger row records. This
  // issue is `dv-duration.units`' declared drop and survives on every success
  // path.
  const unitFolded: Issue = {
    path: TEMPORAL_PATH.durationCode,
    message:
      'the UCUM unit is folded back into the ISO 8601 lexical form rather than carried ' +
      'as a field of its own',
  };

  if (source.code === undefined) {
    return unmapped([
      {
        path: TEMPORAL_PATH.durationCodeAbsent,
        message:
          'DV_DURATION.value is mandatory (1..1) and carries its unit inside the lexical ' +
          'form, so a Duration with no code names no unit to write; PT0S is a real ' +
          'duration, not a missing one, and is not invented here',
      },
    ]);
  }

  if (source.value === undefined) {
    return unmapped([
      {
        path: TEMPORAL_PATH.durationValueAbsent,
        message:
          'DV_DURATION.value is mandatory (1..1) and a Duration with no value names no ' +
          'magnitude to write; 0 is a real duration, not a missing one',
      },
    ]);
  }

  const iso = ucumToIso8601({
    value: source.value,
    code: source.code,
    system: 'http://unitsofmeasure.org',
  });

  if (iso.value === undefined) {
    return unmapped([
      {
        path: TEMPORAL_PATH.durationCode,
        message: 'the unit has no ISO 8601 form, so no DV_DURATION is produced',
      },
      ...issuesOf(iso),
    ]);
  }

  return resultFor({ _type: 'DV_DURATION' as const, value: iso.value }, [
    unitFolded,
    ...issuesOf(iso),
  ]);
}

register<DvDuration, FhirDuration>('dv-duration-to-duration', {
  toFhir: dvDurationToDuration,
  toOpenehr: durationToDvDuration,
});
