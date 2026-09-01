/**
 * Coded data: `CODE_PHRASE`, `DV_CODED_TEXT`, `TERM_MAPPING`, and the
 * null-flavour correspondences.
 *
 * This is the most structurally divergent category and it carries the largest
 * share of the guide's open decisions. Where the working group has not chosen
 * between candidates, the row is `open` and the candidates are stated — nothing
 * here blesses one by default.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const RM_SUPPORT = 'https://specifications.openehr.org/releases/RM/latest/support.html';
const TERM = 'https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';
const R5_OBS = 'https://hl7.org/fhir/R5/observation.html';
const R5_OBS_DEFS = 'https://hl7.org/fhir/R5/observation-definitions.html';
const R5_EXTENSIBILITY = 'https://hl7.org/fhir/R5/extensibility.html';
const EXT_PACK = 'https://hl7.org/fhir/extensions/StructureDefinition';

function rm(anchor: string, label: string): Cite {
  return { url: `${RM}#${anchor}`, label, verification: 'spec-local' };
}

function r5(anchor: string, label: string): Cite {
  return { url: `${R5}#${anchor}`, label, verification: 'spec-local' };
}

function ext(name: string, label: string): Cite {
  return { url: `${EXT_PACK}-${name}.html`, label, verification: 'extension-unverified' };
}

function tho(page: string, label: string): Cite {
  return { url: `https://terminology.hl7.org/${page}`, label, verification: 'spec-remote' };
}

const CODE_PHRASE = rm('_code_phrase_class', 'openEHR RM — CODE_PHRASE');
const TERM_MAPPING = rm('_term_mapping_class', 'openEHR RM — TERM_MAPPING');
const DV_CODED_TEXT = rm('_dv_coded_text_class', 'openEHR RM — DV_CODED_TEXT');
const CODING = r5('Coding', 'FHIR R5 — Coding');
const CODEABLE_CONCEPT = r5('CodeableConcept', 'FHIR R5 — CodeableConcept');
const OPENEHR_TERMINOLOGY: Cite = {
  url: `${TERM}`,
  label: 'openEHR — Support Terminology',
  verification: 'spec-local',
};
const OPENEHR_SUPPORT_IM: Cite = {
  url: `${RM_SUPPORT}#_terminology_identifiers`,
  label: 'openEHR RM — TERMINOLOGY_ID',
  verification: 'spec-local',
};
const DAR_EXTENSION: Cite = {
  url: `${R5_EXTENSIBILITY}#Special-Case`,
  label: 'FHIR R5 — missing data and the data-absent-reason extension',
  verification: 'spec-local',
};
const DAR_VALUESET = tho('CodeSystem-data-absent-reason.html', 'THO — data-absent-reason');
const NULLFLAVOR_CS = tho('CodeSystem-v3-NullFlavor.html', 'THO — v3 NullFlavor');
const OBS_DAR: Cite = {
  url: `${R5_OBS_DEFS}#Observation.dataAbsentReason`,
  label: 'FHIR R5 — Observation.dataAbsentReason',
  verification: 'spec-local',
};

const REVIEWED_BOTH: Review = { openehr: ['Severin'], fhir: ['Gino'] };
const REVIEWED_OPENEHR_ONLY: Review = { openehr: ['Severin'], fhir: [] };

/**
 * The mandatory-attribute rule, cross-referenced from every row it governs.
 * Appended to a row note rather than restated, so the wording cannot drift.
 */
const MANDATORY_RULE =
  ' The openEHR attribute is **mandatory** and the FHIR element is optional, so an ' +
  'incoming instance that omits it cannot be converted: the reference implementation ' +
  'produces **nothing** rather than inventing a value. See ' +
  '[the mandatory-attribute rule](conventions.html#mandatory-attributes).';

// ── CODE_PHRASE ↔ Coding ─────────────────────────────────────────────────────

