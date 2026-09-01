### Numeric primitives

openEHR's Foundation Types specification defines primitive value classes —
`Integer`, `Integer64`, `Real`, `Double` — that carry a raw value plus a set of
associated functions. These are **generally not used directly in archetypes**.
Numbers are normally carried inside `DV_` wrappers (`DV_COUNT`, `DV_QUANTITY`,
`DV_PROPORTION`, `DV_ORDINAL`, `DV_SCALE`), and the Foundation primitives appear
as the declared types of *attributes* of those classes.

FHIR takes the opposite shape. It defines stand-alone numeric primitives —
`integer`, `integer64`, `decimal`, `positiveInt`, `unsignedInt` — that are used
directly, both inside complex types and as resource elements.

The consequence is that this category is mostly consulted **through** another
one: a mapping for `DV_QUANTITY.magnitude` is a `Real` → `decimal` mapping, and
the rules below are what make it well defined.

Four facts govern every row here.

- **FHIR `decimal` preserves lexical precision; openEHR `Real` and `Double` do
  not.** FHIR treats trailing zeros in the lexical form as significant. Where
  precision must survive a round trip, either write the value with explicit
  trailing zeros or carry it in the `quantity-precision` extension.
- **FHIR `integer` is 32-bit.** FHIR defines `integer64` for values that may
  exceed 2³¹ − 1.
- **`integer64` is rare in practice.** Most FHIR elements holding integer data
  are typed `integer`. For a 64-bit openEHR attribute it is generally more
  useful to map in-range values into the designated 32-bit element and use an
  extension for anything that exceeds it, than to expect an `integer64` element
  to be there.
- **`Real` → `decimal` needs care.** Binary floating-point values do not always
  have an exact decimal lexical form, and a naive conversion can widen or narrow
  the apparent precision of a clinical value.

See [Quantities](mapping-quantity.html) for the wrappers these primitives are
carried in, and [Conventions](conventions.html) for how to read the tables.
