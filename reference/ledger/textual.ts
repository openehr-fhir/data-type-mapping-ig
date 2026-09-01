/**
 * Textual data: `DV_TEXT` and `DV_PARAGRAPH`.
 *
 * `DV_PARSABLE` is mapped in [Other Data](mapping-other.html), with the rest of
 * the encapsulated types.
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

const DV_TEXT = rm('_dv_text_class', 'openEHR RM — DV_TEXT');
const TEXT_FORMATTING = rm('_text_formatting', 'openEHR RM — text formatting');
const FHIR_STRING = r5('string', 'FHIR R5 — string');
const FHIR_MARKDOWN = r5('markdown', 'FHIR R5 — markdown');
const CODE_PHRASE = rm('_code_phrase_class', 'openEHR RM — CODE_PHRASE');
const CODEABLE_CONCEPT = r5('CodeableConcept', 'FHIR R5 — CodeableConcept');

const REVIEWED_BOTH: Review = { openehr: ['Ciprian'], fhir: ['Gino'] };

/**
 * The mandatory-attribute rule, cross-referenced from every row it governs.
 * Appended to a row note rather than restated, so the wording cannot drift.
 */
const MANDATORY_RULE =
  ' The openEHR attribute is **mandatory** and the FHIR element is optional, so an ' +
  'incoming instance that omits it cannot be converted: the reference implementation ' +
  'produces **nothing** rather than inventing a value. See ' +
  '[the mandatory-attribute rule](conventions.html#mandatory-attributes).';
const NOT_REVIEWED: Review = { openehr: [], fhir: [] };

