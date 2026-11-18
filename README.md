# openEHR to FHIR Data Type Mapping

This repository holds the source for the **openEHR to FHIR Data Type Mapping**
HL7 FHIR Implementation Guide.

The guide defines mappings between openEHR data types and HL7 FHIR data types,
so that data captured in an openEHR system can be exchanged as FHIR, and data
received as FHIR can be persisted in an openEHR system, without loss of
meaning.

This repository owns the guide and its committed publication inputs. The
[separate reference implementation (RI)](https://github.com/openehr-fhir/data-type-mapping-ri)
owns the mapping ledger, conversions, fixtures, renderer, and browser
converter. For implementation work, see the
[RI operational documentation](https://github.com/openehr-fhir/data-type-mapping-ri/blob/main/reference/README.md)
and [browser-converter documentation](https://github.com/openehr-fhir/data-type-mapping-ri/blob/main/converter-site/README.md).
Guide publication needs no RI checkout or RI tooling. Future generated-content
changes follow the RI's authoring and compatibility process and arrive here as
separately reviewed guide updates; managed regions are not hand-edited.
The Gaps and Open Items pages are the exception: they carry no managed
region and are edited here directly, as the editor note on the Conventions
page describes.

## About this guide

- code: `openehr-data-type-mapping`
- package id: `hl7.fhir.uv.openehr-data-type-mapping`
- canonical: `http://hl7.org/fhir/uv/openehr-data-type-mapping`
- FHIR version: R5 (5.0.0)
- publisher: HL7 International / FHIR Infrastructure
- license: [CC0-1.0](LICENSE)

The guide depends on the openEHR Base FHIR package, `openehr.base#0.1.0-snapshot`,
which represents the openEHR Reference Model for FHIR tooling. The dependency
is pinned in `sushi-config.yaml` and resolved through the FHIR package
registry; no local `base-spec` checkout is required.

`input/fsh/` defines six draft terminology ConceptMaps: both directions for
null flavours and data-absent-reason, null flavours and v3 NullFlavor, and the
documented H/L/N normal-status subset and ObservationInterpretation. They
reference existing CodeSystems rather than replacing them. These are code
relationships, not executable structural conversions; the v3 maps do not
enable v3 extension handling in the external RI.

Two further draft ConceptMaps, `openehr-model-to-fhir` and
`fhir-to-openehr-model`, show type and field correspondences using versioned
StructureDefinition canonicals as implicit code systems and exact snapshot
element IDs as codes. They preserve directional losses, contextual choices
and unmapped cases; they are not executable transforms. Coverage follows the
available snapshots: Foundation numeric models are absent, and `DV_INTERVAL`
has no bound element IDs. See the [mapping index](input/pagecontent/mapping.md).

**Publisher limitation:** the current R5 validator rejects these
StructureDefinition canonicals where it expects CodeSystems, even though it
can resolve their element codes. The maps compile and render, but those
validation errors remain visible and need resolution before publication.

## Repository layout

| Path | Contents |
|-|-|
| `input/fsh/` | FHIR Shorthand (FSH) source — profiles, extensions, concept maps, examples |
| `input/pagecontent/` | Markdown narrative pages, one per entry in `sushi-config.yaml` `pages:` |
| `input/resources/` | Hand-authored JSON resources that SUSHI copies through verbatim (create it with the first one) |
| `input/images-source/` | PlantUML / SVG diagram sources |
| `input/images/` | Images copied verbatim into the published site — currently the openEHR header logo |
| `input/includes/` | Overrides for HL7 template fragments — currently `fragment-header.html`, which adds the openEHR logo |
| `input/ignoreWarnings.txt` | Publisher QA messages that are reviewed and deliberately suppressed |
| `sushi-config.yaml` | IG metadata, dependencies, `pages`, and `menu` |
| `ig.ini` | Points the IG Publisher at the SUSHI-generated ImplementationGuide |
| `_*.bat` / `_*.sh` | Standard HL7 [ig-publisher-scripts](https://github.com/HL7/ig-publisher-scripts) — maintained upstream, do not hand-edit |

`fsh-generated/`, `output/`, `temp/`, `template/`, and `input-cache/` are build
artifacts. They are gitignored and must never be hand-edited.

## Building

See [INSTALLATION.md](INSTALLATION.md) for the prerequisites.

Fast inner loop — compile the FSH only:

```
sushi .
```

Full build — run the IG Publisher, validate, and render the site:

```
_genonce
```

The rendered guide lands in `output/`; open `output/index.html` to read it and
`output/qa.html` for the QA report.

> `_genonce.bat`, `_build.bat`, and `_updatePublisher.bat` are interactive and
> end in `PAUSE`. For automation, invoke the publisher directly — see
> [AGENTS.md](AGENTS.md).

## Contributing

[AGENTS.md](AGENTS.md) records the conventions, build commands, and
architectural invariants for this repository. Read it before making changes.

FHIR&reg; is the registered trademark of HL7 and is used with the permission of
HL7.
