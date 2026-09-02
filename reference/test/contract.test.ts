import test from 'node:test';
import assert from 'node:assert/strict';

import type { Issue, MappingResult } from '../src/result.ts';
import type { Quantity } from '../src/types/fhir/quantity.ts';
import { registered } from '../src/convert/index.ts';
import {
  codeableConceptToDvCodedText,
  codingToCodePhrase,
  codingToTermMapping,
  dataAbsentReasonToNullFlavour,
  dvCodedTextToCodeableConcept,
  termMappingToCoding,
} from '../src/convert/coded.ts';
import {
  countToDvCount,
  dvQuantityToQuantity,
  moneyToDvQuantity,
  quantityToDvQuantity,
  rangeToDvInterval,
  ratioToDvProportion,
  simpleQuantityToDvQuantity,
} from '../src/convert/quantity.ts';
import {
  attachmentToDvMultimedia,
  codeableConceptToDvState,
  dvStateToCodeableConcept,
  stringToDvParsable,
} from '../src/convert/other.ts';
import { stringToDvText } from '../src/convert/textual.ts';
import { durationToDvDuration, timeToDvTime } from '../src/convert/temporal.ts';
import {
  identifierToDvIdentifier,
  referenceToLink,
} from '../src/convert/reference-types.ts';

/**
 * The two contracts every converter in this workspace is held to.
 *
 * **The mandatory-attribute rule.** A converter never invents a value for an
 * attribute the target standard declares mandatory. Where the source carries
 * nothing for such an attribute, the converter returns `unmapped` — no `value`
 * at all — and names the absent **source** path in an issue. Substituting a
 * constant and reporting `lossless` is the single worst statement a fidelity
 * ledger can make, so the rule is pinned here rather than left to review.
 *
 * The round-trip matrix cannot see this class of defect: a fixture that omits
 * the field has nothing to compare against. That is why these assertions call
 * the converters directly.
 *
 * **Composed-issue propagation.** A converter that delegates to another
 * converter carries the inner result's issues forward, so a declared drop
 * cannot vanish behind a composition boundary.
 *
 * The exception list is **closed**: exactly two sites may substitute a value,
 * both are asserted below, and a third would have to be added here to exist.
 */

// ── the mandatory-attribute rule ─────────────────────────────────────────────

/**
 * One case per converter that the rule reaches, authored beside the converter
 * it covers so that adding a converter without covering it is a visible
 * omission rather than a silent gap.
 */
