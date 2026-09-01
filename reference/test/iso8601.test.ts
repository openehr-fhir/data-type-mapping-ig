import test from 'node:test';
import assert from 'node:assert/strict';

import { DURATION_UNITS, iso8601ToUcum, ucumToIso8601 } from '../src/shared/iso8601-ucum.ts';
import {
  ISO8601_FORMS,
  completeSeconds,
  divergentForms,
  expandCompact,
  sharedForms,
  truncateFractionalSeconds,
} from '../src/shared/iso8601-subset.ts';
import { converterFor } from '../src/convert/index.ts';
import type { Issue } from '../src/result.ts';

/**
 * Both helper tables, pinned entry by entry.
 *
 * The subset table is rendered into `cross-cutting.html`, so a change here is a
 * change to the published guide, and the drift gate catches it.
 *
 * The table's own doc comment claims `action` "is the same rule the converters
 * implement". The example-driven suite at the bottom of this file is what makes
 * that claim checkable rather than decorative.
 */

test('every UCUM duration unit except ms converts to ISO 8601 and back', () => {
  for (const unit of DURATION_UNITS) {
    // `ms` is the documented asymmetry and is asserted separately below; it is
    // excluded here rather than skipped silently.
    if (unit.ucum === 'ms') continue;
    const iso = ucumToIso8601({ value: 3, code: unit.ucum, system: 'http://unitsofmeasure.org' });
    assert.equal(iso.fidelity, 'lossless', `${unit.ucum} claims a loss it does not make`);
    assert.ok(iso.value, `no ISO form for ${unit.ucum}`);
    const back = iso8601ToUcum(iso.value);
    assert.equal(back.value?.code, unit.ucum, `${unit.ucum} did not round-trip via ${iso.value}`);
    assert.equal(back.value?.value, 3);
  }
});

test('ms is the one unit that does not survive the return trip, and says so', () => {
  const iso = ucumToIso8601({ value: 250, code: 'ms', system: 'http://unitsofmeasure.org' });
  assert.equal(iso.value, 'PT0.25S');
  assert.equal(iso.fidelity, 'lossy', 'a unit change is a loss, not a lossless conversion');
  assert.deepEqual(
    iso.issues.map((issue: Issue) => issue.path),
    ['Duration.code'],
  );

  // The asymmetry itself: `GROUP_UNITS` has no `ms` capture, so the value comes
  // back in seconds. The magnitude is exact; the unit is not carried.
  const back = iso8601ToUcum('PT0.25S');
  assert.equal(back.value?.code, 's');
  assert.equal(back.value?.value, 0.25);
});

test('months and minutes are distinguished by the T separator', () => {
  assert.equal(iso8601ToUcum('P6M').value?.code, 'mo');
  assert.equal(iso8601ToUcum('PT6M').value?.code, 'min');
  assert.equal(ucumToIso8601({ value: 6, code: 'mo', system: 'http://unitsofmeasure.org' }).value, 'P6M');
  assert.equal(ucumToIso8601({ value: 6, code: 'min', system: 'http://unitsofmeasure.org' }).value, 'PT6M');
});

test('milliseconds are expressed as fractional seconds', () => {
  assert.equal(
    ucumToIso8601({ value: 1, code: 'ms', system: 'http://unitsofmeasure.org' }).value,
    'PT0.001S',
  );
});
test('a duration with several components has no single UCUM unit', () => {
  const result = iso8601ToUcum('P1Y6M');
  assert.equal(result.fidelity, 'unmapped');
  assert.equal(result.value, undefined);
  assert.match(result.issues[0]?.message ?? '', /no single UCUM unit/);
});

test('a malformed duration is reported, not thrown', () => {
  const result = iso8601ToUcum('six months');
  assert.equal(result.fidelity, 'unmapped');
  assert.equal(result.issues.length, 1);
});

test('an unrecognised UCUM code is reported, not thrown', () => {
  const result = ucumToIso8601({ value: 1, code: 'kg', system: 'http://unitsofmeasure.org' });
  assert.equal(result.fidelity, 'unmapped');
  assert.match(result.issues[0]?.message ?? '', /duration-units/);
});

test('the subset table names both standards for every form', () => {
  assert.ok(ISO8601_FORMS.length > 0);
  for (const form of ISO8601_FORMS) {
    assert.ok(form.example.length > 0, 'every form has an example');
    assert.ok(form.action.length > 0, `${form.example} states no mapping action`);
    assert.ok(form.openehr || form.fhir, `${form.example} belongs to neither standard`);
  }
});

