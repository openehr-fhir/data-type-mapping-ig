### Cross-cutting concerns

Some questions are not about any one data type. They apply across the whole
mapping, and answering them once here keeps the per-type tables from repeating
themselves — or, worse, from answering them inconsistently.

### Terminology URI and `terminology_id`

FHIR names a terminology system with a full URI — `http://snomed.info/sct`.
openEHR names one with a shorter identifier string in
`CODE_PHRASE.terminology_id`. A URI maps to an identifier and back without
difficulty; **what does not yet have an answer is what to do with a version.**

FHIR carries `Coding.version` as a separate element. openEHR has no separate
version field, so a version has to be folded into `terminology_id` — and three
formats are under discussion:

| Option | Form | Example |
|-|-|-|
| A — pipe | `system\|version` | `http://hl7.org/fhir/encounter-status\|5.0.0` |
| B — parenthetical | `system (version)` | `http://hl7.org/fhir/encounter-status (5.0.0)` |
| C — hash | `system#version` | `http://hl7.org/fhir/encounter-status#5.0.0` |

The trade-offs, as the working group stated them:

- The **pipe** is the FHIR canonical convention and is what search parameters
  use, which makes it familiar. Against it: the pipe is also used, variably, to
  separate a code from its text rubric, so a reader may misread it.
- The **parenthetical** is unambiguous to a human and is unlikely to collide
  with anything else in a system URI. Against it: it is not a convention either
  standard already uses, and the space makes it fiddly to parse.
- The **hash** is what FHIR implementation guides use for package versions,
  which is a closer analogy than the search syntax. Against it: `#` already has
  a meaning in a URI, as a fragment separator.

**No option is adopted here.** The
[reference implementation](reference-implementation.html) exposes the join and
the split as helpers that take the format as a **required parameter with no
default value**, and the registered converters do not call them at all — they
treat `terminology_id` as opaque. That is deliberate: no test, render, or build
can quietly bless a candidate the working group has not chosen.

