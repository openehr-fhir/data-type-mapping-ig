# openEHR - FHIR Data Type Mapping Analysis

> **Status:** Working draft - last updated 2026-03-03
> **Sources:** Meeting notes (2025-08 through 2026-02), `current-mapping-doc.md`, openEHR Base IG `support/package` StructureDefinitions and CodeSystems
> **Latest update:** Open questions annotated with transcript-based status notes from all working group sessions

What we are doing:
| Who | What |
|-----|------|
|

---

## Review Tracking
1. [Overview](#overview)
2. [Type System Summary](#type-system-summary)
3. [On Terminology](#on-terminology)
4. [Mapped Types](#mapped-types)
   - [DV_IDENTIFIER ↔ FHIR Identifier](#dv_identifier--fhir-identifier)
       - [x] openEHR - Severin
       - [x] FHIR - Gino
   - [DV_TEXT ↔ FHIR string / markdown](#dv_text--fhir-string--markdown)
       - [x] openEHR - Ciprian
       - [x] FHIR - (previous), Gino
   - [DV_CODED_TEXT ↔ FHIR CodeableConcept / Coding](#dv_coded_text--fhir-codeableconcept--coding)
       - [x] openEHR - Severin
       - [x] FHIR - Gino
   - [TERM_MAPPING ↔ FHIR CodeableConcept.coding / Extensions](#term_mapping--fhir-codeableconceptcoding--extensions)
       - [x] openEHR - Severin
       - [x] FHIR - Gino
   - [DV_QUANTITY ↔ FHIR Quantity](#dv_quantity--fhir-quantity)
       - [x] openEHR - Diego & Ian
       - [x] FHIR - Gino
   - [DV_COUNT ↔ FHIR Count](#dv_count--fhir-count)
       - [x] openEHR - Diego & Ian
       - [x] FHIR - Gino
   - [DV_PROPORTION ↔ FHIR Ratio](#dv_proportion--fhir-ratio)
       - [x] openEHR - Diego & Ian
       - [x] FHIR - Gino
   - [DV_ORDINAL ↔ FHIR Observation.component / valueCoding](#dv_ordinal--fhir-observationcomponent--valuecoding)
       - [x] openEHR - Diego & Ian
       - [x] FHIR - Gino
   - [DV_SCALE ↔ FHIR Observation.component / valueCoding](#dv_scale--fhir-observationcomponent--valuecoding)
       - [x] openEHR - Diego & Ian
       - [x] FHIR - Gino
   - [DV_INTERVAL ↔ FHIR Period / Range / Quantity](#dv_interval--fhir-period--range--quantity)
       - [x] openEHR - Diego & Ian
       - [x] FHIR - Gino
   - [DV_DATE ↔ FHIR date / dateTime](#dv_date--fhir-date--datetime)
       - [x] openEHR - Ciprian
       - [x] FHIR - (previous), Gino
   - [DV_TIME ↔ FHIR time](#dv_time--fhir-time)
       - [x] openEHR - Ciprian
       - [x] FHIR - Gino
   - [DV_DATE_TIME ↔ FHIR dateTime](#dv_date_time--fhir-datetime)
       - [x] openEHR - Ciprian
       - [x] FHIR - Gino
   - [DV_DURATION ↔ FHIR Duration / Timing](#dv_duration--fhir-duration--timing)
       - [x] openEHR - Diego & Ian
       - [x] openEHR - Ciprian
       - [ ] FHIR
   - [DV_MULTIMEDIA ↔ FHIR Attachment](#dv_multimedia--fhir-attachment)
       - [ ] openEHR - Seref
       - [ ] openEHR - Ian 
       - [ ] FHIR
   - [DV_PARSABLE ↔ FHIR string](#dv_parsable--fhir-string)
       - [ ] openEHR - Seref
       - [ ] FHIR
   - [DV_BOOLEAN ↔ FHIR boolean](#dv_boolean--fhir-boolean)
       - [ ] openEHR - Seref
       - [ ] FHIR
   - [DV_URI / DV_EHR_URI ↔ FHIR uri / url](#dv_uri--dv_ehr_uri--fhir-uri--url)
       - [ ] openEHR - Seref
       - [ ] FHIR
   - [DV_STATE ↔ FHIR (not discussed)](#dv_state--fhir-no-direct-equivalent)
       - [x] openEHR - Severin
       - [ ] FHIR
   - [NULL_FLAVOUR ↔ FHIR Data Absent Reason / Null Flavor](#null_flavour--fhir-data-absent-reason--null-flavor)
       - [x] openEHR - Severin
       - [ ] openEHR - Ian
       - [ ] FHIR
   - [LINK ↔ FHIR Reference / CodeableReference](#link--fhir-reference--codeablereference)
       - [x] openEHR - Severin
       - [ ] FHIR
   - [MoneyQuantity / Money ↔ DV_QUANTITY](#moneyquantity--money--dv_quantity)
       - [ ] openEHR - Diego & Ian
       - [ ] FHIR
   - [SimpleQuantity ↔ DV_QUANTITY](#simplequantity--dv_quantity)
       - [x] openEHR - Diego & Ian
       - [ ] FHIR
5. [Gaps: openEHR → FHIR](#gaps-openehr--fhir)
   - [ ] openEHR
   - [ ] FHIR
6. [Gaps: FHIR → openEHR](#gaps-fhir--openehr)
   - [ ] openEHR
   - [ ] FHIR
7. [Cross-Cutting Concerns](#cross-cutting-concerns)
   - [ ] openEHR
   - [ ] FHIR
8. [Open Action Items](#open-action-items)
   - [ ] openEHR
   - [ ] FHIR

---

## Overview

This document provides a comprehensive analysis of data type mappings between the openEHR Reference Model (RM) type system and the HL7 FHIR type system. The analysis is derived from the ongoing working group sessions (August 2025 – March 2026), the current mapping working document, and the openEHR Base IG FHIR package StructureDefinitions.

The openEHR type hierarchy is rooted in `DATA_VALUE` (abstract), from which concrete types such as `DV_TEXT`, `DV_QUANTITY`, and `DV_BOOLEAN` derive. Intermediate abstract types (`DV_ORDERED`, `DV_QUANTIFIED`, `DV_AMOUNT`, `DV_TEMPORAL`, `DV_ENCAPSULATED`) provide shared semantics for ordered, quantified, and temporal data. FHIR uses a flatter type system with primitives (`string`, `boolean`, `date`, `dateTime`), general-purpose complex types (`Quantity`, `Coding`, `CodeableConcept`, `Identifier`, `Attachment`, `Period`, `Range`, `Ratio`), and extensions for additional semantics.

### General Notes

- **Bi-directional mapping**: each mapping aims to support round-tripping where possible, with documented information loss when it is not.
- **Archetype-level vs. data-type-level**: some openEHR properties (e.g., reference ranges, normal status) only have meaningful FHIR equivalents at the resource/profile level (e.g., `Observation.referenceRange`), not at the data type level. These are noted as "archetype mapping" concerns.
- **DV_AMOUNT pattern**: properties inherited from `DV_AMOUNT` (`accuracy`, `magnitude_status`, `normal_range`, `other_reference_ranges`, `normal_status`) follow a common mapping strategy across all derived types.

---

## On Terminology

There are many data types that involve terminology mapping between the openEHR and FHIR ecosystems. Fortunately, there is often an external 'source of truth' that applies equally in both models, even if the representation varies. For example, when using LOINC, SNOMED, UCUM, etc., those codes are generally valid and reasonable in the equivalent context.

As a specific call-out, there is guidance when [Using SNOMED CT with HL7 Standards](https://terminology.hl7.org/en/SNOMEDCT.html), which discusses how to format the `system` when referencing SNOMED to correctly identify the edition and version (e.g., a specific release of the International Edition, etc.).


### Specificity and Uniqueness

When moving data _into_ FHIR, one of the main concerns expressed by the terminology group is around the specificity and uniqueness of codes. The terminology recommendations are centered around ensuring that _if a system is specified_, it preserves the uniqueness of the conceptual meaning assigned by the originating system.

For example, if a single implementation/facility uses a local procedure code `PROC123` and there is not a system specified, a mapping engine:
* can add a system if the scope of the issuer is understood and the system is unique in that context
* should not include a `system` property otherwise.

So if the mapping engine _understands_ the context for `PROC123`, a system can be added (such as `http://example.org/facility/1111-1111-111-11/local-procedure-codes`). The mapping engine needs to ensure:
* the system is unique for the concept within the facility (e.g., if an unrelated concept has the code `PROC123` somewhere else in the mapping, they are not conflated)
* the system is unique for the **meaning** of the local procedure (e.g., if another facility uses `PROC123` for a _different_ procedure or the mappings to a standard system such as LOINC could ever differ, it must be a different system).


### Bindings and Expectations

#### To FHIR

When mapping into FHIR, different elements will have different requirements for:
* cardinality: the number of repetitions allowed/required
* binding targets: the systems and/or specific codes that are allowed/required
* binding strength: expectations for _how_ a binding target is used
    * `required`: a value from the set **must** be present
    * `extensibile`: if any value from the set applies, it **must** be used - other value are valid _if no compatible value exists_.
    * `preferred`: the values in the set are encouraged for interoperability, but not necessary.
* usage context: rules about when a set of binding rules applies; e.g.:
    * set-selection based on values in a different element (when class=`x`, valid status is from `y`)
    * jurisdictions (when in country `x`, valid values are from system `y`)
    * other context rules...

Note that the **element** `cardinality` and `binding` rules have different implications for various FHIR data types. The primary distinction is around whether a datatype allows multiple codes _internally_ or not. When a data type has multiple repetitions internally, the expectation is that requirements are met by one of the codes in the value (note that codes must have equivalent meanings). E.g., if there is a required binding to `http://example.org/cs`:

| DataType |  Strength  | Card. | Notes |
|----------|------------|-------|-------|
| `code`   | `required` | 0..1  | Value from `http://example.org/cs` or not present  |
| `code`   | `required` | 1..1  | **Must** be a value and it **must** be from the defined set |
| `code`   | `required` | [0|1]..* | Zero or more values, all **must** be from the defined set |
| `code`   | `extensible` |  | Should never occur |

| `Coding` | 

#### To openEHR



### Process and Recommendations

#### To FHIR


#### To openEHR



---

## Type System Summary

### openEHR Type Hierarchy (from IG StructureDefinitions)

```
DATA_VALUE (abstract)
├── DV_BOOLEAN
├── DV_IDENTIFIER
├── DV_TEXT
│   └── DV_CODED_TEXT
├── DV_URI
│   └── DV_EHR_URI
├── DV_STATE
├── DV_ORDERED (abstract)
│   ├── DV_INTERVAL<T>
│   ├── DV_ORDINAL
│   ├── DV_SCALE
│   ├── DV_TIME          (note: should derive from DV_TEMPORAL)
│   ├── DV_DATE_TIME     (note: should derive from DV_TEMPORAL)
│   └── DV_QUANTIFIED (abstract)
│       └── DV_AMOUNT (abstract)
│           ├── DV_QUANTITY
│           ├── DV_COUNT
│           ├── DV_PROPORTION
│           ├── DV_DURATION
│           └── DV_ENCAPSULATED (abstract - IG issue: parents DV_AMOUNT)
│               ├── DV_MULTIMEDIA
│               └── DV_PARSABLE
├── DV_TEMPORAL (abstract)
│   └── DV_DATE
└── DV_PARAGRAPH
```

> **IG Notes:**
> - `DV_TIME` and `DV_DATE_TIME` parent directly to `DV_ORDERED` in the IG instead of `DV_TEMPORAL` as specified in the openEHR RM.
> - `DV_ENCAPSULATED` parents to `DV_AMOUNT` in the IG instead of `DATA_VALUE`, which incorrectly pulls in quantity attributes.
> - `DV_DATE` correctly parents to `DV_TEMPORAL` but `DV_TIME`/`DV_DATE_TIME` do not.
> - Several StructureDefinitions have copy-paste description errors (e.g., `TERM_MAPPING` described as "Items which are truly boolean data").
> - Many of these issues are fixed in the source already, the rest are are in a PR awaiting approval.


### Supporting Types

| openEHR Type | Role |
|---|---|
| `CODE_PHRASE` | Terminology reference: `terminology_id` (1..1), `code_string` (1..1), `preferred_term` (0..1) |
| `TERM_MAPPING` | Maps a text/coded value to another terminology: `match` (1..1), `purpose` (0..1), `target` (1..1 CODE_PHRASE) |
| `REFERENCE_RANGE<T>` | Named range: `meaning` (1..1 DV_TEXT), `range` (1..1 DV_INTERVAL\<T\>) |
| `LINK` | Logical relationship: `meaning` (1..1 DV_TEXT), `type` (1..1 DV_TEXT), `target` (1..1 DV_EHR_URI) |

### Key openEHR CodeSystems

| CodeSystem | Codes | Used By |
|---|---|---|
| `null_flavours` | 271 (no information), 253 (unknown), 272 (masked), 273 (not applicable) | Element-level null handling |
| `normal_statuses` | HHH, HH, H, N, L, LL, LLL | `DV_ORDERED.normal_status` |
| `proportion_kind` | pk_ratio, pk_unitary, pk_percent, pk_fraction, pk_integer_fraction | `DV_PROPORTION.type` |
| `term_mapping_purpose` | 669 (public health), 670 (reimbursement), 671 (research study) | `TERM_MAPPING.purpose` |
| `compression_algorithms` | compress, deflate, gzip, zlib, other | `DV_MULTIMEDIA.compression_algorithm` |
| `integrity_check_algorithms` | SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256 | `DV_MULTIMEDIA.integrity_check_algorithm` |
| `character_sets` | UTF-8, UTF-16, US-ASCII, ISO-8859-*, etc. | `DV_TEXT.encoding`, `DV_ENCAPSULATED.charset` |

---

## Mapped Types

---

### DV_IDENTIFIER ↔ FHIR Identifier

#### Field Mapping

| openEHR DV_IDENTIFIER | FHIR Identifier | Direction | Notes |
|---|---|---|---|
| `id` (1..1 string) | `value` (0..1 string) | ↔ | Direct equivalence |
| `issuer` (0..1 string) | `system` (0..1 uri) | ↔ | openEHR→FHIR: use `DV_IDENTIFIER.issuer` as Identifier.system. If the issuer is not a valid URI, set system to http://openehr.org/identifier/ + issuer. FHIR→openEHR: `Identifier.system` → `DV_IDENTIFIER.issuer`. |
| `assigner` (0..1 string) | `assigner` (0..1 Reference) | ↔ |FHIR→openEHR: `Identifier.assigner` → `DV_IDENTIFIER.assigner` using system::value notation (e.g. http://example.org/org::OrgRef123). openEHR→FHIR: `DV_IDENTIFIER.assigner` → `Identifier.assigner.identifier`. If :: notation is provided backtransform it, if not do system = http://openehr.org/identifier/assigner and value = `DV_IDENTIFIER.assigner`.  |
| `type` (0..1 string) | `type` (0..1 CodeableConcept) | ↔ |FHIR→openEHR: `Identifier.type` → `DV_IDENTIFIER.type` using `system::value` notation (e.g. `http://terminology.hl7.org/CodeSystem/v2-0203::MR`). openEHR→FHIR: `DV_IDENTIFIER.type` → `Identifier.type.coding`. If :: notation is provided backtransform it, if not use system = http://openehr.org/identifier/type and code = `DV_IDENTIFIER.type`.|
| _(none)_ | `use` (0..1 code) | → (FHIR only) | Categorization element; handled at the modeling/archetype level in openEHR |
| _(none)_ | `period` (0..1 Period) | → (FHIR only) | Validity period; handled at the modeling/archetype level in openEHR |

#### Key convention
- for mapping FHIR->openEHR assigner, use reference.identifier and if not present use Organization.identifier.
- If there are several types, map the one with userSelected = true, otherwise take the first appearance.
-  Skip normalized URL (http://openehr.org/identifier/*) on FHIR->openEHR. 
-  If in the :: notation a system is provided this should be mapped to the system in FHIR instead of the default placeholder http://openehr.org/identifier/ URL. 

#### Example
FHIR

```json
{
  "type": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code": "MR"
      }
    ]
  },
  "system": "https://www.charite.de/fhir/sid/patientenidentifikation",
  "value": "147725268",
  "assigner": {
    "identifier": {
      "system": "https://www.medizininformatik-initiative.de/fhir/core/CodeSystem/core-location-identifier",
      "value": "Charité"
    },
    "display": "Charité"
  }
},
```

openEHR

```json
"value": {
  "_type": "DV_IDENTIFIER",
  "issuer": "https://www.charite.de/fhir/sid/patientenidentifikation",
  "assigner": "https://www.medizininformatik-initiative.de/fhir/core/CodeSystem/core-location-identifier::Charité",
  "id": "147725268",
  "type": "http://terminology.hl7.org/CodeSystem/v2-0203::MR"
},
```

#### Conceptual Differences

- openEHR typically relies on internal record identifiers with external mapping, FHIR uses multiple inline identifiers with categorization (`use`, `period`). Categorization is typically used by the assigner of an identifier (e.g in FHIR Demographics) to clarify its intended period and use, whilst in an openEHR EHR 'consumer of an external identifier', this is generally not required.

- The `system` vs `issuer` mismatch (URI vs. free-text string) is the primary transformation challenge.

#### Cluster
In normal use in a patient record, as a consumer of an identifer 'use' and 'period' are rarely significant. The major use cases are in handling demographic entities and managing e.g. temporary patient identifiers. Occasionally, where the the EHR is also an assigner/manager of the identifier, it might want to explicitly use the extended Cluster to handle use/period

We provide a CLUSTER if users require the fields of use and period and want support for several types. 

[Draft Extended openEHR Identifier archetype](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJDRlODYxNzUwNjkwMzQ5MThhNmViNTIwNmNlOTRlMDE0)
![CleanShot 2026-03-31 at 14.55.54](https://hackmd.io/_uploads/Hyzsz8to-x.png)

#### FHIR Review Notes

* We describe `http://openehr.org/identifier/`, is that purely a placeholder or is there going to be a definition?
    * Should verify fallback vs. blank value, re: search, typical jurisdiction rules, etc.
    * Clarify when it is used (e.g., if `DV_IDENTITIFER.assigner` is not present)
* Need to document the expected loss of historic/etc. identifiers that occur during round-tripping.
* What are we doing with additional `Coding` values within the `CodeableConcept` for `Identifier.type`?
    * If dropped, that needs to be documented.
* Valid scenario is a FHIR value that has a `system` and no `value` - what is the expected behavior mapping into openEHR?
* [ ] Gino: Should note HTML Escaping requirements during mappings (e.g., values that have characters that need escaping)
    * Need to document escaping of `::` that occurs in URLs - e.g., the terrible idea of `http://[2001:db8::1]:8080/path`, etc.
    * Escaping is not needed - rule is to use the last instance of `::` in the string literal.
    * Document note that `:` is a valid character in both URLs and Codes, people should be defensive.
* Or could change to `urn:openehr:identifier:issuer:{value}` or some such.
* Should note that FHIR values that use extended reference data in `Identifier.assigner` can drop data (e.g., `reference.display`)
* IAN: Is there a FHIR equivalent 'tokenizaton' of a Coding?
    * Gino: there are a couple of syntaxes in different contexts:
        * Search: `[system]|[code]|[version]` - no syntax for `display`
        * Terminology/Operations: ``
* Either note that extended properties of `Coding` get dropped or need to expand the serialization format (e.g., `version`, `userSelected`, etc.)
* [ ] Gino: Check with TSMG / TI for preferences re: http vs urn, will be unresolvable values. Looking for guidance
    * URN vs. URI (prefer URN)
    * Is a placeholder stub - what should this look like in Infrastructure to reduce/avoid validation errors.

---


### DV_TEXT ↔ FHIR string / markdown

#### Field Mapping

| openEHR DV_TEXT | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (1..1 string) | `string` or `markdown` | ↔ | Direct mapping. Target type depends on FHIR element definition. |
| `formatting` (0..1 string) | _(implicit in type)_ | → | Values: `plain`, `plain_no_newlines`, `markdown`. Determines whether FHIR target is `string` or `markdown`. |
| `encoding` (0..1 CODE_PHRASE) | _(dropped)_ | - | FHIR mandates UTF-8. If an openEHR value uses UTF-7 or another encoding, the sender is responsible for converting to UTF-8 prior to mapping. |
| `hyperlink` (0..1 DV_URI) | _(dropped)_ | - | Deprecated in openEHR. If present, can be included in markdown content. |
| `language` (0..1 CODE_PHRASE) | Extension | ↔ | See Language section below. |
| `mappings` (0..* TERM_MAPPING) | Extension / CodeableConcept | ↔ | See TERM_MAPPING section. |

#### Formatting

- If the openEHR `formatting` value is `markdown`, the FHIR target should be a `markdown` element or the contents paired down to a `string` element plus the [rendering-markdown](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-rendering-markdown.html) extension.
- If a FHIR `string` element carries the [rendering-markdown](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-rendering-markdown.html) extension, a new field should be added during mapping to represent the markdown value.
- If the openEHR `formatting` value is `html`, the FHIR target should be either a FHIR `xhtml` element or use the [rendering-xhtml](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-rendering-xhtml.html) extension.
- If a FHIR `string` element carries the [rendering-xhtml](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-rendering-xhtml.html) extension, a new field should be added during mapping to represent the `xhtml` value.
- If no such extension is present, the original `string` value is mapped directly.

#### Language

Relevant FHIR extensions for language representation:

| Type | Name | URL | Use Case |
|---|---|---|---|
| Element | language | [`Resource.language`](https://build.fhir.org/resource-definitions.html#Resource.language) | Resource-level primary language indication |
| Extension | Additional Language | `http://hl7.org/fhir/StructureDefinition/additional-language` | Composition-specific extension to indicate additional languages |
| Extension | Language | `http://hl7.org/fhir/StructureDefinition/language` | Element-level language indication (applies to various data types) |
| Extension | Translation | `http://hl7.org/fhir/StructureDefinition/translation` | Translated value of an element (applies to various data types) |
| Extension | Narrative Language Control | `http://hl7.org/fhir/StructureDefinition/narrativeLanguageControl` | Controls narrative language rendering (applies to Reference and canonical) |

- A cluster archetype for narrative should be introduced in openEHR for the extension slot of `COMPOSITION`, accounting for narrative language control. → **Modeling team**
- Primary language code is stored in `Resource.language` (if present). Additional translation data requires a decision tree.

#### Open Questions

- [x] Introduce a cluster archetype for narrative in openEHR (modeling team). DONE
  > **Transcript notes:** Proposed Aug 2025 based on Diego's suggestion. Diego reported it was an "agenda item for the technical board" (Sep 2025). Listed as remaining to-do (Nov 2025). No completion recorded through Feb 2026. The discourse/technical board discussion outcome is unknown.

[Discourse discussion](https://discourse.openehr.org/t/handling-fhir-narrative-on-import/7074)

Discussion summary

No clear advice could be given on exactly how to map FHIR narrative to openEHR since the best advice will be highly dependent on the exact context, and whether the FHIR narrative is fully generated from structured content (in which case it might be dropped).

- Most archetypes do carry some sort of 'Description element' hat would alow narrative to be imported but that may or may not be  safe target for the FHIR narrative, particularly if it is not derived from structured content.
- There are also 'narrative style; archetypes such as the OBSERVATION.story and EVALUATION.clinical_synopsis archetypes that may be appropriate for full non-derived content.

- The openEHR INSTRUCTION class supports a mandatory narrative attribute, but it's main purpose is to represent a clinically safe, simplified version of the Instruction content, not as a verbatim representation of the full content.

Every archetype node does support an original_content attribute, designed more for medico-legal provencne but might be helpful in some circumstances, paerticularly to handle the xhtml passed in a rendered-xhtml extension, and vice-versa.

In all cases we would need to convert the marked-up narrative to plain text or markdown unless/until XHTML is supported

- [ ] Determine full XHTML formatting support requirements.
  > **Transcript notes:** Identified Aug 2025 - group agreed XHTML should be added as a valid `formatting` value, requiring an openEHR RM change request. Severin noted he "cannot imagine anybody saying no" but the CR needs to go through a vote process. No subsequent transcript confirms the CR was filed or approved.
> IAN: On review I think there may be reasonable pushback on XHTML being handled as DV_TEXT, other than as original _content i.e. not as te primary representation

Where none of the options above are applicable it may be helpful to create a simple FHIR Narrative CLUSTER which would act as a direct import of FHIR Narrative, inlcuding the narrative status. This can be included in the Extension slot available in most archetypes

[Draft FHIR Narrative Cluster archetype](
https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJDM1ZTlmZjQzZjA0YjQ1NGNiYTUyNzVmYzEwMzNjODU3)
![CleanShot 2026-03-31 at 14.55.10](https://hackmd.io/_uploads/BJZwGItjbl.png)


#### FHIR Review Notes

* I *believe* openEHR allows empty strings - need to note that those elements are dropped (FHIR does not allow)
    * openEHR: mandatory fields cannot be empty
    * optional we can just drop if encountered
* I am unclear on the openEHR rules on leading/trailing whitespace - need to ensure there is alignment or documentation during conversion (especially relevant during markdown conversion)
    * [ ] Gino: document that FHIR will trim leading/trailing spaces
* Are there any openEHR strings longer than 1 MB (FHIR string limit)?
> IAN: There could be, as no formal limit is applied, but very, very unlikely. I'd be happy for this this be handled as an exeception, but perhaps openEHR worth considering whwether to apply the same limit?
    * [ ] Gino: Document as exception


---

### DV_CODED_TEXT ↔ FHIR CodeableConcept / Coding

This is the most complex mapping due to the structural differences between how openEHR and FHIR represent coded values.

#### Scenario-Based Mapping

> IAN: Slight change to account for DV_CODED_TEXT.value being mandatory
Severin: resolve over Termserver using the code (if no text and display is provided), its what I did in the dataAbsent table e.g. and in the implementations. I would suggest adding that as a node 

| Scenario | FHIR Shape | openEHR Target |
|---|---|---|
| **Text only** | `CodeableConcept.text` = `"Broken Arm"` | `DV_TEXT` |
| **Coding only** | `CodeableConcept.coding[0]` with system/code/display | `DV_CODED_TEXT` with selected code as `defining_code` and `value` as CodeableConcept.coding['selectedCode'].display or CodeableConcept.coding['selectedCode'].code (if display is empty) as `DV_CODED_TEXT.value` is mandaotry in openEHR|
| **Text + coding(s)** | Both `.text` and `.coding[]` present | `DV_TEXT` (for `.text`) with **all** codings in `TERM_MAPPING` |

#### Coding Only - Detailed Field Mapping

| FHIR CodeableConcept.coding | openEHR DV_CODED_TEXT | Notes |
|---|---|---|
| `coding.system` + `coding.version` | `CODE_PHRASE.terminology_id` | FHIR→openEHR: `coding.system` + `coding.version` → `CODE_PHRASE.terminology_id` combined as `system (version)` (e.g. `http://hl7.org/fhir/encounter-status (5.0.0)`). If `coding.version` is absent, use `coding.system` only. openEHR→FHIR: `CODE_PHRASE.terminology_id` → `coding.system` + `coding.version`. If `terminology_id` contains `(version)`, parse and split into `coding.system` and `coding.version`. If no brackets are present, map entire value to `coding.system`. **Mandatory in DV_CODED_TEXT** - if missing in FHIR, a default must be supplied (see open questions). |
| `coding.code` | `CODE_PHRASE.code_string` | **Mandatory in DV_CODED_TEXT.** No character restrictions in openEHR (including whitespace). Propose adding matching restriction to openEHR. |
| `coding.display` | `CODE_PHRASE.preferred_term` | Display text Also needs to be added .to DV_CODED_TEXT.value when this is the `userSelected` code|
| `coding.userSelected` | `TERM_MAPPING.purpose` = "user selected" | Indicates which coding the user explicitly chose |
| Additional `coding[]` values | `TERM_MAPPING` entries | Each extra coding → one `TERM_MAPPING` |

#### Comments
@ianmcnicoll : lets assume that userSelected and defining_code they align, even though there are some semantic nuances. So if a mapping marked as userSelected use it for the defining_code. 
-> The coding marked as userSelected map it to defining_code and the other way around. If there is a terminology defined in the template, this one is to be selected as defining_code. Otherwise use the userSelected. 

SEC meeting DUBLIN @Diego -> we need to change the way valueSets are used. Analyze ADL2.4. DV_CODED_TEXT + adding adding version to TERM


#### Defining Code Selection

When multiple codings are present in FHIR, the `defining_code` in `DV_CODED_TEXT` is selected by (in priority order):

1. Use what the template defines as DV_CODED_TEXT terminolgy (e.g. prefer SNOMED)
2. The coding marked with `userSelected = true`
3. The first coding in the array

Choices under discussion for conveying `defining_code` semantics in FHIR:

- Use `coding.userSelected`
- Use the [Coding Purpose](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-coding-purpose.html) extension with `#original`
- Request addition of `#defining_code` to the `http://hl7.org/fhir/coding-purpose` CodeSystem

#### Open Questions

- [ ] Has `defining_code` been added to `coding-purpose` - waiting on [HTA-170](https://jira.hl7.org/browse/HTA-170)
  > **Transcript notes:** Brett Esler agreed to file THO ticket to add `#defining_code` to coding-purpose (confirmed Sep–Oct 2025).

IAN: I think we can ask FHIR colleagues to drop this request. It is probably semantically correct to regard user-selected and definig_code as different concepts but in practical use the differences arte going ot be very subtle and unliely ot be consistent across implementations.

~~#### TERM_MAPPING.match
We agree that you only need that for > < ? which is term server nowadays, so we decide to drop this.~~


#### TERM_MAPPING.purpose

- Existing ValueSet: `https://specifications.openehr.org/fhir/valueset-term_mapping_purpose` (codes: public health, reimbursement, research study)
- Current IG binding is `required` - **this is incorrect** and should be relaxed.
- Choices under discussion:
  - Add openEHR purpose values to `http://hl7.org/fhir/coding-purpose`
  - Use values from `https://specifications.openehr.org/fhir/codesystem-term_mapping_purpose` directly

#### Alternate Codes Extension

The FHIR [alternate-codes](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-alternate-codes.html) extension can be used with both `string` and `code` types to convey supplementary terminology mappings.

This was proposed as a solution for mapping from openEHR 'purpose'.

#### Open Questions
  
- [ ] Define the default value strategy when `terminology_id` / `code_string` cannot be determined from FHIR data.
  - Options: use the element path, resource ID, FHIR server base URL, or a generic value.
  > **Transcript notes:** Brainstormed Sep 2025 (element path, resource ID, server base URL, generic "unknown"). Pattern resurfaced Feb 2026 in null flavour context ("default unknown"). No formal decision reached.

Handling missing system / code from FHIR import to openEHR.

1. Where both system and code and absent, it is safe to assume that the display should be mapped as a DV_TEXT.value.

2. If either system or code are absent, we would regard this situation as being inherently unsafe and would require local clinical infomatics advice to resolve.

Options might be

1. Degrade to DV_TEXT
2. Inject some sort of 'default' codesystem where this is known
3. Treat as exceptions and fault.

Categorical advice canot be given as it very much depends on understanding the exact reasons why the source system is providing incomplete coding data.

- [ ] Propose adding character restrictions (whitespace) to openEHR `code_string`.
  > **Transcript notes:** Discussed Sep 2025 - group agreed to propose adding FHIR-like whitespace restrictions (no leading/trailing whitespace). Diego agreed it "makes sense." Listed as proposed but no ticket confirmed filed.
  > 
- [ ] Confirm the approach for `defining_code` semantics in FHIR (THO ticket status).
  > **Transcript notes:** Extensively discussed across five meetings (Sep 2025 – Dec 2025). Brett Esler agreed to file THO ticket to add `#defining_code` to coding-purpose (confirmed Sep–Oct 2025). Ticket was filed but acceptance status unknown. Later discussions (Oct–Dec 2025) show group trending toward pragmatic equivalence: treat `userSelected` as effectively equivalent to `defining_code` in most real-world cases, with `coding-purpose#original` as an alternative.
  > Waiting on [HTA-170](https://jira.hl7.org/browse/HTA-170)
  > 

IAN: See above - we are agreed that userSelected=defining_code though not === :) i.e 'truthy'

- [ ] Resolve `TERM_MAPPING.purpose` binding strength (should be extensible, not required).
  > **Transcript notes:** Ian filed a GitHub ticket to relax openEHR binding strengths from required to extensible (confirmed Nov 2025). Group agreed in principle. FHIR's `Observation.interpretation` is already extensible. The specific `TERM_MAPPING.purpose` change has not been explicitly confirmed as completed.

IAN: Still awaits update due to changes to RM tooling.


#### FHIR Review Notes

* Is there anything special we need to do for post-coordinated codes (e.g., SNOMED)?
IAN: In theory there should be no impediment to embedding a post-coordinated expression as a term 

> From the openEHR Spec:
The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context.

but not sure if these would currently be handled by existingCDRs' or might ven be

* [ ] Document that this exists and people need to understand when/if it is used.

* Note that some CodeSystems include versions *in* their url, e.g., `http://snomed.info/sct/900000000000207008/version/20240101`
    * [ ] Gino: Document the "typical" formats of "system URL + version" in a table - check if correct (openEHR)

---


### TERM_MAPPING ↔ FHIR CodeableConcept.coding / Extensions

#### Structure (openEHR)

| Field | Card | Type | Description |
|---|---|---|---|
| `match` | 1..1 | string | Relationship: `>`, `=`, `<`, `?` |
| `purpose` | 0..1 | DV_CODED_TEXT | Purpose of the mapping (public health, reimbursement, research study) |
| `target` | 1..1 | CODE_PHRASE | The mapped term |

#### Mapping Details

- Each `TERM_MAPPING` entry maps to an additional `coding` in a FHIR `CodeableConcept`.
- The `match` value conveys the degree of equivalence between the terms and should be retrievable from terminology services (e.g., via `ConceptMap`).
- The `purpose` carries the coded reason for the mapping; mapped via the [Coding Purpose](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-coding-purpose.html) extension or the `alternate-codes` extension.

#### FHIR Review Notes

* What level are we assuming for `ConceptMap` resources? Are these specific to instance or archetype?
* What are we doing about a `Coding` that *only* has a `display` value?
* Should note that we will need archetype review to see where there is a `required` binding on the FHIR side and what to do. Recommend that ones for the core specs are provided and guidance around the process for IG authors, jurisdictions, etc.

---

### DV_QUANTITY ↔ FHIR Quantity

#### Field Mapping

| openEHR DV_QUANTITY | FHIR Quantity | Direction | Notes |
|---|---|---|---|
| `magnitude` (1..1 decimal) | `value` (0..1 decimal) | ↔ | Direct equivalence |
| `units` (1..1 string) | `code` (0..1 code) | ↔ | UCUM code |
| `units_system` (0..1 string) | `system` (0..1 uri) | ↔ | If absent on either side, assume UCUM (`http://unitsofmeasure.org`) |
| `units_display_name` (0..1 string) | `unit` (0..1 string) | ↔ | Human-readable unit label (e.g., `°C`) |
| `precision` (0..1 integer) | Extension: [quantity-precision](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-precision.html) | ↔ | openEHR value `-1` (unlimited precision) ≡ absence of the extension in FHIR |
| `magnitude_status` | `comparator` (0..1 code) | ↔ | See comparator mapping below |
| `accuracy` | Extension: [quantity-accuracy](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-accuracy.html) | ↔ | `accuracy_is_percent` must be `false`, or the value must be converted before mapping |
| `normal_status` | `Observation.interpretation` | ↔ (archetype) | Only valid in observation contexts with a normal range present. Binding: `codesystem-normal_statuses` ↔ HL7 v2 interpretation codes. openEHR ticket filed to make binding extensible. |
| `normal_range` (0..1 DV_INTERVAL) | `Observation.referenceRange` (type=`normal`) | ↔ (archetype) | Mapped at the archetype/resource level |
| `other_reference_ranges` (0..* REFERENCE_RANGE) | `Observation.referenceRange` (type≠`normal`) | ↔ (archetype) | `REFERENCE_RANGE.meaning` → `referenceRange.type` |

#### Comparator Mapping

| openEHR `magnitude_status` | FHIR `Quantity.comparator` | Notes |
|---|---|---|
| `<` | `<` | less than |
| `<=` | `<=` | less or equal |
| `>` | `>` | greater than |
| `>=` | `>=` | greater or equal |
| `~` | `~` | approximate - [FHIR-56000](https://jira.hl7.org/browse/FHIR-56000) to add (not applied) |
| _(none)_ | `ad` | Quantity value is component of a sum value and meets use-need. |
| `=` | _(implicit)_ | point value, no comparator needed |

#### DV_AMOUNT Pattern (applies to all DV_AMOUNT subtypes)

The following properties are inherited from `DV_AMOUNT` and follow the same mapping strategy across `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, and `DV_DURATION`:

- `normal_range` → `Observation.referenceRange` with `type` = `normal`
- `other_reference_ranges` → `Observation.referenceRange` with `type` ≠ `normal`
- `normal_status` → `Observation.interpretation`
- `accuracy` → which FHIR extension? (see below)
- `magnitude_status` → `Quantity.comparator` (or equivalent)

General expectation: anything with `normal_range`/`normal_status` in openEHR will map to an `Observation` in FHIR.

#### Open Questions

- [X] Request addition of approximate (`~`) comparator to FHIR `Quantity.comparator` (Gino) - waiting on [FHIR-56000](https://jira.hl7.org/browse/FHIR-56000) (resolved, not applied).
  * Note that we are adding `~` for approximate, with guidance for specifying accuracy range and 'default' assumption of +/- 10%.
  > **Transcript notes:** First identified Oct 2025 - Ian characterized as rare and low priority. Gino committed to asking FHIR internally (Nov 2025). Jan 2026: group agreed to throw errors for unmappable comparators. No resolution reported in later transcripts.
- [x] Clarify meaning of `ad` in `Quantity.comparator` and determine if it represents "approximate" (Gino).
  > **Transcript notes:** Debated Nov 2025 - group suspected `ad` means "approximate" but the wording ("sufficient for total quantity to equal") was considered "terrible." Gino committed to asking in the FHIR private chat. No answer reported back in any subsequent transcript.
  > Note: This code means that a quantity is sufficient as part of a sum to meet an understood need.
- [ ] Confirm `accuracy` usage on the openEHR side - does not appear to be widely used. Which extension would match?
  * [quantity-accuracy](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-accuracy.html): The absolute of the maximum deviation of the actual value from the reported value.
  * [quantity-precision](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-precision.html): Explicit precision of the number.
  * [quantity-confidenceInterval](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-confidenceInterval.html): The range within which, at the given level of confidence, the actual value resides
  > **Transcript notes:** Discussed Oct–Nov 2025. Ian: "I've never used accuracy in my life." The FHIR `quantity-accuracy` extension was identified as a workable mapping target. `accuracy_is_percent` must be false. A FHIR extension for Ratio accuracy may also be needed (Jan 2026). **Mostly resolved** - mapping agreed, but rarely used in practice.
- [ ] Define a standardized DV_AMOUNT mapping pattern document for `normal_range` / `other_reference_ranges` reuse across subtypes.
  > **Transcript notes:** Need recognized Oct 2025. Severin proposed formalizing it Jan 2026: "it may be easier to always point to… if you have this reference range, this is how you do it." Policy agreed (all DV_AMOUNT inherited fields promote to Observation level), but no standalone pattern document has been produced.
- [ ] Determine code system linkages: `codesystem-normal_statuses` ←→ HL7 v2 interpretation codes.
  > **Transcript notes:** Discussed Oct–Nov 2025. Ian: openEHR code system is "based on a much older version of V2" but "maps really cleanly" to FHIR interpretation codes. Agreed: `interpretation` ≈ `normal_status` for H/L/N codes. Ian filed GitHub ticket to relax binding to extensible (Nov 2025). Full ConceptMap not yet written.

#### FHIR Review Notes

* Note that [FHIR-56000](https://jira.hl7.org/browse/FHIR-56000) is resolved, we are adding `~` for approximate, with guidance for specifying accuracy range and 'default' assumption of +/- 10% (see [quantity-confidenceInterval](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-confidenceInterval.html). Will be in R6 and will be available to earlier versions once R6 is published.

* I do not remember if we discussed leading/trailing zeros for numbers in general. Note [quantity-precision](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-precision.html) extension if relevant.
    * [ ] Gino: document that openEHR value may or may not have trailing zeros and may or may not have the precision documented. In both directions, need to check both the value and the precision value and use the most granular option (set explicitly in precision).
* Should note for archetype mapping that some "Quantity" targets in FHIR are actually inherited types with further rules (e.g., `Money`, `Age`, `Distance`, etc.). May require additional unit conversion logic in those cases to meet requirements.
* We say to "assume UCUM" when `units_system` is missing - is the expectation for the mapping process to add the value for FHIR? Invariant `qty-3` says that if the units have a `code`, then it must have a `system`.


---

### DV_COUNT ↔ FHIR Count

#### Field Mapping

| openEHR DV_COUNT | FHIR Count | Direction | Notes |
|---|---|---|---|
| `magnitude` (1..1 decimal) | `value` (0..1 decimal) | ↔ | Direct equivalence |
| `magnitude_status` | `comparator` (0..1 code) | ↔ | Same comparator mapping as DV_QUANTITY |
| `normal_range`, `other_reference_ranges` | `Observation.referenceRange` | ↔ (archetype) | Per DV_AMOUNT pattern |

- Additional DV_AMOUNT properties (ranges, statuses) map at the archetype level.
- Straightforward mapping with no significant open issues.

#### FHIR Review Notes

* Should call out that the FHIR side (`Count` datatype) requires:
    * `system` = `http://unitsofmeasure.org`
    * `code` = `1`
* `FHIR.Count` only allows 32-bit values - is this an issue?

---

### DV_PROPORTION ↔ FHIR Ratio

#### Field Mapping

| openEHR DV_PROPORTION | FHIR Ratio | Direction | Notes |
|---|---|---|---|
| `numerator` (1..1 decimal) | `numerator` (0..1 Quantity) | ↔ | Ratio numerator/denominator are Quantity types in FHIR |
| `denominator` (1..1 decimal) | `denominator` (0..1 Quantity) | ↔ | |
| `type` (1..1 code) | _(no direct equivalent)_ | → | See type handling below |
| `precision` (0..1 integer) | Extension: quantity-precision | ↔ | Applied to numerator/denominator Quantity values |
| Inherited DV_AMOUNT fields | Per DV_AMOUNT pattern | ↔ | |

#### Proportion Type Handling

| `DV_PROPORTION.type` | Mapping Behavior |
|---|---|
| `pk_ratio` | Numerator and denominator map normally |
| `pk_unitary` | Numerator maps normally; denominator is fixed to `1` |
| `pk_percent` | Numerator maps normally; denominator is fixed to `100` |
| `pk_fraction` | Numerator and denominator map normally; waiting on [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001) |
| `pk_integer_fraction` | Numerator and denominator map normally; waiting on [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001) |

#### Additional Notes

- In FHIR, `Ratio` includes units in the numerator and denominator `Quantity` values. `DV_PROPORTION` only carries decimal values - units come from the archetype.
- In openEHR, proportions requiring units are often modeled as two `DV_QUANTITY` values instead.
- A standardized DV_AMOUNT mapping for `normal_range` / `other_reference_ranges` should be defined for reuse.


Examples of  'FHIR Ratio'in openEHR 

**Substance Concentrations**

[Medication details cluster archetype] Strenth presentation element (https://ckm.openehr.org/ckm/archetypes/1013.1.5947)
![CleanShot 2026-03-31 at 15.19.42](https://hackmd.io/_uploads/HkrbK8KsZl.png)

The mapping is 

numerator -> at0153::Strength numerator 
denominator -> at0157::Strength denominator

**Service timings**

[Service timings Cluster]
https://ckm.openehr.org/ckm/archetypes/1013.1.3181

![CleanShot 2026-03-31 at 15.31.42](https://hackmd.io/_uploads/H1gRoIKjWe.png)

numerator-> at0005::Amount
denominator handled by Timing archetypes

**Medication Administration rates**

ISSUE: FHIR Medication Admninstration has rateRatio for Administration rates but I'm not clear what these would be

@GinoCanessa In openEHR we use UCUM to capture e.g. 20mg/day - is that where ratio is used in FHIR?

Found an example - so the answer is yes!

```json
{
  "resourceType": "MedicationAdministration",
  "id": "example",
  "status": "completed",
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
      "code": "197361",
      "display": "Furosemide 10mg/mL"
    }]
  },
  "subject": {
    "reference": "Patient/example"
  },
  "dosage": {
    "rateRatio": {
      "numerator": {
        "value": 20,
        "unit": "mg"
      },
      "denominator": {
        "value": 1,
        "unit": "h"
      }
    }
  }
}

```
openEHR equivlent
```json
{
  "_type": "DV_QUANTITY",
  "magnitude": 20,
  "units": "mg/h"
}

```

#### Open Questions

- [ ] Determine FHIR representation for `pk_fraction` and `pk_integer_fraction` formatting info - may need a new extension (Gino) - waiting on [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001), desire is to use the standard extension [rendered-value](http://hl7.org/fhir/StructureDefinition/rendered-value).

  > **Transcript notes:** Identified Jan 2026 during the primary DV_PROPORTION mapping session. Gino searched FHIR live and found "nothing on Ratio" for format/fraction display. Ian confirmed these are "display directives." Gino concluded: "we might need to… define an extension for that." No subsequent transcript shows resolution. TODO persists in mapping doc.
- [x] Document the archetype-level unit mapping when FHIR Ratio includes units.
  > **Transcript notes:** Discussed Jan 2026 - FHIR Ratio carries units (e.g., 5mg/100ml) but openEHR DV_PROPORTION is unitless. In openEHR, units are modeled as two separate DV_QUANTITY fields at the archetype level (e.g., medication archetypes). Group agreed this requires archetype-specific mapping documentation, not generic data-type-level mapping. Acknowledged but not formally documented.

- [x] Consider adding a new FHIR-type Ratio to openEHR to handle mixed units over numerator/denominator extend existing DV_PROPRTION to handle this

- add optional Numerator units, unit_system, denominator units / unists_system


#### FHIR Review Notes

* Nothing significant

---

### DV_ORDINAL ↔ FHIR Observation.component / valueCoding

#### Field Mapping

| openEHR DV_ORDINAL | FHIR Target | Direction | Notes |
|---|---|---|---|
| `symbol` (1..1 DV_CODED_TEXT) | `Observation.component.valueCodeableConcept` / `valueCoding` / `valueCode` | ↔ | Coded label of the ordinal value |
| `symbol` | `QuestionnaireResponse.item.answer.valueCoding` | ↔ | Alternative context |
| `value` (1..1 integer) | `Observation.component.valueInteger` / `valueQuantity` | ↔ | Numeric score |
| `value` | `Observation.component.valueCoding` with [ItemWeight](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-itemWeight-definitions.html) extension | ↔ | Weight conveyed via extension |
| `value` | `QuestionnaireResponse.item.answer.valueInteger` / `valueQuantity` | ↔ | Alternative context |

- Reference range information (`normal_range`, `other_reference_ranges`, `normal_status`) is mapped at the archetype level, not the data type level.
Possibly adda new PROPTION_KIND - pk_mixedRatio which enforces units
 
- In `QuestionnaireResponse` contexts, the value may need to be resolved via terminology from the coded value (e.g., LOINC answer lists such as `LL386-4`).
- Example: [APGAR score](https://build.fhir.org/observation-example-5minute-apgar-score.json.html)

#### FHIR Review Notes

* Should note that this will require case-by-case archetype mapping (e.g., mapping to strcuture of APGAR scores).

---

### DV_SCALE ↔ FHIR Observation.component / valueCoding

#### Field Mapping

| openEHR DV_SCALE | FHIR Target | Direction | Notes |
|---|---|---|---|
| `symbol` (1..1 DV_CODED_TEXT) | Same targets as DV_ORDINAL `symbol` | ↔ | Coded label |
| `value` (1..1 decimal) | Same targets as DV_ORDINAL `value` | ↔ | Non-integer (decimal) score |

- Identical mapping pattern to `DV_ORDINAL`, except that `DV_SCALE.value` is a `decimal` (non-integer, allowing non-constant distance between values) so cannot map to a `valueInteger`.
- The [ItemWeight](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-itemWeight-definitions.html) extension applies here as well.
- Reference range information is mapped at the archetype level.

#### FHIR Review Notes

* Note for searching for contents in FHIR: values in the `ItemWeight` extension are unlikely to be surfaced. Should be a consideration when looking at specific mappings.

---

### DV_INTERVAL ↔ FHIR Period / Range / Quantity

`DV_INTERVAL<T>` is a generic type parameterized on `DV_ORDERED` subtypes. The FHIR target depends on the type parameter.

#### IG Note

The IG `StructureDefinition-DV-INTERVAL.json` defines no child elements (`lower`, `upper`, `lower_unbounded`, `upper_unbounded`, `lower_included`, `upper_included` are absent), which is an IG gap. The openEHR RM defines all six fields.

#### Type-Based Mapping

| openEHR DV_INTERVAL\<T\> | FHIR Target | Notes |
|---|---|---|
| `DV_INTERVAL<DV_DATE_TIME>` / `DV_INTERVAL<DV_DATE>` | `Period` | FHIR `Period` is **inclusive only**. Exclusive boundaries require FHIRPath-based profiling constraints. |
| `DV_INTERVAL<DV_COUNT>` / `DV_INTERVAL<DV_QUANTITY>` (integer/decimal) | `Range` | FHIR `Range` uses `SimpleQuantity` (inclusive only). Exclusive boundaries require FHIRPath-based profiling constraints. |
| `DV_INTERVAL<DV_QUANTITY>` (with comparators) | `Quantity` | Use `Quantity.comparator` to represent the `included` state. Mapping may span multiple elements. |

#### Boundary Properties

| openEHR Field | FHIR Handling: `Period`/`Range` |
|---|---|
| `lower` / `upper` | Map to respective low/high elements of `Period` or `Range` |
| `lower_unbounded` / `upper_unbounded` | Represented by absence of the corresponding boundary value |
| `lower_included` / `upper_included` | FHIR `Period` and `Range` are inclusive only. If exclusive, a design-time constraint (FHIRPath) is needed. |

- `DV_INTERVAL` should generally map to FHIR elements that use `value[x]` choice types (e.g., `Observation.value[x]`).

#### Open Questions

- [x] Analyze when `*_unbounded` is actually used and what types it maps to.
  > **Transcript notes:** Raised Sep 2025; Ian reviewed CKM archetypes and reported back Oct 2025. **Resolved:** `*_unbounded` is used only in archetypes/design-time constraints, not in instance data. Maps to absence of the corresponding boundary value (`Period.start`/`.end` or `Range.low`/`.high`).
- [x] Determine when `*_included` is used with exclusive boundaries in practice and what types they apply to.
  > **Transcript notes:** Discussed Sep–Oct 2025. Ian's CKM review confirmed exclusive boundaries occur only in design-time constraints (archetype → StructureDefinition), not in instance data. **Decision made (Oct 2025):** Instance data treats all boundaries as inclusive (FHIR default). Design-time uses `Quantity.comparator` or FHIRPath constraints for exclusive boundaries. Real lab tests with exclusive ranges exist but are rare.
- [x] Address the IG gap: `DV_INTERVAL` StructureDefinition lacks `lower`/`upper` and boundary flag elements - IG needs rebuilding.
  > **Transcript notes:** Gap identified and documented. All six RM fields (`lower`, `upper`, `*_unbounded`, `*_included`) are absent from the IG StructureDefinition. Acknowledged as relevant for archetype→StructureDefinition mapping (Oct 2025), but no fix committed or ticket filed for the openEHR IG.

#### FHIR Review Notes

* We detail the mappings to `Period` and `Range`, but list `Quantity` as valid as well. We should add the details for using `Quantity` components/repetitions (multiple values) and comparators (single or multiple).
* Search note for mapping: `Period` and `Quantity` have search semantics, `Range` does not.
* Is a `DV_INTERVAL` with `lower_unbounded = true` and `upper_unbounded = true` valid? Not sure what the representation would be in FHIR to be valid.

---

### DV_DATE ↔ FHIR date / dateTime

#### Field Mapping

| openEHR DV_DATE | FHIR date / dateTime | Direction | Notes |
|---|---|---|---|
| `value` (0..1 dateTime) | `date` / `dateTime` | ↔ | ISO 8601 date. openEHR compact forms must be expanded to extended form (e.g., `20250301` → `2025-03-01`). |

#### Notes

- openEHR and FHIR both use ISO 8601 subsets, but the allowed profiles differ. A detailed comparison is needed.
- `accuracy` and `magnitude_status` (inherited from abstract parents) are **dropped** in the mapping.
    - Note that these values need to be *implicit* in the date conversion. E.g., `20260414` accurate to the month would just be `202604`.
- See also: [DV_TEMPORAL general notes](#dv_temporal-general).

#### FHIR Review Notes

* Note that there are some specific cases where the FHIR Date and Time values are separate. E.g., `Patient.birthDate` has an extension for [BirthTime](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-patient-birthTime.html) - the date is repeated, but expected to be present in the element.

---

### DV_TIME ↔ FHIR time

#### Field Mapping

| openEHR DV_TIME | FHIR time | Direction | Notes |
|---|---|---|---|
| `value` (0..1 string) | `time` | ↔ | ISO 8601 time string. |

#### Key Differences

- **Timezone**: FHIR `time` **cannot** have a timezone; openEHR `DV_TIME` can. When a timezone is present, use the FHIR [timezone](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-timezone.html) extension.
- **Fractional seconds**: FHIR allows up to 9 decimal places; openEHR restricts to 3. Additional precision in FHIR should be ignored when mapping to openEHR.
- openEHR compact forms must be expanded to extended form.
- `accuracy` and `magnitude_status` are **dropped**.

#### Open Questions

- [x] Review whether timezone on `DV_TIME` occurs in practice in existing openEHR data.
  > **Transcript notes:** Discussed Oct 2025 and Jan 2026. Severin: "I've never seen a datetime without a time zone in my eight or nine years of openEHR." FHIR `time` does not natively support timezone, but an extension exists. Jan 2026: group agreed this is low risk - the FHIR timezone extension handles the edge case. **Resolved pragmatically.**

---

### DV_DATE_TIME ↔ FHIR dateTime

#### Field Mapping

| openEHR DV_DATE_TIME | FHIR dateTime | Direction | Notes |
|---|---|---|---|
| `value` (0..1 dateTime) | `dateTime` | ↔ | ISO 8601 date-time. openEHR compact forms must be expanded to extended form. |

#### Key Differences

- Fractional seconds: FHIR up to 9 decimal places, openEHR up to 3.
- `accuracy` and `magnitude_status` are **dropped**.
- ISO 8601 subset comparison between the two systems still needed.

---

### DV_TEMPORAL General

<a id="dv_temporal-general"></a>

Across all DV_TEMPORAL subtypes (`DV_DATE`, `DV_TIME`, `DV_DATE_TIME`):

- openEHR types are complex (with metadata fields); FHIR equivalents are primitives.
- ISO 8601 compact forms (e.g., `20250301T143000`) must be expanded to extended form (e.g., `2025-03-01T14:30:00`) for FHIR compatibility.
- `accuracy` and `magnitude_status` can be dropped for all temporal types.
- Fractional seconds: FHIR allows up to 9 decimals, openEHR restricts to 3. Excess precision should be truncated when mapping FHIR→openEHR.

---

### DV_DURATION ↔ FHIR Duration / Timing

#### Field Mapping

| openEHR DV_DURATION | FHIR Duration | Direction | Notes |
|---|---|---|---|
| `value` (0..1 string, ISO 8601) | `value` + `code` + `system` (UCUM) | ↔ | Requires ISO 8601 ↔ UCUM conversion |

#### ISO 8601 Duration ↔ UCUM Conversion

Based on the [FHIR duration units ValueSet](https://build.fhir.org/valueset-duration-units.html):

| UCUM Unit | ISO 8601 Format | Description |
|---|---|---|
| `ms` | `PT0.001S` | Milliseconds |
| `s` | `PT{n}S` | Seconds |
| `min` | `PT{n}M` | Minutes |
| `h` | `PT{n}H` | Hours |
| `d` | `P{n}D` | Days |
| `wk` | `P{n}W` | Weeks |
| `mo` | `P{n}M` | Months |
| `a` | `P{n}Y` | Years |

> **Caution:** Even within UCUM, date/time conversions are not straightforward. See [UCUM §31](https://ucum.org/ucum#para-31). Sub-millisecond precision may be lost in conversion.

#### openEHR Timing → FHIR Timing

For complex scheduling use cases (dosage, treatment plans), `FHIR.Timing` is handled by a combination of 4 archetypes

- `DAILY_TIMING`
- `NON_DAILY_TIMING`
- `SERVICE_DIRECTION`
- `THERAPEUTIC_DIRECTION`

Example:
![CleanShot 2026-04-14 at 14.03.05](https://hackmd.io/_uploads/r1rmjnshZe.png)

Service direction is used in place of Therapeutic direction for non-medication uses. Initial analysis suggest thatthe new approach to Timing in FHIR R6 is a litte closer to the openEHR approach. 


#### Additional Notes

- All DV_AMOUNT inherited properties (`accuracy`, `magnitude_status`) are **dropped** or handled at the archetype level.
- Archetype-level `normal_range` / `other_reference_ranges` restrictions are unlikely to exist for durations in practice but follow the standard DV_AMOUNT pattern if they do.
- A reference library for ISO 8601 ↔ UCUM conversions is planned (Severin).
- The full timing/dosage mapping is acknowedged as the hardest mapping problem and has been deferred to a dedicated future session on archetype-level mapping, particularly as both openEHR and FHIR are subject to some change.

#### Open Questions

- [ ] Create and publish the ISO 8601 ↔ UCUM duration conversion reference library (Severin).
  > **Transcript notes:** First identified Oct 2025. Ian found an existing third-party converter library (Nov 2025). Severin confirmed he already has a Fire Connect plugin that handles standard conversions (Jan 2026). Severin posted a conversion table into the mapping doc and offered to create a formal document (Feb 2026). Gino: "That would be fantastic." **In progress - conversion table delivered; formal standalone library/document not yet published.**
- [x] Identify the  timing archetypes.
  > **Transcript notes:** **Identified Feb 2026** by Ian: the four openEHR timing archetypes are **daily timing**, **non-daily timing**, **therapeutic direction** and **service direction**. The full timing/dosage mapping is acknowledged as the hardest mapping problem and has been deferred to a dedicated future session on archetype-level mapping.

---

### DV_MULTIMEDIA ↔ FHIR Attachment

DV_MULTIMEDIA is the original openEHR datatype best matching FHIR Attachment, but the [Media File]() CLUSTER archetype which includes a `Content` (DV_MULTIMEDIA) element is a better exact target for FHIR Attachment, with only a couple of gaps than can be filled with an extension archetype such as [CLUSTER.extended_media_details.v0](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJGNlZTVmYjlhZjAyOTQ0YTg5MTIxMTA3OGY0NDNiYzRm)

![CleanShot 2026-04-14 at 15.03.39](https://hackmd.io/_uploads/BkZvYpo3-e.png)


#### Field Mapping

| openEHR Media File archetype | FHIR Attachment | Direction | Notes |
|---|---|---|---|
| `Content/data` (0..1 base64Binary) | `data` (0..1 base64Binary) | ↔ | Direct equivalence |
| `Content/uri` (0..1 DV_URI) | `url` (0..1 url) | ↔ | Direct equivalence |
| `Content/media_type` (1..1 CODE_PHRASE) | `contentType` (0..1 code) | ↔ | IANA MIME type |
| `Content/size` (1..1 integer) | `size` (0..1 integer64) | ↔ | Original size in bytes |
| `Content/language` (inherited) | `language` (0..1 code) | ↔ | Direct equivalence |
| `Content/alternate_text` (1..1 string) | `title` (0..1 string) | ↔ | Display text in lieu of multimedia |
| `Content/compression_algorithm` (0..1 CODE_PHRASE) | _(no equivalent)_ | → | **Gap**: needs new FHIR element or extension |
| `integrity_check` (0..1 base64Binary) | `hash` (0..1 base64Binary) | ↔ | FHIR `hash` only supports SHA-1 |
| `Content/integrity_check_algorithm` (0..1 CODE_PHRASE) | _(no equivalent for non-SHA-1)_ | → | **Gap**: TODO file ticket for `hashAlgorithm` element |
| `Content/thumbnail` (0..1 DV_MULTIMEDIA) | _(none)_ | → | Waiting on [FHIR-56002](https://jira.hl7.org/browse/FHIR-56002) |
| `Content/charset` (inherited) | _(MIME type parameter)_ | → | If the charset applies to attachment data, move it into the MIME type as a `charset` parameter. If it applies to local content, convert to UTF-8. |
| `Created` | `creation` (0..1 dateTime) | ← (FHIR only) | Map to Media File archetype.Created  or drop |
| `CLUSTER.extended_media_details.v0` | `height`, `width`, `frames`, `duration`, `pages` | ← (FHIR only) | Map to archetype or drop |

#### Notes

- DV_AMOUNT inherited fields (`normal_range`, `normal_status`, etc.) are nonsensical for multimedia and are dropped.
- `compression_algorithm` values from openEHR: compress, deflate, gzip, zlib, other.
  - [FHIR-56003](https://jira.hl7.org/browse/FHIR-56003) - request for `content-encoding` extension (triaged)
- `integrity_check_algorithm` values from openEHR: SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256.
  - [FHIR-55422](https://jira.hl7.org/browse/FHIR-55422) resolved to add extension `alternate-hash`. Has not been physically added yet.

#### Open Questions

- [x] File FHIR ticket: add `hashAlgorithm` (0..1 coding, extensible) to `Attachment` (Gino).
  > **Transcript notes:** Gap identified Jan 2026. Gino filed the ticket after the Jan 20 meeting. HL7 agreed to define a **core extension called "alternate hash"** while keeping SHA-1 as the default (Feb 2026). Gino confirmed: "That one I did do core extension for alternate hashings. Done." (Feb 2026). **Completed.**
- [ ] ~~Determine whether `documentreference-thumbnail` extension context can be expanded to support `Attachment` directly.~~ Requested new extension, waiting on [FHIR-56002](https://jira.hl7.org/browse/FHIR-56002)
  > **Transcript notes:** Gap identified Jan 2026. Gino explicitly stated "that one I have not done yet" (Feb 2026). The existing `documentreference-thumbnail` extension only covers DocumentReference; needs context expansion to Attachment.
  > Note: that extension is a flag on `DocumentReference.content` that conveys the content _is_ a thumbnail. Requested a new extension on Attachment.
- [ ] Propose FHIR extension or element for `compression_algorithm` - waiting on [FHIR-56003](https://jira.hl7.org/browse/FHIR-56003).
  > **Transcript notes:** Gap identified Jan 2026 - no FHIR equivalent for compression algorithm. Mapping doc notes "DROP/RECOMMEND" as a possible approach. No ticket filed; no further discussion after Jan 2026.
  > Note: data can be decompressed during conversion and thus remove the requirement for this property. Requested the ticket to get feedback from FHIR-I as well.
- [ ] openEHR - Propose adding `CLUSTER.extended_media_details.v0` elements to published Media File CLUSTER archetype.


---

### DV_PARSABLE ↔ FHIR string

#### Field Mapping

| openEHR DV_PARSABLE | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (1..1 string) | `string` | ↔ | Content of the parsable string |
| `formalism` (1..1 string) | Extension: [mimeType](http://hl7.org/fhir/StructureDefinition/mimeType) | → | Attach to the FHIR string element to convey format |

#### Usage Patterns

| Context | Handling |
|---|---|
| General use | Map to FHIR `string` with `mimeType` extension |
| Markdown content | Map to FHIR `markdown` element if available |
| Genomic data (e.g., HGVS) | Use `CodeableConcept.text` pattern per [Genomics Reporting IG](https://build.fhir.org/ig/HL7/genomics-reporting/) |

#### Notes

- FHIR→openEHR: `string` → `DV_PARSABLE` is unlikely, but if done, the `formalism` should be populated if the format is known.
- `DV_PARSABLE` inherited from `DV_ENCAPSULATED` - status and range fields are nonsensical and dropped.

---

### DV_BOOLEAN ↔ FHIR boolean

#### Field Mapping

| openEHR DV_BOOLEAN | FHIR boolean | Direction | Notes |
|---|---|---|---|
| `value` (1..1 boolean) | `boolean` | ↔ | Direct 1:1 mapping, no transformation needed |

No open questions. This is the simplest mapping.

---

### DV_URI / DV_EHR_URI ↔ FHIR uri / url

#### Field Mapping

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_URI.value` (1..1 uri) | `uri` | ↔ | Direct equivalence (RFC 3986) |
| `DV_EHR_URI.value` | `uri` / `url` | → | `ehr:` scheme URI; may need context-specific handling for FHIR references |

#### Notes

- `DV_EHR_URI` constrains the scheme to `ehr:` and references items within EHRs. In FHIR, these would typically be represented as absolute or relative references depending on context.
- Further detail pending - the DV_EHR_URI section is still under discussion.

---

### DV_STATE ↔ FHIR (no direct equivalent)

#### Structure (openEHR)

| Field | Card | Type | Description |
|---|---|---|---|
| `value` | 1..1 | DV_CODED_TEXT | The state name |
| `is_terminal` | 1..1 | boolean | Whether this is a terminal state |

#### Notes

- FHIR does not have a direct "state machine value" data type.
- `DV_STATE.value` maps as a normal `DV_CODED_TEXT` (→ `CodeableConcept` or `Coding`).
- `DV_STATE.is_terminal` has no FHIR equivalent and would require an extension or be handled at the archetype/resource level.
- Low usage in practice. This type is not yet discussed in the mapping working group sessions.
- Severin: Could be just mapped to CodeableConcept with an openEHR system + the internal statename, would require terminal extension.
> IAN: I have never seen this used at all - I think it may be legacy suprceded by ISM_TRANSITION - suggest ignore

---

### NULL_FLAVOURS

#### DataAbsent Extension 
| openEHR Type                                  | FHIR Type            | Direction | Notes                                                                 |
|-----------------------------------------------|----------------------|-----------|-----------------------------------------------------------------------|
| `defining_code.code_string`     | `extension.valueCode` | ↔        | Translated per code mapping table                                     |
| `defining_code.terminology_id`  | `extension.url`      | ↔         | Fixed to `http://hl7.org/fhir/StructureDefinition/data-absent-reason` |
| `value`                         | extension.valueCode       | →         | Display text; the code its 1..1 in openEHR so if not provided in FHIR should be resolved over the code (using a term server)             |


#### FHIR Observation.dataAbsentReason

`Observation.dataAbsentReason` is a `CodeableConcept` used specifically when `Observation.value[x]` is absent. Unlike the generic extension, it is a first-class field on the Observation resource.

| openEHR Type                        | FHIR Type                                     | Direction | Notes                                                                       |
|-------------------------------------|-----------------------------------------------|-----------|-----------------------------------------------------------------------------|
| `defining_code.code_string`         | `coding.code`    | ↔         | Translated per code mapping table                                           |
| `defining_code.terminology_id`      | `coding.system`  | ↔         | Fixed to `http://terminology.hl7.org/CodeSystem/data-absent-reason`         |
| `value`                             | `text`           | →         | Display text; derivable from the code its 1..1 in openEHR so if not provided in FHIR should be resolved over the code (using a term server)                                      |


#### openEHR NullFlavour → FHIR DataAbsentReason

Only L1 codes are mapped explicitly. L2 codes inherit their parent's mapping.

| openEHR Code | openEHR Name   | FHIR DataAbsentReason Code | Inheriting L2 Codes                                                                                                     | Notes                                                                                      |
|--------------|----------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| 253 (UNK)    | unknown        | `unknown`                  | `asked-unknown`, `temp-unknown`, `not-asked`, `not-a-number`, `negative-infinity`, `positive-infinity`, `not-performed` | Direct match; also used as fallback for `no information` (openEHR → FHIR) due to no exact match |
| 272 (MSK)    | masked         | `masked`                   | `asked-declined`, `not-permitted`                                                                                       | Direct match                                                                               |
| 273 (NA)     | not applicable | `not-applicable`           | `unsupported`                                                                                                           | Direct match                                                                               |
| 271 (NI)     | no information | `as-text`, `error`         | *(default / unrecognized)*                                                                                              | Fallback mapping; no exact FHIR DAR equivalent for `no information`                        |


There is no mapping for no-information when going from openEHR to FHIR, therefore we use unknown as fallback. 

#### Mapping: HL7 iso21090-nullFlavor → openEHR NullFlavour

Only parent codes are mapped explicitly. Child codes inherit their parent's mapping following the HL7 hierarchy.

| HL7 Code | HL7 Name          | Level | → openEHR      | Inheriting Children                                      |
|----------|-------------------|-------|----------------|----------------------------------------------------------|
| NI       | No Information    | 1     | 271 / NI       | —                                                        |
| INV      | Invalid           | 2     | 271 / NI       | DER, OTH, UNC — and OTH's children NINF, PINF           |
| MSK      | Masked            | 2     | 272 / MSK      | —                                                        |
| NA       | Not Applicable    | 2     | 273 / NA       | —                                                        |
| UNK      | Unknown           | 2     | 253 / UNK      | ASKU, NASK, NAVU, QS, TRC — and ASKU's child NAV         |
| NP       | Not Present       | 1     | out of scope   | Retired, message-layer only                              |


---
> Severin: https://terminology.hl7.org/en/CodeSystem-v3-NullFlavor.html how are we processing this again, just map to DAR, but then mapping it back ? 
How is Nullflavour used in FHIR

##### Notes & TODOs

- **ConceptMaps**: Will author formal FHIR ConceptMaps to transform to/from each system.
- **openEHR future support**: openEHR will support both FHIR ValueSets for NULL_FLAVOURS. Back-transformation can be based on which CodeSystem is present — either `dataAbsentReason` or `nullFlavor`. 
> Severin: i would suggest extending it maybe ? not sure this need to be discussed what are the complications ? 



#### Open Questions
- [ ] Resolve the mapping for code 271 ("no information") → DAR, which has no exact match.
  > **Transcript notes:** Identified as the one problematic code (Feb 2026). Tentative idea: map to `unknown` but this is lossy since "no information" and "unknown" would both map the same way. Ian suggested proposing "no information" be added to DAR. No resolution reached.
- [x] Check national-level IGs to confirm they are using DAR (or NullFlavor) - [Zulip discussion](https://chat.fhir.org/#narrow/channel/179280-fhir.2Finfrastructure-wg/topic/Null.20Flavour.20vs.20Data.20Absent.20reason/with/210939015) (Gino) - DAR is current guidance.

---

### LINK ↔ FHIR Reference / CodeableReference

Conceptual differences: in openEHR the LINK can be done on each element, meanwhile in FHIR there are explicit references modelled.
Also there is another thing called PARTY_IDENTIFIED to link stuff outside of the EHR space. Therefore, this is split between CLINICAL and OPERATIONAL.
We have to separate between clinical and non-clinical elements. 

#### CLINICAL
Hereby we use link and reference. 

| openEHR LINK | FHIR Field | Notes |
|---|---|---|
| `meaning` (DV_TEXT) | `Reference.display` / `CodeableReference.concept.text` | Use either `display` / `concept.text`, or the name of the reference if not provided. |
| `type` (DV_TEXT) | `Reference.type` / `CodeableReference.concept` | Type of the referenced resource |
| `target` (DV_EHR_URI) | `Reference.reference`/`CodeableReference.reference`  | URI to the target openEHR composition or sub-element |

This allows for a back-transformation since `meaning` can be resolved to a fixed set of names when a controlled vocabulary is applied.
> Severin: could also be alternatively resolved via `Reference.identifier` -> composition UDI for the target. 
> Severin: DISCUSS — I used meaning so we don't lose anything; if we map it into it, we should maybe tag it somehow, e.g. system::value regex.


#### OPERATIONAL
| openEHR PARTY_IDENTIFIED | FHIR Field | Notes |
|---|---|---|
| `name` (String) | `Reference.display` | Human-readable name; free text fallback when no structured display is available |
| `identifiers` (List\<DV_IDENTIFIER\>) | `Reference.identifier` (Identifier) | Logical identifiers (e.g. NHS number, OID-based IDs) |
| `external_ref` (PARTY_REF) | `Reference.reference` (string) | Literal URL or resource reference to an external party registry |

> Severin: could also be alternatively resolved via `Reference.identifier` → composition UDI for the target.

#### General course of action 
> Severin: the references should be explicitly modeled as part of the archetype main classes like OBSERVATION. Also the references we will use then will need to differentiate between external and internal clinical links. There is also some work Thomas did with views on fields from another class which is a good concept. This should also cover CODEABLECONCEPT then.

#### Notes

- FHIR `Reference` combines the semantics of openEHR `LINK` and `PARTY_IDENTIFIED` - it is only directly usable for participants.
- FHIR `CodeableReference` adds a concept alongside the reference, partially overlapping with `LINK.meaning`.
- openEHR needs to investigate the possibility of merging parts of `LINK` and `PARTY_IDENTIFIED` into a common RM class.

#### Open Questions

- [ ] Investigate merging LINK and PARTY_IDENTIFIED into a common openEHR RM class.
  > **Transcript notes:** Extensively discussed Feb 2026. Strong consensus that LINK and PARTY_IDENTIFIED need convergence. Ian identified `OBJECT_REF` as having the right structure ("that's what we need, and that would be a close mapping to Reference"). Key issues: (1) LINK targets can be sub-elements, which FHIR Reference cannot express; (2) non-demographic references (condition, medication) can't use PARTY_IDENTIFIED; (3) LINK.type is DV_TEXT, not standardized. Recognized as an RM-level change requiring spec board process. No ticket filed yet.
- [x] Define detailed mapping rules for LINK ↔ Reference and LINK ↔ CodeableReference.
  > **Transcript notes:** Discussed Dec 2025 and extensively Feb 2026. Ian proposed a "DV codeable reference" that mirrors FHIR's CodeableReference. Gino noted CodeableReference "caused no end of problems" in FHIR cross-version work. Severin proposed interim guidance: "map references as good as we can to party identified and linked with the notion to log these things." 

---


### MoneyQuantity / Money ↔ DV_QUANTITY

#### Field Mapping

| FHIR Type | FHIR Field | openEHR DV_QUANTITY Field | Notes |
|---|---|---|---|
| `MoneyQuantity` | _(all Quantity fields)_ | _(all DV_QUANTITY fields)_ | Bi-directional mapping with DV_QUANTITY |
| `Money` | `value` | `magnitude` | Direct equivalence |
| `Money` | `currency` | `units` + `units_system` | Currency code maps to `units`, bound to Valueset `http://hl7.org/fhir/ValueSet/currencies` and `units_system` =|`urn:iso:std:iso:4217`

#### Open Questions

~~=  **Transcript notes:** Ian volunteered Dec 2025: "Leave that with me. I've got a whole bunch of little shims to do." Reiterated Jan 2026: "What might be worth doing is creating a little cluster archetype to formalize that, which I'll do." The data type mapping itself is considered resolved (straightforward DV_QUANTITY with ISO currency codes). The cluster archetype has not been confirmed as created.~~

IAN: On review, this will have to be left to Implementation guidance, i.e to use a DV_QUANTITY with 'units_sytem' set to http://hl7.org/fhir/ValueSet/currencies as the Aarchetype Designer tooling does not currently allow that binding to be set, even though it is legal in ADL.

An archetype could be created but does not really add much value. 

- [] openEHR: CR to Better to support constraining the units_system in Archetype Designer
- [] openEHR - Raise PR in SEC abput a new Money datatype

---

### SimpleQuantity ↔ DV_QUANTITY

- `SimpleQuantity` is a FHIR `Quantity` that **cannot** include a `comparator`.
- Maps identically to `DV_QUANTITY` ↔ `Quantity`.
- If a `comparator` / `magnitude_status` exists on the openEHR side for a field that maps to `SimpleQuantity`, this is a **modelling error** on the openEHR side.
- Expectation: this is a mapping error that should not be processed. If it occurs in practice, the mapping will be revisited.

---

## Gaps: openEHR → FHIR

These are openEHR data type features that have no direct equivalent in FHIR and require extensions, alternative modeling, or information loss.

### Data Type Level Gaps

| openEHR Feature | FHIR Gap | Proposed Resolution | Status |
|---|---|---|---|
| `DV_MULTIMEDIA.compression_algorithm` | No element or standard extension on `Attachment` | Define a new FHIR extension for compression algorithm | **Open** - [FHIR-56003](https://jira.hl7.org/browse/FHIR-56003) - triaged |
| `DV_MULTIMEDIA.integrity_check_algorithm` (non-SHA-1) | `Attachment.hash` only supports SHA-1 | File ticket to add `hashAlgorithm` element to `Attachment` | **Open** - [FHIR-55422](https://jira.hl7.org/browse/FHIR-55422) - resolved, not applied |
| `DV_MULTIMEDIA.thumbnail` | No direct `Attachment`-level equivalent | Use `documentreference-thumbnail` extension (needs expanded context) | **Open** - [FHIR-56002](https://jira.hl7.org/browse/FHIR-56002) - triaged |
| `DV_QUANTITY.magnitude_status` = `~` (approximate) | Was missing `~` comparator in FHIR `Quantity` | Add to FHIR | **Open** - [FHIR-56000](https://jira.hl7.org/browse/FHIR-56000) - resolved, not applied |
| `DV_PROPORTION.type` (`pk_fraction`, `pk_integer_fraction`) formatting | No way to convey fraction formatting in FHIR `Ratio` | May need a new FHIR extension | **Open** - [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001) - triaged |
| `DV_TEXT.encoding` (non-UTF-8) | FHIR mandates UTF-8 | Sender must convert to UTF-8 before mapping; information about original encoding is lost | **Decision made** |
| `DV_TEXT.hyperlink` | Deprecated; no FHIR equivalent needed | Include in markdown content if present | **Decision made** |
| `DV_STATE.is_terminal` | No FHIR state machine concept | Requires extension or archetype-level handling | **Not discussed** |
| `DV_IDENTIFIER.issuer` (free-text) | `Identifier.system` requires a URI | Construct a URI or use a placeholder | **Decision made** (with caveats) |
| `DV_PARSABLE.formalism` | No native FHIR formalism indicator | Use `mimeType` extension on FHIR `string` | **Decision made** |
| `TERM_MAPPING.match` | No per-coding relationship indicator in FHIR | Rely on terminology services / ConceptMap; extension proposed | **Decision made** (no per-resource extension) |
| `DV_TIME` timezone | FHIR `time` cannot carry timezone | Use FHIR `timezone` extension | **Decision made** |
| `DV_TEMPORAL.accuracy` | No FHIR equivalent for date/time accuracy | Drop | **Decision made** |
| `DV_DURATION` ISO 8601 format | FHIR Duration uses UCUM | Convert ISO 8601 ↔ UCUM; reference library planned | **In progress** - conversion table delivered (Feb 2026); standalone library pending |
| `DV_INTERVAL.lower_included` / `upper_included` (exclusive) | FHIR `Period` and `Range` are inclusive only | Use FHIRPath constraints at design time | **Decision made** (Oct 2025) - only in design-time, not instance data |
| `DV_EHR_URI` (`ehr:` scheme) | Not a standard FHIR URI scheme | Context-dependent transformation | **Under discussion** |
| `DV_PARAGRAPH` | Composite text type | Map to `markdown` or `string` | **Not discussed** |
| `DV_GENERAL_TIME_SPECIFICATION` / `DV_PERIODIC_TIME_SPECIFICATION` | Complex scheduling types | Likely map to FHIR `Timing` | **Not discussed** |

### Archetype/Resource Level Gaps

| openEHR Feature | FHIR Handling | Notes |
|---|---|---|
| `DV_ORDERED.normal_range` | `Observation.referenceRange` | Only applicable in Observation context |
| `DV_ORDERED.other_reference_ranges` | `Observation.referenceRange` | Only applicable in Observation context |
| `DV_ORDERED.normal_status` | `Observation.interpretation` | Only applicable in Observation context; binding differences |
| `DV_QUANTITY.accuracy` | Extension: `quantity-accuracy` | Rarely used; `accuracy_is_percent` must be false |
| `DV_IDENTIFIER` full FHIR fidelity | Cluster archetype needed | To represent `use`, `period` |
| Narrative language control | Cluster archetype needed | For Composition extension slot |

---

## Gaps: FHIR → openEHR

These are FHIR data type features that have no direct equivalent in openEHR and may result in information loss during mapping.

### Data Type Level Gaps

| FHIR Feature | openEHR Gap | Proposed Resolution | Status |
|---|---|---|---|
| `Identifier.use` (code) | No categorization field in `DV_IDENTIFIER` | Handle at modeling/archetype level; or use proposed cluster archetype | **Open** (modeling team) |
| `Identifier.period` (Period) | No validity period in `DV_IDENTIFIER` | Handle at modeling/archetype level; or use proposed cluster archetype | **Open** (modeling team) |
| `Attachment.creation` (dateTime) | No creation date in `DV_MULTIMEDIA` | Map to archetype or drop | **Decision: archetype or drop** IAN: Maps to CLUSTER Mediafile.v1.Created|
| `Attachment.height`, `width`, `frames`, `duration`, `pages` | No dimension fields in `DV_MULTIMEDIA` | Map to archetype or drop | **Decision: archetype or drop** IAN: Can be handled by a new cluster to slot into CLUSTER.mediafile.Additional details |
| `CodeableConcept` with multiple codings | `DV_CODED_TEXT` has a single `defining_code` | Additional codings → `TERM_MAPPING`; all codings used via TERM_MAPPING if text also present | **Decision made** |
| `CodeableConcept.coding.system` (URI) | `CODE_PHRASE.terminology_id` (string identifier) | URI must be mapped/transformed to terminology_id format | **In progress** |
| `Observation.interpretation` extensible binding | `DV_ORDERED.normal_status` restricted binding | openEHR ticket filed to make binding extensible | **In progress** - Ian filed GitHub ticket (Nov 2025); principle agreed |
| FHIR `time` fractional seconds (up to 9 digits) | openEHR restricts to 3 fractional digits | Truncate excess precision | **Decision made** |
| FHIR `Ratio` with units on numerator/denominator | `DV_PROPORTION` has no unit fields | Units handled at archetype level; or use two `DV_QUANTITY` values | **Decision made** |
| FHIR `Timing` (complex scheduling) | No single openEHR data type | Map to `DV_DURATION` + archetype (DAILY_TIMING, NON_DAILY_TIMING) | **Partial** - third archetype identified as SERVICE_DIRECTION (Feb 2026); full mapping deferred |
| `rendering-markdown` extension on `string` | `DV_TEXT.formatting` does not expect extensions | Add a new field during mapping for the markdown value | **Decision made** |
| FHIR `CodeableReference` | No combined concept+reference type | Split into LINK + coded value at archetype level , though the 'reference' in openEHR is often handled by an included CLUSTER archetype e.g. `anatomical location`, alongside a coded BodySite element | **Under discussion** |
| `Reference` combining identity + link | openEHR separates LINK from PARTY_IDENTIFIED | Under investigation for RM unification | **Open** - extensive discussion Feb 2026; OBJECT_REF identified as right structure; RM change needed |

### Terminology/ValueSet Gaps

| FHIR Terminology Feature | openEHR Gap | Notes |
|---|---|---|
| `coding-purpose` CodeSystem | Limited `term_mapping_purpose` ValueSet | Propose adding openEHR purpose codes to FHIR coding-purpose, or use openEHR codes directly |
| `data-absent-reason` breadth | 4-code `null_flavours` CodeSystem | openEHR will support both FHIR ValueSets; ConceptMaps needed |
| Extensible `Observation.interpretation` binding | Required `normal_statuses` binding | Ticket filed to make openEHR binding extensible |

### General Questions

* How are we handling "no value + extensions" from FHIR? How about "value + extensions"?
    * [ ] Gino: Document general case of Cross-Version extensions:
        * When no value + extension, just use the value from the extension
        * In the case of coded values, use TERM_MAPPING to add the multiple values.

* What are expectations around different validation rules when mapping? E.g., if a DV_INTERVAL has a `higher` less than a `lower`, should that: (note that I think any are fine - it would be nice to set expectations)
    * Error on the openEHR side before mapping?
    * Error during mapping?
    * [ ] Gino: Create the FHIR instance that is invalid? - Pick this: document that validation is out-of-scope entirely and data will be mapped, people should validate before starting if possible.

---

## Cross-Cutting Concerns

### Terminology URI ↔ openEHR Terminology ID

FHIR uses full URIs for terminology systems (e.g., `http://snomed.info/sct`), while openEHR uses shorter identifier strings in `CODE_PHRASE.terminology_id`. A standardized namespace mapping is required. The format for combining `system` + `version` into a single `terminology_id` is still under discussion:

- **Option A (pipe):** `http://hl7.org/fhir/encounter-status|5.0.0`
- **Option B (parenthetical):** `http://hl7.org/fhir/encounter-status(5.0.0)`

IAN: Pipe is used (though variably) to represent the text rubric of a term  - does not apply here but is there an argumment for using the # as is done by FHIr IG for package versions?

- **Option C (hash) # **
`http://hl7.org/fhir/encounter-status#5.0.0`

### Character Encoding

- FHIR mandates UTF-8 throughout.
- openEHR allows multiple character sets (via `character_sets` CodeSystem: UTF-8, UTF-16, US-ASCII, various ISO-8859 variants, etc.).
- All non-UTF-8 content must be converted to UTF-8 before mapping to FHIR.
- Recommendation: if data uses UTF-7, the sender is responsible for conversion.

### ISO 8601 ↔ FHIR Temporal Subset

- openEHR uses full ISO 8601 including compact forms.
- FHIR uses a restricted ISO 8601 profile (extended form only, specific precision levels).
- Compact forms must be expanded before mapping.
- A detailed comparison of allowed patterns is still needed.

### DV_AMOUNT Standardized Mapping Pattern

All types deriving from `DV_AMOUNT` share the following properties, which should follow a single documented mapping pattern:

| Property | FHIR Equivalent | Context |
|---|---|---|
| `normal_range` | `Observation.referenceRange` (type=normal) | Observation resources only |
| `other_reference_ranges` | `Observation.referenceRange` (type≠normal) | Observation resources only |
| `normal_status` | `Observation.interpretation` | Observation resources only |
| `accuracy` | Extension (type-specific) | Rarely used |
| `magnitude_status` | `Quantity.comparator` or equivalent | Per-type handling |

This pattern applies to: `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, `DV_DURATION`.

---

## Open Action Items

### FHIR-Side Actions

| Item | Owner | Priority | Status |
|---|---|---|---|
| Add `defining_code` to `coding-purpose` ValueSet (THO ticket) | Brett Esler | High | open - [HTA-170](https://jira.hl7.org/browse/HTA-170) - submitted; group trending toward pragmatic `userSelected` equivalence |
| Add `~` (approximate) to `Quantity.comparator` | Gino | Medium | Open - [FHIR-56000](https://jira.hl7.org/browse/FHIR-56000) - resolved, not applied |
| Propose extension for `hash_algorithm` on `Attachment` | Gino | Medium | Open - [FHIR-55422](https://jira.hl7.org/browse/FHIR-55422) - resolved, change required |
| Propose extension for `compression_algorithm` on `Attachment` | Gino | Low | Open - [FHIR-56003](https://jira.hl7.org/browse/FHIR-56003) - triaged |
| Determine FHIR representation for `pk_fraction` / `pk_integer_fraction` formatting | Gino | Medium | Open - [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001) - triaged |
| Determine FHIR representation for `thumbnail` | Gino | Medium | Open - [FHIR-56002](https://jira.hl7.org/browse/FHIR-56002) - triaged |

### openEHR-Side Actions

| Item | Owner | Priority | Status |
|---|---|---|---|
| Make `normal_status` binding extensible | openEHR | High | In progress - Ian filed GitHub ticket (Nov 2025); principle agreed |
| Investigate merging LINK + PARTY_IDENTIFIED into common RM class | openEHR | Medium | Open - strong consensus on need (Feb 2026); OBJECT_REF identified as right structure; RM change needed |
| Build `DV_IDENTIFIER` cluster archetype for full FHIR Identifier mapping | Modeling team | Medium | Done - needs to be uploaded for review |
| Introduce narrative cluster archetype for Composition extension slot | Modeling team | Medium | Done - needs to be uploaded for review|
| Create MoneyQuantity cluster archetype for validation | Ian | Low | Will not do - Implementation Guidance more appropriate - to be created|
| Add character restrictions (whitespace) to `code_string` | openEHR | Low | Proposed (Sep 2025) - group agreed to propose; no ticket confirmed |
| Relax `TERM_MAPPING.purpose` binding from required to extensible | openEHR IG | Medium | In progress - Ian filed ticket for binding relaxation (Nov 2025); specific TERM_MAPPING change not confirmed |
| Support both FHIR ValueSets (DAR + NullFlavor) for NULL_FLAVOUR | openEHR | Medium | Planned - agreed Feb 2026; ConceptMaps not yet created |

### Documentation & Tooling

| Item | Owner | Priority | Status |
|---|---|---|---|
| Create ISO 8601 ↔ UCUM duration conversion reference library | Severin | Medium | In progress - conversion table posted in mapping doc (Feb 2026); Fire Connect plugin exists; standalone library not yet published |
| Write ConceptMaps for NULL_FLAVOUR ↔ DAR and NULL_FLAVOUR ↔ NullFlavor | Group | Medium | Open - agreed as needed (Feb 2026); "pretty easy" per Gino; not yet created |
| Define standardized DV_AMOUNT mapping pattern document | Group | High | Open - policy agreed (Jan 2026: promote to Observation level); standalone document not yet produced |
| Determine `system`+`version` → `terminology_id` format (pipe vs. parenthetical) | Group | High | Open - trade-offs discussed (Sep 2025); pipe favored by Diego; decision deferred |
| Define default value strategy for missing mandatory `terminology_id` / `code_string` | Group | High | Open - options brainstormed (Sep 2025, Feb 2026); no formal decision |
| Detailed ISO 8601 subset comparison (openEHR vs. FHIR) | Group | Medium | Open - acknowledged as ~90% aligned (Jan 2026); formal comparison not yet done |

### Not Yet Discussed

The following topics have been identified but not yet covered in working group sessions:

| Topic | Notes |
|---|---|
| EVENT | Two approaches: point event + terminology (e.g., 24h BP) or map DV_INTERVAL from codings |
| TIMING | Complex scheduling - intersects with DV_DURATION → FHIR Timing. Third and Fourtharchetype identified as SERVICE_DIRECTION (Feb 2026)and THERAPEUTIC_DIRECTION full mapping deferred to dedicated session |
| MEDIAFILE | CLUSTER archetype which wraps DV_MULTIMEDIA and adds a number of fields which more closely aligns to FHIR.Attachment - needs to be reviewed. |
| ENCOUNTER | Add fields to COMPOSITION for unique encounter addressing; add Encounter archetype |
| DV_PARAGRAPH | Composite text type; likely maps to `markdown` or narrative - unlikely to be used or in-use |
| DV_GENERAL_TIME_SPECIFICATION | Complex scheduling type - unlikely to be used or in-use |
| DV_PERIODIC_TIME_SPECIFICATION | Periodic scheduling type unlikely to be used or in-use|
| DV_ENCAPSULATED (abstract) | IG hierarchy issue - parents to DV_AMOUNT instead of DATA_VALUE |

