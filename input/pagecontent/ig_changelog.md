### Change Log

Substantive changes are recorded here, in the same commit that makes them.
Group entries under the version heading they ship in, using the categories
below, and nest a bullet per page or artifact touched.

Categories, in the order they appear under a version:

- **Non-compatible** — breaks existing implementations (renamed ids, moved
  canonicals, tightened cardinality or bindings).
- **Compatible, Substantive** — changes meaning without breaking conformance.
- **Compatible, Non-Substantive** — clarifications, typos, editorial fixes.

#### Version 0.1.0

**Compatible, Substantive**

First content release. The guide moves from an empty scaffold to a complete
data-type mapping between the openEHR Reference Model and FHIR R5, stated at
**field level** and in **both directions**, with every claim backed by runnable
code.

*Structure*

- **Eighteen pages**, up from four. Added `type-systems.html`,
  `conventions.html`, eight category pages (`mapping-boolean.html`,
  `mapping-numeric.html`, `mapping-reference.html`, `mapping-textual.html`,
  `mapping-coded.html`, `mapping-quantity.html`, `mapping-temporal.html`,
  `mapping-other.html`), `gaps.html`, `cross-cutting.html`, `open-items.html`,
  and `reference-implementation.html`, each registered in both `pages:` and
  `menu:`.
- `mapping.html` became the index to the category pages. Its conventions
  section moved to `conventions.html`, and **the two normative SHALL sentences
  moved verbatim** — *"A mapping marked **lossless** SHALL round-trip:
  converting openEHR to FHIR and back SHALL yield an equivalent instance. A
  mapping marked **lossy** SHALL document exactly which information is
  dropped."* That is a relocation, not a rewording; no conformance language
  changed.
- `conventions.html` extends the relocated legend with **per-direction**
  fidelity columns, a decision-maturity legend (`settled` / `open` /
  `not-discussed`), and a scope legend (`datatype` / `archetype`).

*How the guide is produced*

- Every mapping table and every worked example is **generated** from a single
  machine-checked mapping ledger and written into sentinel-delimited managed
  regions in the page sources. A published example *is* the fixture the
  converters are tested against, so the two cannot drift.
- Fidelity claims are **checked, not asserted**: a `lossless` row must
  round-trip a paired instance unchanged, and a `lossy` row must drop exactly
  what it declares — no more and no less.
- Extension-pack citations are marked with a dagger and are taken on the
  working group's authority, because they cannot be resolved against a local
  mirror of the FHIR R5 core specification. `build.fhir.org` citations are not
  permitted anywhere in this guide.

*The mappings*

- **Quantities** — `DV_QUANTITY` ↔ `Quantity`, `DV_COUNT` ↔ `Count`,
  `DV_PROPORTION` ↔ `Ratio`, `DV_INTERVAL` ↔ `Range` / `Period` / `Quantity`,
  `DV_QUANTITY` ↔ `Money` / `MoneyQuantity` and ↔ `SimpleQuantity`, and the
  archetype-scope `DV_ORDINAL` and `DV_SCALE` ↔ `Observation.component`.
- **Coded data** — `CODE_PHRASE` ↔ `Coding`, `DV_CODED_TEXT` ↔
  `CodeableConcept` / `Coding`, `TERM_MAPPING` ↔ `CodeableConcept.coding`, and
  the `null_flavour` ↔ `data-absent-reason` correspondences with their full
  L1/L2 inheritance in both directions, plus the HL7 v3 `NullFlavor`
  correspondence.
- **Boolean** — `DV_BOOLEAN` ↔ `boolean`.
- **Numeric primitives** — `Integer` ↔ `integer`, `Integer64` ↔ `integer64`,
  and `Real` / `Double` ↔ `decimal`, including the FHIR rule that trailing zeros
  in a `decimal` are significant and openEHR's that they are not.
- **Textual data** — `DV_TEXT` ↔ `string` / `markdown`, covering `formatting`,
  `language`, `encoding`, the deprecated `hyperlink`, and `mappings`.
- **Resource-locator data and references** — `DV_IDENTIFIER` ↔ `Identifier`,
  `DV_URI` / `DV_EHR_URI` ↔ `uri` / `url`, and `LINK` ↔ `Reference` /
  `CodeableReference`, including the `system::value` convention and its
  last-`::` parsing rule.
