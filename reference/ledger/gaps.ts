/**
 * The gap inventories.
 *
 * Most gap rows are **not** here: a gap is an ordinary ledger row whose verdict
 * is `lossy` or `unmapped`, and the four `gaps:*` renderers derive their tables
 * from the whole ledger rather than from a transcription. That is the point of
 * the inversion — a gap cannot fall out of step with the mapping it belongs to.
 *
 * What this module adds is the two inventories that have no home in a category:
 * FHIR types with **no openEHR counterpart at all**, and the types on either
 * side the working group has **not yet discussed**.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const RM_COMMON = 'https://specifications.openehr.org/releases/RM/latest/common.html';
const RM_STRUCTURES =
  'https://specifications.openehr.org/releases/RM/latest/data_structures.html';
const RM_EHR = 'https://specifications.openehr.org/releases/RM/latest/ehr.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';
const R5_RESOURCE = 'https://hl7.org/fhir/R5/resource.html';
const R5_NARRATIVE = 'https://hl7.org/fhir/R5/narrative.html';

/** The FHIR R5 data-type **inventory** page. It has no anchor of its own. */
const R5_INVENTORY: Cite = {
  url: R5,
  label: 'FHIR R5 — Data Types (inventory)',
  verification: 'spec-local',
};

/**
 * The R5 data-type inventory page, bound **separately** for `RelativeTime`.
 *
 * `R5_INVENTORY` is shared by both inventories' `sources` and by five
 * `not-discussed` rows' `NoCounterpart` sides; setting `anchorless` there would
 * silently widen the exemption to all of them. `RelativeTime` is the one
 * endpoint that genuinely has no anchor, so it gets its own binding.
 */
const R5_INVENTORY_NO_ANCHOR: Cite = {
  url: R5,
  label: 'FHIR R5 — Data Types (inventory)',
  verification: 'spec-local',
  anchorless:
    'R5 defines no `RelativeTime`, so the data-type inventory page carries no anchor to ' +
    'point at; the type is an R6-era addition and the citation is to the page that ' +
    'demonstrably does not list it.',
};

/** The openEHR Data Types **inventory** page, cited by every no-counterpart row. */
const RM_INVENTORY: Cite = {
  url: RM,
  label: 'openEHR RM — Data Types Information Model (inventory)',
  verification: 'spec-local',
};

/**
 * RM § 5.1.7, where the `DV_TEXT.formatting` enumeration is published **and**
 * HTML is rejected as a formatting approach on the record.
 *
 * A gap the Reference Model states a position on cites that position, not the
 * inventory page: the inventory is what a type openEHR simply does not have can
 * cite, and this one openEHR has considered and declined.
 */
const RM_TEXT_FORMATTING: Cite = {
  url: `${RM}#_formatting_and_hyperlinking`,
  label: 'openEHR RM — § 5.1.7 Formatting and Hyperlinking',
  verification: 'spec-local',
};

const EXT_PACK = 'https://hl7.org/fhir/extensions/StructureDefinition';

function ext(name: string, label: string): Cite {
  return { url: `${EXT_PACK}-${name}.html`, label, verification: 'extension-unverified' };
}

function r5(anchor: string, label: string): Cite {
  return { url: `${R5}#${anchor}`, label, verification: 'spec-local' };
}

/** `Meta` and `Narrative` are defined outside `datatypes.html`. */
function onPage(page: string, anchor: string, label: string): Cite {
  return { url: `${page}#${anchor}`, label, verification: 'spec-local' };
}

const NOT_REVIEWED: Review = { openehr: [], fhir: [] };

