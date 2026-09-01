/**
 * Numeric primitives: the openEHR Foundation Types numeric classes and the
 * FHIR numeric primitives.
 *
 * This category is normally consulted *through* another one — a mapping for
 * `DV_QUANTITY.magnitude` is a `Real` → `decimal` mapping — so the rows here are
 * what make those well defined.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const BASE = 'https://specifications.openehr.org/releases/BASE/latest/foundation_types.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';

function base(anchor: string, label: string): Cite {
  return { url: `${BASE}#${anchor}`, label, verification: 'spec-local' };
}

function r5(anchor: string, label: string): Cite {
  return { url: `${R5}#${anchor}`, label, verification: 'spec-local' };
}

const REVIEW: Review = { openehr: [], fhir: [] };

const INTEGER = base('_integer_class', 'openEHR BASE — Integer');
const INTEGER64 = base('_integer64_class', 'openEHR BASE — Integer64');
const REAL = base('_real_class', 'openEHR BASE — Real');
const DOUBLE = base('_double_class', 'openEHR BASE — Double');
const FHIR_INTEGER = r5('integer', 'FHIR R5 — integer');
const FHIR_INTEGER64 = r5('integer64', 'FHIR R5 — integer64');
const FHIR_DECIMAL = r5('decimal', 'FHIR R5 — decimal');

const integerToInteger = {
  id: 'integer-to-integer',
  category: 'numeric',
  openehrType: 'Integer',
  fhirType: 'integer',
  title: 'Integer ↔ integer',
  scope: 'datatype',
  sources: [INTEGER, FHIR_INTEGER],
  review: REVIEW,
  rows: [
    {
      id: 'integer.value',
      scope: 'datatype',
      openehr: {
        path: 'Integer',
        cardinality: '1..1',
        type: 'Integer',
        kind: 'element',
        cite: INTEGER,
      },
      fhir: [
        {
          path: 'integer',
          cardinality: '0..1',
          type: 'integer',
          kind: 'element',
          cite: FHIR_INTEGER,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'Both are 32-bit signed integers, so the ranges coincide. openEHR Foundation ' +
        'primitives are generally not used directly in archetypes: numbers are carried ' +
        'inside `DV_` wrappers, and this row states what the wrapper\u2019s attribute ' +
        'mapping means.',
    },
  ],
} satisfies Mapping;

const integer64ToInteger64 = {
  id: 'integer64-to-integer64',
  category: 'numeric',
  openehrType: 'Integer64',
  fhirType: 'integer64',
  title: 'Integer64 ↔ integer64',
  scope: 'datatype',
  sources: [INTEGER64, FHIR_INTEGER64, FHIR_INTEGER],
  review: REVIEW,
  rows: [
    {
      id: 'integer64.value',
      scope: 'datatype',
      openehr: {
        path: 'Integer64',
        cardinality: '1..1',
        type: 'Integer64',
        kind: 'element',
        cite: INTEGER64,
      },
      fhir: [
        {
          path: 'integer64',
          cardinality: '0..1',
          type: 'integer64',
          kind: 'element',
          when: 'the target element is typed `integer64`',
          cite: FHIR_INTEGER64,
        },
        {
          path: 'integer',
          cardinality: '0..1',
          type: 'integer',
          kind: 'element',
          when:
            'the target element is typed `integer` and the value is within the 32-bit range',
          cite: FHIR_INTEGER,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`integer64` is **rare in practice**: most FHIR elements holding integer data are ' +
        'typed `integer`. For a 64-bit openEHR attribute it is generally more useful to map ' +
        'in-range values into the designated 32-bit element and use an extension for ' +
        'anything that exceeds it, than to expect an `integer64` element to be there.',
    },
    {
      id: 'integer64.overflow',
      scope: 'datatype',
      openehr: {
        path: 'Integer64[overflow]',
        cardinality: '1..1',
        type: 'Integer64',
        kind: 'element',
        cite: INTEGER64,
      },
      fhir: {
        kind: 'none',
        reason:
          'A value outside the 32-bit range has no home in an element typed `integer`, and ' +
          'FHIR does not permit the type of an element to change per instance.',
        cite: FHIR_INTEGER,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'A value exceeding 2³¹ − 1 cannot be carried in an element typed `integer`. An ' +
          'extension is required, and which extension depends on the element, so no ' +
          'general answer is given here.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives, because nothing was emitted.',
        owner: 'working-group',
      },
      maturity: 'open',
    },
  ],
} satisfies Mapping;

const realToDecimal = {
  id: 'real-to-decimal',
  category: 'numeric',
  openehrType: 'Real / Double',
  fhirType: 'decimal',
  title: 'Real / Double ↔ decimal',
  scope: 'datatype',
  sources: [REAL, DOUBLE, FHIR_DECIMAL],
  review: REVIEW,
  rows: [
    {
      id: 'real.value',
      scope: 'datatype',
      openehr: {
        path: 'Real',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: REAL,
      },
      fhir: [
        {
          path: 'decimal',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: FHIR_DECIMAL,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'decimal',
            reason:
              'FHIR treats trailing zeros in the lexical form of a `decimal` as significant; ' +
              'openEHR `Real` and `Double` do not carry lexical precision at all, so the ' +
              'significance is lost unless a receiving `DV_QUANTITY.precision` is available ' +
              'to take it',
          },
        ],
      },
      maturity: 'settled',
      note:
        'Where precision must survive a round trip, either write the value with explicit ' +
        'trailing zeros or carry it in the `quantity-precision` extension; see ' +
        '[Quantities](mapping-quantity.html). `Double` maps to `decimal` on the same terms ' +
        'as `Real`. Care is needed converting binary floating-point values, whose exact ' +
        'decimal lexical form can widen or narrow the apparent precision of a clinical ' +
        'value.',
    },
  ],
} satisfies Mapping;

export default [
  integerToInteger,
  integer64ToInteger64,
  realToDecimal,
] satisfies readonly Mapping[];
