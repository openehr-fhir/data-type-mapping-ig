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

#### Running it

The commands, and their expected results, are documented in the repository's
`AGENTS.md` under *Build → Track 3* and in `reference/README.md`. They cover
installing the workspace, type-checking it, running the test suite, rendering
the guide's managed regions, and checking those regions for drift.
