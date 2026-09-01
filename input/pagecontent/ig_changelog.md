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

- **Other data.** Added `DV_MULTIMEDIA` ↔ `Attachment`, `DV_PARSABLE` ↔ `string`, and
  `DV_STATE` ↔ `CodeableConcept`. `compression_algorithm` (FHIR-56003),
  non-SHA-1 `integrity_check_algorithm` (FHIR-55422), and `thumbnail` (FHIR-56002)
  are `unmapped` with their owning tickets named; **no extension, code system, or**
  **value set is invented for any of them**. `DV_STATE.is_terminal` is `unmapped`
  because FHIR has no state-machine value type at all. `DV_ENCAPSULATED` is cited to
  the openEHR Reference Model rather than to any downstream representation of it.
- **Temporal data.** Added `DV_DATE`, `DV_TIME`, `DV_DATE_TIME`, and `DV_DURATION`,
  with the ISO 8601 subset differences stated as mapping rules: compact openEHR forms
  SHALL be expanded, partial precision SHALL be truncated rather than padded,
  fractional seconds truncate from nine digits to three, and a `time` carries its
  offset in the `timezone` extension because FHIR `time` cannot. `DV_TEMPORAL.accuracy`
  is `unmapped`. The archetype-scope `Timing` mapping names the four openEHR timing
  archetypes and is deferred. `DV_GENERAL_TIME_SPECIFICATION` and
  `DV_PERIODIC_TIME_SPECIFICATION` are recorded `not-discussed`.
- **Resource-locator data and references.** Added `DV_IDENTIFIER` ↔ `Identifier`,
  `DV_URI` / `DV_EHR_URI` ↔ `uri` / `url`, and `LINK` ↔ `Reference` /
  `CodeableReference`, including the `system::value` convention and its
  last-`::` parsing rule, the `Identifier.use` and `Identifier.period` gaps, and
  the sub-element addressing that `Reference.reference` cannot express. The pending
  `LINK` / `PARTY_IDENTIFIED` / `OBJECT_REF` unification is named as a reason and
  **not anticipated**: the Reference Model is mapped as published today.
- **Textual data.** Added `DV_TEXT` ↔ `string` / `markdown`, covering `formatting`,
  `language`, `encoding` (`unmapped`: FHIR mandates UTF-8 and the sender converts),
  the deprecated `hyperlink`, and `mappings`, which belongs to a `CodeableConcept`.
  `DV_PARAGRAPH` is recorded `not-discussed` rather than given an invented mapping.
- **Boolean data.** Added `DV_BOOLEAN` ↔ `boolean`, recording that `DV_BOOLEAN.value`
  is mandatory in the Reference Model while a FHIR `boolean` element may be absent.
- **Numeric primitives.** Added `Integer` ↔ `integer`, `Integer64` ↔ `integer64`,
  and `Real` / `Double` ↔ `decimal`, including the FHIR rule that trailing zeros
  in a `decimal` are significant and openEHR's that they are not, and the 32-bit
  overflow case, which is recorded `open` because the right extension is
  element-specific.
- **Coded data.** Added `CODE_PHRASE` ↔ `Coding`, `DV_CODED_TEXT` ↔
  `CodeableConcept` / `Coding`, `TERM_MAPPING` ↔ `CodeableConcept.coding`, and
  the `null_flavour` ↔ `data-absent-reason` correspondences, including the full
  L1/L2 inheritance detail in both directions and the HL7 v3 `NullFlavor`
  correspondence.
- Recorded as **open** and explicitly undecided: how a FHIR `system` plus
  `version` becomes one openEHR `terminology_id` (three candidates, none
  adopted); the default strategy when an incoming `Coding` omits the mandatory
  `system` or `code`; how `TERM_MAPPING.purpose` is represented in FHIR; and the
  openEHR `271` *no information* code, which has no data-absent-reason
  equivalent.
- **No ConceptMap, CodeSystem, or ValueSet is defined by this guide.** Both
  sides of every terminology correspondence are cited to their own publisher.
- **Quantities.** Added the field-level mappings for `DV_QUANTITY` ↔ `Quantity`,
  `DV_COUNT` ↔ `Count`, `DV_PROPORTION` ↔ `Ratio`, `DV_INTERVAL` ↔
  `Range` / `Period` / `Quantity`, `DV_QUANTITY` ↔ `Money` / `MoneyQuantity`,
  `DV_QUANTITY` ↔ `SimpleQuantity`, and the archetype-scope `DV_ORDINAL` and
  `DV_SCALE` ↔ `Observation.component` mappings, each with a per-direction
  fidelity verdict, both mandatory citations, and its decision maturity.
- Recorded as **open** rather than asserted: the `~` approximate comparator
  (R6, FHIR-56000), `Quantity.comparator = ad`, the `DV_PROPORTION.type`
  discriminator (FHIR-56001), units on a `Ratio`, and the `normal_status`
  binding breadth.
- The fidelity claims in this category are now **checked**: every `lossless`
  row round-trips a paired fixture unchanged, and every `lossy` row drops
  exactly what it declares.
- The mapping tables are now **generated** from a single machine-checked
  mapping ledger and written into sentinel-delimited managed regions in the
  page sources. `mapping.html` carries the first such region, the all-mappings
  summary table. Hand-editing a generated region is detected and rejected;
  hand-written prose outside the sentinels is never touched.
- `conventions.html` gained a citation-tier note: extension-pack citations are
  marked with a dagger and are taken on the working group's authority, because
  they cannot be resolved against a local mirror of the FHIR R5 core
  specification. `build.fhir.org` citations are not permitted anywhere in this
  guide.
- Page inventory and navigation: added `type-systems.html`,
  `conventions.html`, the eight category pages (`mapping-boolean.html`,
  `mapping-numeric.html`, `mapping-reference.html`, `mapping-textual.html`,
  `mapping-coded.html`, `mapping-quantity.html`, `mapping-temporal.html`,
  `mapping-other.html`), `gaps.html`, `cross-cutting.html`,
  `open-items.html`, and `reference-implementation.html`, each registered in
  both `pages:` and `menu:`.
- `mapping.html` became the index to the category pages. Its
  `### Conventions used in the mapping tables` section moved to
  `conventions.html`. **The two normative sentences in that section moved
  verbatim** — *"A mapping marked **lossless** SHALL round-trip: converting
  openEHR to FHIR and back SHALL yield an equivalent instance. A mapping
  marked **lossy** SHALL document exactly which information is dropped."* —
  this is a relocation, not a rewording, and neither sentence's conformance
  language changed.
- `conventions.html` extends the relocated legend with per-direction fidelity
  columns and a `Maturity` column, and adds a decision-maturity legend
  (`settled` / `open` / `not-discussed`).
- `index.html` gained a real *How to read this guide* navigation covering
  every page.

- Initial repository scaffold. No published content yet.
