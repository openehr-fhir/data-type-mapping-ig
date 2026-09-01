/**
 * Other data: `DV_MULTIMEDIA`, `DV_PARSABLE`, and `DV_STATE`.
 *
 * Reviewer coverage in this category is **uneven** — several of these types were
 * never reviewed from the FHIR side — so rows the specifications do not clearly
 * support are recorded `open` rather than asserted. See
 * [Open Items](open-items.html) for the coverage table itself.
 */

import type { Cite, Mapping, Review } from '../src/model/types.ts';

const RM = 'https://specifications.openehr.org/releases/RM/latest/data_types.html';
const R5 = 'https://hl7.org/fhir/R5/datatypes.html';
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

const DV_MULTIMEDIA = rm('_dv_multimedia_class', 'openEHR RM — DV_MULTIMEDIA');
const DV_PARSABLE = rm('_dv_parsable_class', 'openEHR RM — DV_PARSABLE');
const DV_STATE = rm('_dv_state_class', 'openEHR RM — DV_STATE');
const DV_ENCAPSULATED = rm('_dv_encapsulated_class', 'openEHR RM — DV_ENCAPSULATED');
const ATTACHMENT = r5('Attachment', 'FHIR R5 — Attachment');
const FHIR_STRING = r5('string', 'FHIR R5 — string');
const CODEABLE_CONCEPT = r5('CodeableConcept', 'FHIR R5 — CodeableConcept');

const NOT_REVIEWED: Review = { openehr: [], fhir: [] };
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

