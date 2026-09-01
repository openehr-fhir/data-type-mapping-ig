/**
 * What each FHIR extension this guide names actually declares.
 *
 * **This table is hand-authored on the working group's authority.** The local
 * FHIR R5 mirror the citation tests resolve against holds the core
 * specification only — the extension pack is not in it, only redirect stubs —
 * so an extension's declared `value[x]` type, cardinality, and context cannot be
 * resolved mechanically here. That is exactly what the `extension-unverified`
 * citation tier exists to say, and every entry below carries such a citation.
 *
 * What the table *does* buy is a closed statement the guide can be checked
 * against: `test/extensions.test.ts` asserts that every extension carried by a
 * published fixture resolves to an entry here, emits the declared `value[x]`
 * property name, and sits on an element the declared context admits — and that
 * every extension URL the ledger cites appears here at all. A wrong entry is
 * still wrong, but it is wrong in **one** place instead of in six fixtures and
 * four pages.
 *
 * `published: false` marks an extension this guide **names but does not emit**:
 * a candidate recorded in the prose, or one the guide considered and withdrew.
 * Nothing in `reference/fixtures/` carries one, and the table therefore records
 * no `value[x]` claim for it.
 */

import type { Cite } from './types.ts';

const EXT_PACK = 'https://hl7.org/fhir/extensions/StructureDefinition';

function ext(name: string, label: string): Cite {
  return { url: `${EXT_PACK}-${name}.html`, label, verification: 'extension-unverified' };
}

/** One extension, as the extension pack declares it. */
export interface ExtensionType {
  /** The last segment of the canonical URL. */
  readonly name: string;
  readonly url: string;
  /**
   * The declared `value[x]` **JSON property name** — `valueInteger`,
   * `valueQuantity`, … — or `undefined` when this guide publishes no instance
   * and therefore records no claim.
   */
  readonly valueProperty?: string;
  /** The declared cardinality of `value[x]`. */
  readonly cardinality?: string;
  /**
   * The types and paths the declared context admits. `Element` means any
   * element. A profile of a listed type — `SimpleQuantity` is a `Quantity` —
   * is admitted too, and is listed explicitly where a fixture uses it.
   */
  readonly contexts?: readonly string[];
  /** True when some fixture in this guide carries an instance of it. */
  readonly published: boolean;
  readonly cite: Cite;
  readonly note?: string;
}

/** The canonical URL prefix every entry shares. */
export const EXTENSION_URL_PREFIX = 'http://hl7.org/fhir/StructureDefinition/';