test('the subset table records real divergence in both directions', () => {
  const divergent = divergentForms();
  assert.ok(divergent.some((f) => f.openehr && !f.fhir), 'openEHR-only forms are recorded');
  assert.ok(divergent.some((f) => !f.openehr && f.fhir), 'FHIR-only forms are recorded');
  assert.ok(sharedForms().length > 0, 'shared forms are recorded');
});

test('compact openEHR forms expand to the FHIR extended form', () => {
  assert.equal(expandCompact('20260301'), '2026-03-01');
  assert.equal(expandCompact('202603'), '2026-03');
  assert.equal(expandCompact('T143000'), '14:30:00');
  assert.equal(expandCompact('20260301T143000Z'), '2026-03-01T14:30:00Z');
  assert.equal(expandCompact('2026-03-01'), '2026-03-01', 'an extended value is unchanged');
  assert.equal(expandCompact('2026'), '2026', 'a year is unchanged');
});

test('partial dates are truncated, never padded', () => {
  assert.equal(expandCompact('202604'), '2026-04');
  assert.notEqual(expandCompact('202604'), '2026-04-01');
});

test('fractional seconds truncate to the three digits openEHR permits', () => {
  const nine = truncateFractionalSeconds('14:30:00.123456789');
  assert.equal(nine.value, '14:30:00.123');
  assert.equal(nine.truncated, true);

  const three = truncateFractionalSeconds('14:30:00.123');
  assert.equal(three.value, '14:30:00.123');
  assert.equal(three.truncated, false);

  const offset = truncateFractionalSeconds('14:30:00.123456789+01:00');
  assert.equal(offset.value, '14:30:00.123+01:00');
  assert.equal(offset.truncated, true);
});

test('every form the table marks as needing action says what the action is', () => {
  for (const form of divergentForms()) {
    assert.match(
      form.action,
      /SHALL|MAY|SHOULD|extension|truncat/,
      `${form.example}: a divergent form must state a mapping rule`,
    );
  }
});

test('minute precision is completed, and nothing else is', () => {
  assert.deepEqual(completeSeconds('14:30'), { value: '14:30:00', completed: true });
  assert.deepEqual(completeSeconds('14:30+01:00'), { value: '14:30:00+01:00', completed: true });
  assert.deepEqual(completeSeconds('2026-03-01T14:30'), {
    value: '2026-03-01T14:30:00',
    completed: true,
  });
  assert.deepEqual(completeSeconds('14:30:00'), { value: '14:30:00', completed: false });
  assert.deepEqual(completeSeconds('2026-03-01T14:30:00Z'), {
    value: '2026-03-01T14:30:00Z',
    completed: false,
  });
  assert.deepEqual(completeSeconds('2026-03-01'), { value: '2026-03-01', completed: false });
  assert.deepEqual(completeSeconds('2026-03'), { value: '2026-03', completed: false });
});

test('a compact UTC offset is expanded before the offset is separated', () => {
  assert.equal(expandCompact('T143000+0100'), '14:30:00+01:00');
  assert.equal(expandCompact('20260301T143000-0500'), '2026-03-01T14:30:00-05:00');
  assert.equal(expandCompact('14:30:00+01:00'), '14:30:00+01:00', 'an extended offset is unchanged');
  assert.equal(expandCompact('2026-03-01'), '2026-03-01', 'a bare date is untouched');
});

// ── the published rules, driven through the converters ───────────────────────

/**
 * `iso8601-subset.ts` claims its `action` column "is the same rule the
 * converters implement". These cases make that checkable: every example in the
 * table is run through the converter its `kind` names, and the result is pinned.
 *
 * The expectations live here rather than in the table because they are a fact
 * about *this* implementation; the table is a fact about the two standards.
 */
const MAPPING_FOR_KIND = {
  date: 'dv-date-to-date',
  time: 'dv-time-to-time',
  dateTime: 'dv-date-time-to-date-time',
} as const;

const EXPECTED: Readonly<
  Record<string, { readonly out: string; readonly issues: readonly string[] }>
> = {
  '2026-03-01': { out: '2026-03-01', issues: [] },
  '20260301': { out: '2026-03-01', issues: [] },
  '2026-03': { out: '2026-03', issues: [] },
  '202603': { out: '2026-03', issues: [] },
  '2026': { out: '2026', issues: [] },
  '14:30:00': { out: '14:30:00', issues: [] },
  T143000: { out: '14:30:00', issues: [] },
  '14:30': { out: '14:30:00', issues: ['DV_TIME.value[minute-precision]'] },
  '14:30:00.123': { out: '14:30:00.123', issues: [] },
  '14:30:00.123456789': { out: '14:30:00.123', issues: ['time.value'] },
  '14:30:00+01:00': { out: '14:30:00', issues: ['DV_TIME.value[timezone]'] },
  'T143000+0100': { out: '14:30:00', issues: ['DV_TIME.value[timezone]'] },
  '2026-03-01T14:30:00Z': { out: '2026-03-01T14:30:00Z', issues: [] },
  '20260301T143000Z': { out: '2026-03-01T14:30:00Z', issues: [] },
  '2026-03-01T14:30:00+01:00': { out: '2026-03-01T14:30:00+01:00', issues: [] },
  '2026-03-01T14:30': {
    out: '2026-03-01T14:30:00',
    issues: ['DV_DATE_TIME.value[minute-precision]'],
  },
};

