### Resource-locator data and references

This category covers the openEHR types that carry a pointer to *something else*
— an opaque URI (`DV_URI`, `DV_EHR_URI`) or a structured link to another node in
an EHR or to an external party (`LINK`, `PARTY_IDENTIFIED`) — and the FHIR types
that play the same role: the URI primitives (`uri`, `url`, `oid`, `uuid`,
`canonical`) and the structured `Reference` and `CodeableReference` data types.
`DV_IDENTIFIER` ↔ `Identifier` is also here, because an identifier is a pointer
at a thing rather than a description of one.

Five facts shape this category.

**The FHIR URI target depends on the element, not on the openEHR type.** FHIR
provides several URI primitives with progressively narrower constraints
(`uri`/`canonical`, `url`, `oid`/`uuid`), and `canonical` additionally carries
versioning semantics. Which one a `DV_URI` maps to is decided by the *element
definition* the value is being carried in.

**The `ehr:` scheme has no FHIR counterpart.** `DV_EHR_URI` constrains the
scheme to `ehr:` and addresses items inside an openEHR EHR — compositions,
sections, entries, or sub-elements. No standard FHIR scheme conveys equivalent
semantics. The closest analogues are absolute or relative `Reference` values,
which address a *resource*, not an element within one.

**FHIR does not natively address sub-elements.** A `LINK.target` can point at a
sub-element of a composition. `Reference.reference` is a resource-level pointer,
with `#fragment` reserved for contained resources. Two standard extensions cover
sub-element addressing when it is genuinely required — `targetElement`, carrying
a target `Element.id`, and `targetPath`, carrying a restricted FHIRPath
expression — but most consumers do not interpret them, so a mapping into FHIR
should avoid producing them unless the source data really needs that
granularity.

**openEHR splits what FHIR joins.** openEHR separates internal record links
(`LINK`) from external party references (`PARTY_IDENTIFIED`); FHIR uses
`Reference` for both. The working group is investigating consolidating `LINK`
and `PARTY_IDENTIFIED` onto a common RM class, likely based on `OBJECT_REF`.
**This guide maps the Reference Model as published today** and records the
pending change as an open item rather than anticipating it.

**FHIR joins what openEHR splits.** `CodeableReference` combines a coded concept
*and* a reference in one value. openEHR has no direct equivalent; mapping one
into openEHR generally means splitting it into a coded element plus a `LINK`, or
into an enclosing `CLUSTER`.

See [Coded Data](mapping-coded.html) for the coded half of a
`CodeableReference`, [Gaps](gaps.html) for the FHIR elements with no openEHR
home, and [Conventions](conventions.html) for how to read the tables.