const MANDATORY: readonly {
  readonly converter: string;
  readonly mapping: string;
  readonly why: string;
  readonly run: () => MappingResult<unknown>;
  readonly paths: readonly string[];
}[] = [
  {
    converter: 'quantityToDvQuantity',
    mapping: 'dv-quantity-to-quantity',
    why: 'a Quantity carrying only a comparator is valid FHIR input',
    run: () => quantityToDvQuantity({ comparator: '<' }),
    paths: ['Quantity.value[absent]', 'Quantity.code[absent]'],
  },
  {
    converter: 'countToDvCount',
    mapping: 'dv-count-to-count',
    why: 'Count.value is 0..1 while DV_COUNT.magnitude is 1..1',
    run: () => countToDvCount({ comparator: '>=' }),
    paths: ['Count.value[absent]'],
  },
  {
    converter: 'rangeToDvInterval',
    mapping: 'dv-interval-to-range',
    why: 'an unconvertible bound cannot be silently rewritten as zero',
    run: () => rangeToDvInterval({ low: { unit: 'mmol/L' } }),
    paths: ['Range.low', 'SimpleQuantity.value[absent]', 'SimpleQuantity.code[absent]'],
  },
  {
    converter: 'moneyToDvQuantity',
    mapping: 'dv-quantity-to-money',
    why: 'Money.value and Money.currency are both 0..1',
    run: () => moneyToDvQuantity({}),
    paths: ['Money.value[absent]', 'Money.currency[absent]'],
  },
  {
    converter: 'simpleQuantityToDvQuantity',
    mapping: 'dv-quantity-to-simple-quantity',
    why: 'SimpleQuantity.value and SimpleQuantity.code are both 0..1',
    run: () => simpleQuantityToDvQuantity({ unit: 'mg' }),
    paths: ['SimpleQuantity.value[absent]', 'SimpleQuantity.code[absent]'],
  },
  {
    converter: 'codingToCodePhrase',
    mapping: 'code-phrase-to-coding',
    why: 'Coding.code is 0..1 while CODE_PHRASE.code_string is 1..1',
    run: () => codingToCodePhrase({ system: 'http://snomed.info/sct', display: 'Anemia' }),
    paths: ['Coding.code[absent]'],
  },
  {
    converter: 'codeableConceptToDvCodedText (no coding)',
    mapping: 'dv-coded-text-to-codeable-concept',
    why: 'a text-only CodeableConcept has nothing to build a defining_code from',
    run: () => codeableConceptToDvCodedText({ text: 'Anemia' }),
    paths: ['CodeableConcept.coding[absent]'],
  },
  {
    converter: 'codeableConceptToDvCodedText (unconvertible coding)',
    mapping: 'dv-coded-text-to-codeable-concept',
    why: 'a coding with no code cannot become the mandatory defining_code',
    run: () =>
      codeableConceptToDvCodedText({
        coding: [{ system: 'http://snomed.info/sct', display: 'Anemia' }],
        text: 'Anemia',
      }),
    paths: ['CodeableConcept.coding', 'Coding.code[absent]'],
  },
  {
    converter: 'codingToTermMapping',
    mapping: 'term-mapping-to-coding',
    why: 'TERM_MAPPING.target is 1..1 and a code-less Coding cannot supply it',
    run: () => codingToTermMapping({ system: 'http://hl7.org/fhir/sid/icd-10' }),
    paths: ['CodeableConcept.coding', 'Coding.code[absent]'],
  },
  {
    converter: 'attachmentToDvMultimedia',
    mapping: 'dv-multimedia-to-attachment',
    why: 'DV_MULTIMEDIA.media_type and .size are both 1..1 while Attachment makes both 0..1',
    run: () => attachmentToDvMultimedia({ data: 'iVBORw0KGgo=' }),
    paths: ['Attachment.contentType[absent]', 'Attachment.size[absent]'],
  },
  {
    converter: 'stringToDvParsable',
    mapping: 'dv-parsable-to-string',
    why: 'DV_PARSABLE.formalism is 1..1 and nothing in FHIR states the syntax of a value',
    run: () => stringToDvParsable({ value: 'NM_000059.3:c.274G>A' }),
    paths: ['string.value'],
  },
  {
    converter: 'stringToDvText',
    mapping: 'dv-text-to-string',
    why: 'a FHIR primitive element may carry extensions and no value at all',
    run: () => stringToDvText({}),
    paths: ['string.value[absent]'],
  },
  {
    converter: 'codeableConceptToDvState',
    mapping: 'dv-state-to-codeable-concept',
    why: 'DV_STATE.value is 1..1 and an unconvertible CodeableConcept cannot supply it',
    run: () => codeableConceptToDvState({ text: 'completed' }),
    paths: ['CodeableConcept.coding', 'CodeableConcept.coding[absent]'],
  },
  {
    converter: 'identifierToDvIdentifier',
    mapping: 'dv-identifier-to-identifier',
    why: 'DV_IDENTIFIER.id is 1..1 while Identifier.value is 0..1',
    run: () => identifierToDvIdentifier({ system: 'http://example.org/mrn' }),
    paths: ['Identifier.value[absent]'],
  },
  {
    converter: 'referenceToLink',
    mapping: 'link-to-reference',
    why: 'LINK.type is 1..1 and a FHIR Reference has no field that can source it',
    run: () => referenceToLink({ reference: 'Condition/anaemia-1', display: 'Related problem' }),
    paths: [
      'CodeableReference.concept',
      'Reference.reference',
      'Reference.display',
      'CodeableReference',
    ],
  },
  {
    converter: 'ratioToDvProportion',
    mapping: 'dv-proportion-to-ratio',
    why: 'DV_PROPORTION.type is 1..1 and no Ratio carries a kind discriminator at all',
    run: () => ratioToDvProportion({ numerator: { value: 5 }, denominator: { value: 100 } }),
    paths: [
      'Ratio.numerator.value',
      'Ratio.denominator.value',
      'Ratio.numerator.extension[quantity-precision]',
    ],
  },
  {
    converter: 'durationToDvDuration',
    mapping: 'dv-duration-to-duration',
    why: 'DV_DURATION.value carries its unit inside the lexical form, so a code-less Duration names no unit to write',
    run: () => durationToDvDuration({ value: 6 }),
    paths: ['Duration.code[absent]'],
  },
  {
    converter: 'timeToDvTime',
    mapping: 'dv-time-to-time',
    why: 'DV_TIME.value is 1..1 while a FHIR time element may carry extensions and no value',
    run: () => timeToDvTime({}),
    paths: ['time.value[absent]'],
  },
  {
    converter: 'dataAbsentReasonToNullFlavour',
    mapping: 'null-flavour-to-data-absent-reason',
    why: 'the null flavour\u2019s defining_code is 1..1 and a CodeableConcept may state no code at all',
    run: () => dataAbsentReasonToNullFlavour({ text: 'no reason given' }),
    paths: ['CodeableConcept.coding[absent]', 'Element.extension[iso21090-nullFlavor]'],
  },
  {
    converter: 'termMappingToCoding',
    mapping: 'term-mapping-to-coding',
    why: 'TERM_MAPPING.target has no valid FHIR Coding form, so no Coding is produced (toFhir)',
    run: () =>
      termMappingToCoding({
        _type: 'TERM_MAPPING',
        match: '=',
        target: {
          _type: 'CODE_PHRASE',
          terminology_id: { value: 'http://snomed.info/sct' },
          code_string: ' 73211009 ',
        },
      }),
    paths: ['TERM_MAPPING.match', 'CODE_PHRASE.code_string[whitespace]'],
  },
  {
    converter: 'dvCodedTextToCodeableConcept',
    mapping: 'dv-coded-text-to-codeable-concept',
    why: 'an unconvertible defining_code would leave a text-only CodeableConcept, which the reverse direction refuses (toFhir)',
    run: () =>
      dvCodedTextToCodeableConcept({
        _type: 'DV_CODED_TEXT',
        value: 'Anemia',
        defining_code: {
          _type: 'CODE_PHRASE',
          terminology_id: { value: 'http://snomed.info/sct' },
          code_string: ' 73211009 ',
        },
      }),
    paths: ['DV_CODED_TEXT.defining_code', 'CODE_PHRASE.code_string[whitespace]'],
  },
];

