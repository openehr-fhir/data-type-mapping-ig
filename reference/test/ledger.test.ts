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
import { isNoCounterpart } from '../src/model/types.ts';
import { ledger } from '../src/model/load.ts';
import { FHIR_NO_COUNTERPART_ID, validateLedger } from '../src/model/validate.ts';

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

test('an archetype-scope row whose FHIR side is an ordinary element is rejected', () => {
  rejects(
    [mapping({ rows: [{ ...GOOD_ROW, scope: 'archetype' }] })],
    "must have a FHIR endpoint of kind 'resource-element'",
  );
});

test('an archetype-scope row with a resource-element target is accepted', () => {
  const row: Row = {
    ...GOOD_ROW,
    scope: 'archetype',
    fhir: [{ ...FHIR_ENDPOINT, path: 'Observation.value', kind: 'resource-element' }],
  };
  assert.deepEqual(validateLedger([mapping({ rows: [row] })]), []);
});

test('a FHIR type this guide maps may not also be published as having no counterpart', () => {
  const inventory = mapping({
    id: FHIR_NO_COUNTERPART_ID,
    openehrType: '(none)',
    fhirType: 'Address and others',
    rows: [
      {
        id: 'fhir:quantity',
        scope: 'datatype',
        openehr: { kind: 'none', reason: 'openEHR has no such type.', cite: OPENEHR_CITE },
        fhir: [{ ...FHIR_ENDPOINT, path: 'Quantity' }],
        toFhir: { fidelity: 'unmapped', reason: 'Nothing produces one.', owner: 'working-group' },
        toOpenehr: { fidelity: 'unmapped', reason: 'Nothing receives one.', owner: 'working-group' },
        maturity: 'open',
      },
    ],
  });
  rejects([mapping(), inventory], 'is published as having no openEHR counterpart');
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

test('a delegates entry naming no mapping is rejected', () => {
  rejects(
    [mapping({ rows: [{ ...GOOD_ROW, delegates: ['no-such-mapping'] }] })],
    "delegates to 'no-such-mapping'",
  );
});

test('a drop that only string-prefixes an anchor is rejected', () => {
  // `Coding.versionable` is a sibling of `Coding.version`, not a descendant. A
  // bare `startsWith` admits it, which matters more now that `delegates` widens
  // the anchor set.
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            fhir: [{ ...FHIR_ENDPOINT, path: 'Coding.version' }],
            toFhir: {
              fidelity: 'lossy',
              drops: [{ path: 'Coding.versionable', reason: 'a sibling, not a descendant' }],
            },
          },
        ],
      }),
    ],
    "is not prefixed by any of the row's",
  );
});

test('a delegated drop is admitted by the delegate mapping own endpoints', () => {
  const inner = mapping({
    id: 'code-phrase-to-coding',
    openehrType: 'CODE_PHRASE',
    fhirType: 'Coding',
    rows: [
      {
        ...GOOD_ROW,
        id: 'code-phrase.terminology_id',
        openehr: { ...OPENEHR_ENDPOINT, path: 'CODE_PHRASE.terminology_id' },
        fhir: [{ ...FHIR_ENDPOINT, path: 'Coding.version' }],
      },
    ],
  });
  const outer = mapping({
    rows: [
      {
        ...GOOD_ROW,
        delegates: ['code-phrase-to-coding'],
        toOpenehr: {
          fidelity: 'lossy',
          drops: [{ path: 'Coding.version', reason: 'carried forward from the inner mapping' }],
        },
      },
    ],
  });
  assert.deepEqual(validateLedger([outer, inner]), []);
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

test('a spec-local endpoint citation with no anchor is rejected', () => {
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            fhir: [{ ...FHIR_ENDPOINT, cite: { ...FHIR_CITE, url: R5_DATATYPES } }],
          },
        ],
      }),
    ],
    'must resolve to an anchor, not merely to a page',
  );
});

test('an anchorless endpoint citation is accepted only with a written reason', () => {
  const row: Row = {
    ...GOOD_ROW,
    fhir: [
      {
        ...FHIR_ENDPOINT,
        cite: {
          ...FHIR_CITE,
          url: R5_DATATYPES,
          anchorless: 'R5 defines no such type, so there is no anchor to point at.',
        },
      },
    ],
  };
  assert.deepEqual(validateLedger([mapping({ rows: [row] })]), []);
});

test('an anchorless reason on a citation that does have an anchor is rejected', () => {
  rejects(
    [
      mapping({
        rows: [
          {
            ...GOOD_ROW,
            fhir: [
              {
                ...FHIR_ENDPOINT,
                cite: { ...FHIR_CITE, anchorless: 'there is an anchor, though' },
              },
            ],
          },
        ],
      }),
    ],
    "carries a fragment and an 'anchorless' reason",
  );
});

// ── One attribute, one declaring class ───────────────────────────────────────

