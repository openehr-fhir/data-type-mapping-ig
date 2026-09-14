### Conventions used in the mapping tables

Every mapping in this guide is stated at **field level** and in **both
directions**. The two directions frequently differ: a field that survives the
trip to FHIR intact may have nowhere to return to, and a FHIR element with no
openEHR counterpart is a gap in one direction only. A single fidelity verdict
per type would hide that, so this guide does not publish one.

#### The mapping index

The summary tables on [Data Type Mapping](mapping.html) and on each category
page use these columns:

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Column | Meaning |
|-|-|
| openEHR type | The openEHR Reference Model type being mapped |
| FHIR type | The FHIR data type it maps to |
| → FHIR | The aggregate fidelity of the openEHR → FHIR direction |
| → openEHR | The aggregate fidelity of the FHIR → openEHR direction |
| Maturity | How settled the mapping decision is |
| Scope | `datatype` or `archetype` — see [Scope](#scope) below |
{: .grid}

</div>

An aggregate verdict is `lossless` only when **every** field row is `lossless`
in that direction, `unmapped` only when every row is `unmapped`, and `lossy`
otherwise. It is a reading aid; the field table is the normative statement.

#### The field tables

Each per-type table uses these columns:

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Column | Meaning |
|-|-|
| openEHR field | The Reference Model attribute, linked to its specification |
| FHIR target | The FHIR element, extension, or resource element, linked to its specification. Where the target depends on the instance, each candidate is listed with the condition under which it applies |
| → FHIR | The fidelity of this field, openEHR → FHIR |
| → openEHR | The fidelity of this field, FHIR → openEHR |
| Maturity | How settled this row is |
| Notes | What is dropped, and any conditions on the mapping |
{: .grid}

</div>

Above each table, a **Sources** line names the specification sections the whole
mapping is drawn from.

#### Fidelity

Fidelity is stated **per direction**, using exactly three values.

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Value | Meaning |
|-|-|
| `lossless` | The information survives the conversion in that direction |
| `lossy` | The conversion succeeds but drops named information |
| `unmapped` | There is nothing to convert to in that direction |
{: .grid}

</div>

A mapping marked **lossless** SHALL round-trip: converting openEHR to FHIR and
back SHALL yield an equivalent instance. A mapping marked **lossy** SHALL
document exactly which information is dropped.

There is no fourth value. A one-way mapping is expressed as `unmapped` in its
reverse direction, with a reason — not as "not applicable". An `unmapped`
verdict on a row that is not yet settled SHALL name an owner, so that every open
gap has somebody it belongs to.

<a name="what-is-checked"></a>

These are not editorial claims. Each is a machine-checked property of the
[reference implementation](reference-implementation.html) — with two scoping
rules that are part of the claim rather than exceptions to it:

- A `lossless` row must **round-trip a paired fixture unchanged**, and a `lossy`
  row must drop **exactly** what it says it drops — no more, and no less.
- Rows at **`archetype` scope are outside the matrix**, because their FHIR home
  is a resource element and a data-type conversion never sees a resource. That
  exemption is itself checked: a row claiming it while targeting an ordinary
  data-type element is rejected, so the set of unchecked rows cannot quietly
  grow.
- A row whose **source side has no counterpart** in the direction under test is
  skipped, because there is nothing to convert from. What is *not* skipped is
  the target side: a row that claims nothing can be carried is held to
  producing nothing.

Every fixture pair is additionally asserted to be a pair — each side producible
from the other, modulo the drops the ledger declares — and a pair that holds in
one direction only says so, with a reason, in a marker beside it. A pair that
holds in **neither** direction names the test that pins the behaviour instead,
because a comparison asserted only to *differ* pins nothing about what differs.

<a name="mandatory-attributes"></a>

#### The mandatory-attribute rule

The two standards disagree about what is optional. Many attributes the openEHR
Reference Model declares `1..1` map to FHIR elements that are `0..1`:
`DV_QUANTITY.magnitude` and `.units`, `DV_COUNT.magnitude`,
`CODE_PHRASE.code_string`, `DV_MULTIMEDIA.media_type` and `.size`,
`DV_PARSABLE.value` and `.formalism`, and `DV_TEXT.value` are all of that shape.
A conforming FHIR instance may therefore arrive with nothing to fill a
mandatory openEHR attribute.

**A converter SHALL NOT invent a value for an attribute the target standard
declares mandatory.** Where the source carries nothing for such an attribute,
the conversion produces **no value at all** and reports the absent source path.
It does not substitute a zero, an empty string, or a default code and then call
the result `lossless`: a fabricated magnitude is a safety hazard, and declaring
a fabrication lossless is the single worst statement a fidelity ledger can make.

This is a rule about **instances**, not a fidelity fact about the two
standards. The mapping tables state what the standards can carry; a row whose
openEHR attribute is mandatory and whose FHIR element is optional stays
`lossless`, because the field maps exactly when it is present. What the rule
governs is what an implementation does when it is not.

Exactly **three** substitutions are permitted, and each is recorded on the row
that describes it:

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Site | Why it is an exception |
|-|-|
| `CODE_PHRASE.terminology_id` from an absent `Coding.system` | The working group has explicitly refused to choose a strategy. The placeholder is substituted **and reported**, so the conversion is `lossy`, never `lossless` |
| `DV_STATE.is_terminal` from a `CodeableConcept` | Nothing in a `CodeableConcept` can source it; it is inferred from the state machine the archetype defines, and the openEHR-only gap is published |
| `TERM_MAPPING.match` from a `Coding` | A `Coding` carries no degree of equivalence and `match` is `1..1`. The Reference Model publishes a value for exactly this case — `?`, "the kind of mapping is unknown" — which is substituted **and reported**, so the conversion is `lossy`, never `lossless`, and no equivalence is asserted |
{: .grid}

</div>

The list is closed. A fourth exception would have to be argued for in the
reference implementation's own contract tests, where the three above are pinned
and where the published list and the substituting sites are asserted to be the
same set.

#### Composed conversions

A conversion that delegates to another — `DV_CODED_TEXT ↔ CodeableConcept`
calls `CODE_PHRASE ↔ Coding` for each coding, and `DV_STATE ↔ CodeableConcept`
calls `DV_CODED_TEXT ↔ CodeableConcept` in turn — **carries the inner
conversion's drops forward**. A drop declared on the inner mapping is reported
on the outer result as well, so composition cannot make a published loss
disappear.

#### Decision maturity

Fidelity says what a conversion does. Maturity says how much confidence the
working group has in it. They are separate columns and are never collapsed.

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Value | Meaning |
|-|-|
| `settled` | The working group has reviewed the mapping and agreed it |
| `open` | The mapping is under discussion; the alternatives are stated in the Notes and none has been adopted |
| `not-discussed` | The type or field has not been examined yet |
{: .grid}

</div>

A `not-discussed` row SHALL NOT claim a fidelity outcome. It carries `unmapped`
in both directions with a reason, because the guide cannot assert what nobody
has checked. Reviewer coverage is published in full on
[Open Items](open-items.html) rather than smoothed over.

#### Scope

<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| Value | Meaning |
|-|-|
| `datatype` | The mapping is expressible between the two data types alone |
| `archetype` | The mapping needs surrounding context — an openEHR archetype and a FHIR resource or profile — to be stated at all |
{: .grid}

</div>

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

<a name="citation-tiers"></a>

Extension-pack citations are marked with a dagger — <sup>†</sup>. They are the
one class of citation this guide cannot verify mechanically: the specification
mirrors its tests resolve citations against hold the openEHR Reference Model and
the FHIR R5 **core** specification, and neither contains extension definitions.
A dagger therefore means *"this citation is taken on the working group's
authority"*. Citations to openEHR RM pages and to FHIR R5 core pages carry no
dagger. Where such a citation sits on a **real endpoint** — a field, an
extension, or a resource element — it SHALL name a real **anchor** on the page,
not merely the page; that rule is enforced whenever the guide is built. Its one
exception is written down as data with a reason: `RelativeTime` is cited to the
R5 data-type inventory page precisely because R5 defines no such type and there
is no anchor to point at. Separately, and **conditionally on the specification
mirrors being configured**, each of those anchors is resolved against a local
copy of the specification before the guide is published: that check is part of
the release gate, and it skips silently for a contributor who has not set the
mirrors up.

Citations to [terminology.hl7.org](https://terminology.hl7.org) and to
[jira.hl7.org](https://jira.hl7.org) are likewise verified as well-formed and
host-allow-listed only; they exist in neither mirror. Citations to
`build.fhir.org` are **not permitted** anywhere in this guide, because a
continuous-build snapshot is not a published specification.

#### Conformance language

`SHALL`, `SHALL NOT`, `SHOULD`, and `MAY` are used in the sense
[RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) gives them and are
normative wherever they appear in this guide. Lower-case "shall", "should", and
"may" are not conformance language.

#### A note for editors

Most of the tables in this guide are **generated**. Each sits between a pair of
HTML comments of the form:

```
<!-- >>> mapping ledger: <region-id> (generated by npm --prefix reference run render) >>> -->
<!-- <<< mapping ledger: <region-id> (generated by npm --prefix reference run render) <<< -->
```

Everything between those two lines comes from the mapping ledger in the
[reference implementation](reference-implementation.html). **An edit made
inside a region is lost on the next render.** To change a table, change the
ledger and re-render; to add prose, put it outside the sentinels, where nothing
will touch it.

The drift check turns a hand edit into a loud failure rather than a silent loss,
but it only helps if it is run. It is named in the repository's contributor
guidance for that reason.

Generated table presentation is maintained in `reference\render\html.ts`;
mapping content remains owned by the ledger. For hand-authored tables outside
managed regions, retain the Markdown rows and give each table the `grid` class
inside its own named, keyboard-focusable scrolling wrapper:

```markdown
<div markdown="1" style="max-width: 100%; overflow-x: auto;" tabindex="0" role="group" aria-label="Scrollable table">

| <span style="white-space: nowrap;">→ openEHR</span> | Notes |
|-|-|
| Example value | Longer explanations can wrap normally. |
{: .grid}

</div>
```

The attribute line attaches `grid` to the table itself. The wrapper permits
table-local horizontal scrolling when needed, while ordinary headers and body
cells remain free to wrap. Use the no-wrap span only when `→ openEHR` is an
actual column header, not for explanatory body labels such as those above.