- **Temporal data** — `DV_DATE`, `DV_TIME`, `DV_DATE_TIME`, and `DV_DURATION`,
  with the ISO 8601 subset differences stated as mapping rules: compact openEHR
  forms SHALL be expanded, partial precision SHALL be truncated rather than
  padded, fractional seconds truncate from nine digits to three, and a `time`
  carries its offset in the `timezone` extension because FHIR `time` cannot.
- **Other data** — `DV_MULTIMEDIA` ↔ `Attachment`, `DV_PARSABLE` ↔ `string`,
  and `DV_STATE` ↔ `CodeableConcept`.

*What is not settled, and is said to be not settled*

- **Gaps.** `gaps.html` publishes four inventories, three of them **derived
  from the whole ledger** rather than transcribed, so a gap cannot fall out of
  step with the mapping it belongs to: openEHR → FHIR, FHIR → openEHR, and
  not-yet-discussed. The fourth lists FHIR types with no openEHR counterpart at
  all — `Address`, `HumanName`, `ContactPoint`, `Annotation`, `Signature`,
  `SampledData`, `RatioRange`, `Money`, `Meta`, `Narrative` — each citing the
  openEHR Data Types inventory page, so "no counterpart exists" stays a sourced
  claim.
- **Open decisions are recorded as open, with their candidates and no default.**
  The `system` + `version` → `terminology_id` format (three candidates); the
  strategy for a missing mandatory `terminology_id` or `code_string`; the
  representation of `TERM_MAPPING.purpose`; openEHR `271` *no information*,
  which has no `data-absent-reason` equivalent; the `~` approximate comparator
  (R6, FHIR-56000); `Quantity.comparator = ad`; the `DV_PROPORTION` kind
  discriminator (FHIR-56001); units on a `Ratio`; `Attachment` compression
  (FHIR-56003), non-SHA-1 hashing (FHIR-55422), and thumbnails (FHIR-56002);
  and the `normal_status` binding breadth.
- **`not-discussed` rows carry no fidelity claim at all.** `DV_PARAGRAPH`,
  `DV_GENERAL_TIME_SPECIFICATION`, `DV_PERIODIC_TIME_SPECIFICATION`,
  `DV_ENCAPSULATED`, `EVENT`, `COMPOSITION`, `PARTY_RELATED`, and the *Media
  File* CLUSTER archetype are listed with a reason and nothing more.
- **Reviewer coverage is published in full**, including the mappings reviewed
  from neither side. Every `Owner` a mapping row blames is asserted to appear in
  the open-items register.

*Cross-cutting*

- `cross-cutting.html` collects the terminology-identifier question with its
  three candidates and no decision, the character-encoding rule, the `DV_AMOUNT`
  pattern stated once for all four subtypes, the ISO 8601 subset comparison as a
  **generated** table, the working group's position that validation is out of
  scope, and both halves of the bindings and process guidance the source
  documents left as empty headings.

*Not in this release*

- No FHIR profile, extension, code system, value set, concept map, or
  StructureMap is defined. `input/fsh/` is intentionally empty. Terminology
  stays anchored in `terminology.hl7.org` or in openEHR's own published
  terminology. No archetype is authored; the guide links the ones a gap depends
  on and names who owns them.

*Review remediation*
- **The mandatory-attribute rule is stated and enforced.** A conversion never
  invents a value for an attribute the target standard declares mandatory:
  where the source carries nothing for one, it produces no value at all and
  reports the absent source path, rather than substituting a zero, an empty
  string, or a default code and reporting `lossless`. The rule is published on
  `conventions.html`, its two recorded exceptions —
  `CODE_PHRASE.terminology_id` from an absent `Coding.system`, and
  `DV_STATE.is_terminal` — are named on the rows that describe them, and the
  reference implementation's contract tests hold every converter to it.
- **Composed conversions carry their inner drops.** `DV_CODED_TEXT ↔
  CodeableConcept`, `TERM_MAPPING ↔ Coding`, and `DV_STATE ↔ CodeableConcept`
  now report the `CODE_PHRASE ↔ Coding` drops they delegate to, so a published
  loss cannot disappear behind a composition boundary.
