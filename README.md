# openEHR to FHIR Data Type Mapping

This repository holds the source for the **openEHR to FHIR Data Type Mapping**
HL7 FHIR Implementation Guide.

The guide defines mappings between openEHR data types and HL7 FHIR data types,
so that data captured in an openEHR system can be exchanged as FHIR, and data
received as FHIR can be persisted in an openEHR system, without loss of
meaning.

## About this guide

- code: `openehr-data-type-mapping`
- package id: `hl7.fhir.uv.openehr-data-type-mapping`
- canonical: `http://hl7.org/fhir/uv/openehr-data-type-mapping`
- FHIR version: R5 (5.0.0)
- publisher: HL7 International / FHIR Infrastructure
- license: [CC0-1.0](LICENSE)

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
