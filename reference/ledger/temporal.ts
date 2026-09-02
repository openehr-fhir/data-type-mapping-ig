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
const ISO_TYPES = base('_time_types', 'openEHR BASE — ISO 8601 time types');
const ISO_TIME_DEFINITIONS = base(
  '_time_definitions_class',
  'openEHR BASE — Time_Definitions (valid_iso8601_time, valid_iso8601_date_time)',
);
const ISO_DURATION_TYPE = base('_iso8601_duration_class', 'openEHR BASE — Iso8601_duration');
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
            path: 'time.value[fractional-seconds]',
            reason:
              'FHIR permits up to **nine** fractional-second digits and openEHR restricts ' +
              'to **three**, so anything finer than a millisecond is truncated',
          },
        ],
      },
      maturity: 'settled',
      note:
        'FHIR `time` also requires seconds, so an openEHR `14:30` is completed to ' +
        '`14:30:00`. That sub-case is a **named drop** in its own right and is stated on ' +
        'the row below, not folded into this one. What this row drops inbound is **only ' +
        'the sub-second precision beyond three digits**, not the value: the time of day ' +
        'itself carries in both directions.',
    },
    {
      id: 'dv-time.value.minute-precision',
      scope: 'datatype',
      openehr: {
        path: 'DV_TIME.value[minute-precision]',
        cardinality: '1..1',
        type: 'Iso8601_time',
        kind: 'element',
        cite: DV_TIME,
      },
      fhir: {
        kind: 'none',
        reason:
          'The FHIR R5 `time` regex makes seconds **mandatory**, so no FHIR lexical form ' +
          'records a time stated only to the minute. The value is completed to `:00`, and ' +
          'the fact that the source stopped at minutes has nowhere to live.',
        cite: FHIR_TIME,
      },
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_TIME.value[minute-precision]',
            reason:
              'an openEHR `14:30` is completed to `14:30:00`, so the FHIR value states a ' +
              'precision the source did not. This is the one case the guide\u2019s ' +
              '"truncate, never pad" rule cannot cover, because FHIR offers no shorter ' +
              '`time` form to truncate to',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives to map back: a completed `14:30:00` is indistinguishable from ' +
          'one the source stated in full.',
      },
      maturity: 'settled',
      note:
        'The sub-case is split out so the round-trip matrix can police it: the completion ' +
        'is reported at this path, and the parent `DV_TIME.value` row keeps its `lossless` ' +
        'claim for every value that already states seconds.',
    },
    {
      id: 'dv-time.value.hour-precision',
      scope: 'datatype',
      openehr: {
        path: 'DV_TIME.value[hour-precision]',
        cardinality: '1..1',
        type: 'Iso8601_time',
        kind: 'element',
        cite: ISO_TIME_DEFINITIONS,
      },
      fhir: {
        kind: 'none',
        reason:
          'The FHIR R5 `time` regex makes **both** minutes and seconds mandatory, so no ' +
          'FHIR lexical form records a time stated only to the hour. The value is ' +
          'completed to `:00:00`, and the fact that the source stopped at the hour has ' +
          'nowhere to live.',
        cite: FHIR_TIME,
      },
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_TIME.value[hour-precision]',
            reason:
              '`valid_iso8601_time` publishes `hh` as a partial form, so an openEHR `14` ' +
              'is a conformant `DV_TIME`. It is completed to `14:00:00`, so the FHIR ' +
              'value states **two** levels of precision the source did not — the minute ' +
              'and the second. As with minute precision, FHIR offers no shorter `time` ' +
              'form to truncate to',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives to map back: a completed `14:00:00` is indistinguishable from ' +
          'one the source stated in full.',
      },
      maturity: 'settled',
      note:
        'Hour precision is a **second** completion sub-case, not the minute one restated. ' +
        'The row above adds seconds to `14:30`; this row adds minutes *and* seconds to ' +
        '`14`, and the two drops are reported at different paths so a reader can tell how ' +
        'much precision the FHIR value claims that the source did not.',
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
      fhir: {
        kind: 'none',
        reason:
          '**FHIR `time` cannot carry a time zone**, and no extension can rescue it. The ' +
          '`timezone` extension does admit `time` as a context, but it declares ' +
          '`value[x]: code 1..1` with a **required** binding to ' +
          '`http://hl7.org/fhir/ValueSet/timezones`, whose codes are IANA zone names. ' +
          '`+01:00` is not a permissible code, and an IANA zone name is not an offset — ' +
          'one zone name denotes different offsets across daylight saving — so a ' +
          '`DV_TIME` offset cannot be carried through it and none is emitted.',
        cite: FHIR_TIME,
      },
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_TIME.value[timezone]',
            reason:
              'the time of day itself carries; the UTC offset does not, because no FHIR ' +
              '`time` element or extension has a home for one. Where the offset matters, ' +
              'the value belongs in a `dateTime`, which carries an offset directly',
          },
        ],
        
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives to map back, because nothing was emitted. An incoming FHIR ' +
          '`time` states no offset, so the local offset has to come from the enclosing ' +
          'resource or from deployment context.',
        owner: 'session:dv-time-offset',
      },
      maturity: 'open',
      note:
        '`dateTime` and `instant` **can** carry an offset, and a `DV_TIME` whose offset is ' +
        'clinically significant SHOULD be mapped to one of those rather than to `time`. ' +
        'openEHR data without a time zone is rare in practice, which is what makes this ' +
        'gap worth an open item rather than a footnote.',
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
        'Unlike `time`, `dateTime` carries a UTC offset directly, and its R5 regex admits ' +
        'partial precision down to the year, so `2026-03` is **truncated**, never padded. ' +
        'What the regex does *not* admit is a time without seconds; that sub-case is a ' +
        'named drop on the row below. R5 separately **requires** an offset once hours and ' +
        'minutes are present, so a source stating a time and no offset is **refused** ' +
        'rather than padded with `Z` — the row after next.',
    },
    {
      id: 'dv-date-time.value.minute-precision',
      scope: 'datatype',
      openehr: {
        path: 'DV_DATE_TIME.value[minute-precision]',
        cardinality: '1..1',
        type: 'Iso8601_date_time',
        kind: 'element',
        cite: DV_DATE_TIME,
      },
      fhir: {
        kind: 'none',
        reason:
          'The FHIR R5 `dateTime` regex makes seconds **mandatory** once a time is ' +
          'present, so no FHIR lexical form records a date-time stated only to the ' +
          'minute. The value is completed to `:00`, and the fact that the source stopped ' +
          'at minutes has nowhere to live.',
        cite: FHIR_DATETIME,
      },
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_DATE_TIME.value[minute-precision]',
            reason:
              'an openEHR `2026-03-01T14:30` is completed to `2026-03-01T14:30:00`, so ' +
              'the FHIR value states a precision the source did not. FHIR additionally ' +
              'requires a UTC offset alongside a time: that offset SHALL come from the ' +
              'source or its context and is **never invented** by a data-type conversion',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives to map back: a completed `…T14:30:00` is indistinguishable ' +
          'from one the source stated in full.',
      },
      maturity: 'settled',
      note:
        'Partial precision *above* the time — `2026`, `2026-03`, `2026-03-01` — is a ' +
        'different case entirely and is carried by truncation, losslessly, on the row ' +
        'above. Only the minute-without-seconds form has no FHIR representation.',
    },
    {
      id: 'dv-date-time.value.hour-precision',
      scope: 'datatype',
      openehr: {
        path: 'DV_DATE_TIME.value[hour-precision]',
        cardinality: '1..1',
        type: 'Iso8601_date_time',
        kind: 'element',
        cite: ISO_TIME_DEFINITIONS,
      },
      fhir: {
        kind: 'none',
        reason:
          'The FHIR R5 `dateTime` regex makes **both** minutes and seconds mandatory once ' +
          'a time is present, so no FHIR lexical form records a date-time stated only to ' +
          'the hour. The value is completed to `:00:00`, and the fact that the source ' +
          'stopped at the hour has nowhere to live.',
        cite: FHIR_DATETIME,
      },
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_DATE_TIME.value[hour-precision]',
            reason:
              '`valid_iso8601_date_time` publishes `YYYY-MM-DDThh` and `YYYYMMDDThh` as ' +
              'partial forms, so an openEHR `2026-03-01T14` is conformant. It is ' +
              'completed to `2026-03-01T14:00:00`, so the FHIR value states **two** ' +
              'levels of precision the source did not. FHIR additionally requires a UTC ' +
              'offset alongside a time: that offset SHALL come from the source or its ' +
              'context and is **never invented** by a data-type conversion, so a source ' +
              'stating neither an offset nor the minutes produces nothing at all',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives to map back: a completed `…T14:00:00` is indistinguishable ' +
          'from one the source stated in full.',
      },
      maturity: 'settled',
      note:
        'The drop is reported even when the offset rule then refuses the whole value, so ' +
        'a reader is told both things that are wrong with `2026-03-01T14` rather than ' +
        'only the first. Where the source *does* carry an offset, the completion happens ' +
        'and a `dateTime` is produced, exactly as for minute precision above.',
    },
    {
      id: 'dv-date-time.value.no-offset',
      scope: 'datatype',
      openehr: {
        path: 'DV_DATE_TIME.value[no-offset]',
        cardinality: '1..1',
        type: 'Iso8601_date_time',
        kind: 'element',
        cite: DV_DATE_TIME,
      },
      fhir: {
        kind: 'none',
        reason:
          'R5\u2019s published `dateTime` **regex** makes the zone group optional, so the ' +
          'lexical form is not what forbids this. The rule is the normative sentence ' +
          'beside it \u2014 *"If hours and minutes are specified, a timezone offset SHALL ' +
          'be populated"* \u2014 so a `DV_DATE_TIME` stating a time with no offset has no ' +
          'conformant FHIR `dateTime` to become.',
        cite: FHIR_DATETIME,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Nothing is produced. The offset has to come from the source or from the ' +
          'surrounding template, and a data-type conversion sees neither: padding with ' +
          '`Z` would state a time zone the source did not, and emitting the value without ' +
          'an offset would publish an invalid FHIR primitive as a faithful conversion.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives to map back, because nothing was emitted.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'This is a **narrative** rule, not a lexical one, which is why a regex-only reading ' +
        'of R5 misses it. Where the offset is known to the mapping engine \u2014 from the ' +
        'composition, the template, or deployment configuration \u2014 it SHOULD be applied ' +
        'before the data-type conversion runs, at which point the value takes the ordinary ' +
        '`DV_DATE_TIME.value` row above. openEHR data without a time zone is rare in ' +
        'practice, which is what keeps this an open item rather than a blocking gap.',
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
  sources: [DV_DURATION, ISO_DURATION_TYPE, FHIR_DURATION],
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
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'A UCUM quantity carries one unit, so a single-component duration converts ' +
        'cleanly: `a` ↔ `P{n}Y`, `mo` ↔ `P{n}M`, `wk` ↔ `P{n}W`, `d` ↔ `P{n}D`, ' +
        '`h` ↔ `PT{n}H`, `min` ↔ `PT{n}M`, and `s` ↔ `PT{n}S`. **Durations may be ' +
        'negative**, and the sign belongs *before* the `P`: openEHR\u2019s ' +
        '`Iso8601_duration` gives `-P3M` — an age of minus three months, for a very ' +
        'premature newborn — as its own example, while its `Years_valid` … ' +
        '`Seconds_valid` invariants require every individual component to be ' +
        'non-negative, so `P-3M` is not a legal openEHR duration. A negative ' +
        '`Duration.value` is legal FHIR; invariant `drt-1` constrains only the code. ' +
        'A millisecond-coded `Duration` is the one case that does **not** carry: it is ' +
        'the `Duration.value[ms]` row below, not this one. Note ' +
        'that `M` means *months* before the `T` separator and *minutes* after it. Even ' +
        'within UCUM, date and time conversions are not straightforward, and sub-millisecond ' +
        'precision may be lost. A standalone conversion library is planned by the working ' +
        'group; if one is published it supersedes the reference helper rather than ' +
        'conflicting with it.',
    },
    {
      id: 'fhir:duration.value.ms',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          'openEHR\u2019s `Iso8601_duration` has **no millisecond designator**. A ' +
          'millisecond-coded `Duration` therefore has no openEHR form that keeps the ' +
          'magnitude as stated: `5 ms` can only be written `PT0.005S`, which is a ' +
          'different number in a different unit.',
        cite: ISO_DURATION_TYPE,
      },
      fhir: [
        {
          path: 'Duration.value[ms]',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: FHIR_DURATION,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'No `DV_DURATION` produces a millisecond-coded `Duration`: with no `ms` ' +
          'designator to parse, an ISO 8601 duration always reads back as seconds.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'The magnitude is rescaled with the unit — `{value: 5, code: "ms"}` becomes ' +
          '`PT0.005S`, and reading that back gives `{value: 0.005, code: "s"}`. The ' +
          'duration is the same length of time and the **stated number is not the same ' +
          'number**, so the millisecond form itself does not survive.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'A **FHIR-sourced** gap, in the pattern of `Quantity.comparator[ad]` and ' +
        '`Attachment.size[overflow]`: the conversion still produces a `DV_DURATION`, and ' +
        'the row says the FHIR *feature* — a magnitude stated in milliseconds — has no ' +
        'openEHR form. It is deliberately **not** an openEHR-side path: nothing in ' +
        '`DV_DURATION` emits it, and declaring one would make every ordinary duration ' +
        'fixture report a loss it does not make.',
    },
    {
      id: 'dv-duration.value.multi-component',
      scope: 'datatype',
      openehr: {
        path: 'DV_DURATION.value[multi-component]',
        cardinality: '1..1',
        type: 'Iso8601_duration',
        kind: 'element',
        cite: DV_DURATION,
      },
      fhir: {
        kind: 'none',
        reason:
          'A FHIR `Duration` is a `Quantity`, and a `Quantity` carries **one** unit. An ' +
          'ISO 8601 duration naming more than one component — `P1Y6M` — has no single UCUM ' +
          'unit to be expressed in, because the number of days in a month and in a year is ' +
          'not fixed.',
        cite: FHIR_DURATION,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Nothing is produced. Combining the components would invent a precision the ' +
          'source does not have, and an empty `Duration` is an invalid instance claiming ' +
          'to be a partial success.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives, because nothing was emitted.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'Split out from the value row so the round-trip matrix polices it: a ' +
        'single-component duration converts cleanly and keeps its `lossless` claim, and ' +
        'this sub-case is where the conversion stops.',
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
      toFhir: { fidelity: 'unmapped', reason: 'Deferred; see below.', owner: 'working-group' },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Deferred; see below.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        '`archetype` scope. Complex scheduling — dosage and treatment plans — is handled ' +
        'in openEHR by a combination of four archetypes: **daily timing**, **non-daily ' +
        'timing**, **service direction**, and **therapeutic direction**, the last two ' +
        'differing only in whether the use is medication-related. The full timing and ' +
        'dosage mapping is acknowledged as **the hardest mapping problem** and is deferred ' +
        'to a dedicated archetype-level session, not least because both standards are ' +
        'changing: the R6 approach to `Timing` appears closer to the openEHR one. A row ' +
        'whose own note defers the work may not also claim `lossless`, so nothing is ' +
        'asserted in either direction — the same treatment ' +
        '`DV_GENERAL_TIME_SPECIFICATION` gets two rows below.',
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