- **The ISO 8601 completion rules are implemented, and the "never pad" rule is
  reconciled with FHIR's lexical requirements.** An openEHR `14:30` or
  `2026-03-01T14:30` is completed to seconds — FHIR admits no shorter form —
  and each completion is now a named loss in its own right,
  `DV_TIME.value[minute-precision]` and
  `DV_DATE_TIME.value[minute-precision]`, rather than a `lossless` claim the
  guide's own normative rule contradicted. Compact UTC offsets (`+0100`) are
  expanded alongside compact dates and times. The published statement that
  partial precision is truncated and never padded now says exactly where it
  applies and where FHIR makes it impossible.
- **`DV_DURATION` conversions no longer fabricate `PT0S` or an empty
  `Duration`.** A multi-component duration, a `Duration` with no unit, a
  `Duration` whose unit is not a time unit, and a `Duration` with no value all
  produce nothing and report why, with the underlying diagnostic preserved.
- **The `ms` duration unit is stated honestly.** `{n}` ms is written as
  `PT{n/1000}S`, which reads back as seconds, so the unit provably does not
  survive the return trip. The published unit list and the conversion helper
  both say so, and the test that used to skip the unit now asserts the
  asymmetry.
- **Every published extension emits the `value[x]` its definition declares.**
  `quantity-accuracy` is a `Quantity`, not a `decimal` — which is what lets an
  accuracy expressed as a percentage be carried at all, in UCUM `%`, so the
  `accuracy_is_percent` drop is gone; `rendering-markdown` is a `markdown`;
  `language` is a `code`. A new gate resolves every extension a worked example
  carries against a declared table of `value[x]` types, cardinalities, and
  contexts, and every worked example in this guide **is** one of those fixtures.
- **Two extension uses are withdrawn, and the gaps are published instead.**
  `DV_PARSABLE.formalism` was mapped to the `mimeType` extension, whose context
  is `Questionnaire.item` and `ElementDefinition` and whose purpose is a
  design-time constraint on permitted attachments; it cannot carry an
  instance's syntax. `DV_TIME`'s UTC offset was mapped to the `timezone`
  extension, whose value is a `code` required-bound to IANA zone names, which an
  offset is not. Both rows now publish the gap with an owner, and
  `DV_PARSABLE ↔ string` is stated as the one-directional mapping it is. No
  substitute extension is invented for either.
- **Every worked example is asserted to be a pair.** Each `openEHR` example and  its `FHIR` partner are now checked to be producible from one another, modulo
  the drops the ledger declares. Where a pair holds in one direction only — an
  approximate `magnitude_status`, a `Quantity.comparator` of `ad`, a `Ratio`
  carrying units, a nine-digit fractional second, a `Coding` with no system, a
  minute-precision `dateTime` — the example now says which direction it claims
  and why, instead of implying both. Three examples were corrected outright:
  the `no information` null flavour maps to `unknown`, not `asked-unknown`; a
  systemless `Coding` becomes the placeholder `terminology_id` the guide
  actually documents; and a `CodeableConcept` with two codings becomes a
  `DV_CODED_TEXT` with a term mapping. A new `asked-unknown` example was added
  for the L2-to-L1 collapse.
- **`integer64` is published in the wire format FHIR R5 actually has.** An
  `integer64` is a **JSON String**, not a JSON number; the worked examples and
  the reference types now say so, with boundary examples at exactly the 32-bit
  maximum and minimum and one beyond them. A value outside the 32-bit range is
  refused rather than silently emitted into an element typed `integer`, which is
  what the `Integer64[overflow]` row already declared.
- **`Attachment.size` no longer claims a range it does not have.** RM
  `DV_MULTIMEDIA.size` is a 32-bit `Integer` and R5 `Attachment.size` is an
  `integer64`, so an attachment larger than 2,147,483,647 bytes has no openEHR
  attribute to land in. That is now a first-class `unmapped` row with an owner,
  cross-referring to the identical gap in the numeric category, instead of a
  `lossless` claim on both sides.
- **A multi-component `DV_DURATION` is `unmapped`, not `lossy`.** `P1Y6M` has no
  single UCUM unit, so nothing is produced; splitting the sub-case out of the
  value row lets the single-component conversion keep its `lossless` claim and
  puts the gap under test.
- **The `unmapped` contract is checked for every row-direction.** A row that
  claims nothing can be carried is now held to it: where the whole conversion
  produces nothing, that is asserted directly, and where the mapping produces a
  value from its other rows, nothing at the unmapped row's own path may survive
  into it. A conversion that produces nothing must also say why, naming a path
  the ledger declares `unmapped`.
