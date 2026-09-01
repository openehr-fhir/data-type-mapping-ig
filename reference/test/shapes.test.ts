import test from 'node:test';
import assert from 'node:assert/strict';

import type { Cite, Mapping, Review } from '../src/model/types.ts';
import { validateLedger } from '../src/model/validate.ts';

/**
 * The five mapping shapes the approach judge named as the ledger model's main
 * risk, exercised **before any content row exists** so the model breaks here
 * rather than after ~400 rows are authored against it.
 *
 * These are throwaway in-test fixtures, **not ledger content**. The real rows
 * land in Phases 5, 6, and 12.
 */

const RM_DATA_TYPES = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const R5_DATATYPES = 'https://hl7.org/fhir/R5/datatypes.html';

function openehrCite(anchor: string, label: string): Cite {
  return { url: `${RM_DATA_TYPES}#${anchor}`, label, verification: 'spec-local' };
}

function fhirCite(anchor: string, label: string): Cite {
  return { url: `${R5_DATATYPES}#${anchor}`, label, verification: 'spec-local' };
}

const NO_REVIEW: Review = { openehr: [], fhir: [] };

/** Shape 1 — a scenario-dependent target: two FHIR endpoints, each with a `when`. */
const SCENARIO_DEPENDENT = {
  id: 'shape-scenario-dependent',
  category: 'coded',
  openehrType: 'DV_CODED_TEXT',
  fhirType: 'Coding | CodeableConcept',
  title: 'Shape: scenario-dependent target',
  scope: 'datatype',
  sources: [openehrCite('_dv_coded_text_class', 'openEHR RM — DV_CODED_TEXT')],
  review: NO_REVIEW,
  rows: [
    {
      id: 'shape.dv-coded-text.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_CODED_TEXT.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: openehrCite('_dv_coded_text_class', 'openEHR RM — DV_CODED_TEXT.value'),
      },
      fhir: [
        {
          path: 'Coding.display',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          when: '`value` equals the rubric of `defining_code` in the stated language',
          cite: fhirCite('Coding', 'FHIR R5 — Coding.display'),
        },
        {
          path: 'CodeableConcept.text',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          when: '`value` differs from the rubric of `defining_code`',
          cite: fhirCite('CodeableConcept', 'FHIR R5 — CodeableConcept.text'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
    },
  ],
} satisfies Mapping;

/** Shape 2 — a polymorphic target: one openEHR type, three FHIR types. */
const POLYMORPHIC = {
  id: 'shape-polymorphic',
  category: 'quantity',
  openehrType: 'DV_INTERVAL',
  fhirType: 'Period | Range | Quantity',
  title: 'Shape: polymorphic target',
  scope: 'datatype',
  sources: [openehrCite('_dv_interval_class', 'openEHR RM — DV_INTERVAL')],
  review: NO_REVIEW,
  rows: [
    {
      id: 'shape.dv-interval.lower',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.lower',
        cardinality: '0..1',
        kind: 'element',
        cite: openehrCite('_interval_class', 'openEHR RM — Interval.lower'),
      },
      fhir: [
        {
          path: 'Period.start',
          kind: 'element',
          when: 'the interval limits are `DV_DATE_TIME`, `DV_DATE`, or `DV_TIME`',
          cite: fhirCite('Period', 'FHIR R5 — Period.start'),
        },
        {
          path: 'Range.low',
          kind: 'element',
          when: 'the interval limits are `DV_QUANTITY` and both bounds are present',
          cite: fhirCite('Range', 'FHIR R5 — Range.low'),
        },
        {
          path: 'Quantity.value',
          kind: 'element',
          when: 'only one bound is present and it is carried as a comparator Quantity',
          cite: fhirCite('Quantity', 'FHIR R5 — Quantity.value'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
    },
  ],
} satisfies Mapping;

/** Shape 3 — a one-to-many fan-out: one openEHR field, several FHIR homes. */
const FAN_OUT = {
  id: 'shape-fan-out',
  category: 'coded',
  openehrType: 'TERM_MAPPING',
  fhirType: 'CodeableConcept.coding',
  title: 'Shape: one-to-many fan-out',
  scope: 'datatype',
  sources: [openehrCite('_term_mapping_class', 'openEHR RM — TERM_MAPPING')],
  review: NO_REVIEW,
  rows: [
    {
      id: 'shape.term-mapping.purpose',
      scope: 'datatype',
      openehr: {
        path: 'TERM_MAPPING.purpose',
        cardinality: '0..1',
        kind: 'element',
        cite: openehrCite('_term_mapping_class', 'openEHR RM — TERM_MAPPING.purpose'),
      },
      fhir: [
        {
          path: 'CodeableConcept.coding.extension[coding-purpose]',
          kind: 'extension',
          when: 'the purpose is carried on the individual coding',
          cite: {
            url: 'https://hl7.org/fhir/extensions/StructureDefinition-coding-purpose.html',
            label: 'FHIR Extensions — coding-purpose',
            verification: 'extension-unverified',
          },
        },
        {
          path: 'CodeableConcept.extension[alternate-codes]',
          kind: 'extension',
          when: 'the alternate codes are carried as a group on the concept',
          cite: {
            url: 'https://hl7.org/fhir/extensions/StructureDefinition-alternate-codes.html',
            label: 'FHIR Extensions — alternate-codes',
            verification: 'extension-unverified',
          },
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'CodeableConcept.coding.extension[coding-purpose]',
            reason:
              'openEHR constrains TERM_MAPPING.purpose to a fixed terminology group, so a ' +
              'purpose coded outside it cannot be carried back.',
          },
        ],
      },
      maturity: 'open',
    },
  ],
} satisfies Mapping;

/** Shape 4 — a resource-level target, which is why `scope` exists. */
const RESOURCE_LEVEL = {
  id: 'shape-resource-level',
  category: 'quantity',
  openehrType: 'DV_ORDINAL',
  fhirType: 'Observation.component',
  title: 'Shape: resource-level target',
  scope: 'archetype',
  sources: [openehrCite('_dv_ordinal_class', 'openEHR RM — DV_ORDINAL')],
  review: NO_REVIEW,
  rows: [
    {
      id: 'shape.dv-ordinal.value',
      scope: 'archetype',
      openehr: {
        path: 'DV_ORDINAL.value',
        cardinality: '1..1',
        type: 'Integer',
        kind: 'element',
        cite: openehrCite('_dv_ordinal_class', 'openEHR RM — DV_ORDINAL.value'),
      },
      fhir: [
        {
          path: 'Observation.component.valueInteger',
          kind: 'resource-element',
          cite: {
            url: 'https://hl7.org/fhir/R5/observation.html#Observation.component',
            label: 'FHIR R5 — Observation.component',
            verification: 'spec-local',
          },
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note: 'Not expressible at the data-type level: the ordinal is split across two components.',
    },
  ],
} satisfies Mapping;

/** Shape 5 — a FHIR type with no openEHR counterpart at all. */
const NO_COUNTERPART = {
  id: 'shape-no-counterpart',
  category: 'gaps',
  openehrType: '(none)',
  fhirType: 'Address',
  title: 'Shape: no counterpart',
  scope: 'datatype',
  sources: [fhirCite('Address', 'FHIR R5 — Address')],
  review: NO_REVIEW,
  rows: [
    {
      id: 'shape.fhir:address',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          'The openEHR RM has no postal-address data type; addresses are modelled in ' +
          'demographic archetypes rather than in the Data Types Information Model.',
        cite: openehrCite('_data_types_information_model', 'openEHR RM — Data Types inventory'),
      },
      fhir: [
        {
          path: 'Address',
          kind: 'element',
          cite: fhirCite('Address', 'FHIR R5 — Address'),
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'Nothing in the openEHR data types produces an Address.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'An incoming Address has no openEHR data type to land in.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
    },
  ],
} satisfies Mapping;

const SHAPES = [
  SCENARIO_DEPENDENT,
  POLYMORPHIC,
  FAN_OUT,
  RESOURCE_LEVEL,
  NO_COUNTERPART,
] satisfies readonly Mapping[];

for (const shape of SHAPES) {
  test(`the ledger model expresses ${shape.title.toLowerCase()}`, () => {
    assert.deepEqual(validateLedger([shape]), []);
  });
}

test('all five hard shapes validate together', () => {
  assert.deepEqual(validateLedger(SHAPES), []);
});

test('a scenario-dependent row keeps every target and its condition', () => {
  const row = SCENARIO_DEPENDENT.rows[0];
  assert.ok(row);
  assert.ok(Array.isArray(row.fhir));
  assert.equal(row.fhir.length, 2);
  for (const endpoint of row.fhir) assert.ok(endpoint.when);
});

test('a resource-level row is scoped to an archetype', () => {
  assert.equal(RESOURCE_LEVEL.scope, 'archetype');
  const row = RESOURCE_LEVEL.rows[0];
  assert.ok(row);
  assert.equal(row.scope, 'archetype');
  assert.equal(row.fhir[0]?.kind, 'resource-element');
});

test('a no-counterpart row still carries both citations', () => {
  const row = NO_COUNTERPART.rows[0];
  assert.ok(row);
  assert.equal(row.openehr.kind, 'none');
  assert.ok('cite' in row.openehr && row.openehr.cite.url.length > 0);
  assert.ok(Array.isArray(row.fhir) && row.fhir[0]?.cite.url.length);
});
