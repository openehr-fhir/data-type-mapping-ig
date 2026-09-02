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
- Fidelity claims are **checked, not asserted**, within a scope the guide states
  rather than leaves implied: a `lossless` row must round-trip a paired instance
  unchanged and a `lossy` row must drop exactly what it declares — no more and
  no less — for every row at `datatype` scope. Rows at `archetype` scope are
  outside the matrix because their FHIR home is a resource element, and that
  exemption is itself checked; a row whose source side has no counterpart in the
  direction under test is skipped because nothing exists to convert from. Every
  fixture pair is also asserted to be a pair, and the ones that hold in a single
  direction say so.
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

Everything in this group is a correction made in response to a full review of
the first content release. The wording changes below are filed as
**Compatible, Non-Substantive**; everything else in this group changes what the
guide asserts and is **Compatible, Substantive**.
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
  `accuracy_is_percent` drop is confined to the `%`-unit sub-case described
  under *Review remediation, second pass* below; `rendering-markdown` is a
  `markdown`; `language` is a `code`. A new gate resolves every extension a
  worked example carries against a declared table of `value[x]` types,
  cardinalities, and contexts, and every worked example in this guide **is** one
  of those fixtures.
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
- **The `archetype` scope now has to earn itself.** A row at `archetype` scope
  is exempt from the converter, fixture and round-trip gates because — in the
  guide's own words — its FHIR home is a resource element. That justification is
  now a check: a row claiming the exemption while targeting an ordinary
  data-type element is rejected. Four rows failed it and were re-scoped to
  `datatype`, which put their published verdicts under test for the first time
  and corrected three of them.
- **`LINK ↔ Reference` is published as the one-way mapping it is.** `LINK`
  requires `meaning`, `type`, and `target`; a FHIR `Reference` has no field that
  can source `type`, so no `LINK` is produced from one. `LINK.meaning` and
  `LINK.type` are also `DV_TEXT`, of which only `value` reaches a `string` or a
  `CodeableConcept.text`, so both directions are restated: `lossy` out, and
  `unmapped` back, with the gap owned rather than papered over by fabricating
  the literal link type `reference`.
- **`DV_DURATION` → `Timing.repeat` no longer claims `lossless` while deferring
  the work.** A row whose own note calls timing and dosage "the hardest mapping
  problem" and defers it to a dedicated session is `unmapped` in both
  directions, exactly as `DV_GENERAL_TIME_SPECIFICATION` is.
- **Every citation now resolves to a real anchor, not merely to a real page.**
  Eight targets did not exist and are corrected: `CodeableReference` is defined
  on `references.html`, `Meta` on `resource.html`, `Narrative` on
  `narrative.html`, `Observation.interpretation` and
  `Observation.dataAbsentReason` on `observation-definitions.html`; the openEHR
  `TERMINOLOGY_ID` and ISO 8601 time-type anchors are corrected to the ones the
  specifications publish; and the FHIR data-type inventory is cited as a page
  rather than through an anchor it does not have.
- **Six quantity rows cited a class that does not declare the attribute.**
  `normal_status`, `normal_range`, and `other_reference_ranges` are declared on
  `DV_ORDERED`; `magnitude_status` on `DV_QUANTIFIED`; only `accuracy` and
  `accuracy_is_percent` are `DV_AMOUNT`'s. The rows, the per-type Sources
  lines, and the "`DV_AMOUNT` pattern" prose now state the
  `DV_ORDERED` → `DV_QUANTIFIED` → `DV_AMOUNT` → `DV_QUANTITY` chain and name
  the declaring class for each inherited attribute.
- **`DV_ORDINAL` and `DV_SCALE` inherit the reference-range attributes too**,
  and now say so: without those rows the summary read `lossless` for both types
  while a `DV_SCALE` carrying a `normal_range` had nowhere stated to put it.