/** One FHIR type with no openEHR data-type counterpart. */
interface NoCounterpartEntry {
  readonly type: string;
  readonly anchor: string;
  /** The R5 page the type is defined on, when it is not `datatypes.html`. */
  readonly page?: string;
  /**
   * An explicit citation, for a type R5 does not define at all: an R6-era
   * forward reference has no R5 anchor to point at, so the inventory page is
   * cited instead of an anchor that does not exist.
   */
  readonly cite?: Cite;
  /**
   * The FHIR path, when it is not the bare type name. An **extension** is a
   * feature rather than a type, and names the element it sits on.
   */
  readonly path?: string;
  /** `extension` for an extension entry; `element` otherwise. */
  readonly kind?: 'element' | 'extension';
  /**
   * The openEHR-side citation, when the reason is a **stated** position in the
   * Reference Model rather than the absence of one. The default is the RM data
   * types inventory, which is what a type openEHR simply does not have can cite.
   */
  readonly openehrCite?: Cite;
  /** Overrides for the two templated verdict reasons, where they do not fit. */
  readonly toFhirReason?: string;
  readonly toOpenehrReason?: string;
  readonly reason: string;
}

const FHIR_ONLY: readonly NoCounterpartEntry[] = [
  {
    type: 'Address',
    anchor: 'Address',
    reason:
      'The openEHR Reference Model has no postal-address data type. Addresses are modelled ' +
      'in demographic archetypes, not in the Data Types Information Model.',
  },
  {
    type: 'HumanName',
    anchor: 'HumanName',
    reason:
      'openEHR models names in demographic archetypes and in `PARTY_IDENTIFIED.name`, not ' +
      'as a structured data type.',
  },
  {
    type: 'ContactPoint',
    anchor: 'ContactPoint',
    reason:
      'Telecom details are archetype content in openEHR, with no corresponding data type.',
  },
  {
    type: 'Annotation',
    anchor: 'Annotation',
    reason:
      'openEHR carries an author and a time on the enclosing RM structures rather than ' +
      'bundling them with the text; there is no data type combining the three.',
  },
  {
    type: 'Signature',
    anchor: 'Signature',
    reason:
      'openEHR attests content through `ATTESTATION` in the Common Information Model, ' +
      'which is an RM class rather than a data type.',
  },
  {
    type: 'SampledData',
    anchor: 'SampledData',
    reason:
      'openEHR represents sampled series through `ITEM_TABLE` and time-series archetypes ' +
      'rather than as a data type.',
  },
  {
    type: 'RatioRange',
    anchor: 'RatioRange',
    reason:
      'openEHR has no interval over `DV_PROPORTION`; `DV_INTERVAL<T>` is parameterised on ' +
      '`DV_ORDERED`, which `DV_PROPORTION` does not extend in a way that yields a ratio ' +
      'range.',
  },
  {
    type: 'Meta',
    anchor: 'Meta',
    page: R5_RESOURCE,
    reason:
      'Resource metadata — version, last-updated, profiles, security labels, tags — has no ' +
      'openEHR data type. openEHR carries the equivalents on `VERSION` and `AUDIT_DETAILS` ' +
      'in the Common Information Model.',
  },
  {
    type: 'Narrative',
    anchor: 'Narrative',
    page: R5_NARRATIVE,
    reason:
      'FHIR resource narrative is XHTML with a generation status. openEHR has no ' +
      'counterpart data type; narrative is either archetype content or absent.',
  },
  {
    type: 'RelativeTime',
    anchor: 'RelativeTime',
    cite: R5_INVENTORY_NO_ANCHOR,
    reason:
      'An **R6-era** type expressing a time relative to an event rather than on a ' +
      'calendar; R5 does not define it, so the citation is to the R5 data-type inventory ' +
      'rather than to an anchor that does not exist. The working group examined it and ' +
      'recorded **no openEHR counterpart identified**; openEHR expresses the same idea ' +
      'structurally, through the `EVENT` and `HISTORY` classes and their offsets, not as ' +
      'a data type.',
  },
  {
    type: 'rendering-xhtml',
    anchor: 'rendering-xhtml',
    path: 'Element.extension[rendering-xhtml]',
    kind: 'extension',
    cite: ext('rendering-xhtml', 'FHIR Extensions — rendering-xhtml'),
    openehrCite: RM_TEXT_FORMATTING,
    reason:
      'FHIR can attach an XHTML rendering of an element\u2019s value through the ' +
      '`rendering-xhtml` extension. openEHR has **no `DV_TEXT.formatting` value for it**: ' +
      'RM § 5.1.7 enumerates the set exhaustively — `Void`, `"markdown"`, `"plain"`, ' +
      '`"plain_no_newlines"`, and a legacy deprecated CSS string — and rejects HTML as a ' +
      'formatting approach explicitly, concluding that rendering is done by a ' +
      'markdown-to-HTML converter and that "this is the approach taken by this ' +
      'specification". XHTML support on the openEHR side is **pending a Reference Model ' +
      'change request**.',
    toFhirReason:
      'Nothing produces one. No `DV_TEXT.formatting` value states XHTML rendering, so this ' +
      'guide emits no `rendering-xhtml` and recommends none.',
    toOpenehrReason:
      'A received `string` carrying the extension keeps its text — `DV_TEXT.value` converts ' +
      'faithfully — and the rendering instruction alone is dropped and reported. The ' +
      'per-attribute row is `dv-text.formatting.xhtml` on ' +
      '[Textual Data](mapping-textual.html); this inventory entry is the same gap seen ' +
      'from the FHIR side. It closes when the pending Reference Model change request lands.',
  },
];

