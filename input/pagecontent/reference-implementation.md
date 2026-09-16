### Reference implementation

Every fidelity claim in this guide is backed by runnable code. The `reference/`
directory of this guide's source repository holds a TypeScript **mapping
ledger** and a set of reference converters, together with the tests that
substantiate what the mapping tables assert.

#### Why it exists

A mapping table that says `lossless` is an assertion. A mapping table generated
from a ledger whose `lossless` rows must round-trip a paired instance unchanged
— and whose `lossy` rows must drop **exactly** what they claim to drop, no more
and no less — is a checked statement.

That is the whole point of the reference implementation. It is not a product.

#### Try it in your browser

The same converters and the same ledger this page describes also run as a
**hosted single page**:

- [openEHR ↔ FHIR data type converter](https://openehr-fhir.github.io/data-type-mapping-ig/)

Four things are worth knowing before you paste anything into it:

- It runs the **same converters and the same ledger** this page describes, so a
  verdict it shows you is the verdict the mapping tables publish, not a
  re-implementation that might disagree with them.
- **Everything you paste stays in your browser.** There is no backend, no
  telemetry, and no network call after the page loads.
- It **names the guide version and the source commit** it was built from, in
  the footer, so you can tell whether you are looking at a current build.
- The **published worked examples load into it** as starting points, so you can
  edit a real instance rather than inventing one.

When a conversion leaves something behind, each dropped field links back to the
mapping row that declares the loss.

#### What it is not

- **Not a published package.** It is not on npm and is not versioned
  independently of this guide.
- **Not a CLI, and not a service.** The hosted converter above is neither: it is
  a static page that runs in your own browser, with nothing behind it — read
  this bullet and [Try it in your browser](#try-it-in-your-browser) together.
- **Not a FHIR or openEHR type library.** It models only the fields the mappings
  actually touch.
- **Not part of the IG build.** Neither SUSHI nor the IG Publisher reads it.

#### How the guide relates to it

The mapping tables on the category pages are **generated** from the ledger and
written into sentinel-delimited managed regions in the guide's markdown source.
The worked examples are the very test fixtures the converters are exercised
against, so a published example cannot drift from the code that produced it.

Editing a generated region by hand is detected and rejected; the fix is to edit
the ledger and re-render.

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
`reference/test/contract.test.ts` holds every converter to it.

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
so it is stated here rather than published as a ledger row.

#### A caveat on citations

Citations to the FHIR **extension pack** cannot be verified against a local
mirror of the R5 specification, because that mirror contains no extension
definitions. Those citations are taken on the working group's authority, and are
marked as such. Citations to openEHR RM pages and to FHIR R5 core pages are held
to two separate rules. A citation sitting on a **real endpoint** SHALL name an
anchor rather than a bare page, with one written-down exception where the
specification offers no anchor at all; that rule is part of the ledger's own
validation and runs on every build. Resolving those anchors against a local copy
of the specification is a **second** check, and it runs only when
`OPENEHR_SPEC_DIR` and `FHIR_R5_DIR` are configured — it is part of the release
gate and skips silently otherwise.

#### The commands

Run from the repository root. These are the same commands the repository's
`AGENTS.md` documents under *Build → Track 3*, and `reference/README.md`
repeats them:

```
npm --prefix reference install
npm --prefix reference run typecheck
npm --prefix reference test
npm --prefix reference run render
npm --prefix reference run render:check
```

- `typecheck` is the primary gate on **ledger content**, because the ledger's
  invariants are compile errors: a `lossy` verdict that names nothing it drops,
  a row with a verdict in only one direction, and an endpoint with no citation
  all fail to compile.
- `test` runs the whole suite: the validator's negative cases, the five hard
  mapping shapes, the page inventory, the region machinery, the coverage gate,
  the round-trip matrix, the converter contract, the two ISO 8601 tables, and
  the open-items register.
- `render` writes the managed regions into `input/pagecontent/`.
- `render:check` re-renders in memory and fails on any difference. That is the
  drift gate.

Citation resolution is opt-in, because it needs local mirrors of the two
specifications:

```
$env:OPENEHR_SPEC_DIR = '…'
$env:FHIR_R5_DIR = '…'
npm --prefix reference test
```

With both set, every `spec-local` citation in the ledger is resolved to a real
**anchor** on a real page in the specification it claims to cite — not merely to
a file. The same configuration runs a second check: the openEHR vocabulary
literals the converters write and the fixtures carry — code-set identifiers,
`DV_TEXT.formatting` values, and the ISO 8601 lexical forms the guide flags as
openEHR-accepted — are resolved against the published openEHR specification,
which needs the openEHR mirror alone. Without the mirrors, those tests skip and
the rest of the suite runs unchanged, which is why **the publication gate is the
form above**, expecting zero skipped tests, rather than the bare run.

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