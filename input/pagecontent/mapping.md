### Overview

This page is the index to the mapping tables. Each category below has its own
page holding the field-level tables for the types in it, in **both** directions,
with the fidelity of each direction stated separately.

Before reading the tables, read [Conventions](conventions.html): it defines the
columns, the three fidelity values, the three maturity values, and what
`datatype` and `archetype` scope mean. [Type Systems](type-systems.html)
describes the two type systems the tables map between.

### Categories

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

### What is not mapped

[Gaps](gaps.html) publishes the four inventories of things that do not map:
openEHR → FHIR, FHIR → openEHR, FHIR types with no openEHR counterpart, and
types the working group has not yet discussed.

[Open Items](open-items.html) publishes reviewer coverage and the register of
unresolved actions, with an owner for each.

### Where the tables come from

The tables on the category pages are generated from a single machine-checked
mapping ledger, and the worked examples are the fixtures the
[reference implementation](reference-implementation.html) is tested against. A
`lossless` claim is one that round-trips in a test; a `lossy` claim is one whose
dropped fields are exactly the fields the converter reports.