const dvMultimediaToAttachment = {
  id: 'dv-multimedia-to-attachment',
  category: 'other',
  openehrType: 'DV_MULTIMEDIA',
  fhirType: 'Attachment',
  title: 'DV_MULTIMEDIA ↔ Attachment',
  scope: 'datatype',
  sources: [DV_MULTIMEDIA, ATTACHMENT, DV_ENCAPSULATED],
  review: NOT_REVIEWED,
  rows: [
    {
      id: 'dv-multimedia.data',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.data',
        cardinality: '0..1',
        type: 'List<Octet>',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.data',
          cardinality: '0..1',
          type: 'base64Binary',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
    },
    {
      id: 'dv-multimedia.uri',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.uri',
        cardinality: '0..1',
        type: 'DV_URI',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.url',
          cardinality: '0..1',
          type: 'url',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
    },
    {
      id: 'dv-multimedia.media_type',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.media_type',
        cardinality: '1..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.contentType',
          cardinality: '0..1',
          type: 'code',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'An IANA MIME type on both sides. Where an openEHR `charset` applies to the ' +
        'attachment data itself it SHOULD be folded into the MIME type as a `charset` ' +
        'parameter; where it applies to local content the content is converted to UTF-8.' +
        MANDATORY_RULE,
    },
    {
      id: 'dv-multimedia.size',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.size',
        cardinality: '1..1',
        type: 'Integer',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.size',
          cardinality: '0..1',
          type: 'integer64',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'The **original** size in bytes, before any compression or encoding. `0` is a real ' +
        'size, not a missing one.' + MANDATORY_RULE,
    },
    {
      id: 'dv-multimedia.alternate_text',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.alternate_text',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.title',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note: 'Display text to show in place of the multimedia content.',
    },
    {
      id: 'dv-multimedia.integrity_check',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.integrity_check',
        cardinality: '0..1',
        type: 'List<Octet>',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.hash',
          cardinality: '0..1',
          type: 'base64Binary',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        '`Attachment.hash` is **defined as SHA-1**. A hash computed with any other ' +
        'algorithm is carried only alongside `integrity_check_algorithm` — see the next ' +
        'row.',
    },
    {
      id: 'dv-multimedia.integrity_check_algorithm',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.integrity_check_algorithm',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: {
        kind: 'none',
        reason:
          '`Attachment.hash` is SHA-1 by definition and R5 has no element naming a ' +
          'different algorithm.',
        cite: ATTACHMENT,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'openEHR permits SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, and ' +
          'SHA-512/256; only SHA-1 has a home in R5. FHIR-55422 is **resolved** and adds a ' +
          'core `alternate-hash` extension keeping SHA-1 as the default, but it has not ' +
          'been published yet. **No extension is invented here.**',
        owner: 'FHIR-55422',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives; a receiving system MAY assume SHA-1, which is an inference ' +
          'from the FHIR definition rather than a carried value.',
        owner: 'FHIR-55422',
      },
      maturity: 'open',
    },
    {
      id: 'dv-multimedia.compression_algorithm',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.compression_algorithm',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: {
        kind: 'none',
        reason: 'FHIR `Attachment` has no element naming a compression algorithm.',
        cite: ATTACHMENT,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'openEHR permits `compress`, `deflate`, `gzip`, `zlib`, and `other`; FHIR has no ' +
          'equivalent. FHIR-56003 requests a `content-encoding` extension and is triaged. ' +
          'The pragmatic alternative is to **decompress during conversion**, which removes ' +
          'the need for the field. **No extension is invented here.**',
        owner: 'FHIR-56003',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives, because nothing was emitted.',
        owner: 'FHIR-56003',
      },
      maturity: 'open',
    },
    {
      id: 'dv-multimedia.thumbnail',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.thumbnail',
        cardinality: '0..1',
        type: 'DV_MULTIMEDIA',
        kind: 'element',
        cite: DV_MULTIMEDIA,
      },
      fhir: {
        kind: 'none',
        reason:
          'The existing `documentreference-thumbnail` extension is a flag on ' +
          '`DocumentReference.content` saying that the content *is* a thumbnail; it does ' +
          'not attach a thumbnail to an `Attachment`.',
        cite: ATTACHMENT,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'A nested thumbnail has no FHIR home. A new extension on `Attachment` has been ' +
          'requested as FHIR-56002 and is **not yet published**. **No extension is invented ' +
          'here.**',
        owner: 'FHIR-56002',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives, because nothing was emitted.',
        owner: 'FHIR-56002',
      },
      maturity: 'open',
    },
    {
      id: 'fhir:attachment.media-details',
      scope: 'archetype',
      openehr: {
        kind: 'none',
        reason:
          'The published openEHR *Media File* CLUSTER archetype has no `creation`, ' +
          '`height`, `width`, `frames`, `duration`, `pages`, or `language` element. A draft ' +
          '`CLUSTER.extended_media_details` archetype provides them.',
        cite: DV_MULTIMEDIA,
      },
      fhir: [
        {
          path: 'Attachment.creation',
          cardinality: '0..1',
          type: 'dateTime',
          kind: 'element',
          cite: ATTACHMENT,
        },
      ],
      toFhir: {
        fidelity: 'unmapped',
        reason: 'No `DV_MULTIMEDIA` field produces any of them.',
        owner: 'openehr-modelling',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Carried by an **extension archetype**, not by the data type. This guide links ' +
          'the archetype and describes it; authoring it belongs to the openEHR modelling ' +
          'team, who have an open proposal to fold the extended elements into the published ' +
          '*Media File* CLUSTER.',
        owner: 'openehr-modelling',
      },
      maturity: 'open',
      note:
        '`archetype` scope, and it applies equally to `Attachment.height`, `.width`, ' +
        '`.frames`, `.duration`, `.pages`, and `.language`. The *Media File* CLUSTER ' +
        'archetype, rather than a bare `DV_MULTIMEDIA`, is the closer target for a FHIR ' +
        '`Attachment`.',
    },
    {
      id: 'dv-multimedia.charset',
      scope: 'datatype',
      openehr: {
        path: 'DV_MULTIMEDIA.charset',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_ENCAPSULATED,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR mandates UTF-8 and has no element recording a character set on an ' +
          '`Attachment`; where the charset applies to the attached bytes it belongs in the ' +
          '`contentType` MIME parameter instead.',
        cite: ATTACHMENT,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Not carried as a field. Where the charset applies to the attachment data it is ' +
          'folded into `contentType`; where it applies to local content the content is ' +
          'converted to UTF-8.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives as a distinct field.',
      },
      maturity: 'settled',
      note:
        'The `DV_ENCAPSULATED` parent also brings `language`. Note that the openEHR **Base ' +
        'IG** models `DV_ENCAPSULATED` differently from the Reference Model; **the ' +
        'Reference Model is the authority** cited here.',
    },
  ],
} satisfies Mapping;

