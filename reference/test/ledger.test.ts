import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  Cite,
  Endpoint,
  Mapping,
  Review,
  Row,
  Verdict,
} from '../src/model/types.ts';
import { validateLedger } from '../src/model/validate.ts';

/**
 * Every rule in `validate.ts` rejects a crafted violation, and every rule the
 * *types* enforce is pinned with a `@ts-expect-error`.
 *
 * The `@ts-expect-error` block is the load-bearing part. The whole justification
 * for authoring the ledger as TypeScript rather than as schema-validated data is
 * that the invariants become compile errors. If contextual typing ever stops
 * applying, those errors disappear, `tsc` reports the *unused* expectations, and
 * `npm --prefix reference run typecheck` fails. That is the alarm.
 */

const RM_DATA_TYPES = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const R5_DATATYPES = 'https://hl7.org/fhir/R5/datatypes.html';

const OPENEHR_CITE: Cite = {
  url: `${RM_DATA_TYPES}#_dv_quantity_class`,
  label: 'openEHR RM — DV_QUANTITY',
  verification: 'spec-local',
};

const FHIR_CITE: Cite = {
  url: `${R5_DATATYPES}#Quantity`,
  label: 'FHIR R5 — Quantity',
  verification: 'spec-local',
};

const NO_REVIEW: Review = { openehr: [], fhir: [] };

const OPENEHR_ENDPOINT: Endpoint = {
  path: 'DV_QUANTITY.magnitude',
  cardinality: '1..1',
  type: 'Real',
  kind: 'element',
  cite: OPENEHR_CITE,
};

const FHIR_ENDPOINT: Endpoint = {
  path: 'Quantity.value',
  cardinality: '0..1',
  type: 'decimal',
  kind: 'element',
  cite: FHIR_CITE,
};

const GOOD_ROW: Row = {
  id: 'dv-quantity.magnitude',
  scope: 'datatype',
  openehr: OPENEHR_ENDPOINT,
  fhir: [FHIR_ENDPOINT],
  toFhir: { fidelity: 'lossless' },
  toOpenehr: { fidelity: 'lossless' },
  maturity: 'settled',
};

function mapping(overrides: Partial<Mapping> = {}): Mapping {
  return {
    id: 'dv-quantity-to-quantity',
    category: 'quantity',
    openehrType: 'DV_QUANTITY',
    fhirType: 'Quantity',
    title: 'DV_QUANTITY ↔ Quantity',
    scope: 'datatype',
    sources: [OPENEHR_CITE, FHIR_CITE],
    review: NO_REVIEW,
    rows: [GOOD_ROW],
    ...overrides,
  };
}

/** Assert that at least one reported problem mentions `fragment`. */
function rejects(mappings: readonly Mapping[], fragment: string): void {
  const problems = validateLedger(mappings);
  assert.ok(
    problems.some((p) => p.includes(fragment)),
    `expected a problem mentioning ${JSON.stringify(fragment)}, got:\n${
      problems.map((p) => `  - ${p}`).join('\n') || '  (none)'
    }`,
  );
}

test('a well-formed mapping validates clean', () => {
  assert.deepEqual(validateLedger([mapping()]), []);
});

test('duplicate mapping ids are rejected', () => {
  rejects([mapping(), mapping()], 'duplicate mapping id');
});

test('duplicate row ids are rejected, across mappings', () => {
  rejects(
    [mapping(), mapping({ id: 'dv-count-to-count', openehrType: 'DV_COUNT' })],
    'duplicate row id',
  );
});

test('a mapping id that is not lower-kebab-case is rejected', () => {
  rejects([mapping({ id: 'DV_Quantity_To_Quantity' })], 'lower-kebab-case');
});

test('a build.fhir.org citation is rejected — continuous-build snapshots rot', () => {
  rejects(
    [
      mapping({
        sources: [
          OPENEHR_CITE,
          {
            url: 'https://build.fhir.org/datatypes.html#Quantity',
            label: 'FHIR CI build — Quantity',
            verification: 'spec-remote',
          },
        ],
      }),
    ],
    'not allow-listed',
  );
});

test('an extension citation mis-tiered as spec-local is rejected', () => {
  rejects(
    [
      mapping({
        sources: [
          OPENEHR_CITE,
          {
            url: 'https://hl7.org/fhir/extensions/StructureDefinition-quantity-precision.html',
            label: 'FHIR Extensions — quantity-precision',
            verification: 'spec-local',
          },
        ],
      }),
    ],
    "must be tiered 'extension-unverified'",
  );
});

test("'extension-unverified' on a core page is rejected", () => {
  rejects(
    [
      mapping({
        sources: [
          OPENEHR_CITE,
          { ...FHIR_CITE, verification: 'extension-unverified' },
        ],
      }),
    ],
    "is reserved for",
  );
});

