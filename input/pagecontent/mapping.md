### Overview

This page holds the mapping tables between openEHR data types and FHIR data
types.

<!-- TODO: author the mapping content. Suggested structure below. -->

### Conventions used in the mapping tables

Each mapping is described with:

| Column | Meaning |
|-|-|
| openEHR type | The openEHR Reference Model type being mapped |
| FHIR type | The FHIR data type it maps to |
| Cardinality | Whether the mapping is 1:1, 1:n, or n:1 |
| Fidelity | `lossless`, `lossy`, or `unmapped` |
| Notes | What is lost, and any conditions on the mapping |

A mapping marked **lossless** SHALL round-trip: converting openEHR to FHIR and
back SHALL yield an equivalent instance. A mapping marked **lossy** SHALL
document exactly which information is dropped.

### Quantity types

<!-- TODO: DV_QUANTITY, DV_COUNT, DV_PROPORTION, DV_ORDINAL, ... -->

### Text and coded types

<!-- TODO: DV_TEXT, DV_CODED_TEXT, CODE_PHRASE, ... -->

### Date, time, and duration types

<!-- TODO: DV_DATE, DV_TIME, DV_DATE_TIME, DV_DURATION, ... -->

### Identifier and reference types

<!-- TODO: DV_IDENTIFIER, DV_URI, DV_EHR_URI, PARTY_REF, ... -->

### Encapsulated types

<!-- TODO: DV_MULTIMEDIA, DV_PARSABLE, ... -->

### Unmapped types

<!-- TODO: list openEHR types with no FHIR equivalent and say what implementers
     should do instead. -->