const codePhraseToCoding = {
  id: 'code-phrase-to-coding',
  category: 'coded',
  openehrType: 'CODE_PHRASE',
  fhirType: 'Coding',
  title: 'CODE_PHRASE ↔ Coding',
  scope: 'datatype',
  sources: [CODE_PHRASE, CODING, OPENEHR_SUPPORT_IM],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'code-phrase.terminology_id',
      scope: 'datatype',
      openehr: {
        path: 'CODE_PHRASE.terminology_id',
        cardinality: '1..1',
        type: 'TERMINOLOGY_ID',
        kind: 'element',
        cite: OPENEHR_SUPPORT_IM,
      },
      fhir: [
        {
          path: 'Coding.system',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          cite: CODING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'The identifier is carried verbatim in both directions. **How a FHIR `system` ' +
        'plus `version` is combined into one `terminology_id` is not decided** — see ' +
        '`Coding.version` below and [Cross-Cutting Concerns](cross-cutting.html). The ' +
        'reference implementation deliberately treats `terminology_id` as opaque, so no ' +
        'candidate format is adopted by accident.',
    },
    {
      id: 'code-phrase.code_string',
      scope: 'datatype',
      openehr: {
        path: 'CODE_PHRASE.code_string',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: CODE_PHRASE,
      },
      fhir: [
        {
          path: 'Coding.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: CODING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'The FHIR `code` type forbids leading, trailing, and repeated internal whitespace. ' +
        'openEHR places **no** character restriction on `code_string`, so a code carrying ' +
        'whitespace has no valid FHIR form. A change request proposing the matching ' +
        'restriction on the openEHR side is open.' + MANDATORY_RULE,
    },
    {
      id: 'code-phrase.code_string.whitespace',
      scope: 'datatype',
      openehr: {
        path: 'CODE_PHRASE.code_string[whitespace]',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: CODE_PHRASE,
      },
      fhir: {
        kind: 'none',
        reason:
          'The FHIR `code` type is defined by the regex `[^\\s]+( [^\\s]+)*`: no leading ' +
          'or trailing whitespace, and exactly one space between tokens. A `code_string` ' +
          'that breaks those rules has **no valid FHIR `code` form at all** — not a lossy ' +
          'one, none.',
        cite: CODING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Nothing is produced: emitting the code anyway would publish an instance no ' +
          'FHIR validator accepts. A change request proposing the matching whitespace ' +
          'restriction on the openEHR side is open.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'A FHIR `code` never carries such a value, so the case never arises.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'A sub-case of `CODE_PHRASE.code_string`, split out the same way ' +
        '`magnitude_status[~]` is: the parent row keeps its `lossless` claim for every ' +
        'code that *is* a legal FHIR `code`, and this row states the exception where the ' +
        'round-trip matrix can police it.',
    },
    {
      id: 'code-phrase.preferred_term',
      scope: 'datatype',
      openehr: {
        path: 'CODE_PHRASE.preferred_term',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: CODE_PHRASE,
      },
      fhir: [
        {
          path: 'Coding.display',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: CODING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
    },
    {
      id: 'fhir:coding.version',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          '`TERMINOLOGY_ID` is a single string. openEHR has no separate version field, so ' +
          'a FHIR `version` has nowhere of its own to land.',
        cite: OPENEHR_SUPPORT_IM,
      },
      fhir: [
        {
          path: 'Coding.version',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: CODING,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Nothing is emitted, because the format for splitting a `terminology_id` back ' +
          'into `system` and `version` has not been chosen.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'The version is not carried. Three candidate formats for combining it into ' +
          '`terminology_id` are under discussion and **none has been adopted**: ' +
          '`system|version` (FHIR canonical style), `system (version)` (parenthetical), ' +
          'and `system#version` (FHIR package style).',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'The reference implementation exposes the join and split as helpers that take the ' +
        'format as a **required parameter with no default**, so no test, render, or build ' +
        'can quietly bless one candidate. Some code systems embed the version in the URI ' +
        'instead, which side-steps the question entirely.',
    },
    {
      id: 'fhir:coding.system.absent',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          '`CODE_PHRASE.terminology_id` and `code_string` are both **mandatory**. There is ' +
          'no openEHR representation of a code whose system or code is unknown.',
        cite: CODE_PHRASE,
      },
      fhir: [
        {
          path: 'Coding.system[absent]',
          cardinality: '0..1',
          kind: 'element',
          cite: CODING,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'openEHR always has both, so the absent case never arises in this direction.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'An incoming `Coding` may populate neither. If **both** `system` and `code` are ' +
          'absent, `display` SHOULD become `DV_TEXT.value` rather than a `DV_CODED_TEXT`. ' +
          'If **only one** is absent the situation is inherently unsafe and needs local ' +
          'clinical informatics advice; the candidates are degrading to `DV_TEXT`, ' +
          'injecting a default system where the source is known, and treating the value as ' +
          'an exception. **No default strategy is chosen here.**',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'This row is one of the two **recorded exceptions** to ' +
        '[the mandatory-attribute rule](conventions.html#mandatory-attributes). Because ' +
        'the working group has explicitly refused to decide what an absent `system` should ' +
        'become, the reference implementation substitutes the placeholder ' +
        '`terminology_id` `unknown` **and reports the substitution at ' +
        '`Coding.system[absent]`**, so the conversion is `lossy` rather than silently ' +
        '`lossless`. An absent `Coding.code` gets no such treatment: `code_string` has no ' +
        'defensible placeholder, so nothing is produced at all. `contract.test.ts` pins ' +
        'both behaviours.',
    },
  ],
} satisfies Mapping;

// ── DV_CODED_TEXT ↔ CodeableConcept / Coding ─────────────────────────────────

const dvCodedTextToCodeableConcept = {
  id: 'dv-coded-text-to-codeable-concept',
  category: 'coded',
  openehrType: 'DV_CODED_TEXT',
  fhirType: 'CodeableConcept | Coding',
  title: 'DV_CODED_TEXT ↔ CodeableConcept / Coding',
  scope: 'datatype',
  sources: [DV_CODED_TEXT, CODEABLE_CONCEPT, CODING],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-coded-text.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_CODED_TEXT.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_CODED_TEXT,
      },
      fhir: [
        {
          path: 'CodeableConcept.text',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          when: 'the value is free text, or differs from the rubric of the defining code',
          cite: CODEABLE_CONCEPT,
        },
        {
          path: 'Coding.display',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          when:
            'the concept is carried as a bare `Coding` and the value equals the rubric of ' +
            'the defining code in the stated language',
          cite: CODING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`DV_CODED_TEXT.value` is **mandatory**. Where an incoming FHIR value supplies ' +
        'neither `text` nor a `display`, the rubric SHOULD be resolved from the code ' +
        'through a terminology server rather than left empty.',
    },
    {
      id: 'dv-coded-text.defining_code',
      scope: 'datatype',
      openehr: {
        path: 'DV_CODED_TEXT.defining_code',
        cardinality: '1..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_CODED_TEXT,
      },
      fhir: [
        {
          path: 'CodeableConcept.coding',
          cardinality: '0..*',
          type: 'Coding',
          kind: 'element',
          cite: CODEABLE_CONCEPT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'CodeableConcept.coding.userSelected',
            reason:
              'openEHR has no field marking which coding a user chose; the flag is consumed ' +
              'to select `defining_code` and is not carried any further',
          },
        ],
      },
      maturity: 'settled',
      note:
        'When several codings are present, `defining_code` is chosen in this order: the ' +
        'terminology the openEHR template defines for the slot; the coding marked ' +
        '`userSelected = true`; the first coding in the array. The working group has ' +
        'converged on treating `userSelected` as effectively equivalent to `defining_code` ' +
        'for round-tripping, while recognising the semantics are not strictly identical. ' +
        'Whether `defining_code` should instead be conveyed by the `coding-purpose` ' +
        'extension is tracked as HTA-170.' + MANDATORY_RULE,
    },
    {
      id: 'dv-coded-text.mappings',
      scope: 'datatype',
      openehr: {
        path: 'DV_CODED_TEXT.mappings',
        cardinality: '0..*',
        type: 'TERM_MAPPING',
        kind: 'element',
        cite: DV_CODED_TEXT,
      },
      fhir: [
        {
          path: 'CodeableConcept.coding',
          cardinality: '0..*',
          type: 'Coding',
          kind: 'element',
          cite: CODEABLE_CONCEPT,
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_CODED_TEXT.mappings.match',
            reason:
              'the degree of equivalence has no element on `Coding`; it is expected to be ' +
              'retrievable from a terminology service through a ConceptMap instead',
          },
          {
            path: 'DV_CODED_TEXT.mappings.purpose',
            reason:
              'no representation has been chosen — see the `TERM_MAPPING.purpose` row — so ' +
              'nothing is emitted rather than a candidate being blessed by default',
          },
        ],
      },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'Each additional coding becomes one `TERM_MAPPING`. Because `TERM_MAPPING.match` ' +
        'is mandatory, an incoming coding is given `=`, which is an inference rather than ' +
        'a carried value. See [TERM_MAPPING](#term-mapping) below. A conversion that ' +
        'delegates to `CODE_PHRASE ↔ Coding` **carries that mapping\u2019s drops forward** ' +
        'rather than swallowing them, so a `Coding.version` or an absent `Coding.system` ' +
        'is reported on the composed result too; the rows that declare those drops are on ' +
        '[CODE_PHRASE ↔ Coding](#code-phrase).',
    },
  ],
} satisfies Mapping;

// ── TERM_MAPPING ↔ CodeableConcept.coding ────────────────────────────────────

const termMappingToCoding = {
  id: 'term-mapping-to-coding',
  category: 'coded',
  openehrType: 'TERM_MAPPING',
  fhirType: 'CodeableConcept.coding',
  title: 'TERM_MAPPING ↔ CodeableConcept.coding',
  scope: 'datatype',
  sources: [TERM_MAPPING, CODEABLE_CONCEPT, CODING],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'term-mapping.target',
      scope: 'datatype',
      openehr: {
        path: 'TERM_MAPPING.target',
        cardinality: '1..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: TERM_MAPPING,
      },
      fhir: [
        {
          path: 'Coding.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: CODING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'The mapped term itself, carried exactly as `CODE_PHRASE ↔ Coding` describes.' +
        MANDATORY_RULE,
    },
    {
      id: 'term-mapping.match',
      scope: 'datatype',
      openehr: {
        path: 'TERM_MAPPING.match',
        cardinality: '1..1',
        type: 'Character',
        kind: 'element',
        cite: TERM_MAPPING,
      },
      fhir: {
        kind: 'none',
        reason:
          '`Coding` has no element expressing the degree of equivalence between two terms. ' +
          'FHIR carries that relationship in a `ConceptMap`, not in the instance.',
        cite: CODING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'The `>`, `=`, `<`, and `?` relationship is not carried in the instance. The ' +
          'working group decided it is retrievable from a terminology service and dropped ' +
          'the request for an instance-level representation.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          '`TERM_MAPPING.match` is mandatory, so a mapping engine must supply a value; ' +
          '`=` is the only defensible default and it is an inference, not a carried value.',
      },
      maturity: 'settled',
    },
    {
      id: 'term-mapping.purpose',
      scope: 'datatype',
      openehr: {
        path: 'TERM_MAPPING.purpose',
        cardinality: '0..1',
        type: 'DV_CODED_TEXT',
        kind: 'element',
        cite: TERM_MAPPING,
      },
      fhir: {
        kind: 'none',
        reason:
          'No FHIR element carries it, because no representation has been chosen. The two ' +
          'candidate targets are the `coding-purpose` extension on the individual coding ' +
          'and the `alternate-codes` extension on the concept; **neither is adopted here**.',
        cite: CODING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'No representation has been chosen. The candidates are adding the openEHR purpose ' +
          'values to the FHIR `coding-purpose` code system, and using openEHR\u2019s own ' +
          'published `term_mapping_purpose` code system directly. **Neither is adopted ' +
          'here**, so nothing is emitted.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives to map back, and the openEHR IG currently binds `purpose` with ' +
          '`required` strength, which is itself considered incorrect and has an open change ' +
          'request to relax it.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'openEHR publishes the value set at ' +
        '`https://specifications.openehr.org/fhir/valueset-term_mapping_purpose` with the ' +
        'codes *public health*, *reimbursement*, and *research study*. The ' +
        '`alternate-codes` extension has also been proposed, as a way of carrying the ' +
        'whole group of alternate codes on the concept rather than one purpose per coding.',
    },
  ],
} satisfies Mapping;

// ── null_flavour ↔ data-absent-reason ────────────────────────────────────────

const nullFlavourToDataAbsentReason = {
  id: 'null-flavour-to-data-absent-reason',
  category: 'coded',
  openehrType: 'NULL_FLAVOUR',
  fhirType: 'data-absent-reason',
  title: 'null_flavour ↔ data-absent-reason',
  scope: 'datatype',
  sources: [OPENEHR_TERMINOLOGY, DAR_EXTENSION, DAR_VALUESET, NULLFLAVOR_CS],
  review: REVIEWED_OPENEHR_ONLY,
  rows: [
    {
      id: 'null-flavour.terminology_id',
      scope: 'datatype',
      openehr: {
        path: 'NULL_FLAVOUR.defining_code.terminology_id',
        cardinality: '1..1',
        type: 'TERMINOLOGY_ID',
        kind: 'element',
        cite: OPENEHR_TERMINOLOGY,
      },
      fhir: [
        {
          path: 'CodeableConcept.coding.system',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          cite: DAR_VALUESET,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'Fixed on each side: openEHR\u2019s own `openehr` terminology, and ' +
        '`http://terminology.hl7.org/CodeSystem/data-absent-reason`. **No local code ' +
        'system or value set is defined by this guide**; both sides are cited to their ' +
        'own publisher.',
    },
    {
      id: 'null-flavour.code_string',
      scope: 'datatype',
      openehr: {
        path: 'NULL_FLAVOUR.defining_code.code_string',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: OPENEHR_TERMINOLOGY,
      },
      fhir: [
        {
          path: 'CodeableConcept.coding.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: DAR_VALUESET,
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'NULL_FLAVOUR.defining_code.code_string',
            reason:
              'openEHR `271` (*no information*) has no data-absent-reason equivalent and ' +
              'falls back to `unknown`, which conflates it with `253`; a request to add ' +
              '*no information* to the FHIR code system has not been made',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'CodeableConcept.coding.code',
            reason:
              'the data-absent-reason code system is broader than openEHR\u2019s ' +
              'null-flavour set, so codes outside the four mapped parents collapse onto ' +
              'their nearest openEHR ancestor',
          },
        ],
      },
      maturity: 'open',
      note:
        'Only L1 codes are mapped explicitly; L2 codes inherit their parent\u2019s ' +
        'mapping. `253` (UNK, *unknown*) ↔ `unknown`, inherited by `asked-unknown`, ' +
        '`temp-unknown`, `not-asked`, `not-a-number`, `negative-infinity`, ' +
        '`positive-infinity`, and `not-performed`. `272` (MSK, *masked*) ↔ `masked`, ' +
        'inherited by `asked-declined` and `not-permitted`. `273` (NA, *not applicable*) ↔ ' +
        '`not-applicable`, inherited by `unsupported`. `271` (NI, *no information*) has no ' +
        'exact counterpart and is the one problematic code.',
    },
    {
      id: 'null-flavour.value',
      scope: 'datatype',
      openehr: {
        path: 'NULL_FLAVOUR.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: OPENEHR_TERMINOLOGY,
      },
      fhir: [
        {
          path: 'CodeableConcept.text',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: CODEABLE_CONCEPT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'The rubric. `NULL_FLAVOUR.value` is mandatory in openEHR, so where FHIR supplies ' +
        'no `text` it SHOULD be resolved from the code through a terminology server.',
    },
    {
      id: 'null-flavour.observation-data-absent-reason',
      scope: 'archetype',
      openehr: {
        path: 'ELEMENT.null_flavour',
        cardinality: '0..1',
        type: 'DV_CODED_TEXT',
        kind: 'element',
        cite: OPENEHR_TERMINOLOGY,
      },
      fhir: [
        {
          path: 'Observation.dataAbsentReason',
          cardinality: '0..1',
          type: 'CodeableConcept',
          kind: 'resource-element',
          when: 'the absent value is an `Observation.value[x]`',
          cite: OBS_DAR,
        },
        {
          path: 'Element.extension[data-absent-reason]',
          cardinality: '0..1',
          kind: 'extension',
          when: 'the absent value is any other element',
          cite: ext('data-absent-reason', 'FHIR Extensions — data-absent-reason'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`archetype` scope: which of the two homes applies is decided by the element the ' +
        'value would have occupied, not by the data type. `Observation.dataAbsentReason` ' +
        'is a first-class element; everywhere else the generic extension is used. ' +
        'data-absent-reason is the current guidance, confirmed against national IGs.',
    },
    {
      id: 'fhir:iso21090-nullflavor',
      scope: 'datatype',
      openehr: {
        path: 'ELEMENT.null_flavour',
        cardinality: '0..1',
        type: 'DV_CODED_TEXT',
        kind: 'element',
        cite: OPENEHR_TERMINOLOGY,
      },
      fhir: [
        {
          path: 'Element.extension[iso21090-nullFlavor]',
          cardinality: '0..1',
          kind: 'extension',
          cite: ext('iso21090-nullFlavor', 'FHIR Extensions — iso21090-nullFlavor'),
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'data-absent-reason is the current guidance and is what this guide emits. The ' +
          'v3 NullFlavor extension is read on input but not produced on output.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Element.extension[iso21090-nullFlavor]',
            reason:
              'the v3 hierarchy is deeper than openEHR\u2019s: `NI` and `INV` (with its ' +
              'children `DER`, `OTH`, `UNC`, `NINF`, `PINF`) all collapse onto `271`, and ' +
              '`UNK` with `ASKU`, `NASK`, `NAVU`, `QS`, `TRC`, and `NAV` all collapse onto ' +
              '`253`',
          },
        ],
      },
      maturity: 'open',
      note:
        '`MSK` → `272` and `NA` → `273` are direct. `NP` (*not present*) is retired and ' +
        'message-layer only, and is out of scope. openEHR intends to support both FHIR ' +
        'value sets, with the back-transformation keyed on which code system is present.',
    },
  ],
} satisfies Mapping;

export default [
  codePhraseToCoding,
  dvCodedTextToCodeableConcept,
  termMappingToCoding,
  nullFlavourToDataAbsentReason,
] satisfies readonly Mapping[];
