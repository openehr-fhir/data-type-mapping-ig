# AGENTS.md

Canonical, machine-readable conventions for automated agents working in
**openehr-fhir-data-type-mapping** (the *openEHR to FHIR Data Type Mapping*
Implementation Guide). This file is the single source of truth that the
`.github/skills/dev-*` skills read before naming any build, test, or lint
command.

**Precedence.** This file is authoritative for commands, conventions, and
invariants an agent must follow. [`README.md`](README.md) and
[`INSTALLATION.md`](INSTALLATION.md) are authoritative for rationale and
toolchain setup detail, and are the place to look for the "why". If this
file contradicts the repository itself, the repository wins — fix this file.

---

## What this repository is

This is a **HL7 FHIR Implementation Guide**, not an application. It is
authored in FHIR Shorthand (FSH) plus markdown pages, compiled by **SUSHI**
into FHIR resources, and rendered into a publishable website by the **HL7 IG
Publisher**. Its canonical is
`http://hl7.org/fhir/uv/openehr-data-type-mapping`.

The guide defines mappings between **openEHR** data types and **HL7 FHIR**
data types, so that data captured in an openEHR system can be exchanged as
FHIR and data received as FHIR can be persisted in an openEHR system without
loss of meaning.

Two framing facts settle most arguments:

1. **The deliverable is a specification** — normative text plus conformance
   resources. Not code.
2. **A mapping is a claim about two external standards.** The openEHR
   Reference Model and the FHIR R5 specification are both authoritative, and
   this guide may not redefine either. "What does the openEHR RM actually
   say?" and "what does FHIR R5 actually say?" are the deciding arguments.
   Where the two cannot be reconciled, the guide documents the loss rather
   than inventing a bridge.

