/**
 * The open-items register.
 *
 * This is **not** ledger content: `load.ts` assembles `reference/ledger/` as
 * `Mapping[]`, and an action item has no openEHR type, no FHIR type, and no
 * rows. It declares its own type and lives here instead.
 *
 * `open-items.test.ts` ties the two together, by asserting that every `Owner`
 * literal cited anywhere in the ledger appears in this register — so a ticket a
 * mapping row blames cannot go missing from the page the working group reads.
 */

import type { Cite, Owner } from '../src/model/types.ts';

export type Side = 'fhir' | 'openehr' | 'documentation';
export type Priority = 'high' | 'medium' | 'low';

export interface OpenItem {
  readonly id: string;
  readonly title: string;
  readonly side: Side;
  /** Who holds it. A person, a group, or a ticket. */
  readonly owner: string;
  readonly priority: Priority;
  /** Where it stands, in the working group's own words. */
  readonly status: string;
  /** The `Owner` literal the ledger uses for this item, where there is one. */
  readonly ledgerOwner?: Owner;
  readonly ticket?: Cite;
}

function jira(ticket: string): Cite {
  return {
    url: `https://jira.hl7.org/browse/${ticket}`,
    label: ticket,
    verification: 'spec-remote',
  };
}

export const OPEN_ITEMS: readonly OpenItem[] = [
  // ── FHIR-side actions ─────────────────────────────────────────────────────
  {
    id: 'hta-170',
    title: 'Add `defining_code` to the `coding-purpose` code system',
    side: 'fhir',
    owner: 'Brett Esler',
    priority: 'high',
    status:
      'Open. Submitted to HL7 Terminology. The group is trending towards the pragmatic ' +
      'position that `userSelected` and `defining_code` are equivalent enough, and may ' +
      'withdraw the request.',
    ledgerOwner: 'HTA-170',
    ticket: jira('HTA-170'),
  },
  {
    id: 'fhir-56000',
    title: 'Add `~` (approximate) to `Quantity.comparator`',
    side: 'fhir',
    owner: 'Gino',
    priority: 'medium',
    status:
      'Resolved, not applied. Lands in R6 with guidance on stating an accuracy range and a ' +
      'default assumption of ±10%. Not available in an R5 instance.',
    ledgerOwner: 'FHIR-56000',
    ticket: jira('FHIR-56000'),
  },
  {
    id: 'fhir-55422',
    title: 'A hash-algorithm extension on `Attachment`',
    side: 'fhir',
    owner: 'Gino',
    priority: 'medium',
    status:
      'Resolved, change required. HL7 agreed to define a core `alternate-hash` extension ' +
      'while keeping SHA-1 as the default. Not yet published.',
    ledgerOwner: 'FHIR-55422',
    ticket: jira('FHIR-55422'),
  },
  {
    id: 'fhir-56003',
    title: 'A compression-algorithm extension on `Attachment`',
    side: 'fhir',
    owner: 'Gino',
    priority: 'low',
    status:
      'Triaged. The pragmatic alternative is to decompress during conversion, which removes ' +
      'the need for the field entirely.',
    ledgerOwner: 'FHIR-56003',
    ticket: jira('FHIR-56003'),
  },
  {
    id: 'fhir-56001',
    title: 'A FHIR representation for `pk_fraction` and `pk_integer_fraction` formatting',
    side: 'fhir',
    owner: 'Gino',
    priority: 'medium',
    status:
      'Triaged. These are display directives; a search of `Ratio` found nothing suitable, ' +
      'and the desire is to use the standard `rendered-value` extension.',
    ledgerOwner: 'FHIR-56001',
    ticket: jira('FHIR-56001'),
  },
  {
    id: 'fhir-56002',
    title: 'A thumbnail extension on `Attachment`',
    side: 'fhir',
    owner: 'Gino',
    priority: 'medium',
    status:
      'Triaged. The existing `documentreference-thumbnail` extension is a flag on ' +
      '`DocumentReference.content` saying the content *is* a thumbnail; a new extension on ' +
      '`Attachment` was requested instead.',
    ledgerOwner: 'FHIR-56002',
    ticket: jira('FHIR-56002'),
  },

  // ── openEHR-side actions ──────────────────────────────────────────────────
  {
    id: 'openehr-normal-status-binding',
    title: 'Relax the `normal_status` binding from `required` to `extensible`',
    side: 'openehr',
    owner: 'openEHR',
    priority: 'high',
    status: 'In progress. Ticket filed November 2025; the principle is agreed.',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-link-party-unification',
    title: 'Merge `LINK` and `PARTY_IDENTIFIED` onto a common Reference Model class',
    side: 'openehr',
    owner: 'openEHR',
    priority: 'medium',
    status:
      'Open. Strong consensus on the need; `OBJECT_REF` identified as the right structure. ' +
      'A Reference Model change is required. **This guide maps the RM as published today.**',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-identifier-cluster',
    title: 'A `DV_IDENTIFIER` cluster archetype carrying `use`, `period`, and several types',
    side: 'openehr',
    owner: 'Modelling team',
    priority: 'medium',
    status: 'Done; needs to be uploaded for review.',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-narrative-cluster',
    title: 'A narrative cluster archetype for the `COMPOSITION` extension slot',
    side: 'openehr',
    owner: 'Modelling team',
    priority: 'medium',
    status: 'Done; needs to be uploaded for review.',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-money',
    title: 'Constraining `units_system` in Archetype Designer, and an RM `Money` type',
    side: 'openehr',
    owner: 'Ian',
    priority: 'low',
    status:
      'Will not do as an archetype — implementation guidance is more appropriate, because ' +
      'the tooling does not currently allow the binding to be set even though ADL permits ' +
      'it. Two change requests are open instead.',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-code-string-whitespace',
    title: 'Add whitespace restrictions to `CODE_PHRASE.code_string`',
    side: 'openehr',
    owner: 'openEHR',
    priority: 'low',
    status:
      'Proposed September 2025; the group agreed to propose it. No ticket confirmed. ' +
      'Without it, a `code_string` containing whitespace has no valid FHIR `code` form.',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-term-mapping-purpose-binding',
    title: 'Relax the `TERM_MAPPING.purpose` binding from `required` to `extensible`',
    side: 'openehr',
    owner: 'openEHR IG',
    priority: 'medium',
    status:
      'In progress. A binding-relaxation ticket was filed November 2025; the specific ' +
      '`TERM_MAPPING` change is not confirmed. The current `required` binding is considered ' +
      'incorrect.',
    ledgerOwner: 'openehr-modelling',
  },
  {
    id: 'openehr-null-flavour-valuesets',
    title: 'Support both FHIR value sets — data-absent-reason and v3 NullFlavor',
    side: 'openehr',
    owner: 'openEHR',
    priority: 'medium',
    status:
      'Planned; agreed February 2026. The back-transformation is keyed on which code system ' +
      'is present. ConceptMaps not yet created.',
    ledgerOwner: 'openehr-modelling',
  },

  // ── Documentation and tooling ─────────────────────────────────────────────
  {
    id: 'doc-iso8601-ucum-library',
    title: 'Publish an ISO 8601 ↔ UCUM duration conversion reference library',
    side: 'documentation',
    owner: 'Severin',
    priority: 'medium',
    status:
      'In progress. The conversion table was delivered February 2026 and is implemented in ' +
      'this guide\u2019s reference implementation; a standalone library is not yet ' +
      'published. If one is, it **supersedes** the reference helper rather than conflicting ' +
      'with it.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-concept-maps',
    title: 'Write the ConceptMaps for null_flavour ↔ data-absent-reason and ↔ NullFlavor',
    side: 'documentation',
    owner: 'Group',
    priority: 'medium',
    status:
      'Open; agreed as needed February 2026. The narrative correspondence tables in ' +
      '[Coded Data](mapping-coded.html) are the input, so the remaining work is ' +
      'transcription.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-dv-amount-pattern',
    title: 'A standardised `DV_AMOUNT` mapping pattern document',
    side: 'documentation',
    owner: 'Group',
    priority: 'high',
    status:
      '**Addressed by this guide.** The policy — every inherited field promotes to the ' +
      '`Observation` level — was agreed January 2026, and the pattern is now stated once on ' +
      '[Cross-Cutting Concerns](cross-cutting.html) and applied per type.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-terminology-id-format',
    title: 'Choose the `system` + `version` → `terminology_id` format',
    side: 'documentation',
    owner: 'Group',
    priority: 'high',
    status:
      'Open. Trade-offs discussed September 2025; the pipe form has support; the decision is ' +
      'deferred. **This guide adopts nothing** — the reference helpers take the format as a ' +
      'required parameter with no default, and no registered converter calls them.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-missing-terminology-defaults',
    title: 'A default strategy for a missing mandatory `terminology_id` or `code_string`',
    side: 'documentation',
    owner: 'Group',
    priority: 'high',
    status:
      'Open. Options brainstormed September 2025 and February 2026; no formal decision. ' +
      'The candidates are stated on [Coded Data](mapping-coded.html) and none is chosen.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-iso8601-subset',
    title: 'A detailed ISO 8601 subset comparison',
    side: 'documentation',
    owner: 'Group',
    priority: 'medium',
    status:
      '**Addressed by this guide.** Acknowledged as roughly 90% aligned in January 2026; ' +
      'the comparison is now published on [Cross-Cutting Concerns](cross-cutting.html), ' +
      'generated from the code that implements the conversion.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-cross-version-extensions',
    title: 'Document the general case of cross-version extensions',
    side: 'documentation',
    owner: 'Gino',
    priority: 'medium',
    status:
      'Open. The agreed handling: where FHIR supplies no value but does supply an ' +
      'extension, use the value from the extension; for coded values, use `TERM_MAPPING` to ' +
      'carry the several values.',
    ledgerOwner: 'working-group',
  },
  {
    id: 'doc-dv-parsable-formalism',
    title: 'Decide how `DV_PARSABLE.formalism` reaches FHIR, if it can',
    side: 'documentation',
    owner: 'Group',
    priority: 'high',
    status:
      'Reopened by review. The working group recorded a **Decision made** to carry the ' +
      'formalism in the `mimeType` extension. That extension declares its context as ' +
      '`Questionnaire.item` and `ElementDefinition` and exists to constrain the ' +
      'attachments an element permits, so it cannot carry an instance\u2019s syntax and ' +
      'the decision is not supported by the definition it names. **This guide publishes ' +
      'the gap** rather than an instance no validator accepts, which makes ' +
      '`DV_PARSABLE ↔ string` one-directional until the question is settled.',
    ledgerOwner: 'session:dv-parsable-formalism',
  },
  {
    id: 'doc-dv-time-offset',
    title: 'Decide where a `DV_TIME` UTC offset goes, given FHIR `time` has no home for one',
    side: 'documentation',
    owner: 'Group',
    priority: 'high',
    status:
      'Reopened by review. The `timezone` extension admits `time` as a context but is a ' +
      '`code` **required**-bound to the IANA zone names, and an offset is neither a zone ' +
      'name nor derivable from one. The guide therefore publishes the offset as a named ' +
      'drop and recommends `dateTime` where the offset is clinically significant. Whether ' +
      'to request a FHIR extension that carries an offset on a `time` is undecided.',
    ledgerOwner: 'session:dv-time-offset',
  },
];