export const EXTENSION_TYPES: readonly ExtensionType[] = [
  {
    name: 'quantity-precision',
    url: `${EXTENSION_URL_PREFIX}quantity-precision`,
    valueProperty: 'valueInteger',
    cardinality: '0..1',
    contexts: ['Quantity', 'SimpleQuantity', 'Count', 'Duration', 'MoneyQuantity'],
    published: true,
    cite: ext('quantity-precision', 'FHIR Extensions — quantity-precision'),
    note:
      'The declared context is `Quantity`; every profile of `Quantity` is a `Quantity`, ' +
      'so the profiles this guide targets are listed explicitly.',
  },
  {
    name: 'quantity-accuracy',
    url: `${EXTENSION_URL_PREFIX}quantity-accuracy`,
    valueProperty: 'valueQuantity',
    cardinality: '0..1',
    contexts: ['Quantity', 'SimpleQuantity', 'Count', 'Duration', 'MoneyQuantity'],
    published: true,
    cite: ext('quantity-accuracy', 'FHIR Extensions — quantity-accuracy'),
    note:
      'The declared `value[x]` is a **`Quantity`**, not a `decimal`. That is what lets an ' +
      'accuracy expressed as a percentage be carried at all: the accuracy quantity takes ' +
      'UCUM `%` as its unit, and the magnitude\u2019s own unit otherwise.',
  },
  {
    name: 'rendering-markdown',
    url: `${EXTENSION_URL_PREFIX}rendering-markdown`,
    valueProperty: 'valueMarkdown',
    cardinality: '0..1',
    contexts: ['Element'],
    published: true,
    cite: ext('rendering-markdown', 'FHIR Extensions — rendering-markdown'),
  },
  {
    name: 'rendering-xhtml',
    url: `${EXTENSION_URL_PREFIX}rendering-xhtml`,
    valueProperty: 'valueString',
    cardinality: '0..1',
    contexts: ['Element'],
    published: true,
    cite: ext('rendering-xhtml', 'FHIR Extensions — rendering-xhtml'),
    note:
      'Emitted by the reference implementation when `DV_TEXT.formatting` is `html`; no ' +
      'fixture in this guide exercises that branch yet.',
  },
  {
    name: 'language',
    url: `${EXTENSION_URL_PREFIX}language`,
    valueProperty: 'valueCode',
    cardinality: '1..1',
    contexts: ['Element'],
    published: true,
    cite: ext('language', 'FHIR Extensions — language'),
    note:
      'The binding to `all-languages` is **required**, so the code is an IETF BCP 47 tag ' +
      'and the `CODE_PHRASE.terminology_id` that stated as much has no home of its own.',
  },
  {
    name: 'iso21090-nullFlavor',
    url: `${EXTENSION_URL_PREFIX}iso21090-nullFlavor`,
    valueProperty: 'valueCode',
    cardinality: '1..1',
    contexts: ['Element'],
    published: false,
    cite: ext('iso21090-nullFlavor', 'FHIR Extensions — iso21090-nullFlavor'),
    note: 'Named as the HL7 v3 NullFlavor correspondence; no fixture emits one.',
  },
  {
    name: 'data-absent-reason',
    url: `${EXTENSION_URL_PREFIX}data-absent-reason`,
    valueProperty: 'valueCode',
    cardinality: '1..1',
    contexts: ['Element'],
    published: false,
    cite: ext('data-absent-reason', 'FHIR Extensions — data-absent-reason'),
    note:
      'The null-flavour mapping is published as a `CodeableConcept` bound to the ' +
      'data-absent-reason code system, not as this element-level extension.',
  },
  {
    name: 'itemWeight',
    url: `${EXTENSION_URL_PREFIX}itemWeight`,
    published: false,
    cite: ext('itemWeight', 'FHIR Extensions — itemWeight'),
    note:
      'Cited by the archetype-scope `DV_ORDINAL` / `DV_SCALE` rows as the place an ordinal ' +
      'value lands on a resource element. No data-type fixture emits one, so no ' +
      '`value[x]` claim is recorded here.',
  },
  {
    name: 'timezone',
    url: `${EXTENSION_URL_PREFIX}timezone`,
    valueProperty: 'valueCode',
    cardinality: '1..1',
    contexts: ['date', 'dateTime', 'instant', 'time'],
    published: false,
    cite: ext('timezone', 'FHIR Extensions — timezone'),
    note:
      '**Considered and withdrawn.** `time` is a permitted context, but the value is a ' +
      '`code` **required**-bound to `http://hl7.org/fhir/ValueSet/timezones`, whose codes ' +
      'are IANA zone names. A UTC offset is not a zone name, and a zone name is not an ' +
      'offset — one zone denotes different offsets across daylight saving — so a ' +
      '`DV_TIME` offset cannot be carried through it. The guide publishes the gap instead.',
  },
  {
    name: 'mimeType',
    url: `${EXTENSION_URL_PREFIX}mimeType`,
    valueProperty: 'valueCode',
    cardinality: '1..1',
    contexts: ['Questionnaire.item', 'ElementDefinition'],
    published: false,
    cite: ext('mimeType', 'FHIR Extensions — mimeType'),
    note:
      '**Considered and withdrawn.** Its context admits neither `string` nor any data ' +
      'type, and its purpose is a design-time constraint on the attachments an element ' +
      'permits — not a statement of the syntax an instance value is written in. It cannot ' +
      'carry `DV_PARSABLE.formalism`.',
  },
  {
    name: 'coding-purpose',
    url: `${EXTENSION_URL_PREFIX}coding-purpose`,
    published: false,
    cite: ext('coding-purpose', 'FHIR Extensions — coding-purpose'),
    note:
      'A **candidate** for `TERM_MAPPING.purpose` and for `defining_code` (HTA-170). ' +
      'Neither is adopted, nothing is emitted, and no `value[x]` claim is recorded.',
  },
  {
    name: 'alternate-codes',
    url: `${EXTENSION_URL_PREFIX}alternate-codes`,
    published: false,
    cite: ext('alternate-codes', 'FHIR Extensions — alternate-codes'),
    note:
      'The other **candidate** for `TERM_MAPPING.purpose`, carrying the whole group of ' +
      'alternate codes on the concept. Not adopted; nothing is emitted.',
  },
  {
    name: 'targetElement',
    url: `${EXTENSION_URL_PREFIX}targetElement`,
    published: false,
    cite: ext('targetElement', 'FHIR Extensions — targetElement'),
    note:
      'Named in the `LINK` rows as the way a reference to a **part** of a resource is ' +
      'expressed. This guide does not produce one.',
  },
  {
    name: 'targetPath',
    url: `${EXTENSION_URL_PREFIX}targetPath`,
    published: false,
    cite: ext('targetPath', 'FHIR Extensions — targetPath'),
    note:
      'The FHIRPath alternative to `targetElement`, named in the same rows. This guide ' +
      'does not produce one.',
  },
];

/** The entry for one canonical URL, or `undefined`. */
export function extensionType(url: string): ExtensionType | undefined {
  return EXTENSION_TYPES.find((entry) => entry.url === url);
}
