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

#### What it is not

- **Not a published package.** It is not on npm and is not versioned
  independently of this guide.
- **Not a CLI, and not a service.**
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

#### Wire format

The openEHR side uses the canonical openEHR JSON form, with the `_type`
discriminator naming the Reference Model class. The FHIR side uses ordinary FHIR
JSON.

#### A caveat on citations

Citations to the FHIR **extension pack** cannot be verified against a local
mirror of the R5 specification, because that mirror contains no extension
definitions. Those citations are taken on the working group's authority, and are
marked as such. Citations to openEHR RM pages and to FHIR R5 core pages **are**
resolved and verified.

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
  the round-trip matrix, the two ISO 8601 tables, and the open-items register.
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
page in the specification it claims to cite. Without them, that one test skips
and the rest of the suite runs unchanged.

#### What the tests actually prove

- A `lossless` row **round-trips**: the value at that row's path survives
  conversion out and back unchanged, and the converter reports no issue at that
  path.
- A `lossy` row neither **over-claims** nor **under-claims**: every issue the
  converter reports is one the ledger declared for that direction, and the union
  of reported issues across all of a mapping's fixtures equals the declared set
  exactly.
- An `unmapped` row reports its source path and produces no value at its target.
- A mapping that claims something can be carried has a converter and a fixture;
  a mapping that claims nothing can be has neither.

Two scoping rules are deliberate. Rows at `archetype` scope are outside the
matrix, because their FHIR home is a resource element and a data-type converter
never sees a resource. And a row whose **source** side has no counterpart in the
direction under test is skipped, because there is nothing to convert from.