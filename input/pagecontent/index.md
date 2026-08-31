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

- **[Data Type Mapping](mapping.html)** — the mapping tables themselves.
- **Artifacts** — the conformance resources (profiles, extensions, concept
  maps) defined by this guide.
- **[Downloads](downloads.html)** — machine-readable packages and definitions.
- **[Change Log](ig_changelog.html)** — what changed in each release.

### Dependencies

This guide is authored against **FHIR R5 (5.0.0)**.

### Status

This guide is a **draft**. Content, artifact identifiers, and canonical URLs
may change between releases until it reaches a balloted status.

<!-- TODO: replace this page with the real introduction, including the
     relationship to the openEHR Reference Model release this guide targets. -->
