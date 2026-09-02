/**
 * Quantities: `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, `DV_INTERVAL`,
 * `DV_ORDINAL`, `DV_SCALE`, and the `Money` / `SimpleQuantity` profiles.
 *
 * Every row cites the openEHR *Data Types Information Model* and the FHIR R5
 * data type it maps to, by **published URL**. The local mirrors are the
 * verification target, never the citation text.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

// ── citation helpers ─────────────────────────────────────────────────────────

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';
const R5_OBS = 'https://hl7.org/fhir/R5/observation-definitions.html';
const EXT_PACK = 'https://hl7.org/fhir/extensions/StructureDefinition';

function rm(anchor: string, label: string): Cite {
  return { url: `${RM}#${anchor}`, label, verification: 'spec-local' };
}

function r5(anchor: string, label: string): Cite {
  return { url: `${R5}#${anchor}`, label, verification: 'spec-local' };
}

function obs(anchor: string, label: string): Cite {
  return { url: `${R5_OBS}#${anchor}`, label, verification: 'spec-local' };
}

function ext(name: string, label: string): Cite {
  return {
    url: `${EXT_PACK}-${name}.html`,
    label,
    verification: 'extension-unverified',
  };
}

function jira(ticket: string): Cite {
  return {
    url: `https://jira.hl7.org/browse/${ticket}`,
    label: `HL7 Jira — ${ticket}`,
    verification: 'spec-remote',
  };
}

const DV_QUANTITY = rm('_dv_quantity_class', 'openEHR RM — DV_QUANTITY');
const DV_AMOUNT = rm('_dv_amount_class', 'openEHR RM — DV_AMOUNT');
const DV_ORDERED = rm('_dv_ordered_class', 'openEHR RM — DV_ORDERED');
const DV_QUANTIFIED = rm('_dv_quantified_class', 'openEHR RM — DV_QUANTIFIED');
const QUANTITY = r5('Quantity', 'FHIR R5 — Quantity');

const REVIEWED_BOTH: Review = {
  openehr: ['Diego', 'Ian'],
  fhir: ['Gino'],
};

const REVIEWED_OPENEHR_ONLY: Review = {
  openehr: ['Diego', 'Ian'],
  fhir: [],
};

const REVIEWED_NEITHER: Review = { openehr: [], fhir: [] };

/**
 * The mandatory-attribute rule, cross-referenced from every row it governs.
 * Appended to a row note rather than restated, so the wording cannot drift.
 */
const MANDATORY_RULE =
  ' The openEHR attribute is **mandatory** and the FHIR element is optional, so an ' +
  'incoming instance that omits it cannot be converted: the reference implementation ' +
  'produces **nothing** rather than inventing a value. See ' +
  '[the mandatory-attribute rule](conventions.html#mandatory-attributes).';

// ── DV_QUANTITY ↔ Quantity ───────────────────────────────────────────────────

