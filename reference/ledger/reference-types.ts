/**
 * Resource-locator data and references: `DV_IDENTIFIER`, `DV_URI` /
 * `DV_EHR_URI`, and `LINK`.
 *
 * The Reference Model is mapped **as published today**. The working group is
 * investigating unifying `LINK`, `PARTY_IDENTIFIED`, and `OBJECT_REF` onto a
 * common class; that change is named as the reason for the open rows and is
 * **not anticipated** here.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const RM_COMMON = 'https://specifications.openehr.org/releases/RM/latest/common.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';
const R5_REFS = 'https://hl7.org/fhir/R5/references.html';
const EXT_PACK = 'https://hl7.org/fhir/extensions/StructureDefinition';

function rm(anchor: string, label: string): Cite {
  return { url: `${RM}#${anchor}`, label, verification: 'spec-local' };
}

function common(anchor: string, label: string): Cite {
  return { url: `${RM_COMMON}#${anchor}`, label, verification: 'spec-local' };
}

function r5(anchor: string, label: string): Cite {
  return { url: `${R5}#${anchor}`, label, verification: 'spec-local' };
}

function refs(anchor: string, label: string): Cite {
  return { url: `${R5_REFS}#${anchor}`, label, verification: 'spec-local' };
}

function ext(name: string, label: string): Cite {
  return { url: `${EXT_PACK}-${name}.html`, label, verification: 'extension-unverified' };
}

const DV_IDENTIFIER = rm('_dv_identifier_class', 'openEHR RM — DV_IDENTIFIER');
const DV_URI = rm('_dv_uri_class', 'openEHR RM — DV_URI');
const DV_EHR_URI = rm('_dv_ehr_uri_class', 'openEHR RM — DV_EHR_URI');
const LINK = common('_link_class', 'openEHR RM — LINK');
const IDENTIFIER = r5('Identifier', 'FHIR R5 — Identifier');
const FHIR_URI = r5('uri', 'FHIR R5 — uri');
const FHIR_URL = r5('url', 'FHIR R5 — url');
const REFERENCE = refs('Reference', 'FHIR R5 — Reference');
const CODEABLE_REFERENCE = r5('CodeableReference', 'FHIR R5 — CodeableReference');

const REVIEWED_BOTH: Review = { openehr: ['Severin'], fhir: ['Gino'] };
const REVIEWED_NEITHER: Review = { openehr: [], fhir: [] };
const REVIEWED_OPENEHR_ONLY: Review = { openehr: ['Severin'], fhir: [] };

// ── DV_IDENTIFIER ↔ Identifier ───────────────────────────────────────────────

const dvIdentifierToIdentifier = {
  id: 'dv-identifier-to-identifier',
  category: 'reference',
  openehrType: 'DV_IDENTIFIER',
  fhirType: 'Identifier',
  title: 'DV_IDENTIFIER ↔ Identifier',
  scope: 'datatype',
  sources: [DV_IDENTIFIER, IDENTIFIER],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-identifier.id',
      scope: 'datatype',
      openehr: {
        path: 'DV_IDENTIFIER.id',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_IDENTIFIER,
      },
      fhir: [
        {
          path: 'Identifier.value',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: IDENTIFIER,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'Direct equivalence. A FHIR `Identifier` with a `system` and **no** `value` has no ' +
        '`DV_IDENTIFIER` to become, because `id` is mandatory.',
    },
    {
      id: 'dv-identifier.issuer',
      scope: 'datatype',
      openehr: {
        path: 'DV_IDENTIFIER.issuer',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_IDENTIFIER,
      },
      fhir: [
        {
          path: 'Identifier.system',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          cite: IDENTIFIER,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        '**The `system` versus `issuer` mismatch — URI against free text — is the primary ' +
        'transformation challenge in this category.** Where the issuer is not a valid URI, ' +
        'the convention is to construct one by prefixing ' +
        '`http://openehr.org/identifier/`, and to strip that prefix again on the way back. ' +
        'Whether that prefix is a real definition or a placeholder, and whether a URN ' +
        'would be preferable to a URL, is **not decided**; guidance has been sought from ' +
        'HL7 TSMG.',
    },
    {
      id: 'dv-identifier.type',
      scope: 'datatype',
      openehr: {
        path: 'DV_IDENTIFIER.type',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_IDENTIFIER,
      },
      fhir: [
        {
          path: 'Identifier.type',
          cardinality: '0..1',
          type: 'CodeableConcept',
          kind: 'element',
          cite: IDENTIFIER,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Identifier.type',
            reason:
              'openEHR carries the type as a single string in `system::value` notation, so ' +
              'only one coding survives — where several are present the `userSelected` one ' +
              'is taken, otherwise the first — and every other property of a `Coding`, ' +
              'including `version`, `display`, and `userSelected` itself, is dropped',
          },
        ],
      },
      maturity: 'open',
      note:
        'The `system::value` convention uses the **last** occurrence of `::` in the ' +
        'string, so no escaping is required even though `:` is valid in both URLs and ' +
        'codes — `http://[2001:db8::1]:8080/path::MR` parses correctly. Where no `::` is ' +
        'present, `http://openehr.org/identifier/type` is used as the system.',
    },
    {
      id: 'dv-identifier.assigner',
      scope: 'datatype',
      openehr: {
        path: 'DV_IDENTIFIER.assigner',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_IDENTIFIER,
      },
      fhir: [
        {
          path: 'Identifier.assigner',
          cardinality: '0..1',
          type: 'Reference(Organization)',
          kind: 'element',
          cite: IDENTIFIER,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Identifier.assigner',
            reason:
              'a FHIR `Reference` carries more than an identifier — `reference`, `display`, ' +
              'and `type` — and openEHR reduces the whole thing to one `system::value` ' +
              'string, so everything except the identifier is dropped',
          },
        ],
      },
      maturity: 'open',
      note:
        'On the way into openEHR the convention is to read `Identifier.assigner.identifier` ' +
        'and, where that is absent, the referenced `Organization.identifier`.',
    },
    {
      id: 'fhir:identifier.use',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          '`DV_IDENTIFIER` has no categorisation field. In openEHR, `use` is expressed at ' +
          'the archetype level rather than on the data type.',
        cite: DV_IDENTIFIER,
      },
      fhir: [
        {
          path: 'Identifier.use',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: IDENTIFIER,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'No `DV_IDENTIFIER` field produces it.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Not carried at the data-type level. A **cluster archetype** providing `use`, ' +
          '`period`, and support for several types is drafted by the openEHR modelling ' +
          'team; this guide links it rather than authoring it.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'As a *consumer* of an identifier, `use` and `period` are rarely significant. They ' +
        'matter mainly for demographic entities, for temporary patient identifiers, and ' +
        'where the EHR is itself the assigner.',
    },
    {
      id: 'fhir:identifier.period',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason: '`DV_IDENTIFIER` has no validity period; see `Identifier.use`.',
        cite: DV_IDENTIFIER,
      },
      fhir: [
        {
          path: 'Identifier.period',
          cardinality: '0..1',
          type: 'Period',
          kind: 'element',
          cite: IDENTIFIER,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'No `DV_IDENTIFIER` field produces it.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Not carried at the data-type level; the extended cluster archetype provides it.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'Round-tripping therefore loses historic and superseded identifiers where they are ' +
        'distinguished only by their period.',
    },
  ],
} satisfies Mapping;

// ── DV_URI / DV_EHR_URI ↔ uri / url ──────────────────────────────────────────

const dvUriToUri = {
  id: 'dv-uri-to-uri',
  category: 'reference',
  openehrType: 'DV_URI / DV_EHR_URI',
  fhirType: 'uri | url',
  title: 'DV_URI / DV_EHR_URI ↔ uri / url',
  scope: 'datatype',
  sources: [DV_URI, DV_EHR_URI, FHIR_URI, FHIR_URL],
  review: REVIEWED_NEITHER,
  rows: [
    {
      id: 'dv-uri.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_URI.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_URI,
      },
      fhir: [
        {
          path: 'uri',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          when: 'the target element is typed `uri`, `oid`, `uuid`, or `canonical`',
          cite: FHIR_URI,
        },
        {
          path: 'url',
          cardinality: '0..1',
          type: 'url',
          kind: 'element',
          when: 'the target element is typed `url` and the value is a resolvable address',
          cite: FHIR_URL,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'Direct equivalence — both are RFC 3986 URIs. **Which FHIR primitive is the target ' +
        'is decided by the element definition, not by the openEHR source type**: FHIR ' +
        'provides several URI primitives with progressively narrower constraints, and ' +
        '`canonical` additionally carries versioning semantics. This section has not been ' +
        'reviewed from either side.',
    },
    {
      id: 'dv-ehr-uri.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_EHR_URI.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_EHR_URI,
      },
      fhir: [
        {
          path: 'uri',
          cardinality: '0..1',
          type: 'uri',
          kind: 'element',
          when: 'the `ehr:` URI is carried opaquely, as an identifier of the source item',
          cite: FHIR_URI,
        },
        {
          path: 'Reference.reference',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          when: 'the URI is a `LINK.target` and is resolved to a FHIR resource',
          cite: REFERENCE,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'Reference.reference',
            reason:
              'the `ehr:` scheme addresses compositions, sections, entries, and ' +
              'sub-elements inside an openEHR EHR, and a FHIR reference addresses a ' +
              'resource; a value that did not originate as an `ehr:` URI cannot be turned ' +
              'into one, so only opaquely round-tripped values survive',
          },
        ],
      },
      maturity: 'open',
      note:
        '**No standard FHIR scheme conveys `ehr:` semantics.** Carrying the URI opaquely ' +
        'preserves it exactly but means nothing on the FHIR side can resolve it; resolving ' +
        'it to a `Reference` makes it usable but is a one-way transformation.',
    },
  ],
} satisfies Mapping;

// ── LINK ↔ Reference / CodeableReference ─────────────────────────────────────

const linkToReference = {
  id: 'link-to-reference',
  category: 'reference',
  openehrType: 'LINK',
  fhirType: 'Reference | CodeableReference',
  title: 'LINK ↔ Reference / CodeableReference',
  scope: 'datatype',
  sources: [LINK, REFERENCE, CODEABLE_REFERENCE],
  review: REVIEWED_OPENEHR_ONLY,
  rows: [
    {
      id: 'link.target',
      scope: 'datatype',
      openehr: {
        path: 'LINK.target',
        cardinality: '1..1',
        type: 'DV_EHR_URI',
        kind: 'element',
        cite: LINK,
      },
      fhir: [
        {
          path: 'Reference.reference',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: REFERENCE,
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'LINK.target',
            reason:
              'a `LINK.target` can address a **sub-element** of a composition, and ' +
              '`Reference.reference` is a resource-level pointer whose `#fragment` is ' +
              'reserved for contained resources; sub-element granularity is lost unless ' +
              'the `targetElement` or `targetPath` extension is used',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'No `LINK` is produced at all, so nothing lands in `target`. `LINK.type` is ' +
          'mandatory and a plain `Reference` has no field that can source it — see the ' +
          '`LINK.type` row — so the reference travels only as part of a `LINK` that cannot ' +
          'be built.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'Two standard extensions cover sub-element addressing when it is genuinely ' +
        'required: `targetElement`, carrying a target `Element.id`, and `targetPath`, ' +
        'carrying a restricted FHIRPath expression. Prefer `targetElement` where you ' +
        'control the target instance and can guarantee an `Element.id`; use `targetPath` ' +
        'where you cannot. **A mapping into FHIR SHOULD NOT produce either unless the ' +
        'source data genuinely needs sub-element granularity**, because most consumers do ' +
        'not interpret them.',
    },
    {
      id: 'link.meaning',
      scope: 'datatype',
      openehr: {
        path: 'LINK.meaning',
        cardinality: '1..1',
        type: 'DV_TEXT',
        kind: 'element',
        cite: LINK,
      },
      fhir: [
        {
          path: 'Reference.display',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: REFERENCE,
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'LINK.meaning',
            reason:
              '`LINK.meaning` is a `DV_TEXT [1..1]` and `Reference.display` is a plain ' +
              '`string`, so **only `DV_TEXT.value` participates**. `formatting`, ' +
              '`encoding`, the deprecated `hyperlink`, and `mappings` are `lossy` or ' +
              '`unmapped` into a FHIR `string` — see the `DV_TEXT` table on ' +
              '[Textual Data](mapping-textual.html) — and a `Reference.display` has no ' +
              'extension slot in this mapping to carry them',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'No `LINK` is produced at all, so nothing lands in `meaning`. See the ' +
          '`LINK.type` row.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'The `lossless` claim this row used to carry was false in both directions: it ' +
        'ignored every `DV_TEXT` attribute except `value`, and it depended on ' +
        '`referenceToLink` fabricating a `LINK.type`.',
    },
    {
      id: 'link.type',
      scope: 'datatype',
      openehr: {
        path: 'LINK.type',
        cardinality: '1..1',
        type: 'DV_TEXT',
        kind: 'element',
        cite: LINK,
      },
      fhir: [
        {
          path: 'CodeableReference.concept',
          cardinality: '0..1',
          type: 'CodeableConcept',
          kind: 'element',
          cite: CODEABLE_REFERENCE,
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'LINK.type',
            reason:
              'only `DV_TEXT.value` participates, as for `LINK.meaning`; and a plain ' +
              '`Reference` — what a data-type conversion produces without the ' +
              'archetype-level decision to use a `CodeableReference` — carries no concept ' +
              'at all, so this guide\u2019s reference converter emits no link type',
          },
        ],
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          '`LINK.type` is **mandatory (1..1)** and a FHIR `Reference` has no field that ' +
          'can source it. Only a `CodeableReference` carries a concept, and using one is ' +
          'an archetype-level decision. **No `LINK` is produced from a bare `Reference`**, ' +
          'because inventing a link type — the literal `reference`, as an earlier draft of ' +
          'this guide did — states a relationship nobody sent.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        'The link type — `issue`, `problem`, `citation`, and the like — has no home on a ' +
        'plain `Reference`. A `CodeableReference` carries a concept **and** a reference in ' +
        'one value, which is the closest FHIR shape. This is the row that makes ' +
        '`LINK ↔ Reference` a **one-way** mapping at data-type level.',
    },
    {
      id: 'fhir:codeable-reference.split',
      scope: 'datatype',
      openehr: {
        kind: 'none',
        reason:
          'openEHR has no single value combining a coded concept and a reference. The two ' +
          'are modelled separately — a coded element alongside a `LINK`, or both inside an ' +
          'enclosing `CLUSTER`.',
        cite: LINK,
      },
      fhir: [
        {
          path: 'CodeableReference',
          cardinality: '0..1',
          kind: 'element',
          cite: CODEABLE_REFERENCE,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'No single openEHR value produces a `CodeableReference`.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'The value must be **split** into a coded element plus a `LINK`, or into an ' +
          'enclosing cluster — for example an anatomical-location cluster alongside a coded ' +
          'body-site element. That is an archetype decision, not a data-type mapping.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
    },
    {
      id: 'link.party-identified-unification',
      scope: 'archetype',
      openehr: {
        path: 'PARTY_IDENTIFIED',
        cardinality: '0..1',
        type: 'PARTY_IDENTIFIED',
        kind: 'element',
        cite: common('_party_identified_class', 'openEHR RM — PARTY_IDENTIFIED'),
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR uses `Reference` for both internal record links and external party ' +
          'references, so there is no separate FHIR type for the openEHR distinction to ' +
          'map onto.',
        cite: REFERENCE,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Not mapped here. openEHR splits internal record links (`LINK`) from external ' +
          'party references (`PARTY_IDENTIFIED`) and the working group is investigating ' +
          'unifying both onto a common Reference Model class, likely based on ' +
          '`OBJECT_REF`. **This guide maps the RM as published today and does not ' +
          'anticipate the unreleased change.**',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Whether an incoming `Reference` becomes a `LINK` or a `PARTY_IDENTIFIED` cannot ' +
          'be decided from the reference alone; it depends on what is referenced, which is ' +
          'archetype context.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
    },
  ],
} satisfies Mapping;

export default [
  dvIdentifierToIdentifier,
  dvUriToUri,
  linkToReference,
] satisfies readonly Mapping[];

/** Exported so the converters and the ledger name the same placeholder. */
export const OPENEHR_IDENTIFIER_PREFIX = 'http://openehr.org/identifier/';