- **`Money` is no longer published simultaneously as mapped and as having no
  openEHR counterpart.** The two `Money` rows are removed from the
  no-counterpart inventory — `DV_QUANTITY ↔ Money` is a real, fixture-backed
  mapping — and the true, narrower claim (openEHR has no *dedicated* monetary
  type) is stated in the `gaps.html` prose. A new ledger rule makes the
  contradiction impossible to reintroduce: a FHIR type named as some mapping's
  own type may not also be published as having no openEHR counterpart.
- **`RelativeTime` is restored to the no-counterpart inventory**, with the
  working group's recorded "no openEHR counterpart identified" verdict and an
  owner, and named again in the `Quantities` prose.
- **Each directional gap inventory now contains what its heading promises.**
  openEHR → FHIR lists rows with a real openEHR attribute; FHIR → openEHR lists
  rows with a real FHIR element, and no longer repeats the FHIR types published
  in full by the no-counterpart inventory.
- **`Attachment.language` is no longer a fabricated gap.** `DV_MULTIMEDIA`
  inherits `language` from `DV_ENCAPSULATED` (RM § 9.2.1), so the element maps;
  only the `CODE_PHRASE`'s terminology identifier is dropped, because
  `Attachment.language` is a `code` required-bound to `all-languages`.
- **The `Attachment` inventory the prose promised now exists.**
  `creation`, `height`, `width`, `frames`, `duration`, and `pages` are six
  `unmapped` rows rather than one row folding the others into its notes, and
  the prose says plainly that `openehr-modelling` is a team rather than a
  ticket.
- **A `CODE_PHRASE.code_string` carrying whitespace produces nothing.** The
  FHIR `code` type forbids leading, trailing, and repeated internal whitespace
  and openEHR permits all three, so such a code has no valid FHIR form at all;
  the sub-case is its own `unmapped` row with an owner, and the guide emits
  nothing rather than an instance a validator rejects.

*Review remediation, second pass*

Corrections made in response to a second review of the same release. Everything
in this group is **Compatible, Substantive** unless the group it sits under says
otherwise.
- **The mandatory-attribute rule is now closed over every converter.** The
  contract test derives its coverage from the converter registry itself rather
  than from a hand-written list, so registering a converter without either
  holding it to the rule or writing down why the rule cannot reach it fails the
  build. Seven mappings are excused on one stated criterion — their FHIR side is
  a bare JSON primitive, which has no present-but-value-less form — and every
  other registered mapping is covered.
- **A `Ratio` no longer becomes a `DV_PROPORTION`.** `DV_PROPORTION.numerator`,
  `.denominator`, and `.type` are all mandatory, and FHIR carries no kind
  discriminator at all; the guide already published `DV_PROPORTION.type` as
  `unmapped` inbound on the ground that reading the kind off the denominator is
  an inference rather than a carried value. The conversion now refuses instead
  of performing that inference and substituting `0` for an absent numerator, so
  the numerator, denominator and precision rows are `unmapped` inbound too and
  `DV_PROPORTION ↔ Ratio` is published as the one-directional mapping it is.
- **Three more conversions refuse where their mirror already did.** A
  `TERM_MAPPING` whose target has no valid FHIR `code` form, a `DV_CODED_TEXT`
  whose `defining_code` has none, and the `DV_STATE` that composes it now
  produce nothing and say why, instead of returning a value-less `lossy` result
  or a text-only `CodeableConcept` with the mandatory defining code gone. A
  `time` element carrying extensions and no value, and a `data-absent-reason`
  `CodeableConcept` stating no code at all, are refused on the same ground.
- **`accuracy_is_percent` is no longer inverted for a `%`-unit quantity.** The
  flag is carried as the unit of the accuracy `Quantity`, which works until the
  magnitude's own unit is `%` — a haematocrit of 45 % with an absolute accuracy
  of ±2 percentage points read back as ±2 % *of* 45, which is ±0.9, and both
  directions called it `lossless`. The extension has no second discriminator, so
  the flag is now **left absent** rather than derived, the loss is named in both
  directions as its own `unmapped` sub-case row, and the normative sentence on
  `cross-cutting.html` that required `accuracy_is_percent` to be `false` "for the
  value to be carried at all" — which the same page, the `DV_QUANTITY` table and
  the converter all contradicted — is replaced by the rule that is actually
  implemented.
