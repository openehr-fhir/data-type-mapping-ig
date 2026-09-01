### Other data

This category holds the types that do not fit any of the others: encapsulated
binary and parsable content, and state machines.

**`DV_MULTIMEDIA` ↔ `Attachment`** is the substantial mapping here. The two
types agree on the essentials — media type, data, size, an integrity hash, and a
URI alternative to inline data — and diverge on almost everything around them.
`DV_MULTIMEDIA` carries a compression algorithm, an integrity check algorithm
that need not be SHA-1, and a thumbnail; `Attachment` carries a creation
timestamp, height, width, frames, duration, pages, and a language. Neither set
has a home on the other side, and each of those is recorded as an `unmapped`
row with the ticket that owns it. **No extension, code system, or value set is
invented here for any of them.**

**`DV_PARSABLE`** wraps a string with a `formalism` naming the syntax it is
written in. The FHIR target is a `string` with the `mimeType` extension, or
`markdown` where the formalism is markdown.

**`DV_STATE`** carries a coded value plus an `is_terminal` flag and belongs to
an instruction state machine. FHIR has no data type for it: FHIR models workflow
state as resource-level elements such as `Task.status`, with its own state
machine. The value can be carried as a `CodeableConcept`, but the state machine
it belongs to cannot, so this is largely `unmapped` and the reason is recorded
rather than papered over.

`DV_ENCAPSULATED`, the abstract parent of `DV_MULTIMEDIA` and `DV_PARSABLE`, is
also noted here. The openEHR Reference Model is the authority for its
definition, and this guide cites the RM rather than any downstream
representation of it.

Reviewer coverage in this category is uneven — several of these types were never
reviewed from the FHIR side. That is published in full on
[Open Items](open-items.html) rather than smoothed over, and rows the
specifications do not clearly support are recorded `open` rather than asserted.

See [Conventions](conventions.html) for how to read the tables.