/**
 * An openEHR attribute is declared on exactly **one** class, so every row that
 * names the same attribute has to cite the same one.
 *
 * The key is the **full** openEHR endpoint path with any `[qualifier]`
 * stripped, so `DV_QUANTITY.magnitude_status[~]` and
 * `DV_QUANTITY.magnitude_status` collapse to one key. It is deliberately *not*
 * the bare attribute suffix: measured over this ledger, twelve suffixes collide
 * and eleven of those collisions are legitimate — `value` alone has sixteen
 * distinct declaring classes — so a suffix-keyed rule would need a large
 * exception map and would stop being a gate. Keyed on the full path it needs no
 * exception map at all, which is the property that makes it worth having.
 *
 * Scoped to `data_types.html` citations: an attribute cited to another
 * specification page is naming a different kind of fact.
 */
const RM_DATA_TYPES_PAGE =
  'https://specifications.openehr.org/releases/RM/latest/data_types.html';

test('an openEHR attribute is cited to one declaring class, everywhere it appears', () => {
  const byPath = new Map<string, Map<string, string[]>>();

  for (const entry of ledger()) {
    for (const row of entry.rows) {
      if (isNoCounterpart(row.openehr)) continue;
      const { url } = row.openehr.cite;
      if (!url.startsWith(RM_DATA_TYPES_PAGE)) continue;

      const key = row.openehr.path.replace(/\[[^\]]*\]/g, '');
      const anchor = url.slice(RM_DATA_TYPES_PAGE.length) || '(no fragment)';
      const anchors = byPath.get(key) ?? new Map<string, string[]>();
      anchors.set(anchor, [...(anchors.get(anchor) ?? []), `${entry.id}/${row.id}`]);
      byPath.set(key, anchors);
    }
  }

  const collisions: string[] = [];
  for (const [path, anchors] of byPath) {
    if (anchors.size <= 1) continue;
    const detail = [...anchors.entries()]
      .map(([anchor, rows]) => `    ${anchor} — ${rows.join(', ')}`)
      .join('\n');
    collisions.push(`  ${path} is cited to ${anchors.size} different classes:\n${detail}`);
  }

  assert.ok(byPath.size > 0, 'no openEHR endpoint was inspected — the gate is inert');
  assert.deepEqual(
    collisions,
    [],
    'every row naming the same openEHR attribute must cite the class that declares ' +
      `it:\n${collisions.join('\n')}`,
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


// ── inherited attributes: one class, one behaviour, everywhere it is inherited ─

/**
 * An openEHR attribute inherited from an ancestor class behaves the same way in
 * every heir, so every heir has to **state** it, and state it the same way.
 *
 * `H18` survived two remediations because both fixed named sites. `2a6770a`
 * retargeted six `magnitude_status` citations and left the verdict; `a699db5`
 * split `normal_status` out for `DV_ORDINAL` and `DV_SCALE` on exactly the
 * ground that a folded note "asserted that `normal_status` follows the
 * `DV_QUANTITY` pattern while carrying a verdict that pattern does not have" —
 * and did not visit `DV_COUNT`, which still did. These three assertions gate the
 * **class** of defect instead: they are derived from the ledger, so they find
 * the sites rather than being told them.
 *
 * A row carries an inherited attribute when the class prefix of its openEHR path
 * differs from the class its own citation names. The citation is the authority,
 * because `a699db5`'s companion rule already forces every row naming one
 * attribute to cite the class that declares it.
 *
 * **One refinement, and it is a correctness fix rather than an exception.** Some
 * rows cite the class of the attribute's *type* — `DV_TEXT.language` is a
 * `CODE_PHRASE` and cites `#_code_phrase_class` — and a type is not an ancestor.
 * Those rows are excluded by comparing the cited class with the row's own
 * declared `type`, which is data the row already carries. No list is written
 * down anywhere in this gate.
 */

const CLASS_ANCHOR = /#_(.+)_class(?:$|\?|#)/;

/** The class an endpoint's citation names, when it names one. */
function citedClass(endpoint: Endpoint): string | undefined {
  const match = CLASS_ANCHOR.exec(endpoint.cite.url);
  return match?.[1] === undefined ? undefined : match[1].toUpperCase();
}

/** One row that states an attribute inherited from an ancestor class. */
interface InheritedRow {
  readonly mapping: string;
  readonly row: Row;
  /** The class that declares the attribute. */
  readonly declaringClass: string;
  /** The attribute leaf this row states. */
  readonly leaf: string;
  /** Every leaf this row covers: its own, plus the siblings it declares. */
  readonly covers: readonly string[];
}

function inheritedRows(): readonly InheritedRow[] {
  const out: InheritedRow[] = [];
  for (const mapping of ledger()) {
    for (const row of mapping.rows) {
      if (isNoCounterpart(row.openehr)) continue;
      const endpoint = row.openehr;
      const dot = endpoint.path.indexOf('.');
      if (dot < 0) continue;
      const pathClass = endpoint.path.slice(0, dot);
      const leaf = endpoint.path.slice(dot + 1);
      // A bracketed sub-case names a value class of an attribute, not an
      // attribute; its parent row is the one that states the attribute.
      if (leaf === '' || /[[\]]/.test(leaf)) continue;
      const declaringClass = citedClass(endpoint);
      if (declaringClass === undefined || declaringClass === pathClass) continue;
      // The citation names the attribute's own type, not a declaring ancestor.
      if (endpoint.type !== undefined && endpoint.type.toUpperCase() === declaringClass) continue;
      out.push({
        mapping: mapping.id,
        row,
        declaringClass,
        leaf,
        covers: [leaf, ...(endpoint.alsoCovers ?? [])],
      });
    }
  }
  return out;
}

/** Every leaf any row states for a declaring class. */
function declaredLeaves(rows: readonly InheritedRow[]): ReadonlySet<string> {
  const leaves = new Set<string>();
  for (const entry of rows) for (const leaf of entry.covers) leaves.add(leaf);
  return leaves;
}

function byDeclaringClass(): ReadonlyMap<string, readonly InheritedRow[]> {
  const grouped = new Map<string, InheritedRow[]>();
  for (const entry of inheritedRows()) {
    grouped.set(entry.declaringClass, [...(grouped.get(entry.declaringClass) ?? []), entry]);
  }
  return grouped;
}

test('every heir of a class states every attribute that class declares', () => {
  const problems: string[] = [];
  for (const [declaringClass, rows] of byDeclaringClass()) {
    const declared = declaredLeaves(rows);
    const mappings = new Set(rows.map((entry) => entry.mapping));
    for (const mapping of mappings) {
      const covered = new Set(
        rows.filter((entry) => entry.mapping === mapping).flatMap((entry) => entry.covers),
      );
      for (const leaf of declared) {
        if (covered.has(leaf)) continue;
        problems.push(
          `${mapping}: states some of ${declaringClass} but not ${declaringClass}.${leaf}`,
        );
      }
    }
  }
  assert.ok(byDeclaringClass().size > 0, 'no inherited attribute was found — the gate is inert');
  assert.deepEqual(
    problems.sort(),
    [],
    'an inherited attribute either has a row of its own or is declared covered by a ' +
      `sibling endpoint's alsoCovers:\n${problems.sort().join('\n')}`,
  );
});

test('one inherited attribute carries one verdict pair, or says why it does not', () => {
  const problems: string[] = [];
  for (const [declaringClass, rows] of byDeclaringClass()) {
    for (const leaf of declaredLeaves(rows)) {
      const covering = rows.filter((entry) => entry.covers.includes(leaf));
      const pairs = new Map<string, string[]>();
      for (const entry of covering) {
        if (entry.row.divergence !== undefined) continue;
        const key = `${entry.row.toFhir.fidelity}/${entry.row.toOpenehr.fidelity}`;
        pairs.set(key, [...(pairs.get(key) ?? []), `${entry.mapping}/${entry.row.id}`]);
      }
      if (pairs.size <= 1) continue;
      const detail = [...pairs.entries()]
        .map(([pair, ids]) => `    ${pair} — ${ids.join(', ')}`)
        .join('\n');
      problems.push(`  ${declaringClass}.${leaf} carries ${pairs.size} verdict pairs:\n${detail}`);
    }
  }
  assert.deepEqual(
    problems,
    [],
    'an inherited attribute behaves the same way in every heir; a row that genuinely ' +
      `diverges records a reason in 'divergence':\n${problems.join('\n')}`,
  );
});

test('a divergence reason is a reason, not an empty field', () => {
  const silent = ledger()
    .flatMap((mapping) => mapping.rows.map((row) => ({ mapping: mapping.id, row })))
    .filter(({ row }) => row.divergence !== undefined && row.divergence.trim() === '')
    .map(({ mapping, row }) => `${mapping}/${row.id}`);
  assert.deepEqual(silent, [], `divergence with no reason: ${silent.join(', ')}`);
});

test('a row does not name an inherited attribute its own mapping leaves uncovered', () => {
  const problems: string[] = [];
  for (const [declaringClass, rows] of byDeclaringClass()) {
    const declared = declaredLeaves(rows);
    for (const entry of rows) {
      const note = entry.row.note;
      if (note === undefined) continue;
      const covered = new Set(
        rows.filter((other) => other.mapping === entry.mapping).flatMap((other) => other.covers),
      );
      for (const leaf of declared) {
        if (covered.has(leaf)) continue;
        // A membership test over the ledger's own leaves, with word boundaries
        // so a leaf cannot match inside a longer identifier.
        if (!new RegExp(`\\b${leaf}\\b`).test(note)) continue;
        problems.push(
          `${entry.mapping}/${entry.row.id}: the note names ${declaringClass}.${leaf}, ` +
            'which this mapping does not cover',
        );
      }
    }
  }
  assert.deepEqual(
    problems.sort(),
    [],
    'a coverage claim that lives only in prose is a claim nothing checks:\n' +
      problems.sort().join('\n'),
  );
});