/**
 * The registered mappings the mandatory-attribute rule **cannot** reach, and
 * why each one is out of its reach.
 *
 * The criterion is a single, checkable one: the FHIR side of these mappings is
 * a **bare JSON primitive** — a boolean, a number, or a string — so there is no
 * element that can be present while its value is absent, and therefore no
 * absent source for a mandatory openEHR attribute to be invented from. Every
 * other registered mapping takes a FHIR *object* with optional members and is
 * covered above.
 *
 * Together with `MANDATORY` this accounts for the whole registry, and the
 * assertion below derives that from `registered()` rather than restating a
 * count. Registering a converter without either covering it or writing down why
 * the rule cannot reach it now fails, which is what the count assertion this
 * replaced could not do: it caught deletion and never omission.
 */
const NO_MANDATORY_GAP: Readonly<Record<string, string>> = {
  'dv-boolean-to-boolean':
    'the FHIR side is a bare JSON boolean, so DV_BOOLEAN.value always has a source',
  'integer-to-integer':
    'the FHIR side is a bare JSON number, so the RM Integer always has a source',
  'integer64-to-integer64':
    'the FHIR side is the bare JSON string R5 serialises integer64 as; the one refusal ' +
    'this mapping has is the 32-bit overflow, which is a range fact rather than an absent ' +
    'mandatory attribute',
  'real-to-decimal':
    'the FHIR side is a bare JSON number, so the RM Real always has a source',
  'dv-uri-to-uri': 'the FHIR side is a bare JSON string, so DV_URI.value always has a source',
  'dv-date-to-date':
    'the FHIR side is a bare JSON string, so DV_DATE.value always has a source',
  'dv-date-time-to-date-time':
    'the FHIR side is a bare JSON string, so DV_DATE_TIME.value always has a source',
};

for (const example of MANDATORY) {
  test(`${example.converter}: no invented mandatory attribute — ${example.why}`, () => {
    const result = example.run();
    assert.equal(
      result.fidelity,
      'unmapped',
      `${example.mapping}: the mandatory-attribute rule requires 'unmapped'`,
    );
    assert.equal(result.value, undefined, `${example.mapping}: no value may be produced`);
    const paths = result.issues.map((issue: Issue) => issue.path);
    assert.deepEqual(
      paths,
      example.paths,
      `${example.mapping}: the issues must name the absent source paths, in order`,
    );
    for (const issue of result.issues) {
      assert.ok(issue.message.length > 0, 'every issue states a reason');
    }
  });
}