const fhirTypesWithNoOpenehrCounterpart = {
  id: 'fhir-types-with-no-openehr-counterpart',
  category: 'gaps',
  openehrType: '(none)',
  fhirType: 'Address, HumanName, ContactPoint, and others',
  title: 'FHIR features with no openEHR counterpart',
  scope: 'datatype',
  sources: [RM_INVENTORY, R5_INVENTORY],
  review: NOT_REVIEWED,
  rows: FHIR_ONLY.map((entry) => ({
    id: `fhir:${entry.type.toLowerCase()}`,
    scope: 'datatype' as const,
    openehr: {
      kind: 'none' as const,
      reason: entry.reason,
      cite: entry.openehrCite ?? RM_INVENTORY,
    },
    fhir: [
      {
        path: entry.path ?? entry.type,
        cardinality: '0..1',
        kind: entry.kind ?? ('element' as const),
        cite:
          entry.cite ??
          (entry.page === undefined
            ? r5(entry.anchor, `FHIR R5 — ${entry.type}`)
            : onPage(entry.page, entry.anchor, `FHIR R5 — ${entry.type}`)),
      },
    ] as const,
    toFhir: {
      fidelity: 'unmapped' as const,
      reason:
        entry.toFhirReason ??
        `Nothing in the openEHR data types produces a \`${entry.type}\`.`,
      owner: 'openehr-modelling' as const,
    },
    toOpenehr: {
      fidelity: 'unmapped' as const,
      reason:
        entry.toOpenehrReason ??
        `An incoming \`${entry.type}\` has no openEHR **data type** to land in. Where an ` +
          'equivalent exists it is an archetype or an RM class, and mapping it is out of ' +
          'scope for this pass. **Not investigated further.**',
      owner: 'openehr-modelling' as const,
    },
    maturity: 'open' as const,
  })),
} satisfies Mapping;

/** One openEHR or FHIR construct the working group has not examined. */
interface NotDiscussedEntry {
  readonly id: string;
  readonly path: string;
  readonly type: string;
  readonly cite: Cite;
  readonly reason: string;
}

