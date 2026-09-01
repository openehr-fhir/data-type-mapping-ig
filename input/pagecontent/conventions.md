### Conventions used in the mapping tables

Every mapping in this guide is stated at **field level** and in **both
directions**. The two directions frequently differ: a field that survives the
trip to FHIR intact may have nowhere to return to, and a FHIR element with no
openEHR counterpart is a gap in one direction only. A single fidelity verdict
per type would hide that, so this guide does not publish one.

#### The mapping index

The summary tables on [Data Type Mapping](mapping.html) and on each category
page use these columns:

| Column | Meaning |
|-|-|
| openEHR type | The openEHR Reference Model type being mapped |
| FHIR type | The FHIR data type it maps to |
| → FHIR | The aggregate fidelity of the openEHR → FHIR direction |
| → openEHR | The aggregate fidelity of the FHIR → openEHR direction |
| Maturity | How settled the mapping decision is |
| Scope | `datatype` or `archetype` — see [Scope](#scope) below |

An aggregate verdict is `lossless` only when **every** field row is `lossless`
in that direction, `unmapped` only when every row is `unmapped`, and `lossy`
otherwise. It is a reading aid; the field table is the normative statement.

#### The field tables

Each per-type table uses these columns:

| Column | Meaning |
|-|-|
| openEHR field | The Reference Model attribute, linked to its specification |
| FHIR target | The FHIR element, extension, or resource element, linked to its specification. Where the target depends on the instance, each candidate is listed with the condition under which it applies |
| → FHIR | The fidelity of this field, openEHR → FHIR |
| → openEHR | The fidelity of this field, FHIR → openEHR |
| Maturity | How settled this row is |
| Notes | What is dropped, and any conditions on the mapping |

Above each table, a **Sources** line names the specification sections the whole
mapping is drawn from.

#### Fidelity

Fidelity is stated **per direction**, using exactly three values.

| Value | Meaning |
|-|-|
| `lossless` | The information survives the conversion in that direction |
| `lossy` | The conversion succeeds but drops named information |
| `unmapped` | There is nothing to convert to in that direction |

A mapping marked **lossless** SHALL round-trip: converting openEHR to FHIR and
back SHALL yield an equivalent instance. A mapping marked **lossy** SHALL
document exactly which information is dropped.

There is no fourth value. A one-way mapping is expressed as `unmapped` in its
reverse direction, with a reason — not as "not applicable". An `unmapped`
verdict on a row that is not yet settled SHALL name an owner, so that every open
gap has somebody it belongs to.

These are not editorial claims. Each is a machine-checked property of the
[reference implementation](reference-implementation.html): a `lossless` row must
round-trip a paired fixture unchanged, and a `lossy` row must drop **exactly**
what it says it drops — no more, and no less.

#### Decision maturity

Fidelity says what a conversion does. Maturity says how much confidence the
working group has in it. They are separate columns and are never collapsed.

| Value | Meaning |
|-|-|
| `settled` | The working group has reviewed the mapping and agreed it |
| `open` | The mapping is under discussion; the alternatives are stated in the Notes and none has been adopted |
| `not-discussed` | The type or field has not been examined yet |

A `not-discussed` row SHALL NOT claim a fidelity outcome. It carries `unmapped`
in both directions with a reason, because the guide cannot assert what nobody
has checked. Reviewer coverage is published in full on
[Open Items](open-items.html) rather than smoothed over.

#### Scope

| Value | Meaning |
|-|-|
| `datatype` | The mapping is expressible between the two data types alone |
| `archetype` | The mapping needs surrounding context — an openEHR archetype and a FHIR resource or profile — to be stated at all |

`DV_ORDINAL` is the clearest `archetype`-scope case: its symbol and its ordinal
value have no single FHIR data type to land in, and the mapping is only
meaningful as a pair of `Observation.component` entries. Rows at `archetype`
scope describe what the surrounding structures must do; they do not define
archetypes or profiles, which is
[out of scope](index.html) for this guide.

#### Citations

Every mapping row cites **both** specifications: the openEHR Reference Model
attribute it maps from, and the FHIR R5 element it maps to. A row with only one
citation is not published. A row whose claim neither specification supports is
recorded `not-discussed` or `open` rather than asserted.

Citations are always published URLs. Where a row targets a FHIR **extension**
rather than a core element, the citation is to the extension pack.

#### Conformance language

`SHALL`, `SHALL NOT`, `SHOULD`, and `MAY` are used in the sense
[RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) gives them and are
normative wherever they appear in this guide. Lower-case "shall", "should", and
"may" are not conformance language.
