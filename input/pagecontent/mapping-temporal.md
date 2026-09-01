### Temporal data

openEHR's temporal values inherit from the abstract `DV_TEMPORAL` class:
`DV_DATE`, `DV_TIME`, `DV_DATE_TIME`, and `DV_DURATION`. FHIR uses the `date`,
`dateTime`, `instant`, and `time` primitives, plus `Duration` (a constrained
`Quantity`) and `Period`.

Both systems use ISO 8601, which makes this category look easier than it is.
Six facts govern the rows.

**The two ISO 8601 subsets are not the same subset.** openEHR permits compact
forms — `20250301`, `T143000` — while FHIR requires the extended form —
`2025-03-01`, `14:30:00`. Compact values SHALL be expanded before mapping to
FHIR. The precise comparison is published as a machine-generated table on
[Cross-Cutting Concerns](cross-cutting.html), rendered directly from the code
that implements the conversion, so the guide and the reference implementation
cannot disagree about it.

**Partial precision is meaningful and SHALL be preserved.** Where an openEHR
value is partial — year and month only — the FHIR lexical form is **truncated**
to match, never padded. `202604` becomes `2026-04`, not `2026-04-01`. Padding
invents a day that the source did not record.

**Fractional seconds differ in width.** FHIR allows up to nine decimal digits;
openEHR restricts to three. Excess precision is truncated when mapping FHIR →
openEHR, which is a named drop rather than a rounding decision.

**FHIR `time` cannot carry a time zone.** `dateTime` and `instant` can. Where an
openEHR `DV_TIME` carries a time zone, the FHIR `timezone` extension is used.

**Some FHIR resources split a date and its time across two elements.**
`Patient.birthDate` is a `date`, with the time conveyed by the
`patient-birthTime` extension. A mapping engine has to know these
element-specific patterns; they are not derivable from the data type alone.

**Duration needs a real conversion.** ISO 8601 durations and UCUM quantities are
different representations, and not every ISO 8601 duration has a UCUM
equivalent. The conversion is implemented in the
[reference implementation](reference-implementation.html) and the
non-convertible cases are reported rather than silently approximated.

Date and time intervals map to `Period` and are covered here. Numeric intervals
map to `Range` and are covered in [Quantities](mapping-quantity.html).

See [Conventions](conventions.html) for how to read the tables.
