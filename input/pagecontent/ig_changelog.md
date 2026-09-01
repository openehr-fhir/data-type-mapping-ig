### Change Log

Substantive changes are recorded here, in the same commit that makes them.
Group entries under the version heading they ship in, using the categories
below, and nest a bullet per page or artifact touched.

Categories, in the order they appear under a version:

- **Non-compatible** — breaks existing implementations (renamed ids, moved
  canonicals, tightened cardinality or bindings).
- **Compatible, Substantive** — changes meaning without breaking conformance.
- **Compatible, Non-Substantive** — clarifications, typos, editorial fixes.

#### Version 0.1.0

**Compatible, Substantive**

- The mapping tables are now **generated** from a single machine-checked
  mapping ledger and written into sentinel-delimited managed regions in the
  page sources. `mapping.html` carries the first such region, the all-mappings
  summary table. Hand-editing a generated region is detected and rejected;
  hand-written prose outside the sentinels is never touched.
- `conventions.html` gained a citation-tier note: extension-pack citations are
  marked with a dagger and are taken on the working group's authority, because
  they cannot be resolved against a local mirror of the FHIR R5 core
  specification. `build.fhir.org` citations are not permitted anywhere in this
  guide.
- Page inventory and navigation: added `type-systems.html`,
  `conventions.html`, the eight category pages (`mapping-boolean.html`,
  `mapping-numeric.html`, `mapping-reference.html`, `mapping-textual.html`,
  `mapping-coded.html`, `mapping-quantity.html`, `mapping-temporal.html`,
  `mapping-other.html`), `gaps.html`, `cross-cutting.html`,
  `open-items.html`, and `reference-implementation.html`, each registered in
  both `pages:` and `menu:`.
- `mapping.html` became the index to the category pages. Its
  `### Conventions used in the mapping tables` section moved to
  `conventions.html`. **The two normative sentences in that section moved
  verbatim** — *"A mapping marked **lossless** SHALL round-trip: converting
  openEHR to FHIR and back SHALL yield an equivalent instance. A mapping
  marked **lossy** SHALL document exactly which information is dropped."* —
  this is a relocation, not a rewording, and neither sentence's conformance
  language changed.
- `conventions.html` extends the relocated legend with per-direction fidelity
  columns and a `Maturity` column, and adds a decision-maturity legend
  (`settled` / `open` / `not-discussed`).
- `index.html` gained a real *How to read this guide* navigation covering
  every page.

- Initial repository scaffold. No published content yet.
