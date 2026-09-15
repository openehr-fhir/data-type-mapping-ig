# `converter-site/` — the hosted browser converter

A single static page that runs this guide's **own** converters against an
instance the reader pastes in, and links every field that is not carried across
back to the mapping row that declares the loss.

`AGENTS.md` § *Build* → **Track 4** is authoritative for the commands; this file
explains what the workspace is and why it is shaped this way.

## What it is

- **The same code the guide is generated from.** It imports
  `reference/src/browser/` — the facade — and nothing else from `reference/`,
  so a verdict it shows a reader is the verdict the mapping tables publish, not
  a re-implementation that can disagree with them.
- **Entirely client-side.** There is no backend, no telemetry, and no network
  call after the page loads. Everything pasted into it stays in the reader's
  browser.
- **Honest about what it is.** The footer names the guide version and the source
  commit the bundle was built from, and CI builds that stamp from the commit it
  is deploying, so a stale deployment is visible rather than silent.
- **Hand-rolled.** No framework, no router, no component library. The
  interesting behaviour lives in pure modules — `state.ts`, `view-model.ts`,
  `preselect.ts` — which is what makes it testable under `node --test` with no
  browser test tooling in the repository.

## What it is not

- **Not part of the IG build.** `converter-site/` sits outside `input/`, so
  neither SUSHI nor the IG Publisher walks it.
- **Not a published package.** It is `"private": true` and has no version of its
  own.
- **Not a second source of mapping truth.** It authors no mapping fact, no
  category page, and no anchor id. Every one of those comes from `reference/`.

## Commands

Run from the repository root.

```powershell
npm --prefix converter-site install
npm --prefix converter-site run generate
npm --prefix converter-site run typecheck
npm --prefix converter-site test
npm --prefix converter-site run build
```

`npm --prefix converter-site run preview` rebuilds on change and serves
`dist/` for a local look.

## The generated-module rule

`src/generated/` is **generated and git-ignored**, and hand-editing it is
pointless — the next command destroys the edit. It holds two modules:

- `fixture-catalog.ts` — the published worked examples, read verbatim from
  `reference/fixtures/` as raw text so what a reader edits is byte-for-byte what
  the guide publishes.
- `provenance.ts` — the guide version from `sushi-config.yaml`, the short commit
  from `git rev-parse`, and the guide base URL (the canonical
  `http://hl7.org/fhir/uv/openehr-data-type-mapping/`, overridable at build time
  with `GUIDE_BASE_URL`).

`npm --prefix converter-site run generate` writes both, and it runs
**automatically** before `typecheck`, `test` and `build` through the `pre*`
hooks. `test/fixture-catalog.test.ts` and `test/provenance.test.ts` compare the
result back to its sources, so a stale module fails rather than ships.

`dist/` is likewise generated and git-ignored.

## One-time repository setting

Deployment needs **Settings → Pages → Source: GitHub Actions** selected once by
the repository owner. Until it is, the workflow's `build` job still passes and
only `deploy` fails, so the gap is loud and confined to publication.

`.github/workflows/converter-site.yml` is ordinary CI. It is unrelated to the
`dev-*` GitHub Integration in `AGENTS.md`, which stays `Enabled: no`.