- **`Attachment.size` is published in the wire format R5 actually has.** R5
  types `Attachment.size` as an `integer64`, and an `integer64` is a **JSON
  String**; the guide's own numeric reasoning already said that a guide
  publishing a bare number for one publishes a wire format R5 does not have,
  while every `DV_MULTIMEDIA ↔ Attachment` worked example published
  `"size": 20416`. The four examples, the reference type, and the row's note now
  carry the string form, and an `Attachment.size` string that names no whole
  number is treated as a size the Attachment does not state rather than reaching
  an openEHR instance as `NaN`.
- **The last two published ISO 8601 rules are now implemented.** A compact
  minute-precision `T1430` or `20260301T1430` fell through both helpers and was
  emitted verbatim as a `lossless` FHIR value that matches no R5 regex; the
  compact expansion now accepts `hhmm` as well as `hhmmss`, and both forms are
  published rows of the subset table. And a `DV_DATE_TIME` stating a time with
  no UTC offset is **refused** rather than emitted: R5 requires an offset once
  hours and minutes are present, the offset can only come from the source or its
  surrounding template, and a data-type conversion sees neither. The gap is a
  first-class `unmapped` row with an owner, worded against the normative
  sentence rather than the lexical form — R5's `dateTime` regex makes the zone
  group optional, so a regex-only reading misses the rule entirely.
- **Negative durations are written the way openEHR writes them.** openEHR's
  `Iso8601_duration` supports a negative duration — its own example is `-P3M`,
  "minus 3 months", for a very premature newborn — but its component invariants
  require every component to be non-negative, so the sign precedes the `P`. The
  conversion emitted `P-3M`, which violates a published openEHR invariant, and
  reported nothing about it. Both directions now use the `-P…` / `-PT…` form,
  and the parser accepts it, so the pair stays symmetric.
- **`DV_DURATION.value` no longer claims `lossless` for the millisecond case.**
  `{value: 5, code: "ms"}` becomes `PT0.005S` and reads back as
  `{value: 0.005, code: "s"}`: the magnitude changes, not only the unit, so the
  drop already booked on `Duration.code` never covered it. The sub-case is now a
  FHIR-sourced `Duration.value[ms]` row of its own, the conversion reports the
  rescale as a second named drop, and a millisecond fixture pair puts it under
  the round-trip matrix — it passed before only because no `ms` pair existed.
- **Three published worked examples were asserted by a comparison that held
  nothing.** `DV_TIME`'s inbound drop was declared as `time.value` — the whole
  value — when what is actually lost is only sub-second precision beyond three
  digits, so the pairing gate deleted the one field from both sides and compared
  `{}` against `{}`. The drop path is narrowed to
  `time.value[fractional-seconds]`, and the gate now **fails** a comparison that
  empties both sides rather than passing it. The two `DV_TIME` pairs that are
  genuinely one-directional — an offset the FHIR value cannot carry, and a
  minute-precision completion that is not reversible — say so, which the vacuous
  comparison had been hiding.
- **The pairing coverage floor is a budget, and every pair is inside it.** One
  asserted direction out of a hundred and twenty-two satisfied the old check.
  Two assertions replace it: **every** fixture pair is asserted in at least one
  direction unless its marker claims none, and at least seven tenths of all
  pair-directions are asserted, with the measured ratio and both counts in the
  failure message. A pair that claims no direction must now name the test that
  pins the behaviour instead, so "asserted only to differ" is no longer the end
  of the story.

**Compatible, Non-Substantive**

- **The guide now says exactly what is machine-checked.** `conventions.html`
  and `reference-implementation.html` stated an unqualified claim — every
  fidelity verdict is a machine-checked property — while the harness has always
  had two scoping rules. Both are now stated where the claim is made, together
  with the fact that citation resolution is conditional on the specification
  mirrors being configured. No verdict, no conformance verb, and no mapping
  changed: this is the wording catching up with what the tests do.
