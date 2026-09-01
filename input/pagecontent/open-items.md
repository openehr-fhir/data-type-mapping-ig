### Open items and review coverage

This guide is a work in progress, and it says so in detail rather than in the
abstract. This page publishes two things the working group needs and readers
deserve:

- **Reviewer coverage** — which mappings have been reviewed from the openEHR
  side, from the FHIR side, from both, or from neither. Coverage is uneven. A
  mapping reviewed on one side only carries more risk of an unsupported claim
  than one reviewed on both, and hiding that would misrepresent the guide's
  maturity.
- **The open-items register** — every unresolved action, who owns it, and what
  its current status is.

Open items fall into three groups.

**FHIR-side actions** are HL7 Jira tickets against the FHIR specification
itself: changes to `Quantity.comparator`, to `Attachment`, and to the
terminology guidance this guide depends on. This guide **references** their
status; it does not advance them, and it does not publish an R6-era item as
though it were R5 content.

**openEHR-side actions** are changes to the openEHR Reference Model or to its
published terminology, owned by the openEHR modelling team: binding strengths,
`code_string` constraints, `TERM_MAPPING.purpose`, and the pending
`LINK` / `PARTY_IDENTIFIED` / `OBJECT_REF` unification.

**Documentation and tooling actions** are this guide's own backlog — the
concept-map pass, the archetypes that several gap rows depend on, and the
questions the working group has not yet decided.

Every ticket cited anywhere in a mapping row appears in the register below.
That is enforced mechanically, so a gap cannot cite an owner that this page then
fails to list.

An item's presence here is not an admission of a defect. It is the guide
declining to assert something nobody has agreed.

See [Gaps](gaps.html) for the mapping-level consequences of these items, and
[Conventions](conventions.html) for what `open` and `not-discussed` mean.
