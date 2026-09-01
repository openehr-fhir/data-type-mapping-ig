/**
 * Temporal data: `DV_DATE`, `DV_TIME`, `DV_DATE_TIME`, and `DV_DURATION`.
 *
 * Both standards use ISO 8601, and **the two subsets are not the same subset**.
 * The comparison is published on [Cross-Cutting Concerns](cross-cutting.html),
 * rendered directly from `reference/src/shared/iso8601-subset.ts`, so the guide
 * and the code that implements the conversion cannot disagree.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const BASE = 'https://specifications.openehr.org/releases/BASE/latest/foundation_types.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';
const R5_OBS = 'https://hl7.org/fhir/R5/observation.html';
const EXT_PACK = 'https://hl7.org/fhir/extensions/StructureDefinition';

function rm(anchor: string, label: string): Cite {
  return { url: `${RM}#${anchor}`, label, verification: 'spec-local' };
}

function base(anchor: string, label: string): Cite {
  return { url: `${BASE}#${anchor}`, label, verification: 'spec-local' };
}

function r5(anchor: string, label: string): Cite {
  return { url: `${R5}#${anchor}`, label, verification: 'spec-local' };
}

function ext(name: string, label: string): Cite {
  return { url: `${EXT_PACK}-${name}.html`, label, verification: 'extension-unverified' };
}

const DV_DATE = rm('_dv_date_class', 'openEHR RM — DV_DATE');
const DV_TIME = rm('_dv_time_class', 'openEHR RM — DV_TIME');
const DV_DATE_TIME = rm('_dv_date_time_class', 'openEHR RM — DV_DATE_TIME');
const DV_DURATION = rm('_dv_duration_class', 'openEHR RM — DV_DURATION');
const DV_TEMPORAL = rm('_dv_temporal_class', 'openEHR RM — DV_TEMPORAL');
const ISO_TYPES = base('_date_time_package', 'openEHR BASE — ISO 8601 time types');
const FHIR_DATE = r5('date', 'FHIR R5 — date');
const FHIR_TIME = r5('time', 'FHIR R5 — time');
const FHIR_DATETIME = r5('dateTime', 'FHIR R5 — dateTime');
const FHIR_INSTANT = r5('instant', 'FHIR R5 — instant');
const FHIR_DURATION = r5('Duration', 'FHIR R5 — Duration');
const FHIR_TIMING = r5('Timing', 'FHIR R5 — Timing');

const REVIEWED_BOTH: Review = { openehr: ['Ciprian'], fhir: ['Gino'] };
const DURATION_REVIEW: Review = { openehr: ['Diego', 'Ian', 'Ciprian'], fhir: [] };
const NOT_REVIEWED: Review = { openehr: [], fhir: [] };

const dvDateToDate = {
  id: 'dv-date-to-date',
  category: 'temporal',
  openehrType: 'DV_DATE',
  fhirType: 'date | dateTime',
  title: 'DV_DATE ↔ date / dateTime',
  scope: 'datatype',
  sources: [DV_DATE, ISO_TYPES, FHIR_DATE],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-date.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_DATE.value',
        cardinality: '1..1',
        type: 'Iso8601_date',
        kind: 'element',
        cite: DV_DATE,
      },
      fhir: [
        {
          path: 'date',
          cardinality: '0..1',
          type: 'date',
          kind: 'element',
          when: 'the target element is typed `date`',
          cite: FHIR_DATE,
        },
        {
          path: 'dateTime',
          cardinality: '0..1',
          type: 'dateTime',
          kind: 'element',
          when: 'the target element is typed `dateTime` and carries only a date',
          cite: FHIR_DATETIME,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'openEHR permits **compact** forms (`20260301`, `202603`) and FHIR requires the ' +
        'extended form, so a compact value SHALL be expanded before mapping. Partial ' +
        'precision is preserved by **truncating** the FHIR lexical form, never padding it: ' +
        '`202604` becomes `2026-04`, not `2026-04-01`. Some FHIR resources split a date ' +
        'from its time — `Patient.birthDate` is a `date` with the time in the ' +
        '`patient-birthTime` extension — and a mapping engine has to know those patterns, ' +
        'because they are not derivable from the data type.',
    },
  ],
} satisfies Mapping;

const dvTimeToTime = {
  id: 'dv-time-to-time',
  category: 'temporal',
  openehrType: 'DV_TIME',
  fhirType: 'time',
  title: 'DV_TIME ↔ time',
  scope: 'datatype',
  sources: [DV_TIME, ISO_TYPES, FHIR_TIME],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-time.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_TIME.value',
        cardinality: '1..1',
        type: 'Iso8601_time',
        kind: 'element',
        cite: DV_TIME,
      },
      fhir: [
        {
          path: 'time.value',
          cardinality: '0..1',
          type: 'time',
          kind: 'element',
          cite: FHIR_TIME,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'time.value',
            reason:
              'FHIR permits up to **nine** fractional-second digits and openEHR restricts ' +
              'to **three**, so anything finer than a millisecond is truncated',
          },
        ],
      },
      maturity: 'settled',
      note:
        'FHIR `time` also requires seconds, so an openEHR `14:30` is completed to ' +
        '`14:30:00` — which states a precision the source did not.',
    },
    {
      id: 'dv-time.timezone',
      scope: 'datatype',
      openehr: {
        path: 'DV_TIME.value[timezone]',
        cardinality: '0..1',
        type: 'Iso8601_time',
        kind: 'element',
        cite: DV_TIME,
      },
      fhir: [
        {
          path: 'time.extension[timezone]',
          cardinality: '0..1',
          kind: 'extension',
          cite: ext('timezone', 'FHIR Extensions — timezone'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        '**FHIR `time` cannot carry a time zone**, while `dateTime` and `instant` can. ' +
        'Where an openEHR `DV_TIME` carries an offset it is moved into the `timezone` ' +
        'extension on the element and restored from there. openEHR data without a time ' +
        'zone is rare in practice.',
    },
  ],
} satisfies Mapping;

const dvDateTimeToDateTime = {
  id: 'dv-date-time-to-date-time',
  category: 'temporal',
  openehrType: 'DV_DATE_TIME',
  fhirType: 'dateTime | instant',
  title: 'DV_DATE_TIME ↔ dateTime / instant',
  scope: 'datatype',
  sources: [DV_DATE_TIME, DV_TEMPORAL, FHIR_DATETIME, FHIR_INSTANT],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-date-time.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_DATE_TIME.value',
        cardinality: '1..1',
        type: 'Iso8601_date_time',
        kind: 'element',
        cite: DV_DATE_TIME,
      },
      fhir: [
        {
          path: 'dateTime',
          cardinality: '0..1',
          type: 'dateTime',
          kind: 'element',
          when: 'the target element is typed `dateTime`',
          cite: FHIR_DATETIME,
        },
        {
          path: 'instant',
          cardinality: '0..1',
          type: 'instant',
          kind: 'element',
          when: 'the value is fully precise and the target element is typed `instant`',
          cite: FHIR_INSTANT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'Unlike `time`, `dateTime` carries a UTC offset directly. FHIR requires seconds ' +
        'once a time is present, so `2026-03-01T14:30` is completed to ' +
        '`2026-03-01T14:30:00` with a time zone.',
    },
    {
      id: 'dv-temporal.accuracy',
      scope: 'datatype',
      openehr: {
        path: 'DV_DATE_TIME.accuracy',
        cardinality: '0..1',
        type: 'DV_DURATION',
        kind: 'element',
        cite: DV_TEMPORAL,
      },
      fhir: {
        kind: 'none',
        reason:
          'No FHIR temporal primitive carries an accuracy. Precision is expressed by the ' +
          'lexical form itself, not by a separate field.',
        cite: FHIR_DATETIME,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Dropped. `accuracy` and `magnitude_status`, inherited from `DV_TEMPORAL` and ' +
          '`DV_QUANTIFIED`, have no FHIR home on a temporal primitive; where the source ' +
          'value is partial, that precision is preserved by truncating the lexical form ' +
          'instead.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives, because nothing was emitted.',
      },
      maturity: 'settled',
    },
  ],
} satisfies Mapping;

const dvDurationToDuration = {
  id: 'dv-duration-to-duration',
  category: 'temporal',
  openehrType: 'DV_DURATION',
  fhirType: 'Duration',
  title: 'DV_DURATION ↔ Duration',
  scope: 'datatype',
  sources: [DV_DURATION, FHIR_DURATION],
  review: DURATION_REVIEW,
  rows: [
    {
      id: 'dv-duration.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_DURATION.value',
        cardinality: '1..1',
        type: 'Iso8601_duration',
        kind: 'element',
        cite: DV_DURATION,
      },
      fhir: [
        {
          path: 'Duration.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: FHIR_DURATION,
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_DURATION.value',
            reason:
              'an ISO 8601 duration naming **more than one** component — `P1Y6M` — has no ' +
              'single UCUM unit, because the number of days in a month and in a year is ' +
              'not fixed; combining them would invent a precision the source does not have',
          },
        ],
      },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'A UCUM quantity carries one unit, so a single-component duration converts ' +
        'cleanly: `a` ↔ `P{n}Y`, `mo` ↔ `P{n}M`, `wk` ↔ `P{n}W`, `d` ↔ `P{n}D`, ' +
        '`h` ↔ `PT{n}H`, `min` ↔ `PT{n}M`, `s` ↔ `PT{n}S`, and `ms` ↔ `PT0.001S`. Note ' +
        'that `M` means *months* before the `T` separator and *minutes* after it. Even ' +
        'within UCUM, date and time conversions are not straightforward, and sub-millisecond ' +
        'precision may be lost. A standalone conversion library is planned by the working ' +
        'group; if one is published it supersedes the reference helper rather than ' +
        'conflicting with it.',
    },
    {
      id: 'dv-duration.units',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          'An ISO 8601 duration names its unit inside the value itself, so openEHR has no ' +
          'separate field for it.',
        cite: DV_DURATION,
      },
      fhir: [
        {
          path: 'Duration.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: FHIR_DURATION,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'No openEHR field produces it; the unit is derived from the ISO 8601 designator, ' +
          'and `Duration.system` is fixed to UCUM.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'The unit is folded back into the ISO 8601 lexical form rather than carried as a ' +
          'field of its own.',
      },
      maturity: 'settled',
    },
    {
      id: 'dv-duration.timing',
      scope: 'archetype',
      openehr: {
        path: 'DV_DURATION.value',
        cardinality: '1..1',
        type: 'Iso8601_duration',
        kind: 'element',
        cite: DV_DURATION,
      },
      fhir: [
        {
          path: 'Timing.repeat',
          cardinality: '0..1',
          kind: 'resource-element',
          cite: FHIR_TIMING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        '`archetype` scope. Complex scheduling — dosage and treatment plans — is handled ' +
        'in openEHR by a combination of four archetypes: **daily timing**, **non-daily ' +
        'timing**, **service direction**, and **therapeutic direction**, the last two ' +
        'differing only in whether the use is medication-related. The full timing and ' +
        'dosage mapping is acknowledged as **the hardest mapping problem** and is deferred ' +
        'to a dedicated archetype-level session, not least because both standards are ' +
        'changing: the R6 approach to `Timing` appears closer to the openEHR one.',
    },
  ],
} satisfies Mapping;

const dvTimeSpecificationNotDiscussed = {
  id: 'dv-time-specification-to-timing',
  category: 'temporal',
  openehrType: 'DV_GENERAL_TIME_SPECIFICATION / DV_PERIODIC_TIME_SPECIFICATION',
  fhirType: 'Timing',
  title: 'Time specifications ↔ Timing',
  scope: 'datatype',
  sources: [rm('_time_specification_package', 'openEHR RM — Time specification package'), FHIR_TIMING],
  review: NOT_REVIEWED,
  rows: [
    {
      id: 'dv-general-time-specification.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_GENERAL_TIME_SPECIFICATION.value',
        cardinality: '1..1',
        type: 'DV_PARSABLE',
        kind: 'element',
        cite: rm(
          '_dv_general_time_specification_class',
          'openEHR RM — DV_GENERAL_TIME_SPECIFICATION',
        ),
      },
      fhir: {
        kind: 'none',
        reason:
          'No FHIR target has been agreed. `Timing` is the obvious candidate, but the ' +
          'openEHR type wraps an HL7 v3 GTS expression, and nobody has examined how the two ' +
          'relate.',
        cite: FHIR_TIMING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason: '**Not yet discussed.** No mapping is asserted, because none has been agreed.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: '**Not yet discussed.**',
        owner: 'working-group',
      },
      maturity: 'not-discussed',
    },
    {
      id: 'dv-periodic-time-specification.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_PERIODIC_TIME_SPECIFICATION.value',
        cardinality: '1..1',
        type: 'DV_PARSABLE',
        kind: 'element',
        cite: rm(
          '_dv_periodic_time_specification_class',
          'openEHR RM — DV_PERIODIC_TIME_SPECIFICATION',
        ),
      },
      fhir: {
        kind: 'none',
        reason: 'No FHIR target has been agreed; see `DV_GENERAL_TIME_SPECIFICATION`.',
        cite: FHIR_TIMING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason: '**Not yet discussed.**',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: '**Not yet discussed.**',
        owner: 'working-group',
      },
      maturity: 'not-discussed',
    },
  ],
} satisfies Mapping;

export default [
  dvDateToDate,
  dvTimeToTime,
  dvDateTimeToDateTime,
  dvDurationToDuration,
  dvTimeSpecificationNotDiscussed,
] satisfies readonly Mapping[];

/** The `Observation` page, cited by the archetype-scope `Timing` row's neighbours. */
export const TEMPORAL_RESOURCE_CONTEXT: Cite = {
  url: R5_OBS,
  label: 'FHIR R5 — Observation',
  verification: 'spec-local',
};
