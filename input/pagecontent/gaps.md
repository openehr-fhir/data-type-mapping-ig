### Gaps

A gap is a place where one standard carries information the other has nowhere to
put. Gaps are **not** failures of this guide; they are facts about two
independently developed specifications, and the guide's job is to state them
precisely rather than to bridge them by invention.

Gaps run in **both directions**, and the two directions are genuinely different.
An openEHR attribute with no FHIR home is a different problem from a FHIR
element with no openEHR home, and they are owned by different groups.

This page publishes four inventories.

- **openEHR → FHIR** — openEHR attributes and types that cannot be carried into
  FHIR, at both the data-type and the archetype/resource level.
- **FHIR → openEHR** — FHIR elements that cannot be carried into openEHR.
- **FHIR types with no openEHR counterpart** — whole FHIR data types for which
  the openEHR Reference Model has no equivalent at all. These are recorded with
  the reason and are not investigated further.
- **Not yet discussed** — types on either side that the working group has not
  examined. These carry no fidelity claim, because nobody has checked.

Every row on this page is an ordinary ledger row and carries the same two
mandatory citations as any mapping row. A row for a type with no counterpart
cites the **inventory page** of the standard that lacks it — the openEHR RM
*Data Types Information Model*, or the FHIR R5 *Data Types* page — so that "no
counterpart exists" remains a sourced claim rather than an assertion.

Where a gap has an owner, the owner is named: an HL7 Jira ticket, the openEHR
modelling team, or the joint working group. [Open Items](open-items.html) tracks
their status.

**Nothing on this page is closed by inventing a FHIR construct.** No extension,
code system, or value set is defined by this guide to fill a gap. Where the
right answer is an archetype, the guide links the archetype and says who owns
it. Where the right answer is a change to one of the two standards, the guide
names the ticket.

See [Conventions](conventions.html) for how to read the tables.
