### Coded data

Coded values are the most structurally divergent area between the two type
systems, and they carry the largest share of this guide's open decisions.

openEHR uses a small `CODE_PHRASE` — `terminology_id`, `code_string`, and an
optional `preferred_term` — which `DV_CODED_TEXT` wraps for clinical content and
which several other types use directly to anchor a code: `DV_ORDINAL.symbol`,
`DV_SCALE.symbol`, `DV_STATE.value`, and `null_flavour`. FHIR has `Coding`
(`system`, `version`, `code`, `display`, `userSelected`), `CodeableConcept`
(free text plus zero or more codings), and a `code` primitive for simple closed
value sets.

#### Terminology is shared, even when its representation is not

Most coded mappings have an external source of truth that applies equally in
both models. A LOINC, SNOMED CT, or UCUM code is valid and means the same thing
on either side; only the way the *system* is named differs.

SNOMED CT is the case that most often goes wrong. The HL7 guidance on
[Using SNOMED CT with HL7 Standards](https://terminology.hl7.org/en/SNOMEDCT.html)
describes how `system` identifies the edition and version, and some code systems
embed a version in the URI itself. See
[Cross-Cutting Concerns](cross-cutting.html) for the unresolved question of how
a FHIR `system` plus `version` is combined into a single openEHR
`terminology_id`.

#### Specificity and uniqueness, moving into FHIR

The main concern raised by the terminology group is that **if a `system` is
specified, it must preserve the uniqueness of the meaning the originating system
assigned.**

Consider a facility-local procedure code `PROC123` arriving with no system. A
mapping engine:

- MAY add a `system` when the scope of the issuer is understood and the system
  is unique in that context — for example
  `http://example.org/facility/1111-1111-111-11/local-procedure-codes`;
- SHOULD NOT include a `system` otherwise.

Where a system is added, the engine SHALL ensure it is unique both for the
concept within the facility and for the **meaning** of the code. If another
facility uses `PROC123` for a different procedure, or its mapping to a standard
system could ever differ, it must be a different system URI.

#### Bindings and expectations

Different FHIR elements impose different requirements on cardinality, binding
target, binding strength (`required`, `extensible`, `preferred`, `example`), and
usage context. Implementers SHOULD consult the target element's binding before
deciding how to populate `system`, `code`, and `display`. The same applies in
reverse: openEHR archetypes and templates may constrain coded values to specific
terminologies.

#### Missing `system` or `code`, moving into openEHR

`CODE_PHRASE.terminology_id` and `code_string` are both mandatory. An incoming
FHIR `Coding` may populate neither.

1. If **both** `system` and `code` are absent, `display` SHOULD be mapped to
   `DV_TEXT.value` rather than to `DV_CODED_TEXT`.
2. If **only one** is absent the situation is inherently unsafe. Resolution
   requires local clinical informatics advice; the options are degrading to
   `DV_TEXT`, injecting a default code system where the source is known, or
   treating the value as an exception. **This guide does not choose between
   them** — see [Open Items](open-items.html).

#### Choosing the defining code

When a FHIR `CodeableConcept` carries several codings, the openEHR
`defining_code` is selected in this priority order:

1. the terminology the openEHR template defines for the slot, where it names
   one;
2. the coding marked `userSelected = true`;
3. the first coding in the `coding` array.

The working group has converged on treating FHIR `userSelected` as effectively
equivalent to openEHR `defining_code` for round-tripping purposes, while
recognising that the semantics are not strictly identical.

#### What lives here

`CODE_PHRASE`, `DV_CODED_TEXT`, `TERM_MAPPING`, and the `null_flavour`
correspondences. `DV_ORDINAL` and `DV_SCALE` are coded values but are mapped in
[Quantities](mapping-quantity.html), because their FHIR target is driven by
their ordinal magnitude and both are archetype-scope mappings.

**No ConceptMap resource, local `CodeSystem`, or local `ValueSet` is defined by
this guide.** Terminology stays anchored in
[terminology.hl7.org](https://terminology.hl7.org) or in openEHR's own published
terminology. The correspondence tables here are the input to a later
concept-map pass, not a substitute for one.

See [Conventions](conventions.html) for how to read the tables.
