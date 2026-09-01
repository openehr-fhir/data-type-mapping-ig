### Textual data

openEHR carries text in `DV_TEXT`, an attribute-rich class with `value`,
`formatting`, `encoding`, `language`, `mappings`, and the deprecated
`hyperlink`. FHIR uses three plain-text primitives — `string` (UTF-8, capped at
1 MiB), `markdown` (CommonMark), and `xhtml` (constrained XHTML) — plus
extensions that let a `string` element carry a richer rendered form alongside
its plain value.

This asymmetry is the single most important thing to understand about the
category: **a FHIR `string` is a value, and an openEHR `DV_TEXT` is a class.**
Everything a `DV_TEXT` carries beyond `value` needs somewhere else to go.

Five cross-cutting facts govern the rows.

- **Character encoding.** FHIR mandates UTF-8 throughout. openEHR permits
  several character sets through its `character_sets` code system. Non-UTF-8
  content must be converted before mapping, and the original encoding is not
  preserved on the FHIR side.
- **Empty and whitespace-only strings.** FHIR strips leading and trailing
  whitespace and does not permit an empty `string`. An empty *optional* openEHR
  text value is dropped; an empty *mandatory* one is an upstream data error, not
  a mapping problem.
- **Length.** FHIR `string` is capped at 1 MiB. openEHR sets no formal cap. In
  practice this is unlikely to be reached, and an oversize value is handled as
  an exception rather than truncated silently.
- **Language.** FHIR represents language at the resource level
  (`Resource.language`) and, at element level, through extensions. openEHR
  carries `DV_TEXT.language` directly on the value, so the two are at different
  levels of the model.
- **Term mappings.** `DV_TEXT.mappings` is not covered here. It belongs to
  [Coded Data](mapping-coded.html), under `TERM_MAPPING`.

`DV_PARSABLE` — an encapsulated string plus a `formalism` — and the deprecated
`DV_PARAGRAPH` are also in this category. `DV_PARAGRAPH` has not been examined
by the working group, and this guide records that rather than inventing a
mapping for it.

See [Conventions](conventions.html) for how to read the tables.
