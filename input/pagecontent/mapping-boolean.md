### Boolean data

Boolean is the simplest mapping in this guide: openEHR's `DV_BOOLEAN` and FHIR's
`boolean` primitive each carry a single true/false value, with no precision,
accuracy, or auxiliary metadata to negotiate.

The one thing that does not line up is **optionality**. `DV_BOOLEAN.value` is
mandatory in the openEHR Reference Model — a `DV_BOOLEAN` that exists has a
value. A FHIR `boolean` element may be absent altogether, and where a reason for
its absence must be carried it is carried by an extension on the element rather
than by a value. That asymmetry is where the direction-specific fidelity of this
category lives, and it is recorded row by row rather than summarised away.

See [Conventions](conventions.html) for how to read the tables below, and
[Coded Data](mapping-coded.html) for the `null_flavour` and
`data-absent-reason` correspondences that carry "why is this absent".