const dvTextToString = {
  id: 'dv-text-to-string',
  category: 'textual',
  openehrType: 'DV_TEXT',
  fhirType: 'string | markdown',
  title: 'DV_TEXT ↔ string / markdown',
  scope: 'datatype',
  sources: [DV_TEXT, FHIR_STRING, FHIR_MARKDOWN],
  review: REVIEWED_BOTH,
  rows: [
    {
      id: 'dv-text.value',
      scope: 'datatype',
      openehr: {
        path: 'DV_TEXT.value',
        cardinality: '1..1',
        type: 'String',
        kind: 'element',
        cite: DV_TEXT,
      },
      fhir: [
        {
          path: 'string.value',
          cardinality: '0..1',
          type: 'string',
          kind: 'element',
          when: 'the target element is typed `string`',
          cite: FHIR_STRING,
        },
        {
          path: 'markdown.value',
          cardinality: '0..1',
          type: 'markdown',
          kind: 'element',
          when: 'the target element is typed `markdown` and `formatting` says markdown',
          cite: FHIR_MARKDOWN,
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'settled',
      note:
        'A direct mapping; the target **type** is decided by the FHIR element definition, ' +
        'not by the data. FHIR strips leading and trailing whitespace and does not permit ' +
        'an empty `string`: an empty *optional* openEHR value is dropped, and an empty ' +
        '*mandatory* one is an upstream data error. FHIR caps `string` at 1 MiB; openEHR ' +
        'sets no cap, and an oversize value is an exception rather than something to ' +
        'truncate silently. The FHIR side is modelled here as the primitive together with ' +
        'its `_`-sibling — the `value` plus `extension` pair — because that is what carries ' +
        'the extensions the rows below use.' + MANDATORY_RULE,
    },
    {
      id: 'dv-text.formatting',
      scope: 'datatype',
      openehr: {
        path: 'DV_TEXT.formatting',
        cardinality: '0..1',
        type: 'String',
        kind: 'element',
        cite: TEXT_FORMATTING,
      },
      fhir: [
        {
          path: 'string.extension[rendering-markdown]',
          cardinality: '0..1',
          kind: 'extension',
          cite: ext('rendering-markdown', 'FHIR Extensions — rendering-markdown'),
        },
      ],
      toFhir: {
        fidelity: 'lossy',
        drops: [
          {
            path: 'DV_TEXT.formatting',
            reason:
              'the distinction between `plain` and `plain_no_newlines` has no FHIR ' +
              'representation; only `markdown` and `html` change what FHIR does, by ' +
              'selecting a different target type or a rendering extension',
          },
        ],
      },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'Where `formatting` is `markdown`, the FHIR target SHOULD be a `markdown` element, ' +
        'or a `string` carrying the `rendering-markdown` extension. Where it is `html`, the ' +
        'target SHOULD be an `xhtml` element or a `string` carrying `rendering-xhtml`. ' +
        'Where a FHIR `string` carries one of those extensions on the way back, the ' +
        'corresponding `formatting` value is set. XHTML support on the openEHR side is ' +
        'pending a Reference Model change request.',
    },
    {
      id: 'dv-text.language',
      scope: 'datatype',
      openehr: {
        path: 'DV_TEXT.language',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: CODE_PHRASE,
      },
      fhir: [
        {
          path: 'string.extension[language]',
          cardinality: '0..1',
          kind: 'extension',
          cite: ext('language', 'FHIR Extensions — language'),
        },
      ],
      toFhir: { fidelity: 'lossless' },
      toOpenehr: { fidelity: 'lossless' },
      maturity: 'open',
      note:
        'The two standards carry language at **different levels of the model**. openEHR ' +
        'puts it on the value; FHIR puts the primary language on `Resource.language` and ' +
        'uses element-level extensions — `language`, `translation`, `additional-language`, ' +
        'and `narrativeLanguageControl` — for anything finer. Which of those applies is a ' +
        'resource-level decision, so only the element-level `language` extension is stated ' +
        'here. A cluster archetype for narrative, accounting for narrative language ' +
        'control, is owned by the openEHR modelling team.',
    },
    {
      id: 'dv-text.encoding',
      scope: 'datatype',
      openehr: {
        path: 'DV_TEXT.encoding',
        cardinality: '0..1',
        type: 'CODE_PHRASE',
        kind: 'element',
        cite: DV_TEXT,
      },
      fhir: {
        kind: 'none',
        reason:
          'FHIR mandates UTF-8 throughout and has no element recording the character set ' +
          'of a value, because there is only one.',
        cite: FHIR_STRING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'The character set is not carried. openEHR permits several through its ' +
          '`character_sets` code system; **the sender is responsible for converting to ' +
          'UTF-8 before mapping**, and the original encoding is not preserved.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason:
          'Nothing arrives. A receiving system MAY set `encoding` to UTF-8, which is an ' +
          'inference from the FHIR rule rather than a carried value.',
      },
      maturity: 'settled',
    },
    {
      id: 'dv-text.hyperlink',
      scope: 'datatype',
      openehr: {
        path: 'DV_TEXT.hyperlink',
        cardinality: '0..1',
        type: 'DV_URI',
        kind: 'element',
        cite: DV_TEXT,
      },
      fhir: {
        kind: 'none',
        reason:
          'A FHIR `string` has no associated link element. A link belongs in the content ' +
          'itself, as markdown, or in a `Reference` on the enclosing resource.',
        cite: FHIR_STRING,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          '`hyperlink` is **deprecated** in the openEHR Reference Model. Where one is ' +
          'present it MAY be folded into markdown content rather than dropped, which is a ' +
          'transformation of the value rather than a mapping of the field.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing arrives, and nothing should: the field is deprecated.',
      },
      maturity: 'settled',
    },
    {
      id: 'dv-text.mappings',
      scope: 'datatype',
      openehr: {
        path: 'DV_TEXT.mappings',
        cardinality: '0..*',
        type: 'TERM_MAPPING',
        kind: 'element',
        cite: DV_TEXT,
      },
      fhir: {
        kind: 'none',
        reason:
          'A FHIR `string` cannot carry codings. A value that has term mappings is a coded ' +
          'value and belongs in a `CodeableConcept`, not in a `string`.',
        cite: CODEABLE_CONCEPT,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          'Not carried by *this* mapping. A `DV_TEXT` with term mappings SHOULD be mapped ' +
          'as a `CodeableConcept` instead — see [Coded Data](mapping-coded.html) — where ' +
          'each mapping becomes an additional coding.',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'A plain `string` carries no codings, so nothing arrives.',
      },
      maturity: 'settled',
    },
  ],
} satisfies Mapping;

const dvParagraphToMarkdown = {
  id: 'dv-paragraph-to-markdown',
  category: 'textual',
  openehrType: 'DV_PARAGRAPH',
  fhirType: 'markdown | string',
  title: 'DV_PARAGRAPH ↔ markdown / string',
  scope: 'datatype',
  sources: [rm('_text_package', 'openEHR RM — Text package'), FHIR_MARKDOWN],
  review: NOT_REVIEWED,
  rows: [
    {
      id: 'dv-paragraph.items',
      scope: 'datatype',
      openehr: {
        path: 'DV_PARAGRAPH.items',
        cardinality: '1..*',
        type: 'DV_TEXT',
        kind: 'element',
        cite: rm('_text_package', 'openEHR RM — Text package'),
      },
      fhir: {
        kind: 'none',
        reason:
          'No FHIR target has been agreed. `markdown` and `string` are both plausible, and ' +
          'neither has been examined by the working group.',
        cite: FHIR_MARKDOWN,
      },
      toFhir: {
        fidelity: 'unmapped',
        reason:
          '`DV_PARAGRAPH` has **not been discussed**. It is deprecated in the Reference ' +
          'Model but may appear in older data and archetypes, so it is listed rather than ' +
          'omitted. No mapping is asserted, because none has been agreed.',
        owner: 'working-group',
      },
      toOpenehr: {
        fidelity: 'unmapped',
        reason: 'Nothing is mapped into a deprecated type that has not been discussed.',
        owner: 'working-group',
      },
      maturity: 'not-discussed',
    },
  ],
} satisfies Mapping;

export default [dvTextToString, dvParagraphToMarkdown] satisfies readonly Mapping[];
