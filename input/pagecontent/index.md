### Scope

This Implementation Guide defines mappings between **openEHR** data types and
**HL7 FHIR** data types.

Its purpose is to allow data captured in an openEHR system to be exchanged as
FHIR, and data received as FHIR to be persisted in an openEHR system, without
loss of meaning. Where a mapping is lossy, this guide says so explicitly and
describes what is lost.

A mapping is a claim about **two external standards**. Neither is redefined
here. Where an openEHR type has no faithful FHIR equivalent, this guide records
a documented gap rather than inventing a FHIR construct to fill it, and where a
question is unresolved it says so instead of choosing on the working group's
behalf.

### The standards this guide targets

- **FHIR R5 (5.0.0)**, as published at
  [hl7.org/fhir/R5](https://hl7.org/fhir/R5/datatypes.html). Items resolved for
  R6 but not available in R5 — the `~` approximate comparator is the clearest —
  appear as forward references, never as R5 mappings.
- The **openEHR Reference Model** and **Foundation Types**, as published at
  [specifications.openehr.org](https://specifications.openehr.org/releases/RM/latest/data_types.html).
  The Reference Model is mapped **as published today**: pending changes, such
  as the proposed unification of `LINK`, `PARTY_IDENTIFIED`, and `OBJECT_REF`,
  are named as reasons for open rows and are not anticipated.

Where the openEHR Base FHIR IG and the openEHR Reference Model differ, **the
Reference Model is the authority** cited here.

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

- **[Data Type Mapping](mapping.html)** — the index, with every mapping in one
  summary table.
- **[Boolean](mapping-boolean.html)**, **[Numeric](mapping-numeric.html)**,
  **[References](mapping-reference.html)**, **[Textual](mapping-textual.html)**,
  **[Coded](mapping-coded.html)**, **[Quantities](mapping-quantity.html)**,
  **[Temporal](mapping-temporal.html)**, **[Other](mapping-other.html)** — the
  field-level tables, by category.
- **[Cross-Cutting Concerns](cross-cutting.html)** — the questions that are not
  about any one type: terminology identifiers, character encoding, the
  `DV_AMOUNT` pattern, the two ISO 8601 subsets, and validation.

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

### What this guide does not do

- It does not define FHIR profiles, extensions, code systems, value sets, or
  concept maps. Terminology stays anchored in
  [terminology.hl7.org](https://terminology.hl7.org) or in openEHR's own
  published terminology.
- It does not author archetypes. Where the right answer to a gap is an
  archetype, the guide links it and names who owns it.
- It does not map resources or profiles. `Observation`, `Composition`, and
  `Timing` appear only where a data-type mapping is unintelligible without them,
  and those rows are marked `archetype` scope.
- It does not validate. See
  [Cross-Cutting Concerns](cross-cutting.html) for the working group's position.

### Status

This guide is a **draft**. Content, artifact identifiers, and canonical URLs
may change between releases until it reaches a balloted status.

Mapping decisions carry their own maturity, separately from the guide's. A row
marked `open` is under discussion and a row marked `not-discussed` has not been
examined; neither should be implemented as though it were settled. See
[Conventions](conventions.html), and
[Open Items](open-items.html) for the guide's own reviewer coverage.