test('a spec-local citation with no spec-mirror-map.ts prefix is rejected', () => {
  rejects(
    [
      mapping({
        sources: [
          OPENEHR_CITE,
          {
            url: 'https://hl7.org/fhir/R5/some-page-nobody-mirrored.html#x',
            label: 'FHIR R5 — unmirrored page',
            verification: 'spec-local',
          },
        ],
      }),
    ],
    'no prefix in spec-mirror-map.ts',
  );
});

test('a THO citation must be spec-remote, never spec-local', () => {
  rejects(
    [
      mapping({
        sources: [
          OPENEHR_CITE,
          {
            url: 'https://terminology.hl7.org/CodeSystem-data-absent-reason.html',
            label: 'THO — data-absent-reason',
            verification: 'spec-local',
          },
        ],
      }),
    ],
    "must be tiered 'spec-remote'",
  );
});

test('a mirrored citation downgraded to spec-remote is rejected', () => {
  rejects(
    [mapping({ sources: [OPENEHR_CITE, { ...FHIR_CITE, verification: 'spec-remote' }] })],
    "must therefore be tiered 'spec-local'",
  );
});

test("a 'not-discussed' row may not claim a fidelity outcome", () => {
  rejects(
    [mapping({ rows: [{ ...GOOD_ROW, maturity: 'not-discussed' }] })],
    'may not claim the fidelity outcome',
  );
});

test("an 'unmapped' verdict on an 'open' row must name an owner", () => {
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            maturity: 'open',
            toFhir: { fidelity: 'unmapped', reason: 'no FHIR home' },
          },
        ],
      }),
    ],
    'must name an owner',
  );
});

test('an orphan drop path is rejected', () => {
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            toFhir: {
              fidelity: 'lossy',
              drops: [{ path: 'SOME_OTHER_TYPE.field', reason: 'not this row' }],
            },
          },
        ],
      }),
    ],
    "is not prefixed by any of the row's",
  );
});

test('a row with no counterpart on either side is rejected', () => {
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            openehr: { kind: 'none', reason: 'none here', cite: OPENEHR_CITE },
            fhir: { kind: 'none', reason: 'none there', cite: FHIR_CITE },
            toFhir: { fidelity: 'unmapped', reason: 'nothing to map' },
            toOpenehr: { fidelity: 'unmapped', reason: 'nothing to map' },
          },
        ],
      }),
    ],
    'no counterpart on either side',
  );
});

test('a multi-target row must say when each target applies', () => {
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            fhir: [FHIR_ENDPOINT, { ...FHIR_ENDPOINT, path: 'Range.low' }],
          },
        ],
      }),
    ],
    "must say 'when' each",
  );
});

test('an empty string is rejected', () => {
  rejects([mapping({ title: '   ' })], 'empty string');
});

test('a non-https citation is rejected', () => {
  rejects(
    [
      mapping({
        sources: [
          OPENEHR_CITE,
          { ...FHIR_CITE, url: 'http://hl7.org/fhir/R5/datatypes.html#Quantity' },
        ],
      }),
    ],
    'must be https',
  );
});

// ── The compile-time guarantee ───────────────────────────────────────────────
// Each expectation below MUST be an error. `tsc` fails if any of them is not,
// which is exactly the alarm that fires if contextual typing stops applying.

test('the type model makes the ledger invariants compile errors', () => {
  // @ts-expect-error A `lossy` verdict SHALL name exactly what is lost.
  const lossyWithNoDrops: Verdict = { fidelity: 'lossy' };

  // @ts-expect-error `drops` is a non-empty tuple; an empty list names nothing.
  const lossyWithEmptyDrops: Verdict = { fidelity: 'lossy', drops: [] };

  // @ts-expect-error An `unmapped` verdict must state its reason.
  const unmappedWithNoReason: Verdict = { fidelity: 'unmapped' };

  // @ts-expect-error There are exactly three fidelity values; `n/a` is not one.
  const fourthFidelityValue: Verdict = { fidelity: 'n/a' };

  // @ts-expect-error An endpoint must carry a citation.
  const endpointWithNoCite: Endpoint = { path: 'Quantity.value', kind: 'element' };

  // @ts-expect-error A row must carry a verdict in BOTH directions.
  const rowWithOneDirection: Row = {
    id: 'x.y',
    scope: 'datatype',
    openehr: OPENEHR_ENDPOINT,
    fhir: [FHIR_ENDPOINT],
    toFhir: { fidelity: 'lossless' },
    maturity: 'settled',
  };

  // @ts-expect-error A mapping's `fhir` side may not be an empty tuple.
  const rowWithNoFhirTarget: Row = { ...GOOD_ROW, fhir: [] };

  assert.ok(
    [
      lossyWithNoDrops,
      lossyWithEmptyDrops,
      unmappedWithNoReason,
      fourthFidelityValue,
      endpointWithNoCite,
      rowWithOneDirection,
      rowWithNoFhirTarget,
    ].length === 7,
  );
});
