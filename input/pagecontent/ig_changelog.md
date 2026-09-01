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
