### Overview

This page is the index to the mapping tables. Each category below has its own
page holding the field-level tables for the types in it, in **both** directions,
with the fidelity of each direction stated separately.

Before reading the tables, read [Conventions](conventions.html): it defines the
columns, the three fidelity values, the three maturity values, and what
`datatype` and `archetype` scope mean. [Type Systems](type-systems.html)
describes the two type systems the tables map between.

### ConceptMap resources

The guide publishes eight draft, experimental
[FHIR R5 ConceptMaps](https://hl7.org/fhir/R5/conceptmap.html): six terminology
maps and two model-element maps for the correspondences described in the field
tables. Each direction is an independent resource; reversing a map is not
assumed to be safe.

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Correspondence | openEHR to FHIR | FHIR to openEHR |
|-|-|-|
| Null flavour and data-absent-reason | [Four source codes](ConceptMap-openehr-null-flavour-to-data-absent-reason.html) | [All fifteen R5 codes](ConceptMap-data-absent-reason-to-openehr-null-flavour.html) |
| Null flavour and v3 NullFlavor | [Four direct correspondences](ConceptMap-openehr-null-flavour-to-v3-nullflavor.html) | [Documented roll-up; NP unmapped](ConceptMap-v3-nullflavor-to-openehr-null-flavour.html) |
| Normal status and ObservationInterpretation | [H, L and N only](ConceptMap-openehr-normal-status-to-observation-interpretation.html) | [H, L and N only](ConceptMap-observation-interpretation-to-openehr-normal-status.html) |
| Logical models and FHIR types/resources | [Model and field concepts](ConceptMap-openehr-model-to-fhir.html) | [Independently authored reverse map](ConceptMap-fhir-to-openehr-model.html) |
{: .grid}

</div>

The terminology groups reference openEHR's published CodeSystems from the
pinned base package and HL7's THO CodeSystems, with explicit CodeSystem
versions. They do not define replacement terminologies. The openEHR canonical
identifies the vocabulary for translation; it does not settle the separate
question of rewriting an RM `terminology_id` of `openehr` as a FHIR
`Coding.system`.

Every target records the directional `fidelity` and decision `maturity` as
ConceptMap properties. Exact code correspondences use `equivalent`. Open
semantic choices and lossy collapses use `related-to`, with comments naming
what is lost; they are not promoted to equivalences or inferred from the THO
hierarchy. These annotations do not change the normative field tables or make
an `open` decision settled.

The normal-status maps are deliberately partial: no target is asserted for
unreviewed codes, and there is no identity or catch-all fallback. The v3 maps
publish the documented code relationships for planned support; the
[reference implementation](reference-implementation.html) still neither emits
nor consumes `iso21090-nullFlavor`. Its structural mapping remains `unmapped`.

#### Model-element maps

The two model-element maps use the **implicit code systems of
StructureDefinitions**. A group's source and target are versioned
StructureDefinition canonicals from `openehr.base#0.1.0-snapshot`, FHIR R5
`5.0.0`, or the published extension pack `5.4.0`. A code is an exact
`snapshot.element.id` in that definition. For example, `DV_QUANTITY.units-system`
is an ID, not its `units_system` path spelling; the `SimpleQuantity` snapshot
uses `Quantity.value`; a choice element remains
`Observation.component.value[x]`, with the intended type stated in the
condition. No replacement CodeSystems or invented element IDs are defined.

Root concepts describe type correspondences; other concepts describe fields.
All model-element targets use `related-to`: preserving a field's information
does not make the two element definitions semantically equivalent. Targets
record directional `fidelity`, `maturity`, `scope` and, where needed, a
human-readable `condition`. Where a pair has both lossless and lossy cases,
its fidelity is conservatively `lossy` and its comment distinguishes the cases
and names the loss. Conditions are documentation, not executable predicates.
Select the model pair and enclosing archetype context before interpreting an
alternative; multiple targets are not an instruction to emit every
representation.

An explicit `noMap` means this guide defines no correspondence **for that
model pair**, not that the source concept can never be mapped. Reasons are
recorded in resource-level annotations using the published
[note extension](https://hl7.org/fhir/extensions/StructureDefinition-note.html),
labelled by source ID, and in the linked field tables. An omitted element has
no asserted correspondence. In particular, a bare `Ratio` does not supply
mandatory `DV_PROPORTION.type`, a string does not supply
`DV_PARSABLE.formalism`, and a `Reference` does not supply `LINK.type`.
The reverse map does not manufacture those values.

Coverage is limited by the pinned snapshots. The base package has no
StructureDefinitions for the Foundation numeric primitives, so the numeric
tables have no model-element groups. Its `DV_INTERVAL` snapshot has no bound
element IDs, so interval correspondences are root-only rather than fabricated
`lower`/`upper` codes. Extension locations and resource-level fields such as
`Observation.referenceRange` still require the context documented in the
tables. These maps do not implement unresolved or not-discussed mappings.

**Tooling limitation:** the current R5 publisher resolves these element
concepts but rejects the group canonicals as the wrong resource type, expecting
CodeSystems rather than StructureDefinitions. The resources compile and
render, but these validation errors are not suppressed and prevent a clean
publication build. Resolving this tooling issue remains an
[open action](open-items.html).

ConceptMaps relate **codes**, including model elements treated as implicit
concepts; they do not construct instances, choose an extension's location,
convert units, or supply mandatory attributes.
[StructureMap](https://hl7.org/fhir/R5/structuremap.html) is FHIR's resource for
executable structural transforms. No StructureMap is defined here: the
field-level structural mappings remain in the tables.

The FSH sources under `input/fsh/` are maintained in this guide. A change to a
correspondence in a field table is accompanied by the corresponding ConceptMap
update.

### Categories

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Category | Covers |
|-|-|
| [Boolean](mapping-boolean.html) | `DV_BOOLEAN` |
| [Numeric](mapping-numeric.html) | The openEHR Foundation numeric primitives and the FHIR numeric primitives |
| [References](mapping-reference.html) | `DV_IDENTIFIER`, `DV_URI`, `DV_EHR_URI`, `LINK` |
| [Textual](mapping-textual.html) | `DV_TEXT`, `DV_PARSABLE`, `DV_PARAGRAPH` |
| [Coded](mapping-coded.html) | `CODE_PHRASE`, `DV_CODED_TEXT`, `TERM_MAPPING`, `null_flavour` |
| [Quantities](mapping-quantity.html) | `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, `DV_ORDINAL`, `DV_SCALE`, `DV_INTERVAL` |
| [Temporal](mapping-temporal.html) | `DV_DATE`, `DV_TIME`, `DV_DATE_TIME`, `DV_DURATION` |
| [Other](mapping-other.html) | `DV_MULTIMEDIA`, `DV_PARSABLE`, `DV_STATE`, `DV_ENCAPSULATED` |
{: .grid}

</div>

### All mappings

Every mapping in the guide, in one table. The verdicts here are **aggregates**
— see [Conventions](conventions.html) — and the field tables on the category
pages are the normative statement.

<div style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">
<table class="grid">
<thead>
<tr><th>openEHR type</th><th>FHIR type</th><th>→ FHIR</th><th style="white-space: nowrap;">→ openEHR</th><th>Maturity</th><th>Scope</th></tr>
</thead>
<tbody>
<tr><td><a href="mapping-quantity.html#mapping-dv-quantity-to-quantity">DV_QUANTITY</a></td><td><code>Quantity</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-count-to-count">DV_COUNT</a></td><td><code>Count</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-proportion-to-ratio">DV_PROPORTION</a></td><td><code>Ratio</code></td><td><code>lossy</code></td><td><code>unmapped</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-interval-to-range">DV_INTERVAL&lt;T&gt;</a></td><td><code>Range | Period | Quantity</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>settled</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-quantity-to-money">DV_QUANTITY</a></td><td><code>Money</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-quantity-to-simple-quantity">DV_QUANTITY</a></td><td><code>SimpleQuantity</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-ordinal-to-observation-component">DV_ORDINAL</a></td><td><code>Observation.component</code></td><td><code>lossless</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>archetype</code></td></tr>
<tr><td><a href="mapping-quantity.html#mapping-dv-scale-to-observation-component">DV_SCALE</a></td><td><code>Observation.component</code></td><td><code>lossless</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>archetype</code></td></tr>
<tr><td><a href="mapping-coded.html#mapping-code-phrase-to-coding">CODE_PHRASE</a></td><td><code>Coding</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-coded.html#mapping-dv-coded-text-to-codeable-concept">DV_CODED_TEXT</a></td><td><code>CodeableConcept | Coding</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-coded.html#mapping-term-mapping-to-coding">TERM_MAPPING</a></td><td><code>CodeableConcept.coding</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-coded.html#mapping-null-flavour-to-data-absent-reason">NULL_FLAVOUR</a></td><td><code>data-absent-reason</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-boolean.html#mapping-dv-boolean-to-boolean">DV_BOOLEAN</a></td><td><code>boolean</code></td><td><code>lossless</code></td><td><code>lossless</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-numeric.html#mapping-integer-to-integer">Integer</a></td><td><code>integer</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>settled</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-numeric.html#mapping-integer64-to-integer64">Integer64</a></td><td><code>integer64</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-numeric.html#mapping-real-to-decimal">Real / Double</a></td><td><code>decimal</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>settled</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-textual.html#mapping-dv-text-to-string">DV_TEXT</a></td><td><code>string | markdown</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-textual.html#mapping-dv-paragraph-to-markdown">DV_PARAGRAPH</a></td><td><code>markdown | string</code></td><td><code>unmapped</code></td><td><code>unmapped</code></td><td><code>not-discussed</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-reference.html#mapping-dv-identifier-to-identifier">DV_IDENTIFIER</a></td><td><code>Identifier</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-reference.html#mapping-dv-uri-to-uri">DV_URI / DV_EHR_URI</a></td><td><code>uri | url</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-reference.html#mapping-link-to-reference">LINK</a></td><td><code>Reference | CodeableReference</code></td><td><code>lossy</code></td><td><code>unmapped</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-temporal.html#mapping-dv-date-to-date">DV_DATE</a></td><td><code>date | dateTime</code></td><td><code>lossless</code></td><td><code>lossless</code></td><td><code>settled</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-temporal.html#mapping-dv-time-to-time">DV_TIME</a></td><td><code>time</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-temporal.html#mapping-dv-date-time-to-date-time">DV_DATE_TIME</a></td><td><code>dateTime | instant</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-temporal.html#mapping-dv-duration-to-duration">DV_DURATION</a></td><td><code>Duration</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-temporal.html#mapping-dv-time-specification-to-timing">DV_GENERAL_TIME_SPECIFICATION / DV_PERIODIC_TIME_SPECIFICATION</a></td><td><code>Timing</code></td><td><code>unmapped</code></td><td><code>unmapped</code></td><td><code>not-discussed</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-other.html#mapping-dv-multimedia-to-attachment">DV_MULTIMEDIA</a></td><td><code>Attachment</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-other.html#mapping-dv-parsable-to-string">DV_PARSABLE</a></td><td><code>string</code></td><td><code>lossy</code></td><td><code>unmapped</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
<tr><td><a href="mapping-other.html#mapping-dv-state-to-codeable-concept">DV_STATE</a></td><td><code>CodeableConcept</code></td><td><code>lossy</code></td><td><code>lossy</code></td><td><code>open</code></td><td><code>datatype</code></td></tr>
</tbody>
</table>
</div>

### What is not mapped
[Gaps](gaps.html) publishes the four inventories of things that do not map:
openEHR → FHIR, FHIR → openEHR, FHIR features with no openEHR counterpart, and
types the working group has not yet discussed.

[Open Items](open-items.html) publishes reviewer coverage and the register of
unresolved actions, with an owner for each.

### Where the tables come from

Every table and worked example in this guide is maintained by hand in this
guide, which is the source of truth for the mappings. The field tables on the
category pages are the normative statement; the summaries above, the category
summaries, and the tables on [Gaps](gaps.html) and
[Open Items](open-items.html) restate them, and
[Conventions](conventions.html#editing-gaps-and-open-items) says how editors
keep them in step.

The fidelity claims are tested by the
[reference implementation](reference-implementation.html), which follows this
guide. A `lossless` claim is one that round-trips in its tests, within the two
scoping rules [Conventions](conventions.html#what-is-checked) states —
`archetype`-scope rows and rows whose source side has no counterpart are
outside the harness — and a `lossy` claim is one whose dropped fields are
exactly the fields its converter reports. The worked examples began as that
implementation's test fixtures.