/** The lexical value a converter produced, whichever shape it produced it in. */
function lexical(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value !== null && typeof value === 'object' && 'value' in value) {
    return String((value as { value?: unknown }).value ?? '');
  }
  return '';
}

const OPENEHR_TYPE = {
  date: 'DV_DATE',
  time: 'DV_TIME',
  dateTime: 'DV_DATE_TIME',
} as const;

for (const form of ISO8601_FORMS) {
  test(`the subset table's rule for '${form.example}' is the rule the converter implements`, () => {
    const expected = EXPECTED[form.example];
    assert.ok(expected, `no converter expectation is recorded for '${form.example}'`);

    const pair = converterFor(MAPPING_FOR_KIND[form.kind]);
    assert.ok(pair, `no converter registered for ${form.kind}`);

    const result = form.openehr
      ? pair.toFhir({ _type: OPENEHR_TYPE[form.kind], value: form.example })
      : pair.toOpenehr(form.kind === 'time' ? { value: form.example } : form.example);

    assert.equal(lexical(result.value), expected.out, `${form.example}: unexpected output`);
    assert.deepEqual(
      result.issues.map((issue: Issue) => issue.path),
      expected.issues,
      `${form.example}: unexpected issue set`,
    );

    if (form.openehr && form.fhir) {
      assert.equal(
        expected.out,
        form.example,
        `${form.example}: both standards accept it, so it must be carried unchanged`,
      );
    }
    if (form.openehr && !form.fhir) {
      assert.notEqual(
        expected.out,
        form.example,
        `${form.example}: FHIR does not accept this form, so the converter must rewrite it`,
      );
    }
    if (!form.openehr) {
      assert.ok(
        expected.issues.length > 0,
        `${form.example}: openEHR does not accept this form, so the loss must be reported`,
      );
    }
  });
}

test('every subset-table example has a recorded converter expectation', () => {
  const uncovered = ISO8601_FORMS.filter((form) => EXPECTED[form.example] === undefined);
  assert.deepEqual(uncovered.map((form) => form.example), []);
});

// ── DV_DURATION, where a fixture pair cannot express the case ────────────────

test('a multi-component duration produces no FHIR Duration and says why', () => {
  const pair = converterFor('dv-duration-to-duration');
  assert.ok(pair);
  const result = pair.toFhir({ _type: 'DV_DURATION', value: 'P1Y6M' });
  assert.equal(result.fidelity, 'unmapped');
  assert.equal(result.value, undefined, 'an empty Duration is not a partial success');
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path),
    ['DV_DURATION.value', 'DV_DURATION.value'],
  );
  assert.match(result.issues[1]?.message ?? '', /no single UCUM unit/);
});

test('a Duration whose code is not a time unit produces no DV_DURATION', () => {
  const pair = converterFor('dv-duration-to-duration');
  assert.ok(pair);
  const result = pair.toOpenehr({ value: 5, code: 'kg', system: 'http://unitsofmeasure.org' });
  assert.equal(result.fidelity, 'unmapped');
  assert.equal(result.value, undefined, 'PT0S is not a safe default for an unconvertible unit');
  // The real diagnostic survives instead of being replaced by the generic
  // "the unit is folded back into the lexical form" message.
  assert.match(result.issues.at(-1)?.message ?? '', /duration-units/);
});

test('a Duration with no code and one with no value both produce nothing', () => {
  const pair = converterFor('dv-duration-to-duration');
  assert.ok(pair);

  const noCode = pair.toOpenehr({ value: 5 });
  assert.equal(noCode.fidelity, 'unmapped');
  assert.deepEqual(
    noCode.issues.map((issue: Issue) => issue.path),
    ['Duration.code[absent]'],
  );

  const noValue = pair.toOpenehr({ code: 'mo', system: 'http://unitsofmeasure.org' });
  assert.equal(noValue.fidelity, 'unmapped');
  assert.deepEqual(
    noValue.issues.map((issue: Issue) => issue.path),
    ['Duration.value[absent]'],
  );
});