test('the mandatory-attribute rule covers every converter that can meet it', () => {
  const covered = new Set(MANDATORY.map((example) => example.mapping));
  const excused = new Set(Object.keys(NO_MANDATORY_GAP));
  const accounted = new Set([...covered, ...excused]);
  const registeredIds = new Set(registered().keys());

  const uncovered = [...registeredIds].filter((id) => !accounted.has(id)).sort();
  const stale = [...accounted].filter((id) => !registeredIds.has(id)).sort();

  assert.deepEqual(
    { uncovered, stale },
    { uncovered: [], stale: [] },
    'registered but uncovered: ' +
      `${uncovered.join(', ') || '(none)'}; covered but not registered: ` +
      `${stale.join(', ') || '(none)'}`,
  );

  const both = [...covered].filter((id) => excused.has(id)).sort();
  assert.deepEqual(
    both,
    [],
    `a mapping cannot be both covered and excused: ${both.join(', ')}`,
  );
});

test('every opt-out states a reason', () => {
  const silent = Object.entries(NO_MANDATORY_GAP)
    .filter(([, why]) => why.trim().length === 0)
    .map(([id]) => id);
  assert.deepEqual(silent, [], `opt-outs with no reason: ${silent.join(', ')}`);
});

// ── the two recorded exceptions ──────────────────────────────────────────────

test('exception 1: an absent Coding.system is reported and substituted, not refused', () => {
  const result = codingToCodePhrase({ code: 'PROC123', display: 'Local procedure 123' });
  assert.equal(result.fidelity, 'lossy');
  assert.equal(result.value?.terminology_id.value, 'unknown');
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path),
    ['Coding.system[absent]'],
  );
});

test('exception 2: DV_STATE.is_terminal is inferred, and the openEHR-only gap is reported', () => {
  const result = codeableConceptToDvState({
    coding: [{ system: 'openehr', code: '532' }],
    text: 'completed',
  });
  assert.equal(result.fidelity, 'lossless');
  assert.equal(result.value?.is_terminal, false);

  // The gap is published from the other direction, where the flag exists to be
  // dropped.
  const outbound = dvStateToCodeableConcept({
    _type: 'DV_STATE',
    value: {
      _type: 'DV_CODED_TEXT',
      value: 'completed',
      defining_code: {
        _type: 'CODE_PHRASE',
        terminology_id: { value: 'openehr' },
        code_string: '532',
      },
    },
    is_terminal: true,
  });
  assert.ok(outbound.issues.some((issue: Issue) => issue.path === 'DV_STATE.is_terminal'));
});

// ── the `%`-unit accuracy collision ──────────────────────────────────────────

/**
 * The round-trip matrix cannot see this on its own: a bracketed sub-case path
 * holds no value to compare, so both halves are asserted directly, as the
 * mandatory-attribute rule already is.
 *
 * `DV_QUANTITY.accuracy_is_percent` is carried as the **unit** of the accuracy
 * `Quantity` — UCUM `%` when true, the magnitude's own unit when false. Where
 * the magnitude's own unit is already `%` the two cases produce the identical
 * instance, so the flag may not be derived back out of it.
 */
test('a %-unit accuracy reports the collision outbound and does not invent the flag inbound', () => {
  const outbound = dvQuantityToQuantity({
    _type: 'DV_QUANTITY',
    magnitude: 45,
    units: '%',
    accuracy: 2,
    accuracy_is_percent: false,
  });
  assert.equal(outbound.fidelity, 'lossy');
  assert.deepEqual(
    outbound.issues.map((issue: Issue) => issue.path),
    ['DV_QUANTITY.accuracy_is_percent[percent-unit]'],
  );
  // The accuracy magnitude itself is still carried.
  assert.equal(
    outbound.value?.extension?.[0]?.valueQuantity?.value,
    2,
    'the accuracy magnitude is clinically useful and is still emitted',
  );

  const inbound = quantityToDvQuantity(outbound.value as Quantity);
  assert.equal(inbound.fidelity, 'lossy');
  assert.deepEqual(
    inbound.issues.map((issue: Issue) => issue.path),
    ['Quantity.extension[quantity-accuracy][percent-unit]'],
  );
  assert.equal(inbound.value?.accuracy, 2);
  assert.ok(
    inbound.value !== undefined && !('accuracy_is_percent' in inbound.value),
    'accuracy_is_percent must be absent, not inverted: ±2 percentage points is not ±2 % of 45',
  );
});