const dvQuantityToQuantity = {
  id: 'dv-quantity-to-quantity',
  category: 'quantity',
  openehrType: 'DV_QUANTITY',
  fhirType: 'Quantity',
  title: 'DV_QUANTITY ↔ Quantity',
  scope: 'datatype',
  sources: [DV_QUANTITY, QUANTITY, DV_ORDERED, DV_QUANTIFIED, DV_AMOUNT],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-quantity.magnitude',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.magnitude',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Quantity.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'Direct equivalence. `magnitude` is mandatory in openEHR and optional in FHIR, so ' +
        'a `Quantity` with no `value` has no `DV_QUANTITY` to become.' + MANDATORY_RULE,
    },
    {
      id: 'dv-quantity.units',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.units',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Quantity.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note: 'The computable unit, normally a UCUM code.' + MANDATORY_RULE,
    },
    {
      id: 'dv-quantity.units_system',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.units_system',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Quantity.system',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'FHIR invariant `qty-3` requires `system` whenever `code` is present, so a mapping ' +
        'engine SHALL supply `http://unitsofmeasure.org` when `units_system` is absent and ' +
        'the units are UCUM. The field itself round-trips exactly whenever it is present; ' +
        'a supplied default arrives back as an explicit `units_system`, which is a ' +
        'normalisation rather than a loss.',
    },
    {
      id: 'dv-quantity.units_display_name',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.units_display_name',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Quantity.unit',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note: 'The human-readable unit label, for example `°C`.',
    },
    {
      id: 'dv-quantity.precision',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.precision',
        cardinality: '0..1',
        type: 'Integer',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Quantity.extension[quantity-precision]',
          cardinality: '0..1',
          type: 'integer',
          kind: 'extension',
          cite: ext('quantity-precision', 'FHIR Extensions — quantity-precision'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'openEHR `precision = -1` (unlimited) is equivalent to the **absence** of the ' +
        'extension in FHIR. Take the most granular precision available across the value ' +
        'and this field in both directions.',
    },
    {
      id: 'dv-quantity.magnitude_status',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.magnitude_status',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTIFIED,
      },
      fhir: [
        {
          path: 'Quantity.comparator',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`<`, `<=`, `>`, and `>=` are direct. openEHR `=` is the point value and is ' +
        'represented in FHIR by the **absence** of `comparator`.',
    },
    {
      id: 'dv-quantity.magnitude_status.approximate',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.magnitude_status[~]',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTIFIED,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR R5 `Quantity.comparator` has no code for "approximate". The `~` code is ' +
          'added in R6 and is not available in an R5 instance.',
        cite: QUANTITY,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'An approximate magnitude cannot be carried in an R5 `Quantity`. FHIR-56000 is ' +
          'resolved and adds `~` in R6, with guidance to state an accuracy range and a ' +
          'default assumption of ±10%; it is not applied in R5.',
        owner: 'FHIR-56000',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing in an R5 instance carries the approximate marker back.',
        owner: 'FHIR-56000',
      },
      maturity: 'open',
      note:
        'R6-era item, recorded as a forward reference and **not** presented as an R5 ' +
        'mapping.',
    },
    {
      id: 'dv-quantity.accuracy',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.accuracy',
        cardinality: '0..1',
        type: 'Real',
        kind: 'element',
        cite: DV_AMOUNT,
      },
      fhir: [
        {
          path: 'Quantity.extension[quantity-accuracy]',
          cardinality: '0..1',
          type: 'Quantity',
          kind: 'extension',
          cite: ext('quantity-accuracy', 'FHIR Extensions — quantity-accuracy'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'Inherited from `DV_AMOUNT`. Agreed as the mapping target but rarely used in ' +
        'practice. The extension declares `value[x]` as a **`Quantity`**, not a `decimal`, ' +
        'so `accuracy_is_percent` is carried too: an accuracy stated as a percentage takes ' +
        'UCUM `%` as the accuracy quantity\u2019s unit, and an absolute one takes the ' +
        'magnitude\u2019s own unit. Reading the extension back, `accuracy_is_percent` is ' +
        '`true` exactly when the accuracy quantity\u2019s code is `%` — **except** where ' +
        'the magnitude\u2019s own unit is `%`, where the two cases are indistinguishable ' +
        'and the flag is not carried at all. That sub-case is the next row.',
    },
    {
      id: 'dv-quantity.accuracy-is-percent.percent-unit',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.accuracy_is_percent[percent-unit]',
        cardinality: '0..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_AMOUNT,
      },
      fhir: [
        {
          path: 'Quantity.extension[quantity-accuracy][percent-unit]',
          cardinality: '0..1',
          type: 'Quantity',
          kind: 'extension',
          cite: ext('quantity-accuracy', 'FHIR Extensions — quantity-accuracy'),
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'The flag is not carried. The `quantity-accuracy` extension\u2019s **only** ' +
          'discriminator is the unit of the accuracy `Quantity`, and where the ' +
          'magnitude\u2019s own unit is already `%` that unit is what an absolute accuracy ' +
          'takes *and* what a relative one takes. The accuracy magnitude is still emitted; ' +
          'the flag beside it is not.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing in the instance says whether the accuracy is absolute or relative, so ' +
          '`accuracy_is_percent` is left **absent** rather than derived. Deriving it would ' +
          'read \u00b12 percentage points on a 45 % value as \u00b12 % *of* 45 — which is ' +
          '\u00b10.9, a different number.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'A named sub-case of the `DV_QUANTITY.accuracy` row above, in the pattern the ' +
        'guide already uses for `DV_QUANTITY.magnitude_status[~]` and ' +
        '`CODE_PHRASE.code_string[whitespace]`. An SpO\u2082 or haematocrit of 45 % with an ' +
        'absolute accuracy of \u00b12 percentage points is the ordinary clinical shape. ' +
        'Resolving it needs a discriminator the extension does not have — a second ' +
        'extension, or a `value[x]` that is not a `Quantity` — so the gap is published ' +
        'rather than closed by a convention this guide would be inventing.',
    },
    {
      id: 'fhir:quantity.comparator.ad',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          'openEHR `magnitude_status` has no value meaning "sufficient as part of a sum"; ' +
          'the RM vocabulary is `<`, `<=`, `>`, `>=`, `~`, and `=`.',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Quantity.comparator[ad]',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: QUANTITY,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'No openEHR value produces `ad`.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'A `Quantity` with `comparator = ad` has no faithful `DV_QUANTITY` form; the ' +
          'comparator is dropped and the magnitude alone would misstate the value.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        'The group read the R5 definition — "the quantity is sufficient for the total ' +
        'quantity to equal the stated amount" — as unclear, and the question of whether it ' +
        'means "approximate" was asked of FHIR and not answered.',
    },
    {
      id: 'dv-quantity.normal_range',
      scope: 'archetype',
      openehr: {
        path: 'DV_QUANTITY.normal_range',
        cardinality: '0..1',
        type: 'DV_INTERVAL<DV_QUANTITY>',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.referenceRange',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.referenceRange', 'FHIR R5 — Observation.referenceRange'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`archetype` scope: the FHIR home is a resource element, not part of `Quantity`. ' +
        'Carried with `referenceRange.type = normal`. Inherited from `DV_AMOUNT` and ' +
        'mapped identically for every subtype.',
    },
    {
      id: 'dv-quantity.other_reference_ranges',
      scope: 'archetype',
      openehr: {
        path: 'DV_QUANTITY.other_reference_ranges',
        cardinality: '0..*',
        type: 'REFERENCE_RANGE<DV_QUANTITY>',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.referenceRange',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.referenceRange', 'FHIR R5 — Observation.referenceRange'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`archetype` scope. `REFERENCE_RANGE.meaning` becomes `referenceRange.type`, which ' +
        'is `≠ normal` for these.',
    },
    {
      id: 'dv-quantity.normal_status',
      scope: 'archetype',
      openehr: {
        path: 'DV_QUANTITY.normal_status',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.interpretation',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.interpretation', 'FHIR R5 — Observation.interpretation'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Observation.interpretation',
            reason:
              'openEHR binds `normal_status` to its `normal_statuses` code system with ' +
              '`required` strength, so an interpretation coded outside that set cannot be ' +
              'carried; a change request to relax the binding to `extensible` is open',
          },
        ],
      },
      maturity: 'open',
      note:
        '`archetype` scope. The openEHR code system derives from an older HL7 v2 release ' +
        'and maps cleanly for the H/L/N codes; a full ConceptMap has not been written.',
    },
  ],
} satisfies Mapping;

// ── DV_COUNT ↔ Count ─────────────────────────────────────────────────────────

const DV_COUNT = rm('_dv_count_class', 'openEHR RM — DV_COUNT');
const COUNT = r5('Count', 'FHIR R5 — Count');

const dvCountToCount = {
  id: 'dv-count-to-count',
  category: 'quantity',
  openehrType: 'DV_COUNT',
  fhirType: 'Count',
  title: 'DV_COUNT ↔ Count',
  scope: 'datatype',
  sources: [DV_COUNT, COUNT, DV_ORDERED, DV_QUANTIFIED, DV_AMOUNT],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-count.magnitude',
      scope: 'datatype',
      openehr: {
        path: 'DV_COUNT.magnitude',
        cardinality: '1..1',
        type: 'Integer',
        kind: 'element',
        cite: DV_COUNT,
      },
      fhir: [
        {
          path: 'Count.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: COUNT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'FHIR `Count` invariant `cnt-3` requires a whole number. Both sides are 32-bit ' +
        'integers in practice, so the range is the same.' + MANDATORY_RULE,
    },
    {
      id: 'dv-count.magnitude_status',
      scope: 'datatype',
      openehr: {
        path: 'DV_COUNT.magnitude_status',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTIFIED,
      },
      fhir: [
        {
          path: 'Count.comparator',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: COUNT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note: 'The same comparator correspondence as `DV_QUANTITY.magnitude_status`.',
    },
    {
      id: 'fhir:count.system',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          '`DV_COUNT` is unitless: the RM defines no `units` or `units_system` on it, and ' +
          'a countable thing carries its meaning in the archetype node, not in a unit.',
        cite: DV_COUNT,
      },
      fhir: [
        {
          path: 'Count.system',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          cite: COUNT,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'No openEHR field produces it. FHIR invariant `cnt-3` fixes it to ' +
          '`http://unitsofmeasure.org`, so a mapping engine supplies the constant.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'The fixed UCUM system carries no information into openEHR.',
      },
      maturity: 'settled',
    },
    {
      id: 'fhir:count.code',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason: '`DV_COUNT` is unitless; see `Count.system`.',
        cite: DV_COUNT,
      },
      fhir: [
        {
          path: 'Count.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: COUNT,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'No openEHR field produces it. FHIR invariant `cnt-3` fixes it to `1`, so a ' +
          'mapping engine supplies the constant.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'The fixed UCUM code `1` carries no information into openEHR.',
      },
      maturity: 'settled',
    },
    {
      id: 'dv-count.dv-amount-inherited',
      scope: 'archetype',
      openehr: {
        path: 'DV_COUNT.normal_range',
        cardinality: '0..1',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.referenceRange',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.referenceRange', 'FHIR R5 — Observation.referenceRange'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`archetype` scope. `normal_range`, `other_reference_ranges`, and `normal_status` ' +
        'are inherited from `DV_ORDERED` and follow the same pattern as `DV_QUANTITY`.',
    },
  ],
} satisfies Mapping;

// ── DV_PROPORTION ↔ Ratio ────────────────────────────────────────────────────

const DV_PROPORTION = rm('_dv_proportion_class', 'openEHR RM — DV_PROPORTION');
const PROPORTION_KIND_CITE = rm('_proportion_kind_class', 'openEHR RM — PROPORTION_KIND');
const RATIO = r5('Ratio', 'FHIR R5 — Ratio');

const dvProportionToRatio = {
  id: 'dv-proportion-to-ratio',
  category: 'quantity',
  openehrType: 'DV_PROPORTION',
  fhirType: 'Ratio',
  title: 'DV_PROPORTION ↔ Ratio',
  scope: 'datatype',
  sources: [DV_PROPORTION, RATIO, PROPORTION_KIND_CITE],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-proportion.numerator',
      scope: 'datatype',
      openehr: {
        path: 'DV_PROPORTION.numerator',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: DV_PROPORTION,
      },
      fhir: [
        {
          path: 'Ratio.numerator.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: RATIO,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing is produced. `DV_PROPORTION.type` is mandatory and no `Ratio` carries a ' +
          'kind discriminator, so no `Ratio` becomes a `DV_PROPORTION` at all and the ' +
          'numerator has nothing to land in. The value itself would carry across; it does ' +
          'not carry across on its own.',
        owner: 'FHIR-56001',
      },
      maturity: 'settled',
      note: 'FHIR carries the numerator as a `Quantity`; openEHR carries a bare decimal.',
    },
    {
      id: 'dv-proportion.denominator',
      scope: 'datatype',
      openehr: {
        path: 'DV_PROPORTION.denominator',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: DV_PROPORTION,
      },
      fhir: [
        {
          path: 'Ratio.denominator.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: RATIO,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing is produced, for the same reason as the numerator: `DV_PROPORTION.type` ' +
          'is mandatory and unsourceable from a `Ratio`, so the denominator has nothing to ' +
          'land in.',
        owner: 'FHIR-56001',
      },
      maturity: 'settled',
      note:
        '`pk_unitary` fixes the denominator to `1` and `pk_percent` fixes it to `100`; ' +
        'both are carried as ordinary denominator values.',
    },
    {
      id: 'dv-proportion.type',
      scope: 'datatype',
      openehr: {
        path: 'DV_PROPORTION.type',
        cardinality: '1..1',
        type: 'PROPORTION_KIND',
        kind: 'element',
        cite: PROPORTION_KIND_CITE,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR `Ratio` has no discriminator saying how the ratio should be read or ' +
          'rendered; `pk_ratio`, `pk_unitary`, `pk_percent`, `pk_fraction`, and ' +
          '`pk_integer_fraction` all serialise the same way.',
        cite: RATIO,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'The kind discriminator is dropped. `pk_unitary` and `pk_percent` survive ' +
          'implicitly through their fixed denominators, but `pk_fraction` and ' +
          '`pk_integer_fraction` are display directives with no FHIR home.',
        owner: 'FHIR-56001',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          '`DV_PROPORTION.type` is mandatory, so an incoming `Ratio` requires the mapping ' +
          'engine to infer a kind from the denominator — `1` implies `pk_unitary`, `100` ' +
          'implies `pk_percent`, anything else `pk_ratio` — which is an inference, not a ' +
          'carried value.',
        owner: 'FHIR-56001',
      },
      maturity: 'open',
      note:
        'The desire is to use the standard `rendered-value` extension; the group found ' +
        'nothing on `Ratio` for fraction display and concluded an extension may be needed. ' +
        'The reference implementation **refuses rather than infers**: because the kind is ' +
        'mandatory and unsourceable, `ratioToDvProportion` produces no `DV_PROPORTION` at ' +
        'all, which is why the numerator, denominator and precision rows are `unmapped` ' +
        'inbound too.',
    },
    {
      id: 'dv-proportion.precision',
      scope: 'datatype',
      openehr: {
        path: 'DV_PROPORTION.precision',
        cardinality: '0..1',
        type: 'Integer',
        kind: 'element',
        cite: DV_PROPORTION,
      },
      fhir: [
        {
          path: 'Ratio.numerator.extension[quantity-precision]',
          cardinality: '0..1',
          type: 'integer',
          kind: 'extension',
          cite: ext('quantity-precision', 'FHIR Extensions — quantity-precision'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing is produced. `DV_PROPORTION.type` is mandatory and unsourceable from a ' +
          '`Ratio`, so no `DV_PROPORTION` is produced and the precision extension has ' +
          'nothing to land in.',
        owner: 'FHIR-56001',
      },
      maturity: 'open',
      note:
        'openEHR carries one precision for the whole proportion; FHIR would carry one per ' +
        '`Quantity`. This guide places it on the numerator and the reverse reads it from ' +
        'there, which round-trips but does not let the two sides differ.',
    },
    {
      id: 'fhir:ratio.units',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          '`DV_PROPORTION` carries bare decimals and no units at all. In openEHR a ' +
          'proportion that needs units is modelled as two `DV_QUANTITY` values at the ' +
          'archetype level instead.',
        cite: DV_PROPORTION,
      },
      fhir: [
        {
          path: 'Ratio.numerator.code',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: RATIO,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'No `DV_PROPORTION` field produces a unit.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'A `Ratio` carrying units — 5 mg per 100 mL — cannot be carried into a ' +
          '`DV_PROPORTION`. A change request to add optional numerator and denominator ' +
          'units to `DV_PROPORTION`, or a new proportion kind that enforces them, is open.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'The same applies to `Ratio.denominator.code`, `Ratio.numerator.system`, and ' +
        '`Ratio.denominator.system`.',
    },
  ],
} satisfies Mapping;

// ── DV_INTERVAL ↔ Range / Period / Quantity ──────────────────────────────────

const DV_INTERVAL = rm('_dv_interval_class', 'openEHR RM — DV_INTERVAL');
const RANGE = r5('Range', 'FHIR R5 — Range');
const PERIOD = r5('Period', 'FHIR R5 — Period');

const dvIntervalToRange = {
  id: 'dv-interval-to-range',
  category: 'quantity',
  openehrType: 'DV_INTERVAL<T>',
  fhirType: 'Range | Period | Quantity',
  title: 'DV_INTERVAL ↔ Range / Period / Quantity',
  scope: 'datatype',
  sources: [DV_INTERVAL, RANGE, PERIOD, QUANTITY],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-interval.lower',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.lower',
        cardinality: '0..1',
        type: 'T : DV_ORDERED',
        kind: 'element',
        cite: DV_INTERVAL,
      },
      fhir: [
        {
          path: 'Range.low',
          cardinality: '0..1',
          type: 'SimpleQuantity',
          kind: 'element',
          when: 'the type parameter is `DV_QUANTITY` or `DV_COUNT`',
          cite: RANGE,
        },
        {
          path: 'Period.start',
          cardinality: '0..1',
          type: 'dateTime',
          kind: 'element',
          when: 'the type parameter is `DV_DATE`, `DV_TIME`, or `DV_DATE_TIME`',
          cite: PERIOD,
        },
        {
          path: 'Quantity.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          when:
            'only one bound is present and the interval is carried as a comparator ' +
            '`Quantity` rather than as a `Range`',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'The FHIR target is chosen by the type parameter, not by the interval itself. ' +
        '`Period` and `Quantity` have search semantics in FHIR; `Range` does not. A bound ' +
        'the reference implementation cannot convert — a `SimpleQuantity` with no `value` ' +
        'or no `code` — stops the whole interval rather than being rewritten as zero; see ' +
        '[the mandatory-attribute rule](conventions.html#mandatory-attributes).',
    },
    {
      id: 'dv-interval.upper',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.upper',
        cardinality: '0..1',
        type: 'T : DV_ORDERED',
        kind: 'element',
        cite: DV_INTERVAL,
      },
      fhir: [
        {
          path: 'Range.high',
          cardinality: '0..1',
          type: 'SimpleQuantity',
          kind: 'element',
          when: 'the type parameter is `DV_QUANTITY` or `DV_COUNT`',
          cite: RANGE,
        },
        {
          path: 'Period.end',
          cardinality: '0..1',
          type: 'dateTime',
          kind: 'element',
          when: 'the type parameter is `DV_DATE`, `DV_TIME`, or `DV_DATE_TIME`',
          cite: PERIOD,
        },
        {
          path: 'Quantity.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          when:
            'only one bound is present and the interval is carried as a comparator ' +
            '`Quantity` rather than as a `Range`',
          cite: QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
    },
    {
      id: 'dv-interval.lower_unbounded',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.lower_unbounded',
        cardinality: '1..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_INTERVAL,
      },
      fhir: [
        {
          path: 'Range.low',
          cardinality: '0..1',
          kind: 'element',
          cite: RANGE,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`true` is represented by the **absence** of the corresponding boundary, which ' +
        'round-trips exactly. The working group confirmed from a CKM review that ' +
        '`*_unbounded` appears only in design-time constraints, not in instance data.',
    },
    {
      id: 'dv-interval.upper_unbounded',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.upper_unbounded',
        cardinality: '1..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_INTERVAL,
      },
      fhir: [
        {
          path: 'Range.high',
          cardinality: '0..1',
          kind: 'element',
          cite: RANGE,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note: '`true` is represented by the absence of `Range.high`.',
    },
    {
      id: 'dv-interval.lower_included',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.lower_included',
        cardinality: '0..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_INTERVAL,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR `Range` and `Period` are **inclusive only**. There is no element on either ' +
          'that expresses an exclusive boundary in instance data.',
        cite: RANGE,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'An exclusive lower boundary cannot be stated in an instance. At design time it ' +
          'is expressed as a FHIRPath constraint in a profile, or by using ' +
          '`Quantity.comparator` instead of a `Range`.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'A FHIR instance never says whether a bound is exclusive, so the flag is set to ' +
          'the FHIR default — inclusive — rather than carried.',
        owner: 'working-group',
      },
      maturity: 'settled',
      note:
        'Decided October 2025 on the evidence of a CKM review: instance data treats every ' +
        'boundary as inclusive. Exclusive boundaries do occur in real laboratory ranges ' +
        'but are rare and are a design-time concern.',
    },
    {
      id: 'dv-interval.upper_included',
      scope: 'datatype',
      openehr: {
        path: 'DV_INTERVAL.upper_included',
        cardinality: '0..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_INTERVAL,
      },
      fhir: {
        kind: 'none',
        reason: 'FHIR `Range` and `Period` are inclusive only; see `lower_included`.',
        cite: RANGE,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason: 'An exclusive upper boundary cannot be stated in an instance.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'A FHIR instance never says whether a bound is exclusive.',
        owner: 'working-group',
      },
      maturity: 'settled',
    },
  ],
} satisfies Mapping;

// ── DV_QUANTITY ↔ Money / MoneyQuantity ──────────────────────────────────────

const MONEY = r5('Money', 'FHIR R5 — Money');

const dvQuantityToMoney = {
  id: 'dv-quantity-to-money',
  category: 'quantity',
  openehrType: 'DV_QUANTITY',
  fhirType: 'Money',
  title: 'DV_QUANTITY ↔ Money / MoneyQuantity',
  scope: 'datatype',
  sources: [DV_QUANTITY, MONEY],
  review: REVIEWED_NEITHER,
  rows: [
    {
      id: 'dv-quantity.money.magnitude',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.magnitude',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Money.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: MONEY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note: 'The monetary amount itself.' + MANDATORY_RULE,
    },
    {
      id: 'dv-quantity.money.units',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.units',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'Money.currency',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: MONEY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'The ISO 4217 currency code is carried in `units`, with `units_system` set to ' +
        '`urn:iso:std:iso:4217`. `MoneyQuantity` is an ordinary `Quantity` profile and ' +
        'maps as `DV_QUANTITY ↔ Quantity` does.' + MANDATORY_RULE,
    },
    {
      id: 'dv-quantity.money.units_system',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.units_system',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR `Money` has no `system` element: the currency system is implicit in the ' +
          '`currency` element\u2019s binding to the FHIR currencies value set.',
        cite: MONEY,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'The constant `urn:iso:std:iso:4217` has no home on `Money` and is not carried.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing in a `Money` instance states the currency system, so the mapping ' +
          'engine supplies the constant rather than carrying it.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'Left to implementation guidance rather than to an archetype: the Archetype ' +
        'Designer tooling does not currently allow `units_system` to be constrained, even ' +
        'though ADL permits it. Two openEHR change requests are open — one for the tooling ' +
        'constraint, one proposing a `Money` data type in the RM.',
    },
  ],
} satisfies Mapping;

// ── DV_QUANTITY ↔ SimpleQuantity ─────────────────────────────────────────────

const SIMPLE_QUANTITY = r5('SimpleQuantity', 'FHIR R5 — SimpleQuantity');

const dvQuantityToSimpleQuantity = {
  id: 'dv-quantity-to-simple-quantity',
  category: 'quantity',
  openehrType: 'DV_QUANTITY',
  fhirType: 'SimpleQuantity',
  title: 'DV_QUANTITY ↔ SimpleQuantity',
  scope: 'datatype',
  sources: [DV_QUANTITY, SIMPLE_QUANTITY],
  review: REVIEWED_OPENEHR_ONLY,
  rows: [
    {
      id: 'dv-quantity.simple.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.magnitude',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: DV_QUANTITY,
      },
      fhir: [
        {
          path: 'SimpleQuantity.value',
          cardinality: '0..1',
          type: 'decimal',
          kind: 'element',
          cite: SIMPLE_QUANTITY,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'Every field except `magnitude_status` maps exactly as `DV_QUANTITY ↔ Quantity` ' +
        'does; `SimpleQuantity` is that mapping with `comparator` forbidden.' +
        MANDATORY_RULE,
    },
    {
      id: 'dv-quantity.simple.magnitude_status',
      scope: 'datatype',
      openehr: {
        path: 'DV_QUANTITY.magnitude_status',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_QUANTIFIED,
      },
      fhir: {
        kind: 'none',
        reason:
          '`SimpleQuantity` forbids `comparator` by invariant `sqty-1`. There is no ' +
          'element to carry a magnitude status into.',
        cite: SIMPLE_QUANTITY,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'A `DV_QUANTITY` carrying `magnitude_status` in a slot whose FHIR target is ' +
          '`SimpleQuantity` is a **modelling error** on the openEHR side. The expectation ' +
          'is that the mapping is refused, not that the status is silently dropped.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'A `SimpleQuantity` never carries a comparator, so nothing arrives.',
      },
      maturity: 'settled',
    },
  ],
} satisfies Mapping;

// ── DV_ORDINAL and DV_SCALE ↔ Observation.component ──────────────────────────

const DV_ORDINAL = rm('_dv_ordinal_class', 'openEHR RM — DV_ORDINAL');
const DV_SCALE = rm('_dv_scale_class', 'openEHR RM — DV_SCALE');
const OBS_COMPONENT = obs('Observation.component', 'FHIR R5 — Observation.component');

const dvOrdinalToObservationComponent = {
  id: 'dv-ordinal-to-observation-component',
  category: 'quantity',
  openehrType: 'DV_ORDINAL',
  fhirType: 'Observation.component',
  title: 'DV_ORDINAL ↔ Observation.component',
  scope: 'archetype',
  sources: [DV_ORDINAL, OBS_COMPONENT],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-ordinal.symbol',
      scope: 'archetype',
      openehr: {
        path: 'DV_ORDINAL.symbol',
        cardinality: '1..1',
        type: 'DV_CODED_TEXT',
        kind: 'element',
        cite: DV_ORDINAL,
      },
      fhir: [
        {
          path: 'Observation.component.valueCodeableConcept',
          cardinality: '0..1',
          kind: 'resource-element',
          when: 'the ordinal is carried as an observation component',
          cite: OBS_COMPONENT,
        },
        {
          path: 'QuestionnaireResponse.item.answer.valueCoding',
          cardinality: '0..1',
          kind: 'resource-element',
          when: 'the ordinal is an answer to a questionnaire item',
          cite: {
            url: 'https://hl7.org/fhir/R5/questionnaireresponse.html#QuestionnaireResponse.item.answer',
            label: 'FHIR R5 — QuestionnaireResponse.item.answer',
            verification: 'spec-local',
          },
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'The coded label of the ordinal value. See [Coded Data](mapping-coded.html) for ' +
        'the `DV_CODED_TEXT` mapping itself.',
    },
    {
      id: 'dv-ordinal.value',
      scope: 'archetype',
      openehr: {
        path: 'DV_ORDINAL.value',
        cardinality: '1..1',
        type: 'Integer',
        kind: 'element',
        cite: DV_ORDINAL,
      },
      fhir: [
        {
          path: 'Observation.component.valueInteger',
          cardinality: '0..1',
          kind: 'resource-element',
          when: 'the score is carried as its own component value',
          cite: OBS_COMPONENT,
        },
        {
          path: 'Observation.component.valueCodeableConcept.coding.extension[itemWeight]',
          cardinality: '0..1',
          kind: 'extension',
          when: 'the score is carried as a weight on the coded symbol',
          cite: ext('itemWeight', 'FHIR Extensions — itemWeight'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'A value carried in the `itemWeight` extension is unlikely to be surfaced by a ' +
        'FHIR search, which matters when choosing between the two shapes.',
    },
    {
      id: 'dv-ordinal.dv-ordered-inherited',
      scope: 'archetype',
      openehr: {
        path: 'DV_ORDINAL.normal_range',
        cardinality: '0..1',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.referenceRange',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.referenceRange', 'FHIR R5 — Observation.referenceRange'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`archetype` scope. `DV_ORDINAL` inherits `normal_range` and ' +
        '`other_reference_ranges` from `DV_ORDERED` like every other ordered value, and ' +
        'both share one `Observation.referenceRange` home and one verdict, which is why ' +
        'they are stated together here. `normal_status` is **not** folded in with them: ' +
        'its FHIR home and its verdict are different, and it has a row of its own below. ' +
        'Without this row the aggregate would read `lossless` while a `DV_ORDINAL` ' +
        'carrying a `normal_range` had nowhere stated to put it.',
    },
    {
      id: 'dv-ordinal.normal_status',
      scope: 'archetype',
      openehr: {
        path: 'DV_ORDINAL.normal_status',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.interpretation',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.interpretation', 'FHIR R5 — Observation.interpretation'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Observation.interpretation',
            reason:
              'openEHR binds `normal_status` to its `normal_statuses` code system with ' +
              '`required` strength, so an interpretation coded outside that set cannot be ' +
              'carried; a change request to relax the binding to `extensible` is open',
          },
        ],
      },
      maturity: 'open',
      note:
        '`archetype` scope. Inherited from `DV_ORDERED` — § 6.2.1 is where `normal_status` ' +
        'is declared — and it follows the `DV_QUANTITY` pattern **including that ' +
        'pattern\u2019s inbound loss**, which is why it is a row of its own rather than a ' +
        'sentence on the reference-range row.',
    },
  ],
} satisfies Mapping;

const dvScaleToObservationComponent = {
  id: 'dv-scale-to-observation-component',
  category: 'quantity',
  openehrType: 'DV_SCALE',
  fhirType: 'Observation.component',
  title: 'DV_SCALE ↔ Observation.component',
  scope: 'archetype',
  sources: [DV_SCALE, OBS_COMPONENT],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-scale.symbol',
      scope: 'archetype',
      openehr: {
        path: 'DV_SCALE.symbol',
        cardinality: '1..1',
        type: 'DV_CODED_TEXT',
        kind: 'element',
        cite: DV_SCALE,
      },
      fhir: [
        {
          path: 'Observation.component.valueCodeableConcept',
          cardinality: '0..1',
          kind: 'resource-element',
          cite: OBS_COMPONENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note: 'The same targets as `DV_ORDINAL.symbol`.',
    },
    {
      id: 'dv-scale.value',
      scope: 'archetype',
      openehr: {
        path: 'DV_SCALE.value',
        cardinality: '1..1',
        type: 'Real',
        kind: 'element',
        cite: DV_SCALE,
      },
      fhir: [
        {
          path: 'Observation.component.valueQuantity',
          cardinality: '0..1',
          kind: 'resource-element',
          when: 'the score is carried as its own component value',
          cite: OBS_COMPONENT,
        },
        {
          path: 'Observation.component.valueCodeableConcept.coding.extension[itemWeight]',
          cardinality: '0..1',
          kind: 'extension',
          when: 'the score is carried as a weight on the coded symbol',
          cite: ext('itemWeight', 'FHIR Extensions — itemWeight'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`DV_SCALE.value` is a `Real`, so unlike `DV_ORDINAL.value` it cannot land in ' +
        '`valueInteger`. The distances between scale points need not be constant.',
    },
    {
      id: 'dv-scale.dv-ordered-inherited',
      scope: 'archetype',
      openehr: {
        path: 'DV_SCALE.normal_range',
        cardinality: '0..1',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.referenceRange',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.referenceRange', 'FHIR R5 — Observation.referenceRange'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        '`archetype` scope. `DV_SCALE` inherits `normal_range` and ' +
        '`other_reference_ranges` from `DV_ORDERED` like every other ordered value, and ' +
        'both share one `Observation.referenceRange` home and one verdict, which is why ' +
        'they are stated together here. `normal_status` is **not** folded in with them: ' +
        'its FHIR home and its verdict are different, and it has a row of its own below. ' +
        'Without this row the aggregate would read `lossless` while a `DV_SCALE` carrying ' +
        'a `normal_range` had nowhere stated to put it.',
    },
    {
      id: 'dv-scale.normal_status',
      scope: 'archetype',
      openehr: {
        path: 'DV_SCALE.normal_status',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_ORDERED,
      },
      fhir: [
        {
          path: 'Observation.interpretation',
          cardinality: '0..*',
          kind: 'resource-element',
          cite: obs('Observation.interpretation', 'FHIR R5 — Observation.interpretation'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Observation.interpretation',
            reason:
              'openEHR binds `normal_status` to its `normal_statuses` code system with ' +
              '`required` strength, so an interpretation coded outside that set cannot be ' +
              'carried; a change request to relax the binding to `extensible` is open',
          },
        ],
      },
      maturity: 'open',
      note:
        '`archetype` scope. Inherited from `DV_ORDERED` — § 6.2.1 is where `normal_status` ' +
        'is declared — and it follows the `DV_QUANTITY` pattern **including that ' +
        'pattern\u2019s inbound loss**, which is why it is a row of its own rather than a ' +
        'sentence on the reference-range row.',
    },
  ],
} satisfies Mapping;

export default [
  dvQuantityToQuantity,
  dvCountToCount,
  dvProportionToRatio,
  dvIntervalToRange,
  dvQuantityToMoney,
  dvQuantityToSimpleQuantity,
  dvOrdinalToObservationComponent,
  dvScaleToObservationComponent,
] satisfies readonly Mapping[];

/** Exported so `roundtrip.test.ts` and the converters cite the same Jira URLs. */
export const QUANTITY_TICKETS: readonly Cite[] = [jira('FHIR-56000'), jira('FHIR-56001')];
