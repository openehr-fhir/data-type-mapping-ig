### Reference implementation

Every fidelity claim in this guide is backed by runnable code. The separate
[reference implementation repository](https://github.com/openehr-fhir/data-type-mapping-ri)
holds a TypeScript **mapping ledger** — a machine-checkable transcription of
this guide's mapping tables — and a set of reference converters, together with
the tests that substantiate what the tables assert.
Their [source](https://github.com/openehr-fhir/data-type-mapping-ri/tree/main/reference)
is maintained independently of this guide.

**This guide is the source of truth.** Its tables, notes, and examples are
edited here, and the reference implementation follows them; nothing in the
guide is generated from it. Where the two disagree, the guide states the
mapping, and the disagreement is a defect to be resolved in one or the other.

#### Why it exists

A mapping table that says `lossless` is an assertion. A ledger transcribing that
table whose `lossless` rows must round-trip a paired instance unchanged — and
whose `lossy` rows must drop **exactly** what they claim to drop, no more and no
less — turns the assertion into a checked statement.

That is the whole point of the reference implementation. It is not a product.

#### Try it in your browser

The same converters and the same ledger this page describes also run as a
**hosted single page**:

- [openEHR ↔ FHIR data type converter](https://openehr-fhir.github.io/data-type-mapping-ri/)

Four things are worth knowing before you paste anything into it:

- It runs the **RI's converters and ledger**, not a separate re-implementation.
  Its build may follow a different version of this guide from the one you are
  reading; agreement is not automatic across revisions.
- **Everything you paste stays in your browser.** There is no backend, no
  telemetry, and no network call after the page loads.
- Its displayed **provenance** names the guide version and the independent
  RI source commit. See the
  [browser-converter documentation](https://github.com/openehr-fhir/data-type-mapping-ri/blob/main/converter-site/README.md)
  for the separate compatible-guide revision, which is not displayed in
  that provenance. A matching guide version alone does not establish
  revision parity with a guide snapshot.
- The **RI's test fixtures load into it** as starting points, so you can edit
  a real instance rather than inventing one. The worked examples in this guide
  began as those fixtures, but each is now maintained on its own side.

When a conversion leaves something behind, each dropped field links back to the
mapping row that declares the loss.

#### What it is not

- **Not a published package.** It is not on npm. Its source revision is
  independent of the guide's version and revision.
- **Not a CLI, and not a service.** The hosted converter above is neither: it is
  a static page that runs in your own browser, with nothing behind it — read
  this bullet and [Try it in your browser](#try-it-in-your-browser) together.
- **Not a FHIR or openEHR type library.** It models only the fields the mappings
  actually touch.
- **Not part of the IG build.** Neither SUSHI nor the IG Publisher reads it.

#### How the guide relates to it

Every table and worked example in this guide — the mapping tables on the
category pages, the summaries, the ISO 8601 subset comparison, and the tables
on [Gaps](gaps.html) and [Open Items](open-items.html) — is maintained by hand
in this guide. [Conventions](conventions.html#editing-gaps-and-open-items) says
how editors keep them in step with one another.

The RI is a consumer of the guide. When a mapping changes here, the RI's ledger,
converters, and fixtures are updated to match in the RI repository, and its
tests then check the new claim. The RI does not write to this guide, and
publishing the guide needs no RI checkout and runs none of its checks.

#### The converter contract

Every converter returns a result carrying three things: the value it produced,
the fidelity it actually achieved, and one issue per piece of information it
could not carry across, each naming the path it came from. A converter does not
throw for a mapping-level problem — an unmappable field is data, not an
exception.

The issue paths are the join between the code and the ledger. A converter that
drops a field the ledger does not list, or fails to drop one it does, fails the
test suite.

A converter **never invents a value for an attribute the target standard
declares mandatory**. Where the source has nothing to fill one — a FHIR
`Quantity` carrying only a `comparator`, a `Coding` with no `code`, an
`Attachment` with no `contentType` — the converter returns `unmapped`, produces
no value at all, and names the absent source path. Substituting a zero, an
empty string, or a default code and reporting `lossless` would publish an
instance that claims to be a valid `DV_QUANTITY`, `CODE_PHRASE`, or
`DV_MULTIMEDIA` while carrying a value nobody sent. The rule and its two
recorded exceptions are stated in full under
[the mandatory-attribute rule](conventions.html#mandatory-attributes), and
the external RI's `reference/test/contract.test.ts` holds every converter to it.

A converter that **composes** another carries the inner result's issues
forward, so a declared drop cannot vanish behind a composition boundary. The
same test file pins that in both directions.

#### Wire format

The openEHR side uses the canonical openEHR JSON form, with the `_type`
discriminator naming the Reference Model class. The FHIR side uses ordinary FHIR
JSON — including the places where that is not the obvious JavaScript value:
`integer64` is serialised as a **JSON String**, because FHIR R5 says so "due to
issues with precision in floating point libraries", and this implementation
publishes the format R5 has rather than the one that would be convenient.

**One limitation of this code, which is not a mapping fact.** The openEHR side
of a numeric primitive is a JSON number, and a JavaScript number represents
integers exactly only up to ±(2<sup>53</sup> − 1). A FHIR `integer64` beyond
that range is read as the nearest representable value. Nothing in either
standard makes that a loss — `Integer64` and `integer64` have the same range —
so it is stated here rather than published as a mapping row.

#### A caveat on citations

Citations to the FHIR **extension pack** cannot be verified against a local
mirror of the R5 specification, because that mirror contains no extension
definitions. Those citations are taken on the working group's authority, and are
marked as such. Citations to openEHR RM pages and to FHIR R5 core pages are held
to two separate rules. A citation sitting on a **real endpoint** SHALL name an
anchor rather than a bare page, with one written-down exception, stated on
[Gaps](gaps.html), where the specification offers no anchor at all. In this
guide, editors hold every table to that rule in review. In the RI, its ledger's
structural validation holds the transcribed rows to it, and a **second**,
mirror-dependent check in its release gate resolves those anchors against local
copies of both specifications, skipping when the mirrors are not configured.
Neither RI check runs when the guide is published.

#### The commands

Implementation commands run in the separate RI checkout, not in this guide
repository. Its maintained documentation supplies setup, invocation, and
release requirements:

- [RI operations](https://github.com/openehr-fhir/data-type-mapping-ri/blob/main/reference/README.md)
  — ledger validation and conversion tests.
- [Browser-converter operations](https://github.com/openehr-fhir/data-type-mapping-ri/blob/main/converter-site/README.md)
  — building, previewing, and understanding the hosted converter's provenance.

Citation resolution needs local mirrors of **both** specifications: every
`spec-local` citation is resolved to a real **anchor** on a real page, not merely
to a file. The separate vocabulary check needs the **openEHR mirror alone**. It
resolves the openEHR vocabulary literals the converters write and the fixtures
carry — code-set identifiers, `DV_TEXT.formatting` values, and the ISO 8601
lexical forms the guide flags as openEHR-accepted — against the published
openEHR specification. Missing mirrors cause those tests to skip rather than
prove their claims; the external RI documentation defines the configured,
zero-skipped release gate. Guide publication consumes committed inputs and
does not execute these suites or require their mirrors.

#### What the tests actually prove

- A `lossless` row **round-trips**: the value at that row's path survives
  conversion out and back unchanged, and the converter reports no issue at that
  path.
- A `lossy` row neither **over-claims** nor **under-claims**: every issue the
  converter reports is one the ledger declared for that direction, and the union
  of reported issues across all of a mapping's fixtures equals the declared set
  exactly.
- An `unmapped` row reports its source path and produces no value at its target.
- A converter **never invents a mandatory attribute** it has no source for, and
  a composing converter carries its inner converter's issues forward.
- A mapping that claims something can be carried has a converter and a fixture;
  a mapping that claims nothing can be has neither.

Two scoping rules are deliberate, and both are narrower than they were. Rows at
`archetype` scope are outside the matrix, because their FHIR home is a resource
element and a data-type converter never sees a resource — and a row that claims
that exemption while targeting an ordinary data-type element is now **rejected**,
so the exempt set cannot grow by inattention. And a row whose **source** side
has no counterpart in the direction under test is skipped, because there is
nothing to convert from; its **target** side is not skipped, and a conversion
that produces nothing at all has to name a path the ledger declares `unmapped`.