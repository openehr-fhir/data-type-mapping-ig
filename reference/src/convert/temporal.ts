/**
 * Reference converters for the temporal category.
 *
 * The two genuinely algorithmic conversions live in `src/shared/`: the ISO 8601
 * ↔ UCUM duration table and the ISO 8601 subset comparison. These converters
 * are the mapping around them.
 */

import { register } from '../registry.ts';
import { resultFor, type Issue, type MappingResult } from '../result.ts';
import { iso8601ToUcum, ucumToIso8601 } from '../shared/iso8601-ucum.ts';
import { expandCompact, truncateFractionalSeconds } from '../shared/iso8601-subset.ts';
import type {
  DvDate,
  DvDateTime,
  DvDuration,
  DvTime,
} from '../types/openehr/temporal.ts';
import {
  TIMEZONE_EXTENSION,
  type Extension,
  type FhirDate,
  type FhirDateTime,
  type FhirDuration,
  type FhirTimeElement,
} from '../types/fhir/temporal.ts';

/** Drop and unmapped paths, named once so the ledger and the code cannot drift. */
export const TEMPORAL_PATH = {
  timeValue: 'time.value',
  temporalAccuracy: 'DV_DATE_TIME.accuracy',
  durationValue: 'DV_DURATION.value',
  durationCode: 'Duration.code',
} as const;

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
  return resultFor(expandCompact(source.value), []);
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
  const { time, offset } = splitOffset(expandCompact(source.value));
  const extension: Extension[] =
    offset === undefined ? [] : [{ url: TIMEZONE_EXTENSION, valueString: offset }];
  return resultFor(compact({ value: time, extension }), []);
}

export function timeToDvTime(source: FhirTimeElement): MappingResult<DvTime> {
  const issues: Issue[] = [];
  const raw = source.value ?? '';
  const { value, truncated } = truncateFractionalSeconds(raw);

  if (truncated) {
    issues.push({
      path: TEMPORAL_PATH.timeValue,
      message:
        'FHIR permits up to nine fractional-second digits and openEHR restricts to three, ' +
        'so anything finer than a millisecond is truncated',
    });
  }

  const offset = source.extension?.find((e) => e.url === TIMEZONE_EXTENSION)?.valueString;
  return resultFor(
    { _type: 'DV_TIME' as const, value: offset === undefined ? value : `${value}${offset}` },
    issues,
  );
}

register<DvTime, FhirTimeElement>('dv-time-to-time', {
  toFhir: dvTimeToTime,
  toOpenehr: timeToDvTime,
});

// ── DV_DATE_TIME ↔ dateTime ──────────────────────────────────────────────────

export function dvDateTimeToDateTime(source: DvDateTime): MappingResult<FhirDateTime> {
  const issues: Issue[] =
    source.accuracy === undefined
      ? []
      : [
          {
            path: TEMPORAL_PATH.temporalAccuracy,
            message:
              'no FHIR temporal primitive carries an accuracy; precision is expressed by ' +
              'the lexical form itself, not by a separate field',
          },
        ];
  return resultFor(expandCompact(source.value), issues);
}

export function dateTimeToDvDateTime(source: FhirDateTime): MappingResult<DvDateTime> {
  return resultFor({ _type: 'DV_DATE_TIME' as const, value: source }, []);
}

register<DvDateTime, FhirDateTime>('dv-date-time-to-date-time', {
  toFhir: dvDateTimeToDateTime,
  toOpenehr: dateTimeToDvDateTime,
});

// ── DV_DURATION ↔ Duration ───────────────────────────────────────────────────

export function dvDurationToDuration(source: DvDuration): MappingResult<FhirDuration> {
  const converted = iso8601ToUcum(source.value);
  if (converted.value === undefined) {
    return {
      value: {},
      fidelity: 'lossy',
      issues: converted.issues.map((issue) => ({
        path: TEMPORAL_PATH.durationValue,
        message: issue.message,
      })),
    };
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
  // carried as a field of its own, which is what the ledger row records.
  const issues: Issue[] = [
    {
      path: TEMPORAL_PATH.durationCode,
      message:
        'the UCUM unit is folded back into the ISO 8601 lexical form rather than carried ' +
        'as a field of its own',
    },
  ];

  if (source.code === undefined) {
    return { value: { _type: 'DV_DURATION' as const, value: 'PT0S' }, fidelity: 'lossy', issues };
  }

  const iso = ucumToIso8601({
    value: source.value ?? 0,
    code: source.code,
    system: 'http://unitsofmeasure.org',
  });

  if (iso.value === undefined) {
    return {
      value: { _type: 'DV_DURATION' as const, value: 'PT0S' },
      fidelity: 'lossy',
      issues,
    };
  }

  return { value: { _type: 'DV_DURATION' as const, value: iso.value }, fidelity: 'lossy', issues };
}

register<DvDuration, FhirDuration>('dv-duration-to-duration', {
  toFhir: dvDurationToDuration,
  toOpenehr: durationToDvDuration,
});
