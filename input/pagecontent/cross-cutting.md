### Cross-cutting concerns

Some questions are not about any one data type. They apply across the whole
mapping, and answering them once here keeps the per-type tables from repeating
themselves — or, worse, from answering them inconsistently.

This page collects:

- **Terminology URI ↔ `terminology_id`** — how a FHIR `system` plus `version`
  becomes a single openEHR `terminology_id`, and why the guide does not yet pick
  one of the candidate formats.
- **Character encoding** — FHIR mandates UTF-8; openEHR does not.
- **The `DV_AMOUNT` pattern** — the inherited `accuracy`,
  `accuracy_is_percent`, `magnitude_status`, `normal_range`,
  `other_reference_ranges`, and `normal_status` attributes, mapped once for
  every `DV_AMOUNT` subtype rather than repeated per type.
- **The ISO 8601 subsets** — which compact and partial temporal forms each
  standard accepts, published as a table generated directly from the code that
  implements the conversion.
- **Validation expectations** — what a mapping engine is and is not responsible
  for checking.

Two of these are worth stating up front.

**Validation is not mapping.** The working group's position is that validating
an instance against an archetype, a template, a profile, or a terminology
binding is the responsibility of the receiving system, not of the mapping
engine. A mapping engine SHOULD report what it could not carry; it is not
expected to enforce the target model's constraints. This guide therefore
describes information loss, not conformance failure.

**An open question stays open.** Where the working group has not chosen between
candidate approaches — the `terminology_id` format is the clearest example —
this page states the candidates and their trade-offs and stops there. The
reference implementation is written so that no default can be adopted by
accident: the helper that needs the format takes it as a required parameter with
no default value, so no test, render, or build can quietly bless one candidate.

See [Conventions](conventions.html) for the fidelity and maturity vocabulary,
and [Open Items](open-items.html) for who owns each unresolved question.