test('there is no third exception: every other substitution site refuses instead', () => {
  const substituting = MANDATORY.filter((example) => example.run().value !== undefined);
  assert.deepEqual(
    substituting.map((example) => example.converter),
    [],
    'a converter that produces a value with a mandatory attribute absent is a third ' +
      'exception, and must be argued for here rather than appearing silently',
  );
});

// ── composed converters carry their inner issues ─────────────────────────────

const VERSIONED_CODING = {
  system: 'http://loinc.org',
  version: '2.77',
  code: '718-7',
  display: 'Hemoglobin [Mass/volume] in Blood',
} as const;

test('codeableConceptToDvCodedText carries the Coding.version drop (the H1 case)', () => {
  const result = codeableConceptToDvCodedText({
    coding: [{ system: 'http://snomed.info/sct', code: '73211009', version: '2024-01' }],
    text: 'Diabetes',
  });
  assert.equal(result.fidelity, 'lossy');
  assert.ok(
    result.issues.some((issue: Issue) => issue.path === 'Coding.version'),
    'the inner CODE_PHRASE ↔ Coding drop must survive the composition boundary',
  );
});

test('codingToTermMapping carries the Coding.version drop', () => {
  const result = codingToTermMapping(VERSIONED_CODING);
  assert.equal(result.fidelity, 'lossy');
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path),
    ['Coding.version'],
  );
});

test('termMappingToCoding reports its own drops and adds no phantom inner one', () => {
  const result = termMappingToCoding({
    _type: 'TERM_MAPPING',
    match: '=',
    target: {
      _type: 'CODE_PHRASE',
      terminology_id: { value: 'http://hl7.org/fhir/sid/icd-10' },
      code_string: 'D64.9',
    },
  });
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path),
    ['TERM_MAPPING.match'],
  );
});

test('dvCodedTextToCodeableConcept reports its own drops for a mapped term', () => {
  const result = dvCodedTextToCodeableConcept({
    _type: 'DV_CODED_TEXT',
    value: 'Anemia',
    defining_code: {
      _type: 'CODE_PHRASE',
      terminology_id: { value: 'http://snomed.info/sct' },
      code_string: '271737000',
    },
    mappings: [
      {
        _type: 'TERM_MAPPING',
        match: '=',
        target: {
          _type: 'CODE_PHRASE',
          terminology_id: { value: 'http://hl7.org/fhir/sid/icd-10' },
          code_string: 'D64.9',
        },
      },
    ],
  });
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path),
    ['DV_CODED_TEXT.mappings.match'],
  );
});

test('codeableConceptToDvState carries the inner DV_CODED_TEXT issues', () => {
  const result = codeableConceptToDvState({
    coding: [{ ...VERSIONED_CODING, userSelected: true }],
    text: 'Hemoglobin measured',
  });
  assert.equal(result.fidelity, 'lossy');
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path).sort(),
    ['CodeableConcept.coding.userSelected', 'Coding.version'],
  );
});

test('dvStateToCodeableConcept keeps its own issue at the head and appends the inner ones', () => {
  const result = dvStateToCodeableConcept({
    _type: 'DV_STATE',
    value: {
      _type: 'DV_CODED_TEXT',
      value: 'completed',
      defining_code: {
        _type: 'CODE_PHRASE',
        terminology_id: { value: 'openehr' },
        code_string: '532',
      },
      mappings: [
        {
          _type: 'TERM_MAPPING',
          match: '=',
          target: {
            _type: 'CODE_PHRASE',
            terminology_id: { value: 'http://hl7.org/fhir/sid/icd-10' },
            code_string: 'D64.9',
          },
        },
      ],
    },
    is_terminal: true,
  });
  assert.deepEqual(
    result.issues.map((issue: Issue) => issue.path),
    ['DV_STATE.is_terminal', 'DV_CODED_TEXT.mappings.match'],
  );
});