const dvParsableToString = {
  id: 'dv-parsable-to-string',
  category: 'other',
  openehrType: 'DV_PARSABLE',
  fhirType: 'string',
  title: 'DV_PARSABLE ↔ string',
  scope: 'datatype',
  sources: [DV_PARSABLE, FHIR_STRING, DV_ENCAPSULATED],
  review: NOT_REVIEWED,
  rows: [
    {
      id: 'dv-parsable.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_PARSABLE.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_PARSABLE,
      },
      fhir: [
        {
          path: 'string.value',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          cite: FHIR_STRING,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'A FHIR `string` states nothing about the syntax its value is written in, and ' +
          '`DV_PARSABLE.formalism` is mandatory, so **no `DV_PARSABLE` can be produced ' +
          'from a `string` alone**. The formalism has to come from the element definition, ' +
          'which a data-type conversion never sees. This mapping is one-directional.',
        owner: 'session:dv-parsable-formalism',
      },
      maturity: 'open',
      note:
        'Where the formalism is markdown, a `markdown` element is the better target. For ' +
        'genomic content such as HGVS, the Genomics Reporting IG uses a ' +
        '`CodeableConcept.text` pattern instead.',
    },
    {
      id: 'dv-parsable.formalism',
      scope: 'datatype',
      openehr: {
        path: 'DV_PARSABLE.formalism',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_PARSABLE,
      },
      fhir: {
        kind: 'none',
        reason:
          'No FHIR element or extension carries the syntax a parsable instance is written ' +
          'in. The `mimeType` extension is **not** it: its declared context is ' +
          '`Questionnaire.item` and `ElementDefinition`, not `string` or any data type, ' +
          'and its purpose is a design-time constraint on the attachments an element ' +
          'permits — not a statement about an instance.',
        cite: FHIR_STRING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Nothing carries it. The working group recorded a **Decision made** to use the ' +
          '`mimeType` extension; the extension definition does not support that decision, ' +
          'and this guide publishes the gap rather than an instance no validator accepts.',
        owner: 'session:dv-parsable-formalism',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives to map back, because nothing was emitted.',
        owner: 'session:dv-parsable-formalism',
      },
      maturity: 'open',
      note:
        '`formalism` is **mandatory** in openEHR, so this gap is what makes ' +
        '`DV_PARSABLE ↔ string` a one-way mapping: the value travels to FHIR, and nothing ' +
        'travels back. Inventing a FHIR usage to fill an openEHR gap is exactly what this ' +
        'guide will not do, so no substitute extension is proposed here — the decision ' +
        'belongs to the working group, and it is recorded as open.',
    },
  ],
} satisfies Mapping;

const dvStateToCodeableConcept = {
  id: 'dv-state-to-codeable-concept',
  category: 'other',
  openehrType: 'DV_STATE',
  fhirType: 'CodeableConcept',
  title: 'DV_STATE ↔ CodeableConcept',
  scope: 'datatype',
  sources: [DV_STATE, CODEABLE_CONCEPT],
  review: REVIEWED_OPENEHR_ONLY,
  rows: [
    {
      id: 'dv-state.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_STATE.value',
        cardinality: '1..1',
        type: 'DV_CODED_TEXT',
        kind: 'element',
        cite: DV_STATE,
      },
      fhir: [
        {
          path: 'CodeableConcept',
          cardinality: '0..1',
          kind: 'element',
          cite: CODEABLE_CONCEPT,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'The state **name** maps as an ordinary `DV_CODED_TEXT`; see ' +
        '[Coded Data](mapping-coded.html). What does **not** map is the state machine it ' +
        'belongs to.' + MANDATORY_RULE,
    },
    {
      id: 'dv-state.is_terminal',
      scope: 'datatype',
      openehr: {
        path: 'DV_STATE.is_terminal',
        cardinality: '1..1',
        type: 'Boolean',
        kind: 'element',
        cite: DV_STATE,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR has **no data type for a state-machine value**. It models workflow state as ' +
          'resource-level elements such as `Task.status`, each with its own state machine, ' +
          'and none of them carries a terminal flag on the value.',
        cite: CODEABLE_CONCEPT,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'There is no FHIR element for it and **no extension is invented here**. Carrying ' +
          'it would require either an extension or handling at the archetype and resource ' +
          'level.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          '`is_terminal` is mandatory in openEHR, so a mapping engine must infer it from ' +
          'the state machine the archetype defines — an inference, not a carried value.',
        owner: 'working-group',
      },
      maturity: 'open',
      note:
        '`DV_STATE` sees very little use. One participant has never seen it used at all ' +
        'and suggests it is legacy, superseded by `ISM_TRANSITION`. This row is one of the ' +
        'two **recorded exceptions** to ' +
        '[the mandatory-attribute rule](conventions.html#mandatory-attributes): nothing in ' +
        'a `CodeableConcept` can source `is_terminal`, the openEHR-only gap is published ' +
        'here, and the reference implementation infers `false` rather than refusing the ' +
        'whole conversion. `contract.test.ts` pins the exception, so the list cannot grow ' +
        'unnoticed.',
    },
  ],
} satisfies Mapping;

export default [
  dvMultimediaToAttachment,
  dvParsableToString,
  dvStateToCodeableConcept,
] satisfies readonly Mapping[];