const NOT_DISCUSSED: readonly NotDiscussedEntry[] = [
  {
    id: 'not-discussed.event',
    path: 'EVENT<T>',
    type: 'EVENT<T : ITEM_STRUCTURE>',
    cite: {
      url: `${RM_STRUCTURES}#_history_class`,
      label: 'openEHR RM — EVENT, in the Data Structures Information Model',
      verification: 'spec-local',
    },
    reason:
      '`EVENT` and its `POINT_EVENT` and `INTERVAL_EVENT` subtypes carry time-series data ' +
      'inside a `HISTORY`. They are RM structures rather than data types, and their FHIR ' +
      'counterparts are resource-level.',
  },
  {
    id: 'not-discussed.dv-encapsulated',
    path: 'DV_ENCAPSULATED',
    type: 'DV_ENCAPSULATED',
    cite: {
      url: `${RM}#_dv_encapsulated_class`,
      label: 'openEHR RM — DV_ENCAPSULATED',
      verification: 'spec-local',
    },
    reason:
      'The abstract parent of `DV_MULTIMEDIA` and `DV_PARSABLE`. Its `charset` and ' +
      '`language` attributes are covered per subtype; the abstract class itself has not ' +
      'been examined. **The Reference Model is the authority for its definition**, not any ' +
      'downstream representation of it.',
  },
  {
    id: 'not-discussed.mediafile',
    path: 'CLUSTER.media_file',
    type: 'CLUSTER archetype',
    cite: {
      url: `${RM_STRUCTURES}#_cluster_class`,
      label: 'openEHR RM — CLUSTER, in the Data Structures Information Model',
      verification: 'spec-local',
    },
    reason:
      'The published *Media File* CLUSTER archetype is a closer target for a FHIR ' +
      '`Attachment` than a bare `DV_MULTIMEDIA`, but archetype-level mapping is out of ' +
      'scope for this pass.',
  },
  {
    id: 'not-discussed.encounter',
    path: 'COMPOSITION',
    type: 'COMPOSITION / ENTRY',
    cite: {
      url: `${RM_EHR}#_composition_class`,
      label: 'openEHR RM — COMPOSITION, in the EHR Information Model',
      verification: 'spec-local',
    },
    reason:
      'Encounter-level structures — `COMPOSITION`, `SECTION`, and the `ENTRY` subtypes — ' +
      'correspond to FHIR resources rather than to data types. Resource- and profile-level ' +
      'mapping is a separate deliverable.',
  },
  {
    id: 'not-discussed.party-related',
    path: 'PARTY_RELATED',
    type: 'PARTY_RELATED',
    cite: {
      url: `${RM_COMMON}#_party_related_class`,
      label: 'openEHR RM — PARTY_RELATED',
      verification: 'spec-local',
    },
    reason:
      '`PARTY_RELATED` adds a relationship to `PARTY_IDENTIFIED`. It is caught up in the ' +
      'pending `LINK` / `PARTY_IDENTIFIED` / `OBJECT_REF` unification and has not been ' +
      'examined on its own.',
  },
];

const openehrTypesNotYetDiscussed = {
  id: 'openehr-types-not-yet-discussed',
  category: 'gaps',
  openehrType: 'EVENT, DV_ENCAPSULATED, CLUSTER.media_file, COMPOSITION, PARTY_RELATED',
  fhirType: '(not determined)',
  title: 'openEHR constructs not yet discussed',
  scope: 'datatype',
  sources: [RM_INVENTORY],
  review: NOT_REVIEWED,
  rows: NOT_DISCUSSED.map((entry) => ({
    id: entry.id,
    scope: 'datatype' as const,
    openehr: {
      path: entry.path,
      cardinality: '0..1',
      type: entry.type,
      kind: 'element' as const,
      cite: entry.cite,
    },
    fhir: {
      kind: 'none' as const,
      reason:
        'No FHIR target has been agreed, because the construct has not been examined. ' +
        'Listing a candidate here would be a guess.',
      cite: R5_INVENTORY,
    },
    toFhir: {
      fidelity: 'unmapped' as const,
      reason: `**Not yet discussed.** ${entry.reason}`,
      owner: 'working-group' as const,
    },
    toOpenehr: {
      fidelity: 'unmapped' as const,
      reason: '**Not yet discussed.** No mapping is asserted, because none has been agreed.',
      owner: 'working-group' as const,
    },
    maturity: 'not-discussed' as const,
  })),
} satisfies Mapping;

export default [
  fhirTypesWithNoOpenehrCounterpart,
  openehrTypesNotYetDiscussed,
] satisfies readonly Mapping[];
