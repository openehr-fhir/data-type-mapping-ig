### Scope

This Implementation Guide defines mappings between **openEHR** data types and
**HL7 FHIR** data types.

Its purpose is to allow data captured in an openEHR system to be exchanged as
FHIR, and data received as FHIR to be persisted in an openEHR system, without
loss of meaning. Where a mapping is lossy, this guide says so explicitly and
describes what is lost.

### Audience

- Implementers building bridges between openEHR repositories and FHIR servers.
- Modellers who need to know how an openEHR archetype element surfaces in FHIR.
- Tooling authors generating FHIR artifacts from openEHR templates, or the
  reverse.

### How to read this guide

**Background**

- **[Type Systems](type-systems.html)** — how openEHR and FHIR each model data
  types, and the three conceptual differences that account for most of the
  fidelity loss recorded here.
- **[Conventions](conventions.html)** — the columns, the three fidelity values,
  the three maturity values, and what `datatype` and `archetype` scope mean.
  Read this before the tables.

**The mappings**

- **[Data Type Mapping](mapping.html)** — the index to the mapping tables.
- **[Boolean](mapping-boolean.html)**, **[Numeric](mapping-numeric.html)**,
  **[References](mapping-reference.html)**, **[Textual](mapping-textual.html)**,
  **[Coded](mapping-coded.html)**, **[Quantities](mapping-quantity.html)**,
  **[Temporal](mapping-temporal.html)**, **[Other](mapping-other.html)** — the
  field-level tables, by category.
- **[Cross-Cutting Concerns](cross-cutting.html)** — the questions that are not
  about any one type.

**What is not settled**

- **[Gaps](gaps.html)** — what does not map, in both directions, and why.
- **[Open Items](open-items.html)** — reviewer coverage, and the register of
  unresolved actions with an owner for each.

**Support**

- **Artifacts** — the conformance resources defined by this guide.
- **[Reference Implementation](reference-implementation.html)** — the runnable
  code that substantiates the fidelity claims.
- **[Downloads](downloads.html)** — machine-readable packages and definitions.
- **[Change Log](ig_changelog.html)** — what changed in each release.

### Dependencies

This guide is authored against **FHIR R5 (5.0.0)**.

### Status

This guide is a **draft**. Content, artifact identifiers, and canonical URLs
may change between releases until it reaches a balloted status.

Mapping decisions carry their own maturity, separately from the guide's. A row
marked `open` is under discussion and a row marked `not-discussed` has not been
examined; neither should be implemented as though it were settled. See
[Conventions](conventions.html).
