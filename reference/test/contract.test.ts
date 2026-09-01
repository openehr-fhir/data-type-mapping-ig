import test from 'node:test';
import assert from 'node:assert/strict';

import type { Issue, MappingResult } from '../src/result.ts';
import {
  codeableConceptToDvCodedText,
  codingToCodePhrase,
  codingToTermMapping,
  dvCodedTextToCodeableConcept,
  termMappingToCoding,
} from '../src/convert/coded.ts';
import {
  countToDvCount,
  moneyToDvQuantity,
  quantityToDvQuantity,
  rangeToDvInterval,
  simpleQuantityToDvQuantity,
} from '../src/convert/quantity.ts';
import {
  attachmentToDvMultimedia,
  codeableConceptToDvState,
  dvStateToCodeableConcept,
  stringToDvParsable,
} from '../src/convert/other.ts';
import { stringToDvText } from '../src/convert/textual.ts';

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
];

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
  // A guard against the list above silently falling behind the converters: the
  // count is stated here so that adding a case is a deliberate edit.
  assert.equal(MANDATORY.length, 13);
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
