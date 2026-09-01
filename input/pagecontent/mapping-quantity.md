### Quantities

openEHR's quantitative data flows through the `DV_AMOUNT` branch of the
hierarchy: `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, and `DV_DURATION`. They
share a set of inherited attributes — `accuracy`, `accuracy_is_percent`,
`magnitude_status`, `normal_range`, `other_reference_ranges`, and
`normal_status` — that follow the same mapping strategy regardless of the
concrete subtype. That shared strategy is described once, as the **`DV_AMOUNT`
pattern**, in [Cross-Cutting Concerns](cross-cutting.html), and each type's
table then states how it applies.

FHIR spreads the same ground across more types. Single values normally use the
`Quantity` branch — `Quantity`, `Age`, `Distance`, `Duration`, `Count`,
`MoneyQuantity`, `SimpleQuantity` — whose members are *restrictions* on the base
type rather than independent types. Other quantitative types include `Ratio`,
`Range`, `Period`, `RatioRange`, `Timing`, and `Money`.

Four facts govern the rows in this category.

**Reference ranges and interpretation are resource-level.** `normal_range`,
`other_reference_ranges`, and `normal_status` are attributes of an openEHR
*value*. Their FHIR counterparts — `Observation.referenceRange` and
`Observation.interpretation` — are elements of a *resource*. Rows for them are
`archetype` scope, not `datatype` scope.

**Precision is carried differently on each side.** openEHR uses `precision`
together with the lexical form of `magnitude`; FHIR uses the lexical form of
`decimal` together with the `quantity-precision` extension. A mapping SHOULD
take the most granular precision available across both fields. openEHR
`precision = -1` (unlimited) corresponds to the absence of the extension.

**Profiled quantities add invariants a `DV_QUANTITY` may violate.**
`SimpleQuantity` forbids a comparator; `Age`, `Distance`, `Duration`, and
`Count` constrain `system` and `code`; `Money` and `MoneyQuantity` carry a
currency. A `DV_QUANTITY` with a `magnitude_status` cannot be carried in a
`SimpleQuantity` element at all — that is a modelling error, not a lossy
mapping.

**Units are mandatory on the FHIR side more often than on the openEHR side.**
FHIR invariant `qty-3` requires `system` whenever `code` is present, so a
mapping engine SHALL supply `http://unitsofmeasure.org` when openEHR
`units_system` is absent and the units are UCUM. `Count` requires
`system = http://unitsofmeasure.org` with `code = 1`; `Money` uses
`system = urn:iso:std:iso:4217` with the ISO 4217 currency code.

`DV_ORDINAL` and `DV_SCALE` are mapped here rather than in
[Coded Data](mapping-coded.html): although both carry a `CODE_PHRASE` symbol,
their FHIR target is driven by the ordinal magnitude and neither is expressible
without an `Observation` around it.

Date and time intervals are in [Temporal Data](mapping-temporal.html); only
numeric intervals are here.

See [Conventions](conventions.html) for how to read the tables.