Some code systems side-step the question entirely by embedding the version in
the URI itself, as SNOMED CT does with
`http://snomed.info/sct/900000000000207008/version/20240101`. The
[HL7 guidance on using SNOMED CT](https://terminology.hl7.org/en/SNOMEDCT.html)
describes how a `system` identifies the edition and version.

### Character encoding

FHIR mandates **UTF-8** throughout and has no element recording the character
set of a value, because there is only one.

openEHR permits several through its `character_sets` code system — UTF-8,
UTF-16, US-ASCII, the ISO-8859 family, and UTF-7 among them.

The rule is therefore one-directional and settled: **the sender converts.**
Non-UTF-8 content SHALL be converted to UTF-8 before mapping, and the original
encoding is not preserved on the FHIR side. `DV_TEXT.encoding` and
`DV_ENCAPSULATED.charset` are `unmapped` for this reason, and the rows say so.
Where a charset applies to attached binary content rather than to text, it
belongs in the MIME type as a `charset` parameter — see
[Other Data](mapping-other.html).

### The `DV_AMOUNT` pattern

The name is a convenience: the six attributes below are **not** all declared on
`DV_AMOUNT`. They arrive along an inheritance chain —
`DV_ORDERED` → `DV_QUANTIFIED` → `DV_AMOUNT` → `DV_QUANTITY` — and the table
names the class that actually declares each one, because that is where a
citation has to point. `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, and
`DV_DURATION` all inherit them, and they follow **one** mapping pattern
regardless of the concrete subtype:

| Inherited property | Declared on | FHIR counterpart | Scope |
|-|-|-|-|
| `magnitude_status` | `DV_QUANTIFIED` | `Quantity.comparator`, or the per-type equivalent | `datatype` |
| `accuracy` | `DV_AMOUNT` | The `quantity-accuracy` extension, whose `value[x]` is a `Quantity` | `datatype` |
| `accuracy_is_percent` | `DV_AMOUNT` | The unit of that accuracy `Quantity` — UCUM `%` when true, except where the magnitude's own unit is `%` | `datatype` |
| `normal_range` | `DV_ORDERED` | `Observation.referenceRange` with `type` = `normal` | `archetype` |
| `other_reference_ranges` | `DV_ORDERED` | `Observation.referenceRange` with `type` ≠ `normal` | `archetype` |
| `normal_status` | `DV_ORDERED` | `Observation.interpretation` | `archetype` |

The last three are **only meaningful at the FHIR resource level**, not on the
data type. Anything carrying a `normal_range` or a `normal_status` in openEHR
maps to an `Observation` in FHIR, and this guide marks those rows `archetype`
scope rather than pretending they are data-type mappings.

Two consequences follow. `accuracy` is rarely used in practice, and where it is,
`accuracy_is_percent` is carried as the **unit of the accuracy `Quantity`**:
UCUM `%` when the flag is `true`, and the magnitude's own unit when it is
`false`. That rule has exactly one blind spot, and it is an ordinary clinical
one — a magnitude whose *own* unit is already `%`, such as an SpO₂ or a
haematocrit. Both readings then produce the identical instance, so a conversion
**SHALL NOT** derive `accuracy_is_percent` from an incoming accuracy on a
`%`-unit quantity, and **SHALL** leave the flag absent instead: reading ±2
percentage points as ±2 % *of* 45 gives ±0.9, a different number stated as
though it were the same one. The accuracy magnitude still carries; the flag
does not, and the sub-case is published as a gap on
[Quantities](mapping-quantity.html). And openEHR binds `normal_status` to its
own `normal_statuses` code system with `required` strength, which is narrower
than FHIR's `extensible` binding on `Observation.interpretation`; a change
request to relax the openEHR binding is open.

<a name="iso8601"></a>

### The two ISO 8601 subsets

Both standards use ISO 8601. **They do not use the same subset of it.**

The table below is generated directly from the capability table in the
[reference implementation](reference-implementation.html) that the converters
themselves consult, so the guide and the code cannot disagree about it. A ✓ means
the standard accepts the form; a — means it does not.

<!-- >>> mapping ledger: iso8601-subset (generated by npm --prefix reference run render) >>> -->

<table>
<thead>
<tr><th>Form</th><th>Example</th><th>openEHR</th><th>FHIR</th><th>Mapping rule</th></tr>
</thead>
<tbody>
<tr><td>Full date, extended form<br/><em>(<code>date</code>)</em></td><td><code>2026-03-01</code></td><td>✓</td><td>✓</td><td>Carried unchanged.</td></tr>
<tr><td>Full date, compact form<br/><em>(<code>date</code>)</em></td><td><code>20260301</code></td><td>✓</td><td>—</td><td>SHALL be expanded to the extended form before mapping to FHIR.</td></tr>
<tr><td>Year and month only<br/><em>(<code>date</code>)</em></td><td><code>2026-03</code></td><td>✓</td><td>✓</td><td>Carried unchanged. The FHIR lexical form is <strong>truncated</strong> to match the source precision, never padded — padding invents a day the source did not record.</td></tr>
<tr><td>Year and month, compact form<br/><em>(<code>date</code>)</em></td><td><code>202603</code></td><td>✓</td><td>—</td><td>SHALL be expanded to <code>2026-03</code>.</td></tr>
<tr><td>Year only<br/><em>(<code>date</code>)</em></td><td><code>2026</code></td><td>✓</td><td>✓</td><td>Carried unchanged.</td></tr>
<tr><td>Full time, extended form<br/><em>(<code>time</code>)</em></td><td><code>14:30:00</code></td><td>✓</td><td>✓</td><td>Carried unchanged.</td></tr>
<tr><td>Full time, compact form<br/><em>(<code>time</code>)</em></td><td><code>143000</code></td><td>✓</td><td>—</td><td>SHALL be expanded to <code>14:30:00</code>. openEHR writes a compact time as <code>hhmmss</code>, with no <code>T</code> designator — <code>T</code> separates the date from the time in a <em>date-time</em> and nowhere else — and FHIR <code>time</code> accepts only the extended form.</td></tr>
<tr><td>Hours and minutes only<br/><em>(<code>time</code>)</em></td><td><code>14:30</code></td><td>✓</td><td>—</td><td>FHIR <code>time</code> requires seconds. The value SHALL be completed to <code>14:30:00</code>, which adds a precision the source did not state and is a <strong>named drop</strong>.</td></tr>
<tr><td>Compact time, hours and minutes only<br/><em>(<code>time</code>)</em></td><td><code>1430</code></td><td>✓</td><td>—</td><td>SHALL be expanded to <code>14:30</code> and then completed to <code>14:30:00</code>. Neither the compact form nor a seconds-less time is a FHIR <code>time</code>, and the completion adds a precision the source did not state, so it is a <strong>named drop</strong>.</td></tr>
<tr><td>Hours only, compact form<br/><em>(<code>time</code>)</em></td><td><code>14</code></td><td>✓</td><td>—</td><td>SHALL be completed to <code>14:00:00</code>. <code>valid_iso8601_time</code> publishes <code>hh</code> as a partial form and FHIR <code>time</code> requires both minutes and seconds, so the completion adds two levels of precision the source did not state and is a <strong>named drop</strong> of its own.</td></tr>
<tr><td>Fractional seconds, 3 digits<br/><em>(<code>time</code>)</em></td><td><code>14:30:00.123</code></td><td>✓</td><td>✓</td><td>Carried unchanged.</td></tr>
<tr><td>Fractional seconds, up to 9 digits<br/><em>(<code>time</code>)</em></td><td><code>14:30:00.123456789</code></td><td>—</td><td>✓</td><td>openEHR restricts fractional seconds to 3 digits. Excess precision SHALL be truncated when mapping FHIR → openEHR, and that is a <strong>named drop</strong>.</td></tr>
<tr><td>Time with a UTC offset<br/><em>(<code>time</code>)</em></td><td><code>14:30:00+01:00</code></td><td>✓</td><td>—</td><td>FHIR <code>time</code> <strong>cannot</strong> carry a time zone, and no extension rescues it: the <code>timezone</code> extension is a <code>code</code> required-bound to the IANA zone names, and a UTC offset is neither a zone name nor derivable from one. The time of day is carried and the offset is a <strong>named drop</strong>. Where the offset matters, the value SHOULD be mapped to a <code>dateTime</code>, which carries one directly.</td></tr>
<tr><td>Compact time with a compact UTC offset<br/><em>(<code>time</code>)</em></td><td><code>143000+0100</code></td><td>✓</td><td>—</td><td>SHALL be expanded to <code>14:30:00+01:00</code> before the offset is separated from the time; FHIR accepts neither the compact time nor the compact offset, and then has no home for the offset at all.</td></tr>
<tr><td>Compact time with an hours-only UTC offset<br/><em>(<code>time</code>)</em></td><td><code>143000+01</code></td><td>✓</td><td>—</td><td><code>valid_iso8601_time</code> writes the compact offset as <code>±hh[mm]</code>, so the minutes are optional. The value SHALL be expanded to <code>14:30:00+01:00</code> before the offset is separated; the offset then has no home on a FHIR <code>time</code> and is a <strong>named drop</strong>.</td></tr>
<tr><td>Full date and time in UTC<br/><em>(<code>dateTime</code>)</em></td><td><code>2026-03-01T14:30:00Z</code></td><td>✓</td><td>✓</td><td>Carried unchanged. A fully precise UTC value MAY use FHIR <code>instant</code>.</td></tr>
<tr><td>Full date and time, compact form<br/><em>(<code>dateTime</code>)</em></td><td><code>20260301T143000Z</code></td><td>✓</td><td>—</td><td>SHALL be expanded to the extended form before mapping to FHIR.</td></tr>
<tr><td>Full date and time with a UTC offset<br/><em>(<code>dateTime</code>)</em></td><td><code>2026-03-01T14:30:00+01:00</code></td><td>✓</td><td>✓</td><td>Carried unchanged. Unlike <code>time</code>, <code>dateTime</code> does carry an offset.</td></tr>
<tr><td>Date and time without seconds<br/><em>(<code>dateTime</code>)</em></td><td><code>2026-03-01T14:30</code></td><td>✓</td><td>—</td><td>FHIR <code>dateTime</code> requires seconds once a time is present. The value SHALL be completed to <code>2026-03-01T14:30:00</code>, which adds a precision the source did not state and is a <strong>named drop</strong>. FHIR additionally requires a UTC offset alongside the time: that offset SHALL come from the source or its context and is never invented by a data-type conversion.</td></tr>
<tr><td>Compact date and time without seconds<br/><em>(<code>dateTime</code>)</em></td><td><code>20260301T1430</code></td><td>✓</td><td>—</td><td>SHALL be expanded to <code>2026-03-01T14:30</code> and then completed to <code>2026-03-01T14:30:00</code>, which is a <strong>named drop</strong>. This form also states no UTC offset, which FHIR requires once hours and minutes are present and which a data-type conversion never invents, so nothing is produced from it.</td></tr>
<tr><td>Date and time to the hour only<br/><em>(<code>dateTime</code>)</em></td><td><code>2026-03-01T14</code></td><td>✓</td><td>—</td><td><code>valid_iso8601_date_time</code> publishes <code>YYYY-MM-DDThh</code> as a partial form. FHIR requires seconds once a time is present, so the value SHALL be completed to <code>2026-03-01T14:00:00</code> and that completion is a <strong>named drop</strong>. The completed value states hours and minutes and no UTC offset, which FHIR also requires and which a data-type conversion never invents, so nothing is produced from it.</td></tr>
<tr><td>Compact date and time to the hour only<br/><em>(<code>dateTime</code>)</em></td><td><code>20260301T14</code></td><td>✓</td><td>—</td><td>SHALL be expanded to <code>2026-03-01T14</code> and then completed to <code>2026-03-01T14:00:00</code>, which is a <strong>named drop</strong>. As with the extended form, the completed value states no UTC offset and nothing is produced from it.</td></tr>
</tbody>
</table>

<!-- <<< mapping ledger: iso8601-subset (generated by npm --prefix reference run render) <<< -->

Three rules carry most of the weight:

- **Compact forms SHALL be expanded** before mapping to FHIR. openEHR permits
  `20250301` and `T143000`; FHIR requires `2025-03-01` and `14:30:00`.
- **Partial precision SHALL be preserved by truncating, never by padding.**
  `202604` becomes `2026-04`. Padding it to `2026-04-01` invents a day the
  source did not record. The one place the rule cannot apply is a time stated
  to the minute: FHIR `time` requires seconds, and `dateTime` requires them
  once a time is present, so `14:30` SHALL be completed to `14:30:00` and the
  added precision is a **named loss** rather than a silent one.
- **Fractional seconds truncate from nine digits to three** when mapping FHIR →
  openEHR. That is a named drop, not a rounding decision.

### Validation expectations

**Validation is not mapping.** Validating an instance against an archetype, a
template, a profile, or a terminology binding is the responsibility of the
receiving system, not of the mapping engine.

Consider a `DV_INTERVAL` whose upper bound is below its lower bound. Three
things could happen: the openEHR system could reject it before mapping, the
mapping engine could reject it, or the mapping engine could faithfully produce
the equally invalid FHIR instance. The working group's resolution is the third:
**validation is out of scope entirely, data is mapped as it is found, and
systems should validate before mapping where they can.**

A mapping engine SHOULD report what it could not carry — that is what the
`Issue` list in the [reference implementation](reference-implementation.html)
is for — and SHOULD NOT be expected to enforce the target model's constraints.

This guide therefore describes **information loss**, not conformance failure.
The two are different, and conflating them would make every mapping table an
assertion about systems this guide has no view of.

### Bindings and expectations, moving into FHIR

Different FHIR elements impose different requirements on cardinality, binding
target, binding strength (`required`, `extensible`, `preferred`, `example`), and
usage context, including conditional bindings and jurisdictional rules.
Implementers SHOULD consult the target element's binding before deciding how to
populate `system`, `code`, and `display`.

Where a core FHIR element carries a `required` binding that an openEHR value
cannot satisfy, the mapping fails at that element rather than degrading
silently. Identifying which elements those are needs an archetype-by-archetype
review, and this guide recommends that the core-specification cases be published
with guidance for implementation-guide authors and jurisdictions.

### Bindings and expectations, moving into openEHR

The same applies in reverse, and is easy to overlook because openEHR expresses
its constraints somewhere else. Archetypes and operational templates constrain
coded values to specific terminologies, constrain units, and constrain
cardinalities — the equivalents of a FHIR profile's bindings and slicing.

Two consequences matter for mapping:

- **The template decides the `defining_code`.** Where an openEHR template names
  the terminology for a slot, that terminology takes precedence over
  `userSelected` in choosing which incoming coding becomes the `defining_code`.
  A data-type converter cannot see the template, so it can only apply the second
  and third rules; a template-aware engine SHOULD apply the first.
- **A `required` binding on the openEHR side can be narrower than its FHIR
  counterpart.** `normal_status` is the worked example: openEHR's binding is
  `required` and FHIR's `Observation.interpretation` is `extensible`, so a
  legitimate FHIR value can have nowhere to land. Where that happens, the guide
  records it as a `lossy` direction and names the change request, rather than
  quietly widening the openEHR binding on paper.

### Process and recommendations

**Moving content into FHIR**, the recommended order of work is: identify the
target element and read its binding; decide the target type from the element
definition rather than from the openEHR source type; map the value; and report
everything that could not be carried, naming the source path. Do **not** produce
an extension for a field this guide records as `unmapped` — an invented
extension is worse than a recorded gap, because it looks like conformance.

**Moving content into openEHR**, the recommended order is: establish which
archetype and template the value is destined for, because they decide the
terminology and the units; map the value; supply the mandatory openEHR fields
that FHIR leaves optional, and record which ones were supplied rather than
carried; and treat an inference — a defaulted `TERM_MAPPING.match`, an inferred
`DV_PROPORTION.type`, an assumed SHA-1 hash algorithm — as exactly that.

In both directions, the guide's fidelity columns are the contract: a `lossless`
row round-trips, and a `lossy` row drops exactly what it says it drops.

See [Conventions](conventions.html) for the fidelity and maturity vocabulary,
and [Open Items](open-items.html) for who owns each unresolved question.