Because it is a spec, there is **no test suite** in the software sense. The
build *is* the verification — see [Test](#test).

**This repository is new.** It has no commit history, no `origin` remote, and
no published release yet. Where a convention below is stated as a *target*
rather than an *observed* practice, it says so.

---

## Repository layout

| Path | Contents |
|-|-|
| `input/fsh/` | FSH source: profiles, extensions, concept maps, examples. The primary authoring surface. Currently empty. |
| `input/pagecontent/` | Markdown narrative pages (one per entry in `sushi-config.yaml` `pages:`). The other primary authoring surface. |
| `input/pagecontent/ig_changelog.md` | The IG change log. See [Commit conventions](#commit-conventions). |
| `input/resources/` | Hand-authored ("pre-defined") JSON resources that SUSHI copies through verbatim. **Not present yet** — create it with the first such resource. Do not add a placeholder file: SUSHI warns about every non-JSON/XML file it finds there. |
| `input/images-source/` | PlantUML / SVG diagram sources. |
| `input/ignoreWarnings.txt` | Publisher QA messages that are reviewed and deliberately suppressed, each with a comment explaining why. |
| `sushi-config.yaml` | IG metadata, dependencies, `pages`, and `menu`. The most important config file in the repo. |
| `ig.ini` | Points the IG Publisher at the SUSHI-generated ImplementationGuide resource and names the HL7 template. |
| `_genonce.*`, `_build.*`, `_gencontinuous.*`, `_genclean.bat`, `_updatePublisher.*` | Standard HL7 `ig-publisher-scripts`. **Maintained upstream** at `HL7/ig-publisher-scripts`; `_updatePublisher` overwrites them. Do not hand-edit. |
| `.vscode/tasks.json` | The default VS Code build task; runs `_genonce`. |
| `input-cache/` | Downloaded `publisher.jar` and package cache. **Ignored.** |
| `fsh-generated/` | SUSHI output. **Ignored, and never hand-edited.** |
| `output/`, `temp/`, `template/`, `translations/` | IG Publisher output and scratch. **Ignored, and never hand-edited.** |
| `scratch/` | `dev-*` skill slots. **Ignored.** |
| `reference/` | The **mapping ledger** and the TypeScript reference implementation. Outside `input/`, so neither SUSHI nor the IG Publisher walks it. `ledger/` holds the mapping facts, `src/model/` their single shape declaration, `src/convert/` the converters, `fixtures/` the paired instances, `render/` the projection into `input/pagecontent/`, `test/` the suite. See [Track 3](#track-3--reference-implementation) and `reference/README.md`. |
| `reference/fixtures/<mapping-id>/NN-<name>.pairing.json` | The **pairing marker** for a fixture pair that is deliberately one-directional: `{ "directions": ["toFhir"], "reason": "…" }`. `reference/test/pairs.test.ts` asserts only the directions it names, and asserts that every direction it does *not* name genuinely fails to produce the partner, so a marker cannot outlive the defect it documents. A marker with no reason is a failure. |
| `reference/node_modules/` | npm install tree. **Ignored** by the existing unrooted `node_modules/` rule. |

Ignored paths are listed in `.gitignore`. Anything under `fsh-generated/`,
`output/`, `temp/`, `template/`, or `input-cache/` is a build artifact:
editing it is always wrong, and the edit is destroyed on the next build.

---

## Toolchain pins

- **SUSHI** — installed globally via `npm install -g fsh-sushi`. No pin is
  checked in; the repository tracks the current SUSHI release. Verified
  working with **SUSHI v3.20.1** (FSH spec v3.0.0). Requires Node.js.
- **Node.js** — no `.nvmrc` and no pin. Verified working with **Node
  v26.7.0**. Needed to run SUSHI, and to run the `reference/` workspace,
  which relies on Node's **native TypeScript type stripping** to execute
  `.ts` sources and `.ts` tests with no build step and no loader flag.
- **npm** — no pin. Verified working with **npm 11.19.0**. Only needed for
  the `reference/` workspace.
- **`reference/` dependencies** — three **devDependencies** only, declared as
  caret ranges in `reference/package.json` and pinned exactly by the
  committed `reference/package-lock.json`: `typescript` and `@types/node`
  serve `typecheck`, and `yaml` serves `reference/test/pages.test.ts`, which
  reads `sushi-config.yaml`. The ledger, the converters, the renderer, and
  every other test have **no** dependency at all — Node runs them directly —
  so a failed `npm install` degrades the workspace to "type-check and
  `pages.test.ts` unavailable", never to "nothing runs".
- **Java** — required to run the IG Publisher. `INSTALLATION.md` states JRE 8
  is a floor and JDK 11+ is recommended (heap headroom). Verified working
  with **OpenJDK 25.0.4.1**. The build scripts set
  `JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8`; keep that, the publisher needs
  UTF-8.
- **IG Publisher** — `publisher.jar`, not checked in and **not currently
  present in this clone**. Fetch it with `_updatePublisher.bat` (latest
  release of `HL7/fhir-ig-publisher`) into `input-cache/`; the scripts also
  accept it in the **parent** directory (`..\publisher.jar`). There is no
  version pin — the scripts always take *latest*.
- **IG template** — `hl7.fhir.template#current` in `ig.ini`. A floating pin;
  template changes can alter rendering without any repo change.
- **FHIR version** — `fhirVersion: 5.0.0` in `sushi-config.yaml`. R5 only;
  there is no `generate-version` cross-version generation in this IG.
- **Package dependencies** — the `dependencies:` block in
  `sushi-config.yaml` is currently commented out. When a dependency is
  added it **must be pinned to an exact version**: a floating dependency can
  move generated URLs and QA output without any change in this repo.
- **Ruby + Jekyll** — only needed for the publisher's local page rendering;
  see `INSTALLATION.md`. Not needed to run SUSHI alone.

Warnings are **not** errors here, but they are not free either: the QA
report is a review artifact, and any warning that is knowingly accepted is
expected to be entered in `input/ignoreWarnings.txt` **with a comment
explaining why**.

---

## Build

There are three build tracks. They catch different things, and the fast ones
do not subsume the slow one.

### Track 1 — SUSHI only (fast inner loop)

```powershell
sushi .
```

Compiles `input/fsh/**.fsh` plus `input/resources/` into
`fsh-generated/resources/` and regenerates the ImplementationGuide resource.
Seconds, not minutes. This is the right command after any `.fsh` or
`sushi-config.yaml` edit.

The expected baseline is **0 errors**. SUSHI's exit code is the error count,
so a clean run exits `0`. Warnings are tolerated but should be understood —
the scaffold as committed reports **0 errors, 0 warnings**, so treat any
warning as something your change introduced until proven otherwise.

Because SUSHI is fast and the publisher is slow, run this first and only
escalate to Track 2 once it is clean.

### Track 2 — full IG Publisher build

The publisher runs SUSHI itself and then validates, renders, and produces
the QA report. Minutes, and it needs network access for terminology and
package resolution.

The checked-in entry point is the VS Code default build task, which runs:

```powershell
.\_genonce.bat
```

**`_genonce.bat` and `_build.bat` end in `PAUSE` and `_build.bat` opens an
interactive menu.** Both will hang a non-interactive agent shell. For
automation, invoke the publisher directly the same way the script does:

```powershell
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8'
java -jar input-cache\publisher.jar -ig .
```

If `publisher.jar` is not in `input-cache/`, the scripts fall back to
`..\publisher.jar`; use whichever exists. **Neither exists in this clone
yet** — run `.\_updatePublisher.bat` (interactive, so hand it to the user)
to fetch it.

Offline, or when `tx.fhir.org` is unreachable, append `-tx n/a` — that is
exactly what the scripts do when their connectivity probe fails. Expect
terminology-dependent QA messages to change when you do.

`-no-sushi` skips the SUSHI stage (`_build.bat` option 3) when you have
already run Track 1 and only want the render.

The expected baseline is **the publisher completing and writing
`output/qa.html`**, with no new errors relative to `HEAD`. Do not treat the
absolute warning count as the bar — compare against a clean checkout before
calling anything a regression, because template and terminology drift can
move it without any change in this repo.

### Track 3 — reference implementation

The `reference/` workspace is built and verified independently of the IG.
Nothing in the SUSHI or IG Publisher path reads it, and it emits no files
into `input/` except the **managed regions** the renderer owns. All commands
run from the repository root:

```powershell
npm --prefix reference install
npm --prefix reference run typecheck
npm --prefix reference test
npm --prefix reference run render
npm --prefix reference run render:check
```

- `install` — restores the three devDependencies. Required before
  `typecheck` and before `test` can run `pages.test.ts`.
- `typecheck` — `tsc --noEmit`. The ledger's invariants are **compile**
  errors, so this is the primary gate on ledger content. Expected: exit 0,
  no diagnostics.
- `test` — `node --test`, which discovers `reference/**/*.test.ts`
  recursively, skips `node_modules`, and executes them under native type
  stripping. Expected: `fail 0`.
- `render` — projects the ledger into the managed regions in
  `input/pagecontent/*.md`. **It writes to those files.**
- `render:check` — re-renders in memory and exits non-zero if any managed
  region on disk differs. This is the drift gate; run it after any
  `reference/ledger/` change.

`reference/test/cite-local.test.ts` resolves every `spec-local` citation
against local mirrors of the two specifications — to a real **anchor**, not
merely to a file — and **skips** unless both `OPENEHR_SPEC_DIR` and
`FHIR_R5_DIR` are set. Because it skips silently, the bare `npm --prefix
reference test` is **not** the release gate; this is:

```powershell
$env:OPENEHR_SPEC_DIR = 'C:\ai\support\openEHR'
$env:FHIR_R5_DIR = 'C:\ai\support\fhir-r5'
npm --prefix reference test
```

A publication run SHALL use the form above and expect **0 skipped**. The bare
form stays available for contributors without the mirrors.

Citations in the ledger are always **published URLs**; a machine-local path
must never be written into one.

---

## Test

**The IG itself has no unit-test suite, and no test runner. Do not look for
one, and do not add one.** Verification for the guide is:

1. `sushi .` exits `0`.
2. The IG Publisher completes.
3. `output/qa.html` shows no **new** errors or warnings versus `HEAD`.
4. The rendered pages under `output/` say what the change intended, read in
   a browser.

The `reference/` workspace **does** have a test suite, and it is the only
place in this repository that has one. It is scoped to `reference/` and adds
no tooling to the IG: `npm --prefix reference test` runs the Node built-in
test runner with no test-runner dependency. Its job is to substantiate the
guide's fidelity claims — a `lossless` mapping must round-trip, and a `lossy`
mapping must drop exactly what the ledger says it drops.

### Full

Track 2 above, then open `output/qa.html`.

### Scoped

Track 1 above (`sushi .`). This is the smallest meaningful verification and
covers every FSH-only change up to the point of validation.

For a change confined to `reference/`, the scoped verification is
`npm --prefix reference run typecheck` plus `npm --prefix reference test`;
add `npm --prefix reference run render:check` whenever `reference/ledger/`
or `reference/render/` changed.

### Focused

There is no per-artifact or per-page build; SUSHI and the publisher both
operate on the whole IG. The focused equivalent is to inspect the single
generated artifact after Track 1, e.g.
`fsh-generated/resources/StructureDefinition-<id>.json`.

**Prefer the smallest command that covers the change.** A narrative-only
edit to `input/pagecontent/*.md` does not need Track 1 at all — it needs
Track 2 to be seen rendered.

### Known failure modes

- `error Ignoring FSH definition for <url> since it duplicates existing
  pre-defined resource` — the same artifact is defined **both** in
  `input/fsh/` and as JSON in `input/resources/`. Exactly one of the two
  must define it.
- A page listed in `sushi-config.yaml` `pages:` with no matching file in
  `input/pagecontent/` fails the publisher, not SUSHI. Add both together.

---

## Lint / format

There is no linter and no formatter. No `.editorconfig`, no `.prettierrc`,
no format check in the build. **Do not add one, and do not raise review
findings that amount to formatting preferences.**

---

## Run

There is nothing to run — the artifact is a website. After a Track 2 build,
open:

```powershell
Start-Process output\index.html
```

For an edit/refresh loop the publisher can watch the tree:

```powershell
.\_gencontinuous.bat
```

---

## Code style

There is no enforced style configuration; **match the surrounding file**.
That instruction is the rule here, not a fallback.

- **FSH** (`input/fsh/*.fsh`) — two-space indent for rule continuation, `//`
  comments, `^` caret rules for metadata, and `Title`/`Description` on every
  definition. Keep artifact ids `lower-kebab-case`. Because the repository
  has no FSH yet, the **first** files authored set the pattern for the rest
  — be deliberate about naming.
- **Markdown pages** (`input/pagecontent/*.md`) — these render into the
  spec. Conformance verbs (`SHALL`, `SHOULD`, `MAY`, `SHALL NOT`) are
  **normative and uppercase**; never soften, strengthen, or case-fold one
  without it being the point of the change. Cross-page links are to the
  generated `*.html` name, not the `.md` source. Pages start at heading
  level `###` — the template supplies the page title.
- **Managed regions** inside `input/pagecontent/*.md` — content between a
  pair of `mapping ledger` sentinels is **generated from
  `reference/ledger/`**. Do not hand-edit it: edit the ledger, then run
  `npm --prefix reference run render`. The sentinels are the pattern this
  file already uses for its own `## GitHub Integration` block, and this
  section is their **normative definition**. Every tool that reads or
  writes one reproduces both strings byte-for-byte from here and never
  re-derives, paraphrases, or reformats them:

  ```
  <!-- >>> mapping ledger: <region-id> (generated by npm --prefix reference run render) >>> -->
  <!-- <<< mapping ledger: <region-id> (generated by npm --prefix reference run render) <<< -->
  ```

  Hand-written prose **outside** the sentinels is never touched by a
  render. A region id is one of `mapping:<mapping-id>`,
  `summary:<category>`, `summary:all`, `gaps:*`, `review-coverage`,
  `open-items`, `iso8601-subset`, or `example:<fixture-path>`.
- **YAML** (`sushi-config.yaml`) — two-space indent. The decorative
  box-drawing comment banners are SUSHI scaffolding; leave them alone.
- **JSON** (`input/resources/*.json`) — two-space indent.
- Files are UTF-8. The build forces UTF-8 for Java; do not introduce other
  encodings.

### Architectural invariants

These are decisions, not preferences. Violating one is a review Blocker.

- **Neither source standard may be redefined.** A mapping describes openEHR
  and FHIR as they are. If an openEHR type has no faithful FHIR equivalent,
  the correct output is a documented gap, not an invented FHIR construct.
- **Every mapping declares its fidelity.** `lossless`, `lossy`, or
  `unmapped`. A `lossy` mapping SHALL name exactly what is lost. A mapping
  table row with no fidelity is incomplete.
- **Canonical URLs and artifact ids are public API.** Renaming an id or
  moving a canonical breaks every implementer and every inbound link. Treat
  it as a non-compatible change, and record it as such in the change log.
- **Terminology is anchored in THO** (`terminology.hl7.org`) or in openEHR's
  own published terminology, not defined locally. Do not add local
  CodeSystems or ValueSets that duplicate content either publisher already
  maintains.
- **A new page means two edits.** Adding `input/pagecontent/foo.md` requires
  adding `foo.md` to **both** `pages:` and `menu:` in `sushi-config.yaml`.
  A page missing from `pages:` is not rendered at all.
  `reference/test/pages.test.ts` enforces this in both directions.
- **A managed region is generated, and hand-editing one is a Blocker.**
  Content between a `mapping ledger` sentinel pair belongs to
  `reference/ledger/`; edit the ledger and re-render. A hand edit is
  detected by `npm --prefix reference run render:check`, which fails, and
  the edit is destroyed by the next `render`.
- **A region and its renderer land in the same commit.** A page may not
  carry a region no renderer can fill, and the renderer may not produce a
  region no page has a home for. Both are errors in `render-pages.ts`.
- **Every mapping row cites both specifications.** The openEHR RM attribute
  it maps from and the FHIR R5 element it maps to. A row whose side has no
  counterpart cites the *inventory* page of the standard that lacks it, so
  both citations stay real. `build.fhir.org` is never cited — a
  continuous-build snapshot is not a published specification.
- **Generated trees are never hand-edited** — `fsh-generated/`, `output/`,
  `temp/`, `template/`, `input-cache/`. Fix the FSH or the config instead.
- **The HL7 build scripts are upstream files.** `_build.*`, `_genonce.*`,
  `_gencontinuous.*`, `_genclean.bat`, `_updatePublisher.*` come from
  `HL7/ig-publisher-scripts` and are overwritten by `_updatePublisher`.
  Changes belong upstream, not here.

---

## Commit conventions

- **This repository does not use conventional commits.** Do not introduce
  them. It follows the HL7 IG convention: an HL7 Jira ticket followed by a
  description of what changed.

  ```
  FHIR-43920 - Added DV_QUANTITY to Quantity mapping and its fidelity note
  ```

  Tickets live in HL7 Jira (`https://jira.hl7.org/browse/FHIR-#####`), **not**
  in GitHub Issues. Work with no ticket uses a plain imperative subject
  (`Add repository scaffold`, `Build fixes`, `Script updates`).

  *Target convention.* The repository has no commit history yet, so there is
  nothing to sample. Once history exists, re-derive this section from
  `git log --format=%s -50` and correct it if practice diverges.
- Subject in the past or imperative tense, matching neighbours; there is no
  enforced length limit, and subjects may exceed 72 characters when the
  ticket needs it. Clarity wins over brevity.
- **No trailers are required.** `Co-Authored-By` is optional.
- One logical change per commit. A ticket that touches narrative, an
  artifact, and the change log is still one commit.
- **Substantive changes update `input/pagecontent/ig_changelog.md`** in the
  same commit, under the current version heading, using the
  `Non-compatible` / `Compatible, Substantive` / `Compatible,
  Non-Substantive` grouping already established in that file.
- When the GitHub integration below is on **and** the slot carries an
  `Issue` binding, `dev-do` adds an `Issue: #N` trailer to each phase
  commit. The integration is off, so nothing is added.
- Agents **do not push** and **do not open pull requests** unless the user
  explicitly asks.

---

## GitHub Integration

**Off by default, in two independent ways.** A repository whose
`AGENTS.md` has **no** `## GitHub Integration` section is off. A section
whose `Enabled` row says **`no`** is equally off. In either case no skill
prompts about GitHub, and the `dev-*` loop behaves exactly as it did
before this feature existed.

This repository has **no `origin` remote** and tracks work in **HL7 Jira**
rather than GitHub Issues, so the integration is deliberately disabled.
`no` / `n/a` below are **resolved answers**, not gaps — do not re-prompt on
them. If a GitHub remote is added later and the project decides to use
GitHub Issues, re-run `dev-setup` and answer `yes`.

The block below is **machine-managed**. This section is the **normative
definition** of both sentinel strings: every skill that reads or writes
the block reproduces the opener and the closer byte-for-byte from here,
and no skill re-derives, paraphrases, or reformats them.

<!-- >>> dev-* github integration (managed by dev-* skills) >>> -->
| Setting | Value |
|-|-|
| Enabled | no |
| Repository | n/a |
| Label — feature request | n/a |
| Label — bug report | n/a |
| Label — docs-only (additive) | n/a |
| Changelog file | n/a |
| Changelog entry format | n/a |
| PR opens as draft | n/a |
<!-- <<< dev-* github integration (managed by dev-* skills) <<< -->

**These sentinels are not `dev-setup`'s ignore-file sentinels.** The
ignore-file block that `dev-setup` maintains in `.gitignore` or
`.git/info/exclude` is delimited by
`# >>> dev-* skills (managed by dev-setup) >>>` and
`# <<< dev-* skills (managed by dev-setup) <<<`. That is a **different
block in a different file**, with a `#` comment prefix rather than an
HTML comment. Do not conflate the two, and never substitute one pair for
the other.

Rules for the block:

- Only `dev-setup`, `dev-issue`, and `dev-pr-open` may rewrite it, and
  only **in place** — never a second copy, never appended to the end of
  the file.
- Hand-written text outside the sentinels is never touched. Everything a
  human writes in this section survives every rewrite.
- A recorded value of `no`, `none`, or `n/a` is a **resolved answer**, not
  a missing one. It must never re-trigger a prompt on a later run.
- When `Enabled` is `no`, every other row is `n/a`.

> Note: `input/pagecontent/ig_changelog.md` **is** this IG's change log and
> is maintained by hand per [Commit conventions](#commit-conventions). It is
> recorded as `n/a` above only because the automated changelog machinery
> belongs to the disabled GitHub integration.

---

## Scratch / slot convention

Local inner-loop work is organized into **slots** under `scratch/`:

```
scratch/<MMDD>-<##>/
  featurerequest.md    # authored by the dev-request skill
  bugreport.md         # authored by the dev-report skill
  approach-a.md        # authored by dev-approach (minimum change)
  approach-b.md        # authored by dev-approach (cleanest architecture)
  approach-c.md        # authored by dev-approach (unconstrained)
  approach.md          # authored by dev-approach (the judge's selection)
  plan.md              # authored by dev-plan, updated by dev-do
  analysis.md          # authored by dev-review
```

- `<MMDD>` is the local date (zero-padded month + day); `<##>` is a
  zero-padded two-digit slot number.
- `scratch/` is **ignored** (`/scratch/` in `.gitignore`). Nothing in it is
  ever committed.
- Because the slot is ignored, **no plan phase may declare a `scratch/` path
  as an owned path.** `plan.md` is a control file that `dev-do` edits
  continuously and never stages or commits.

---

## Agent guardrails

- Read this file before proposing any build, test, or lint command. **Never
  invent a command.** If something you need is not documented here, say so
  rather than guessing.
- **Never run `_genonce.bat`, `_build.bat`, or `_updatePublisher.bat` from a
  non-interactive shell.** They `PAUSE` and prompt, and they will hang.
  Use the direct `java -jar ... -ig .` invocation in [Build](#build).
- **Never hand-edit generated output** — `fsh-generated/`, `output/`,
  `temp/`, `template/`, `input-cache/`. Change the FSH, the markdown, or
  `sushi-config.yaml`.
- **Never edit the HL7 build scripts** (`_*.bat`, `_*.sh`); they are
  overwritten from `HL7/ig-publisher-scripts`.
- **Do not change `sushi-config.yaml` dependency versions, `fhirVersion`,
  `version`, `releaseLabel`, `status`, `canonical`, or `id`** without being
  asked. These drive publication and are release-manager decisions.
  Changing `id` or `canonical` also requires updating `ig.ini` and
  `README.md` in the same commit.
- Adding a page means updating **both** `pages:` and `menu:` in
  `sushi-config.yaml`.
- **Never assert a mapping without a citation** to the openEHR Reference
  Model specification and the FHIR R5 data type it maps to. An unsourced
  mapping row is a review Blocker.
- Suppressing a QA message means adding it to `input/ignoreWarnings.txt`
  **with a comment saying why** — never silently.
- Substantive changes update `input/pagecontent/ig_changelog.md`.
- Conformance language (`SHALL`/`SHOULD`/`MAY`) is normative. Changing one
  is a substantive spec change, never a copy-edit.
- Subagents must use the same model configuration as the spawning agent.
- Do not add new linting, building, or testing tooling without being asked.
- Prefer the smallest targeted verification that covers the change; escalate
  to the full suite only when the targeted run indicates it is needed.
