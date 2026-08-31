# openEHR and FHIR Data Type Mapping

## Table Of Contents

* Introduction
* Scope and Limitations
* The Type Systems
* Conversions and Considerations
    * Boolean Data
    * Numeric Primitives
    * Resource-Locator Data and References
    * Textual Data
    * Coded Data
    * Quantities
    * Temporal Data
    * Other Data (e.g, binary, etc.)

## Introduction

This document provides a comprehensive analysis of data type mappings between the openEHR Reference Model (RM) type system and the HL7 FHIR type system. The analysis is derived from the ongoing working group sessions (August 2025 – April 2026), the current mapping working document, and the openEHR Base IG FHIR package StructureDefinitions.

## Scope and Limitations

The intention is to provide guidance and detailed mapping to enable round-tripping of content between formats to the extent possible. Areas where there are additional expectations or limitations are documented.

Of particular note is that there are cases where the data elements themselves do not contain enough context or information to correctly map data. For example, if information related to *where* the data is found in an openEHR archetype or a FHIR resource or profile is needed. More details can be found in the discussion of [The Type Systems](#the-type-systems) and in specific conversion sections where applicable.


## The Type Systems

### Overview of the openEHR Type System

The openEHR type system is split across two specifications: the [Foundation Types](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html) specification (in the BASE component) defines the low-level primitive, structure, interval, time, and terminology types; the [Data Types Information Model](https://specifications.openehr.org/releases/RM/latest/data_types.html) (in the Reference Model) defines the clinical/scientific `DV_` data-value hierarchy that is built on top of them.

* The Foundation Types specification defines the **primitive types** (e.g., `Boolean`, `String`, `Integer`, etc.), the **structure types** (`List<T>`, `Set<T>`, etc.), the **`Interval<T>` family**, and the **ISO 8601 time types** (`Iso8601_date`, `Iso8601_time`, etc.). These are not themselves data values - they are the building blocks used to define the attributes of the `DV_` classes, and in some cases (the time types) they are direct ancestors of the corresponding `DV_` types.
* The root of the data-value hierarchy is an abstract class called `DATA_VALUE`. It defines no attributes of its own; it serves as the common ancestor for every type that can be carried in an `ELEMENT.value` slot in an archetype structure.
* All data-value classes are named with the `DV_` prefix (e.g., `DV_BOOLEAN`, `DV_TEXT`, `DV_QUANTITY`), with class names rendered in upper-case-with-underscores and attributes in lower\_snake\_case. Every concrete `DV_` class inherits, directly or transitively, from `DATA_VALUE`.

Beneath `DATA_VALUE`, several **abstract intermediate types** establish shared semantics that are inherited by groups of concrete types such as `DV_ORDERED`, `DV_TEMPORAL`, etc..  Details on the types can be found in the relevant mapping sections.

openEHR does not draw a structural distinction between categories of data types - every `DV_` value is a class with one or more attributes, and even a value that semantically wraps a single primitive (e.g., `DV_BOOLEAN`, `DV_URI`) inherits whatever structure its abstract ancestors define. As a result, types lower in the hierarchy can carry a substantial amount of inherited structure: a `DV_QUANTITY`, for example, brings together a magnitude, units, precision, accuracy, magnitude status, normal range, other reference ranges, and normal status. Generic types (e.g., `DV_INTERVAL<T : DV_ORDERED>`) are parameterized by an ordered data-value type.

In addition to the `DV_` hierarchy, the RM defines a small number of **supporting types** that are not themselves data values but are referenced by them:
* `CODE_PHRASE` - a `terminology_id` + `code_string` pair (with an optional `preferred_term`) used to anchor coded data.
* `TERM_MAPPING` - a mapping from a text/coded term to an equivalent, broader, or narrower term in another terminology.
* `REFERENCE_RANGE<T>` - a named range with a `meaning` (`DV_TEXT`) and a `range` (`DV_INTERVAL<T>`).
* `LINK` (defined in the Common IM) - a logical relationship between archetype nodes.

For context, openEHR layers higher-level structures on top of the data types: **Reference Model classes** such as `ELEMENT`, `CLUSTER`, `OBSERVATION`, and `COMPOSITION` carry data values in their `value` slots, and **archetypes** (and operational templates) constrain those structures for specific clinical or jurisdictional use cases. Archetypes therefore play a role broadly comparable to FHIR profiles - they are where most domain-specific constraints (permitted units, value sets, reference ranges, cardinalities) are expressed, rather than at the data-type level itself.


### Overview of the FHIR Type System

The FHIR type system is defined on the [Datatypes page](https://hl7.org/fhir/datatypes.html) of the core specification.

* The root of the FHIR type system is a type called `Base`. It is an abstract type that does not define any characteristics.
* Inheriting from `Base` is the `Element` data type. It defines the `id` and `extension` properties that are common across every data element in FHIR (save a few special elements that *prohibit* the use of `id` and `extension`).
* Inheriting from `Element` is the `DataType` abstract type. It serves as an entry-point to distinguish data types from 'elements' in the specification.

The actual data types fall into two main categories of types that derive from `DataType`:
* **Primitive types**
    * Inherit from `PrimitiveType` (which inherits from `DataType`).
    * Defined as `StructureDefinition` resources with `kind` = `primitive-type`.
    * Carry a single value and cannot have child elements (e.g., `boolean`, `integer`, `string`, `dateTime`).
    * Are camelCased (start with a lower-case letter).
    * In JSON, primitives are represented as Values - so if `id` and/or `extension` elements exist, they appear in implicitly-defined properties alongside the value (e.g., `"valueDateTime"` and `"_valueDateTime" : { "id" : ... }`).
* **Complex types**
    * Inherit from `DataType` directly.
    * Defined as `StructureDefinition` resources with `kind` = `complex-type`.
    * Have child elements (e.g., `Coding`, `CodeableConcept`, `Quantity`, `Period`, `Identifier`, `Reference`).
    * Are PascalCased (start with an upper-case letter).
    * Sub-elements can be primitive types or complex types.
    * In JSON, complex types are represented as Objects - so if `id` and/or `extension` elements exist, they appear as properties in the object value (e.g., `"valueCoding" : { "id" : ...}`).

For context, FHIR defines **Resources** as models composed of elements (each of which is a primitive or complex type).  For more information, see the [FHIR Overview - Developers](https://hl7.org/fhir/overview-dev.html) or the [Resource Type Index](https://hl7.org/fhir/resourcelist.html).

Note that resources are often  constrained by **Profiles** that are more specific to a use-case or jurisdiction.


### Conceptual Differences when Representing Data

Some points to highlight:
* The same term: **primitive** is used by both specifications but have different meaning.
    * The FHIR "primitive" `string` is a singular textual value, with optional `id` and `extension` elements.
    * The openEHR "primitive" `DV_TEXT` is a class that has many properties beyond `value` (e.g., `formatting`, `encoding`, etc.).
* Due differences in the type systems, properties and types do not always map cleanly. E.g.,:
    * Looking at the openEHR `DV_TEXT`:
        * The openEHR type `DV_TEXT` property `.formatting` contains information regarding what type of content the string has (e.g., `markdown`)
        * FHIR has a `markdown` type that may be used.
        * Some FHIR elements are typed `string` and are described to contain Markdown data (e.g., elements that were standardized before the `markdown` type existed).
    * Looking at the openEHR common properties like `normal_range`, `reference_range`, etc.:
        * The FHIR equivalents are only meaningful at the resource/profile level (e.g., element `Observation.referenceRange`).


## Conversions and Considerations

The sub-sections that follow group the openEHR `DV_` data-value classes (and their supporting types) and FHIR primitive and complex types according to data categories. Each sub-section opens with the broad concerns that apply across the group, lists the type mappings in scope, and then drills into per-type details (field mappings, conversions, and known information loss).

The examples use compact JSON fragments unless the mapping only makes sense in a FHIR resource context. They are intended to show the value shape, extension placement, and known edge cases rather than define complete exchange payloads.

### Boolean Data

#### Overview

Boolean is the simplest mapping: openEHR's `DV_BOOLEAN` and FHIR's `boolean` primitive each carry a single true/false value, with no precision, accuracy, or auxiliary metadata to negotiate.

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_BOOLEAN` | `boolean` | ↔ | Direct 1:1 mapping, no transformation |

#### DV_BOOLEAN ↔ FHIR boolean

| openEHR DV_BOOLEAN | FHIR boolean | Direction | Notes |
|---|---|---|---|
| `value` (1..1 boolean) | `boolean` | ↔ | Direct 1:1 mapping, no transformation |

**Additional Notes**

In FHIR, a missing element is **not** equivalent to `false`. A `null` value in an openEHR `DV_BOOLEAN` should be omitted from the FHIR output (or carry a Data Absent Reason if absence itself is meaningful).

**Example - openEHR JSON**

```json
{
  "_type": "DV_BOOLEAN",
  "value": false
}
```

**Example - FHIR JSON**

```json
{
  "valueBoolean": false
}
```

If the openEHR value is absent but the absence itself must be represented, the FHIR value is omitted and the primitive element carries a Data Absent Reason extension instead.

**Example - FHIR JSON**

```json
{
  "_valueBoolean": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
        "valueCode": "unknown"
      }
    ]
  }
}
```


### Numeric Primitives

#### Overview

openEHR defines Foundation types that are primitive value classes, with the raw value and (typically) a set of associated functions. However, the Foundation types are _generally_ not use directly in archetypes; instead numbers are typically carried inside `DV_` wrappers (`DV_COUNT`, `DV_QUANTITY`, `DV_PROPORTION`, `DV_ORDINAL`, `DV_SCALE`). Class attributes in the Data Types model commonly use the Foundation-Type primitives (`Integer`, `Real`, `Double`). FHIR conversely defines several stand-alone numeric primitives (`integer`, `integer64`, `decimal`, `positiveInt`, `unsignedInt`), that are used both in Complex Types and in Resource definitions directly.

When mapping, the FHIR primitive type is selected based on the value range and use context of the corresponding openEHR attribute. Note:

* FHIR `decimal` is intended to preserve the precision indicated by trailing zeros in the lexical form. openEHR `Real` / `Double` are not. When round-tripping decimals, use the [quantity-precision](https://hl7.org/fhir/extensions/StructureDefinition-quantity-precision.html) extension or write the value with explicit trailing zeros if precision needs to be preserved.
* The FHIR `integer` is 32-bit. FHIR defines the `integer64` type for values that may exceed `2^31 - 1`.
* Note that the FHIR `integer64` type is not commonly used. _Most_ elements that have integer data use the `integer` FHIR type. For openEHR attributes that are 64-bits, it is typically be more useful to map the 32-bit instance values into the designated 32-bit FHIR element and use an extension for any values that exceed the capacity.
* openEHR uses a `Real` type (e.g., `DV_QUANTITY.magnitude`); care is required when mapping to/from `decimal` to avoid losing precision.

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| Foundation `Integer` (attribute) | `integer` / `positiveInt` / `unsignedInt` | ↔ | Choice depends on allowed range |
| Foundation `Integer` (large) | `integer64` | ↔ | Use when value may exceed 32-bit range |
| Foundation `Real` / `Double` (attribute) | `decimal` | ↔ | Watch for precision/trailing-zero behaviour |

These primitive numeric mappings are most relevant for sub-fields of the higher-level data values discussed in [Quantities](#quantities) and [Coded Data](#coded-data) (e.g., `magnitude`, `precision`, `numerator`/`denominator`, ordinal `value`).

**Example - openEHR JSON**

```json
{
  "_type": "DV_ORDINAL",
  "value": 3,
  "symbol": {
    "_type": "DV_CODED_TEXT",
    "value": "severe",
    "defining_code": {
      "terminology_id": {
        "value": "local-pain-scale"
      },
      "code_string": "severe"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "valueInteger": 3
}
```

For integer values that exceed the FHIR `integer` range, a target element typed as `integer64` is required. Many FHIR elements do not permit this, so the actual destination often remains an archetype/profile decision.

**Example - openEHR JSON**

```json
{
  "_type": "DV_COUNT",
  "magnitude": 2147483648
}
```

**Example - FHIR JSON**

```json
{
  "valueInteger64": "2147483648"
}
```


### Resource-Locator Data and References

#### Overview

This section covers the openEHR types that carry a pointer to *something else* - either an opaque URI (`DV_URI`, `DV_EHR_URI`) or a structured link to another node in an EHR or to an external party (`LINK`, `PARTY_IDENTIFIED`) - and the FHIR types that play the same role: the URI primitives (`uri`, `url`, `oid`, `uuid`, `canonical`) and the structured `Reference` / `CodeableReference` data types.

Key points across the group:

* **URI primitives.** FHIR provides several URI primitives with progressively narrower constraints (`uri`/`canonical`, `url`, `oid`/`uuid`); `canonical` additionally carries versioning semantics. The chosen FHIR target generally depends on the *element definition* where the value is being carried, not on the openEHR source type.
* **`ehr:` scheme.** `DV_EHR_URI` constrains the scheme to `ehr:` and points at items inside an openEHR EHR (compositions, sections, entries, or sub-elements). There is no standard FHIR scheme that conveys equivalent semantics; the closest analogues are absolute or relative `Reference` values, but those carry resource-level rather than element-level addressing.
* **Sub-element addressing.** A `LINK.target` can address a sub-element of a composition. FHIR `Reference.reference` is a resource-level pointer (with `#fragment` reserved for contained resources) and does not natively address sub-elements. Two standard extensions on `Reference` (and on `canonical`, R4+) cover this when needed - though their use is uncommon in routine FHIR exchange:
    * [`targetElement`](http://hl7.org/fhir/StructureDefinition/targetElement) - `valueUri` carrying the target `Element.id`. Simpler to evaluate; requires the target element to have an `id`.
    * [`targetPath`](http://hl7.org/fhir/StructureDefinition/targetPath) - `valueString` carrying a (restricted) FHIRPath expression. More expressive (e.g., addressing a slice or a specific extension by URL); requires the consumer to support FHIRPath.
    
    Prefer `targetElement` when you control the target instance and can guarantee an `Element.id`; use `targetPath` when you cannot add ids or need to address something an id cannot pinpoint cleanly. Mappings into FHIR should generally avoid producing these extensions unless the source data genuinely requires sub-element granularity, since most consumers do not interpret them.
* **Clinical vs. operational references.** openEHR splits internal record links (`LINK`) from external party references (`PARTY_IDENTIFIED`); FHIR uses `Reference` for both. The working group is investigating consolidating `LINK` and `PARTY_IDENTIFIED` onto a common openEHR RM class (likely based on `OBJECT_REF`).
* **`CodeableReference`.** FHIR `CodeableReference` combines a coded concept *and* a reference. openEHR has no direct equivalent; mapping into openEHR generally requires splitting the value into a coded element plus a `LINK` (or an enclosing CLUSTER, e.g., `anatomical location` alongside a coded `BodySite` element).

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_URI` | `uri` / `url` / `oid` / `uuid` | ↔ | Direct equivalence (RFC 3986) |
| `DV_EHR_URI` | `uri` / `url` | → | `ehr:`-scheme URI; context-specific handling needed for FHIR |
| `DV_EHR_URI` (as a `LINK.target`) | `Reference.reference` / `CodeableReference.reference` | ↔ | See LINK mapping below |
| `LINK` (clinical) | `Reference` / `CodeableReference` | ↔ | Internal openEHR addressing |
| `PARTY_IDENTIFIED` (operational) | `Reference` | ↔ | External party references |

#### DV_URI ↔ FHIR uri / url / oid / uuid

| openEHR DV_URI | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (1..1 uri) | `uri` / `url` / `oid` / `uuid` | ↔ | Direct equivalence; pick the FHIR primitive that matches the target element's typing |

**Example - openEHR JSON**

```json
{
  "_type": "DV_URI",
  "value": "urn:oid:1.2.840.10008.5.1.4.1.1.2"
}
```

**Example - FHIR JSON**

```json
{
  "valueUri": "urn:oid:1.2.840.10008.5.1.4.1.1.2"
}
```

#### DV_URI ↔ FHIR canonical

| openEHR DV_URI | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (1..1 uri) | `canonical` | ↔ |  |

**Open Questions**

The format for combining `system` + `version` into a single `DV_URI` is still under discussion - candidates include `system|version` (FHIR canonical-style), `system(version)` (parenthetical), and `system#version` (FHIR package-style). The decision is captured in [Open Action Items](#open-action-items) of the working analysis.

The example below uses the `system|version` style that FHIR uses.

**Example - openEHR JSON**

```json
{
  "_type": "DV_URI",
  "value": "http://hl7.org/fhir/StructureDefinition/Observation|6.0.0"
}
```

**Example - FHIR JSON**

```json
{
  "valueCanonical": "http://hl7.org/fhir/StructureDefinition/Observation|6.0.0"
}
```


#### DV_EHR_URI ↔ FHIR uri / url

`DV_EHR_URI` requires the `ehr:` scheme and addresses items within an openEHR EHR (compositions, sections, entries, or sub-elements).

* **openEHR → FHIR:** preserve the `ehr:` URI as-is in `uri`/`url` elements. Where the target element is a FHIR `Reference`, the URI is generally not directly usable as `Reference.reference` - the value should be carried inside a `LINK` mapping (see below) or resolved to a concrete FHIR resource at the archetype/profile level.
* **FHIR → openEHR:** mapping a FHIR `uri` to `DV_EHR_URI` is only valid when the FHIR value already carries the `ehr:` scheme; otherwise map to `DV_URI`.

**Additional Notes**

* `DV_EHR_URI` mapping is still under discussion in the working group.

**Example - openEHR JSON**

```json
{
  "_type": "DV_EHR_URI",
  "value": "ehr://ehr.example.org/ehr/123/compositions/comp-456"
}
```

**Example - FHIR JSON**

```json
{
  "valueUri": "ehr://ehr.example.org/ehr/123/compositions/comp-456"
}
```

#### LINK ↔ FHIR Reference / CodeableReference

`LINK` and `PARTY_IDENTIFIED` together cover what FHIR conveys with `Reference` or a `CodeableReference.reference`. `LINK` carries clinical, internal-record relationships (composition or sub-element targets); `PARTY_IDENTIFIED` carries operational references to external parties.

##### Clinical: LINK ↔ Reference / CodeableReference

| openEHR LINK | FHIR Field | Direction | Notes |
|---|---|---|---|
| `meaning` (DV_TEXT) | `Reference.display` / `CodeableReference.concept.text` | ↔ | Free-text rendering; falls back to the name of the referenced node when no display is provided |
| `type` (DV_TEXT) | `Reference.type` / `CodeableReference.concept` | ↔ | Type of the referenced resource. `LINK.type` is currently `DV_TEXT` (not standardized) |
| `target` (DV_EHR_URI) | `Reference.reference` / `CodeableReference.reference` (+ optional [`targetElement`](http://hl7.org/fhir/StructureDefinition/targetElement) / [`targetPath`](http://hl7.org/fhir/StructureDefinition/targetPath) extension for sub-element addressing) | ↔ | URI to the target composition or sub-element. Use the sub-element extensions only when the source `LINK.target` actually points below resource level |

`LINK` targets can be sub-elements of a composition. FHIR `Reference.reference` does not natively address sub-elements, but the [`targetElement`](http://hl7.org/fhir/StructureDefinition/targetElement) and [`targetPath`](http://hl7.org/fhir/StructureDefinition/targetPath) extensions on `Reference` (see Concerns above) can carry that granularity when needed - their use is uncommon in routine FHIR exchange, so produce them only when the source data genuinely requires them. The composition-level identifier may alternatively be conveyed via `Reference.identifier` when round-tripping. Detailed mapping rules for `LINK ↔ CodeableReference` are still under discussion; interim guidance is to map as well as possible and log cases that cannot be cleanly expressed.

**Example - openEHR JSON**

```json
{
  "_type": "LINK",
  "meaning": {
    "_type": "DV_TEXT",
    "value": "source observation"
  },
  "type": {
    "_type": "DV_TEXT",
    "value": "derived-from"
  },
  "target": {
    "_type": "DV_EHR_URI",
    "value": "ehr://ehr.example.org/ehr/123/compositions/comp-456/content/items/systolic"
  }
}
```

**Example - FHIR JSON**

```json
{
  "reference": "Observation/obs-456",
  "type": "Observation",
  "display": "source observation",
  "extension": [
    {
      "url": "http://hl7.org/fhir/StructureDefinition/targetElement",
      "valueUri": "systolic"
    }
  ]
}
```

When the target element cannot be given a stable `Element.id`, the FHIR reference can use `targetPath` instead.

**Example - openEHR JSON**

```json
{
  "_type": "LINK",
  "meaning": {
    "_type": "DV_TEXT",
    "value": "anatomical site detail"
  },
  "type": {
    "_type": "DV_TEXT",
    "value": "refers-to"
  },
  "target": {
    "_type": "DV_EHR_URI",
    "value": "ehr://ehr.example.org/ehr/123/compositions/comp-789/content/items/body-site/laterality"
  }
}
```

**Example - FHIR JSON**

```json
{
  "reference": "Observation/obs-789",
  "type": "Observation",
  "display": "anatomical site detail",
  "extension": [
    {
      "url": "http://hl7.org/fhir/StructureDefinition/targetPath",
      "valueString": "Observation.bodySite.extension.where(url = 'http://example.org/fhir/StructureDefinition/laterality')"
    }
  ]
}
```

##### Operational: PARTY_IDENTIFIED ↔ Reference

| openEHR PARTY_IDENTIFIED | FHIR Field | Direction | Notes |
|---|---|---|---|
| `name` (String) | `Reference.display` | ↔ | Human-readable name; free-text fallback when no structured display is available |
| `identifiers` (List\<DV_IDENTIFIER\>) | `Reference.identifier` | ↔ | Logical identifiers (e.g., NHS number, OID-based IDs) - per the [DV_IDENTIFIER ↔ Identifier](#dv_identifier--fhir-identifier) mapping |
| `external_ref` (PARTY_REF) | `Reference.reference` | ↔ | Literal URL or resource reference to an external party registry |

**Example - openEHR JSON**

```json
{
  "_type": "PARTY_IDENTIFIED",
  "name": "Dr Alex Smith",
  "identifiers": [
    {
      "_type": "DV_IDENTIFIER",
      "issuer": "https://example.org/fhir/sid/national-provider-id",
      "id": "998877",
      "type": "http://terminology.hl7.org/CodeSystem/v2-0203::PRN"
    }
  ],
  "external_ref": {
    "_type": "PARTY_REF",
    "namespace": "FHIR",
    "type": "PERSON",
    "id": {
      "value": "Practitioner/prac-998877"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "reference": "Practitioner/prac-998877",
  "display": "Dr Alex Smith",
  "identifier": {
    "system": "https://example.org/fhir/sid/national-provider-id",
    "value": "998877",
    "type": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
          "code": "PRN"
        }
      ]
    }
  }
}
```


### Textual Data

#### Overview

openEHR carries text in `DV_TEXT`, an attribute-rich class with `value`, `formatting`, `encoding`, `language`, `mappings`, and (deprecated) `hyperlink`. FHIR uses three plain-text primitives: `string` (≤ 1 MiB UTF-8), `markdown` (CommonMark), and `xhtml` (constrained XHTML). FHIR also defines extensions ([rendering-markdown](https://hl7.org/fhir/extensions/StructureDefinition-rendering-markdown.html), [rendering-xhtml](https://hl7.org/fhir/extensions/StructureDefinition-rendering-xhtml.html)) so that a `string` element can carry a richer rendered form alongside the plain value.

Cross-cutting points:

- **Character encoding.** FHIR mandates UTF-8 throughout. openEHR allows several character sets via the `character_sets` CodeSystem (UTF-8, UTF-16, US-ASCII, ISO-8859-*, UTF-7, etc.). Non-UTF-8 content must be converted to UTF-8 before mapping; the original encoding is not preserved in FHIR.
- **Empty / whitespace strings.** FHIR strips leading/trailing whitespace and does not allow empty `string` values. Empty optional openEHR text values should be dropped; empty mandatory openEHR values are an upstream data error.
- **Length.** FHIR `string` is capped at 1 MiB. openEHR does not formally cap length; in practice this is unlikely to be exceeded, but oversize values should be handled as exceptions.
- **Language.** FHIR represents language at the resource level (`Resource.language`) and via element-level extensions ([language](http://hl7.org/fhir/StructureDefinition/language), [translation](http://hl7.org/fhir/StructureDefinition/translation), [additional-language](http://hl7.org/fhir/StructureDefinition/additional-language), [narrativeLanguageControl](http://hl7.org/fhir/StructureDefinition/narrativeLanguageControl)). openEHR carries `DV_TEXT.language` directly on the value.
- **Term mappings.** `DV_TEXT.mappings` is covered in [Coded Data](#coded-data) under TERM_MAPPING.

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_TEXT` | `string` | ↔ | Default mapping when no formatting indicated |
| `DV_TEXT` (`formatting = markdown`) | `markdown` (or `string` + [rendering-markdown](https://hl7.org/fhir/extensions/StructureDefinition-rendering-markdown.html)) | ↔ | |
| `DV_TEXT` (`formatting = html`) | `xhtml` (or `string` + [rendering-xhtml](https://hl7.org/fhir/extensions/StructureDefinition-rendering-xhtml.html)) | ↔ | XHTML support in openEHR pending RM change request |
| `DV_PARSABLE` | `string` + [mimeType](http://hl7.org/fhir/StructureDefinition/mimeType) extension | ↔ | Map to `markdown` if the formalism is markdown |
| `DV_PARAGRAPH` | `markdown` / `string` | → | `DV_PARAGRAPH` is deprecated, but may appear in older data or archetypes |

#### DV_TEXT ↔ FHIR string / markdown / xhtml

| openEHR DV_TEXT | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (1..1 string) | `string` / `markdown` / `xhtml` | ↔ | Direct mapping; target type depends on the FHIR element definition and `formatting` |
| `formatting` (0..1 string) | _(implicit in target type)_ | → | Values: `plain`, `plain_no_newlines`, `markdown`, (proposed: `html`) |
| `encoding` (0..1 CODE_PHRASE) | _(dropped)_ | - | Sender converts to UTF-8 prior to mapping |
| `hyperlink` (0..1 DV_URI) | _(dropped)_ | - | Deprecated; if present, fold into markdown content |
| `language` (0..1 CODE_PHRASE) | Extension or `Resource.language` | ↔ | See cross-cutting language notes |
| `mappings` (0..* TERM_MAPPING) | `CodeableConcept.coding` / extensions | ↔ | See [Coded Data - TERM_MAPPING](#term_mapping--fhir-codeableconceptcoding--extensions-coded) |

When a FHIR `string` carries a `rendering-markdown` or `rendering-xhtml` extension, the rendered value should be preserved by setting `DV_TEXT.formatting` to `markdown` / `html` and using the rendered content as `value`. When openEHR `formatting = markdown`/`html` is mapped to a FHIR `string` element (because the element type is `string`, not `markdown`/`xhtml`), use the corresponding rendering extension on the FHIR side.


**Example - openEHR JSON**

```json
{
  "_type": "DV_TEXT",
  "value": "**Severe** pain reported on movement.",
  "formatting": "markdown",
  "encoding": {
    "terminology_id": {
      "value": "IANA_character-sets"
    },
    "code_string": "UTF-8"
  },
  "language": {
    "terminology_id": {
      "value": "ISO_639-1"
    },
    "code_string": "en"
  }
}
```

**Example - FHIR JSON**

```json
{
  "valueString": "Severe pain reported on movement.",
  "_valueString": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/rendering-markdown",
        "valueMarkdown": "**Severe** pain reported on movement."
      },
      {
        "url": "http://hl7.org/fhir/StructureDefinition/language",
        "valueCode": "en"
      }
    ]
  }
}
```

**Example - openEHR JSON**

```json
{
  "_type": "DV_TEXT",
  "value": "<p>Patient <strong>declined</strong> measurement.</p>",
  "formatting": "html"
}
```

**Example - FHIR JSON**

```json
{
  "valueString": "Patient declined measurement.",
  "_valueString": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/rendering-xhtml",
        "valueString": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p>Patient <strong>declined</strong> measurement.</p></div>"
      }
    ]
  }
}
```



#### DV_PARSABLE ↔ FHIR string

| openEHR DV_PARSABLE | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (1..1 string) | `string` | ↔ | Content of the parsable string |
| `formalism` (1..1 string) | [mimeType](http://hl7.org/fhir/StructureDefinition/mimeType) extension | ↔ | Conveys the format (e.g., `application/x-hgvs`) |

Usage patterns:

| Context | Handling |
|---|---|
| General use | FHIR `string` + `mimeType` extension |
| Markdown content | FHIR `markdown` element if the target permits |
| Genomic data (e.g., HGVS) | `CodeableConcept.text` per the [Genomics Reporting IG](https://build.fhir.org/ig/HL7/genomics-reporting/) |

`DV_PARSABLE` inherits from `DV_ENCAPSULATED`; `DV_AMOUNT`-derived attributes carried via the IG hierarchy issue (range, status) are nonsensical here and dropped.

**Example - openEHR JSON**

```json
{
  "_type": "DV_PARSABLE",
  "value": "NM_000059.4:c.7790G>A",
  "formalism": "application/x-hgvs"
}
```

**Example - FHIR JSON**

```json
{
  "valueString": "NM_000059.4:c.7790G>A",
  "_valueString": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/mimeType",
        "valueCode": "application/x-hgvs"
      }
    ]
  }
}
```

##### FHIR Narrative

The FHIR `Narrative` type is typically used via the common element `DomainResource.text` ("Text summary of the resource, for human interpretation"). The element is _more or less_ an unstructured representation of the structured data in the resource, though it _can_ contain additional content that is difficult to capture in the existing structures.

So far, no clear advice can be given on exactly how to map FHIR Narrative to openEHR since it is highly dependent on the exact context and whether the FHIR narrative is fully generated from structured content (in which case it might be dropped).

Most archetypes do carry some sort of 'Description element' hat would alow narrative to be imported but that may or may not be safe target for the FHIR narrative, particularly if it is not derived from structured content.

There are also 'narrative style' archetypes such as the `OBSERVATION.story` and `EVALUATION.clinical_synopsis` archetypes that may be appropriate for full non-derived content.

Additionally, the openEHR `INSTRUCTION` class supports a mandatory narrative attribute, but it's main purpose is to represent a clinically safe, simplified version of the Instruction content, not as a verbatim representation of the full content.

Every archetype node does support an original_content attribute, designed more for medico-legal provencne but might be helpful in some circumstances, paerticularly to handle the xhtml passed in a rendered-xhtml extension, and vice-versa.


Where none of the options above are applicable it may be helpful to create a simple FHIR Narrative CLUSTER which would act as a direct import of FHIR Narrative, inlcuding the narrative status. This can be included in the Extension slot available in most archetypes.

[Draft FHIR Narrative Cluster](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJDM1ZTlmZjQzZjA0YjQ1NGNiYTUyNzVmYzEwMzNjODU3)

![CleanShot 2026-03-31 at 14.55.10](https://hackmd.io/_uploads/BJZwGItjbl.png)

:::spoiler

Following is the ADL for the above draft cluster.

```
archetype (adl_version=1.4; uid=dcf49968-b5c2-4836-bb1c-98c561b4bbcf)
	openEHR-EHR-CLUSTER.fhir_narrative.v0

concept
	[at0000]

language
	original_language = <[ISO_639-1::en]>

description
	original_author = <
		["date"] = <"2026-03-31">
		["name"] = <"Ian McNicoll">
		["organisation"] = <"freshEHR Clinical Informatics Ltd.">
		["email"] = <"ian@freshehr.com">
	>
	lifecycle_state = <"in_development">
	other_contributors = <"Gino Canessa","Microsoft">
	details = <
		["en"] = <
			language = <[ISO_639-1::en]>
		>
	>
	other_details = <
		["licence"] = <"This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/.">
		["custodian_organisation"] = <"openEHR Foundation">
		["original_namespace"] = <"org.openehr">
		["original_publisher"] = <"openEHR Foundation">
		["custodian_namespace"] = <"org.openehr">
		["MD5-CAM-1.0.1"] = <"00880cb27ee56030d404b953917bc804">
		["build_uid"] = <"1e4f24ca-3a90-37d4-9b3b-8eeb7c97fde3">
		["revision"] = <"0.0.1">
	>

definition
	CLUSTER[at0000] matches {    -- FHIR Narrative
		items cardinality matches {1..*; unordered} matches {
			ELEMENT[at0002] occurrences matches {0..1} matches {    -- Narrative
				value matches {
					DV_PARSABLE matches {*}
				}
			}
			ELEMENT[at0001] occurrences matches {0..1} matches {    -- Status
				value matches {
					DV_TEXT matches {*}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"FHIR Narrative">
					description = <"This cluster is intended to support the recording of FHIR narrative ingested that does not have a more natural target within existing archetypes. ">
				>
				["at0021.1"] = <
					text = <"Element">
					description = <"">
				>
				["at0001"] = <
					text = <"Status">
					description = <"The status of the narrative - whether it's entirely generated (from just the defined data or the extensions too), or whether a human authored it and it may contain additional data.

">
					comment = <"FHIR Codesystem: generated | extensions | additional | empty">
				>
				["at0002"] = <
					text = <"Narrative">
					description = <"The narrative carried in the div element in FHIR">
				>
			>
		>
	>
```

:::

#### DV_PARAGRAPH ↔ FHIR markdown / string

`DV_PARAGRAPH` is a composite text type that is currently `deprecated` and thus has not yet been discussed in the working group. The expected mapping is to FHIR `markdown` (preferred) or `string`.

**Example - openEHR JSON**

```json
{
  "_type": "DV_PARAGRAPH",
  "items": [
    {
      "_type": "DV_TEXT",
      "value": "First paragraph."
    },
    {
      "_type": "DV_TEXT",
      "value": "Second paragraph."
    }
  ]
}
```

**Example - FHIR JSON**

```json
{
  "valueMarkdown": "First paragraph.\n\nSecond paragraph."
}
```


### Coded Data

#### Overview

Coded values are the most structurally divergent area between the two type systems. openEHR uses a small `CODE_PHRASE` (`terminology_id`, `code_string`, `preferred_term`) that is wrapped by `DV_CODED_TEXT` for clinical content and used directly to anchor several other types (`DV_ORDINAL.symbol`, `DV_SCALE.symbol`, `DV_STATE.value`, `null_flavour`). FHIR has a `Coding` (system, version, code, display, userSelected) and a `CodeableConcept` (free-text plus zero or more `coding` entries), with a `code` primitive for simple closed value sets.

Several cross-cutting concerns apply to every coded mapping:

##### On Terminology

There are many data types that involve terminology mapping between the openEHR and FHIR ecosystems. Fortunately, there is often an external 'source of truth' that applies equally in both models, even if the representation varies. For example, when using LOINC, SNOMED, UCUM, etc., those codes are generally valid and reasonable in the equivalent context.

As a specific call-out, there is guidance when [Using SNOMED CT with HL7 Standards](https://terminology.hl7.org/en/SNOMEDCT.html), which discusses how to format the `system` when referencing SNOMED to correctly identify the edition and version (e.g., a specific release of the International Edition, etc.). Some CodeSystems also embed versions in their URI (e.g., `http://snomed.info/sct/900000000000207008/version/20240101`); see also the discussion of `system` + `version` representation below.

###### Specificity and Uniqueness

When moving data _into_ FHIR, one of the main concerns expressed by the terminology group is around the specificity and uniqueness of codes. The terminology recommendations are centered around ensuring that _if a system is specified_, it preserves the uniqueness of the conceptual meaning assigned by the originating system.

For example, if a single implementation/facility uses a local procedure code `PROC123` and there is not a system specified, a mapping engine:
* can add a system if the scope of the issuer is understood and the system is unique in that context
* should not include a `system` property otherwise.

So if the mapping engine _understands_ the context for `PROC123`, a system can be added (such as `http://example.org/facility/1111-1111-111-11/local-procedure-codes`). The mapping engine needs to ensure:
* the system is unique for the concept within the facility (e.g., if an unrelated concept has the code `PROC123` somewhere else in the mapping, they are not conflated)
* the system is unique for the **meaning** of the local procedure (e.g., if another facility uses `PROC123` for a _different_ procedure or the mappings to a standard system such as LOINC could ever differ, it must be a different system).

###### Bindings and Expectations

When mapping into FHIR, different elements will have different requirements for cardinality, binding targets, binding strength (`required`, `extensible`, `preferred`, `example`), and usage context (e.g., conditional bindings or jurisdictional rules). Implementers should consult the target element's binding before deciding how to populate `system`, `code`, and `display`. The same applies in reverse: openEHR archetypes and templates may constrain coded values to specific terminologies.

##### `system` + `version` ↔ `terminology_id`

FHIR uses full URIs for terminology systems while openEHR uses shorter identifier strings in `CODE_PHRASE.terminology_id`. The format for combining `system` + `version` into a single `terminology_id` is still under discussion - candidates include `system|version` (FHIR canonical-style), `system(version)` (parenthetical), and `system#version` (FHIR package-style). The decision is captured in [Open Action Items](#open-action-items) of the working analysis.

##### Missing system or code

When importing FHIR `Coding` values into openEHR, the mandatory `terminology_id` and `code_string` may not be populated.

1. If both `system` and `code` are absent, the `display` should be mapped to `DV_TEXT.value` instead of `DV_CODED_TEXT`.
2. If only one of `system` or `code` is absent the situation is inherently unsafe; resolution requires local clinical informatics advice. Options include degrading to `DV_TEXT`, injecting a default code system if the source is known, or treating as an exception.

##### Defining Code Selection

When a FHIR `CodeableConcept` carries multiple codings, the openEHR `defining_code` is selected (in priority order) by:

1. The terminology defined for the slot in the openEHR template (e.g., prefer SNOMED if the template specifies it).
2. The coding marked with `userSelected = true`.
3. The first coding in the `coding[]` array.

The working group has converged on treating FHIR `userSelected` as effectively equivalent to openEHR `defining_code` for round-tripping purposes, even though the semantics are not strictly identical.

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `CODE_PHRASE` | `Coding` | ↔ | Building block - rarely surfaces directly |
| `DV_CODED_TEXT` | `CodeableConcept` / `Coding` / `code` | ↔ | Primary clinical coded value |
| `TERM_MAPPING` | `CodeableConcept.coding[]` (additional codings) | ↔ | Each `TERM_MAPPING` becomes an extra `coding` |
| `DV_ORDINAL` | `Observation.component.value[x]` (Coding/Integer) | ↔ | Archetype-level mapping |
| `DV_SCALE` | `Observation.component.value[x]` (Coding/Decimal) | ↔ | Archetype-level mapping |
| `DV_STATE` | `CodeableConcept` (+ extension for `is_terminal`) | → | Low usage; possibly legacy |
| `null_flavour` | [data-absent-reason](http://hl7.org/fhir/StructureDefinition/data-absent-reason) extension / `Observation.dataAbsentReason` / [iso21090-nullFlavor](http://hl7.org/fhir/StructureDefinition/iso21090-nullFlavor) | ↔ | DAR is preferred guidance |

#### DV_CODED_TEXT ↔ FHIR CodeableConcept / Coding

Scenario-based mapping:

| Scenario | FHIR Shape | openEHR Target |
|---|---|---|
| **Text only** | `CodeableConcept.text` = `"Broken Arm"` | `DV_TEXT` |
| **Coding only** | `CodeableConcept.coding[0]` with system/code/display | `DV_CODED_TEXT` with selected coding as `defining_code`; `value` = `coding.display` (or `coding.code` if `display` is absent, since `DV_CODED_TEXT.value` is mandatory) |
| **Text + coding(s)** | Both `.text` and `.coding[]` present | `DV_TEXT` (for `.text`) with **all** codings carried in `TERM_MAPPING` |

Detailed field mapping (coding-only scenario):

| FHIR `Coding` | openEHR DV_CODED_TEXT | Notes |
|---|---|---|
| `coding.system` + `coding.version` | `defining_code.terminology_id` | Combined per the agreed `system`+`version` format (see Concerns above) |
| `coding.code` | `defining_code.code_string` | Mandatory in DV_CODED_TEXT; openEHR currently has no whitespace restriction (proposed addition pending) |
| `coding.display` | `defining_code.preferred_term` and `value` (when this coding is `defining_code`) | |
| `coding.userSelected` | Selects the `defining_code` (per priority order) | |
| Additional `coding[]` entries | `mappings` (each → one `TERM_MAPPING`) | |

Discussion is ongoing about whether `defining_code` semantics should be conveyed in FHIR via `coding.userSelected`, the [coding-purpose](https://hl7.org/fhir/extensions/StructureDefinition-coding-purpose.html) extension with `#original`, or a new `#defining_code` value (THO ticket [HTA-170](https://jira.hl7.org/browse/HTA-170)). Working consensus: treat `userSelected` as the practical equivalent of `defining_code`.

Post-coordinated codes (e.g., SNOMED expressions) are valid in `code_string` per the openEHR specification, but support in deployed CDRs varies. Implementations should verify before relying on round-tripping.

**Example - openEHR JSON**

```json
{
  "_type": "DV_CODED_TEXT",
  "value": "CT Upper extremity - right",
  "defining_code": {
    "terminology_id": {
      "value": "http://loinc.org/|2.65"
    },
    "code_string": "35983-6",
    "preferred_term": "CT Upper extremity - right"
  }
}
```

**Example - FHIR JSON**

```json
{
  "coding": [
    {
      "system": "http://loinc.org/",
      "version": "2.65",
      "code": "35983-6",
      "display": "CT Upper extremity - right",
      "userSelected": true
    }
  ]
}
```

When a FHIR `CodeableConcept` contains only text, the safer openEHR target is `DV_TEXT`, not `DV_CODED_TEXT`.

**Example - openEHR JSON**

```json
{
  "_type": "DV_TEXT",
  "value": "Broken arm"
}
```

**Example - FHIR JSON**

```json
{
  "text": "Broken arm"
}
```

A post-coordinated expression can be carried as the openEHR `code_string` and the FHIR `Coding.code`; implementations should verify that both terminology tooling stacks support the expression syntax.

**Example - openEHR JSON**

```json
{
  "_type": "DV_CODED_TEXT",
  "value": "Left hip replacement",
  "defining_code": {
    "terminology_id": {
      "value": "http://snomed.info/sct"
    },
    "code_string": "71388002:363704007=24136001,272741003=7771000",
    "preferred_term": "Left hip replacement"
  }
}
```

**Example - FHIR JSON**

```json
{
  "coding": [
    {
      "system": "http://snomed.info/sct",
      "code": "71388002:363704007=24136001,272741003=7771000",
      "display": "Left hip replacement",
      "userSelected": true
    }
  ]
}
```

#### TERM_MAPPING ↔ FHIR CodeableConcept.coding / Extensions

`TERM_MAPPING` carries:

| Field | Card | Type | Description |
|---|---|---|---|
| `match` | 1..1 | string | Relationship: `>`, `=`, `<`, `?` |
| `purpose` | 0..1 | DV_CODED_TEXT | Purpose (public health, reimbursement, research study, …) |
| `target` | 1..1 | CODE_PHRASE | The mapped term |

Each `TERM_MAPPING` becomes an additional `coding` in the FHIR `CodeableConcept`. The `match` value conveys the degree of equivalence and is generally retrievable from terminology services (e.g., via `ConceptMap`). The `purpose` is conveyed via the [coding-purpose](https://hl7.org/fhir/extensions/StructureDefinition-coding-purpose.html) or [alternate-codes](https://hl7.org/fhir/extensions/StructureDefinition-alternate-codes.html) extension. The current openEHR IG `required` binding on `purpose` should be relaxed to `extensible`.

**Example - openEHR JSON**

```json
{
  "_type": "DV_TEXT",
  "value": "Broken arm",
  "mappings": [
    {
      "match": "=",
      "purpose": {
        "_type": "DV_CODED_TEXT",
        "value": "research study",
        "defining_code": {
          "terminology_id": {
            "value": "openehr_term_mapping_purpose"
          },
          "code_string": "research-study"
        }
      },
      "target": {
        "terminology_id": {
          "value": "http://snomed.info/sct"
        },
        "code_string": "125605004",
        "preferred_term": "Fracture of bone"
      }
    }
  ]
}
```

**Example - FHIR JSON**

```json
{
  "text": "Broken arm",
  "coding": [
    {
      "system": "http://snomed.info/sct",
      "code": "125605004",
      "display": "Fracture of bone",
      "extension": [
        {
          "url": "http://hl7.org/fhir/StructureDefinition/coding-purpose",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "http://openehr.org/fhir/CodeSystem/term-mapping-purpose",
                "code": "research-study",
                "display": "research study"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### DV_ORDINAL / DV_SCALE ↔ FHIR Observation.component / valueCoding

`DV_ORDINAL` (integer value) and `DV_SCALE` (decimal value) share the same shape: a coded `symbol` paired with a numeric `value`. Both map at the archetype level rather than the data-type level.

| openEHR Field | FHIR Target | Notes |
|---|---|---|
| `symbol` (DV_CODED_TEXT) | `Observation.component.valueCodeableConcept` / `valueCoding` / `valueCode`, or `QuestionnaireResponse.item.answer.valueCoding` | Coded label |
| `value` (Integer for DV_ORDINAL, Real for DV_SCALE) | `Observation.component.valueInteger` / `valueQuantity`, or `valueCoding` with the [itemWeight](https://hl7.org/fhir/extensions/StructureDefinition-itemWeight-definitions.html) extension, or `QuestionnaireResponse.item.answer.valueInteger` / `valueQuantity` | Numeric score; `DV_SCALE.value` cannot use `valueInteger` |

Reference range information (`normal_range`, `other_reference_ranges`, `normal_status`) maps via the [DV_AMOUNT pattern](#dv_amount-pattern) and only at Observation level. Searching FHIR data for ordinal/scale values via the `itemWeight` extension is unlikely to be supported by typical search infrastructure - this is a consideration when designing archetype-specific mappings (e.g., APGAR scores).

**Example - openEHR JSON**

```json
{
  "_type": "DV_ORDINAL",
  "value": 2,
  "symbol": {
    "_type": "DV_CODED_TEXT",
    "value": "moderate",
    "defining_code": {
      "terminology_id": {
        "value": "http://example.org/fhir/CodeSystem/pain-severity"
      },
      "code_string": "moderate"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "resourceType": "Observation",
  "component": [
    {
      "code": {
        "text": "Pain severity"
      },
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "http://example.org/fhir/CodeSystem/pain-severity",
            "code": "moderate",
            "display": "moderate",
            "extension": [
              {
                "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
                "valueDecimal": 2
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Example - openEHR JSON**

```json
{
  "_type": "DV_SCALE",
  "value": 0.5,
  "symbol": {
    "_type": "DV_CODED_TEXT",
    "value": "some difficulty",
    "defining_code": {
      "terminology_id": {
        "value": "http://example.org/fhir/CodeSystem/mobility-scale"
      },
      "code_string": "some-difficulty"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "resourceType": "QuestionnaireResponse",
  "item": [
    {
      "linkId": "mobility",
      "answer": [
        {
          "valueCoding": {
            "system": "http://example.org/fhir/CodeSystem/mobility-scale",
            "code": "some-difficulty",
            "display": "some difficulty",
            "extension": [
              {
                "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
                "valueDecimal": 0.5
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### DV_STATE

`DV_STATE` has no direct FHIR equivalent. Its `value` (`DV_CODED_TEXT`) maps as a normal coded value; `is_terminal` requires an extension or archetype handling. Usage in deployed openEHR systems is very low (possibly legacy, superseded by `ISM_TRANSITION`); the current recommendation is to ignore unless encountered.

**Example - openEHR JSON**

```json
{
  "_type": "DV_STATE",
  "value": {
    "_type": "DV_CODED_TEXT",
    "value": "completed",
    "defining_code": {
      "terminology_id": {
        "value": "http://example.org/fhir/CodeSystem/state"
      },
      "code_string": "completed"
    }
  },
  "is_terminal": true
}
```

**Example - FHIR JSON**

```json
{
  "coding": [
    {
      "system": "http://example.org/fhir/CodeSystem/state",
      "code": "completed",
      "display": "completed"
    }
  ],
  "extension": [
    {
      "url": "http://openehr.org/fhir/StructureDefinition/dv-state-is-terminal",
      "valueBoolean": true
    }
  ]
}
```

#### NULL_FLAVOUR ↔ Data Absent Reason / ISO 21090 Null Flavor

openEHR `NULL_FLAVOUR` codes (271 no information, 253 unknown, 272 masked, 273 not applicable) are conveyed in FHIR through one of:

1. The [data-absent-reason](http://hl7.org/fhir/StructureDefinition/data-absent-reason) extension on the absent element (preferred guidance).
2. `Observation.dataAbsentReason` (when the target is an Observation value).
3. The [iso21090-nullFlavor](http://hl7.org/fhir/StructureDefinition/iso21090-nullFlavor) extension (legacy, still supported).

| openEHR Code | openEHR Name | FHIR DAR | HL7 NullFlavor |
|---|---|---|---|
| 253 | unknown | `unknown` | `UNK` |
| 271 | no information | `unknown` (lossy fallback - no exact DAR match) or `as-text` / `error` | `NI` |
| 272 | masked | `masked` | `MSK` |
| 273 | not applicable | `not-applicable` | `NA` |

For round-trip mapping, the FHIR-to-openEHR transformation can pick the openEHR code based on which CodeSystem is present. Code 271 ("no information") is the only problematic case; current direction is to map it to DAR `unknown` while logging the loss, with a long-term goal of proposing "no information" be added to DAR. ConceptMaps for both directions are planned.

**Example - openEHR JSON**

```json
{
  "null_flavour": {
    "_type": "DV_CODED_TEXT",
    "value": "masked",
    "defining_code": {
      "terminology_id": {
        "value": "openehr"
      },
      "code_string": "272",
      "preferred_term": "masked"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "_valueQuantity": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
        "valueCode": "masked"
      }
    ]
  }
}
```

For `Observation`, the same meaning is often carried on `Observation.dataAbsentReason` rather than on the missing value element.

**Example - openEHR JSON**

```json
{
  "null_flavour": {
    "_type": "DV_CODED_TEXT",
    "value": "not applicable",
    "defining_code": {
      "terminology_id": {
        "value": "openehr"
      },
      "code_string": "273",
      "preferred_term": "not applicable"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "text": "Example observation"
  },
  "dataAbsentReason": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/data-absent-reason",
        "code": "not-applicable",
        "display": "Not Applicable"
      }
    ]
  }
}
```

Legacy `iso21090-nullFlavor` can be round-tripped when present, but Data Absent Reason remains the preferred FHIR representation.

**Example - openEHR JSON**

```json
{
  "null_flavour": {
    "_type": "DV_CODED_TEXT",
    "value": "no information",
    "defining_code": {
      "terminology_id": {
        "value": "openehr"
      },
      "code_string": "271",
      "preferred_term": "no information"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "_valueString": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/iso21090-nullFlavor",
        "valueCode": "NI"
      }
    ]
  }
}
```


### Quantities

#### Overview

openEHR's quantitative data flows through the `DV_AMOUNT` branch of the hierarchy: `DV_QUANTITY`, `DV_COUNT`, `DV_PROPORTION`, and `DV_DURATION`. These all inherit a common set of attributes - `accuracy`, `magnitude_status`, `normal_range`, `other_reference_ranges`, and `normal_status` - that follow the same mapping strategy regardless of the concrete subtype.

FHIR's quantitative data flows through various types. For single-values, the `Quantity` branch of the hierarchy is generally used: `Quantity`, `Age`, `Distance`, `Duration`, `Count`, `MoneyQuantity`, and `SimpleQuantity`. These sub-types are  _restrictions_ on the base type (e.g., `Age` restricts to 'UCUM Expressions for Time'). Other common types for quantitative data include: `Ratio`, `Range`, `Period`, `RatioRange`, `Timing`, `Money`, and `RelativeTime`.

##### DV_AMOUNT pattern

| Inherited Property | FHIR Equivalent | Context |
|---|---|---|
| `magnitude_status` | `Quantity.comparator` (or per-type equivalent) | Per-type handling |
| `accuracy` | [quantity-accuracy](https://hl7.org/fhir/extensions/StructureDefinition-quantity-accuracy.html) extension (`accuracy_is_percent` must be `false`) | Rarely used in practice |
| `normal_range` | `Observation.referenceRange` with `type = normal` | Observation context only |
| `other_reference_ranges` | `Observation.referenceRange` with `type ≠ normal` | Observation context only |
| `normal_status` | `Observation.interpretation` (CodeSystem `normal_statuses` ↔ HL7 v2 `Interpretation`) | Observation context only |

Reference-range and interpretation fields are only meaningful at the FHIR resource/profile level (typically `Observation`), not on the data type itself. The openEHR `normal_statuses` binding should be relaxed from `required` to `extensible` to align with FHIR's `Observation.interpretation` extensibility (ticket filed; principle agreed).

##### Comparator mapping

| openEHR `magnitude_status` | FHIR `Quantity.comparator` | Notes |
|---|---|---|
| `<`, `<=`, `>`, `>=` | `<`, `<=`, `>`, `>=` | Direct |
| `~` | `~` (added in R6) | Approximate; default tolerance ±10% per FHIR guidance. [FHIR-56000](https://jira.hl7.org/browse/FHIR-56000) - resolved, awaiting publication |
| `=` | _(implicit, no comparator)_ | Point value |
| _(none)_ | `ad` | "Sufficient as part of a sum" - no openEHR equivalent |

##### Numeric precision and trailing zeros

Both systems can carry precision via different mechanisms - openEHR via `precision` (and `magnitude` lexical form), FHIR via the lexical form of `decimal` and the [quantity-precision](https://hl7.org/fhir/extensions/StructureDefinition-quantity-precision.html) extension. When mapping, take the most granular precision available across both fields. openEHR `precision = -1` (unlimited) corresponds to absence of the `quantity-precision` extension.

##### Profiled FHIR Quantities

FHIR `Quantity` has several constrained variants - `SimpleQuantity` (no comparator), `Age`, `Distance`, `Duration`, `Count`, `Money`, `MoneyQuantity`. Each adds invariants on the `system`/`code` or which fields are permitted; mappings to/from `DV_QUANTITY` may need to add unit conversions or refuse the mapping when the openEHR data is incompatible (e.g., a `comparator` for a `SimpleQuantity` target is a modelling error).

##### Units

FHIR `Quantity` invariant `qty-3` requires `system` whenever `code` is present. When openEHR `units_system` is absent, the mapping engine must add `http://unitsofmeasure.org` (UCUM) on the FHIR side. `Count` requires `system = http://unitsofmeasure.org` and `code = 1`; `Money` uses `system = urn:iso:std:iso:4217` with the ISO 4217 currency code in `code`/`units`.

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_QUANTITY` | `Quantity` | ↔ | Primary mapping |
| `DV_QUANTITY` | `SimpleQuantity` | ↔ | No comparator allowed |
| `DV_QUANTITY` | `Age` / `Distance` | ↔ | Domain-constrained Quantity |
| `DV_QUANTITY` | `MoneyQuantity` / `Money` | ↔ | Currency in `units` (ISO 4217); see implementation guidance |
| `DV_COUNT` | `Count` | ↔ | UCUM `1`; FHIR `Count` is 32-bit |
| `DV_PROPORTION` | `Ratio` | ↔ | Includes `type` discriminator (pk_*) |
| `DV_INTERVAL<DV_QUANTITY>` (numeric) | `Range` | ↔ | See [Temporal Data](#temporal-data) for date/time intervals |
| `DV_INTERVAL<DV_QUANTITY>` (with comparators) | `Quantity` (one or more) | ↔ | Use `comparator` to express bounds |

#### DV_QUANTITY ↔ FHIR Quantity

| openEHR DV_QUANTITY | FHIR Quantity | Direction | Notes |
|---|---|---|---|
| `magnitude` (1..1 Real) | `value` (0..1 decimal) | ↔ | Direct |
| `units` (1..1 string) | `code` (0..1 code) | ↔ | UCUM code by default |
| `units_system` (0..1 string) | `system` (0..1 uri) | ↔ | If absent on either side, assume UCUM |
| `units_display_name` (0..1 string) | `unit` (0..1 string) | ↔ | Human-readable unit label (e.g., `°C`) |
| `precision` (0..1 Integer) | [quantity-precision](https://hl7.org/fhir/extensions/StructureDefinition-quantity-precision.html) extension | ↔ | `-1` ≡ absent extension |
| `magnitude_status` | `comparator` | ↔ | See comparator mapping |
| `accuracy` | [quantity-accuracy](https://hl7.org/fhir/extensions/StructureDefinition-quantity-accuracy.html) extension | ↔ | `accuracy_is_percent` must be `false` |
| `normal_range` / `other_reference_ranges` / `normal_status` | `Observation.referenceRange` / `Observation.interpretation` | ↔ (archetype) | Per [DV_AMOUNT pattern](#dv_amount-pattern) |

Simple quantity values are straightforward in mapping.

**Example - openEHR JSON**

```json
{
  "_type": "DV_QUANTITY",
  "magnitude": 2.3,
  "precision": 2,
  "units": "mg",
  "units_system": "http://unitsofmeasure.org"
}
```

**Example - FHIR JSON**

```json
{
  "valueQuantity": {
    "value": 2.3,
    "_value": {
      "extension": [{
        "url": "http://hl7.org/fhir/StructureDefinition/quantity-precision",
        "valueInteger": 2
      }]
    }
    "system": "http://unitsofmeasure.org",
    "code": "mg"
  }
}
```

**Example - openEHR JSON**

```json
{
  "_type": "DV_QUANTITY",
  "magnitude": 5.2,
  "units": "mmol/L",
  "units_system": "http://unitsofmeasure.org",
  "units_display_name": "millimole per litre",
  "precision": 2,
  "magnitude_status": "~",
  "accuracy": 0.1,
  "accuracy_is_percent": false,
  "normal_range": {
    "lower": {
      "_type": "DV_QUANTITY",
      "magnitude": 3.5,
      "units": "mmol/L",
      "units_system": "http://unitsofmeasure.org"
    },
    "upper": {
      "_type": "DV_QUANTITY",
      "magnitude": 5.5,
      "units": "mmol/L",
      "units_system": "http://unitsofmeasure.org"
    },
    "lower_included": true,
    "upper_included": true
  },
  "normal_status": {
    "_type": "DV_CODED_TEXT",
    "value": "normal",
    "defining_code": {
      "terminology_id": {
        "value": "openehr_normal_statuses"
      },
      "code_string": "N"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "text": "Serum glucose"
  },
  "valueQuantity": {
    "value": 5.20,
    "comparator": "~",
    "unit": "millimole per litre",
    "system": "http://unitsofmeasure.org",
    "code": "mmol/L",
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/quantity-precision",
        "valueInteger": 2
      },
      {
        "url": "http://hl7.org/fhir/StructureDefinition/quantity-accuracy",
        "valueDecimal": 0.1
      }
    ]
  },
  "interpretation": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          "code": "N",
          "display": "Normal"
        }
      ]
    }
  ],
  "referenceRange": [
    {
      "low": {
        "value": 3.5,
        "system": "http://unitsofmeasure.org",
        "code": "mmol/L"
      },
      "high": {
        "value": 5.5,
        "system": "http://unitsofmeasure.org",
        "code": "mmol/L"
      },
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/referencerange-meaning",
            "code": "normal",
            "display": "Normal Range"
          }
        ]
      }
    }
  ]
}
```

Domain-constrained `Quantity` types such as `Age` and `Distance` use the same value shape, with the target element/profile enforcing the unit expectations.

**Example - openEHR JSON**

```json
{
  "_type": "DV_QUANTITY",
  "magnitude": 65,
  "units": "a",
  "units_system": "http://unitsofmeasure.org",
  "units_display_name": "years"
}
```

**Example - FHIR JSON**

```json
{
  "valueAge": {
    "value": 65,
    "unit": "years",
    "system": "http://unitsofmeasure.org",
    "code": "a"
  }
}
```



#### DV_COUNT ↔ FHIR Count

| openEHR DV_COUNT | FHIR Count | Direction | Notes |
|---|---|---|---|
| `magnitude` (1..1 Integer) | `value` (0..1 decimal) | ↔ | Integer in practice |
| `magnitude_status` | `comparator` | ↔ | Same comparator handling as DV_QUANTITY |
| Inherited DV_AMOUNT fields | Per [DV_AMOUNT pattern](#dv_amount-pattern) | ↔ (archetype) | |

FHIR `Count` requires `system = http://unitsofmeasure.org` and `code = 1`. FHIR `Count.value` is restricted to 32-bit; values exceeding this should be mapped to a generic `Quantity` instead.

**Example - openEHR JSON**

```json
{
  "_type": "DV_COUNT",
  "magnitude": 12,
  "magnitude_status": "<"
}
```

**Example - FHIR JSON**

```json
{
  "valueCount": {
    "value": 12,
    "comparator": "<",
    "unit": "count",
    "system": "http://unitsofmeasure.org",
    "code": "1"
  }
}
```

If the value exceeds the FHIR `Count` range, map to a generic `Quantity` only when the target element allows it.

**Example - openEHR JSON**

```json
{
  "_type": "DV_COUNT",
  "magnitude": 3000000000
}
```

**Example - FHIR JSON**

```json
{
  "valueQuantity": {
    "value": 3000000000,
    "unit": "count",
    "system": "http://unitsofmeasure.org",
    "code": "1"
  }
}
```

#### DV_PROPORTION ↔ FHIR Ratio

| openEHR DV_PROPORTION | FHIR Ratio | Direction | Notes |
|---|---|---|---|
| `numerator` (1..1 Real) | `numerator` (0..1 Quantity) | ↔ | FHIR carries units in the Quantity |
| `denominator` (1..1 Real) | `denominator` (0..1 Quantity) | ↔ | |
| `type` (1..1 code) | _(no direct equivalent)_ | → | See type handling |
| `precision` (0..1 Integer) | [quantity-precision](https://hl7.org/fhir/extensions/StructureDefinition-quantity-precision.html) on numerator/denominator | ↔ | |
| Inherited DV_AMOUNT fields | Per [DV_AMOUNT pattern](#dv_amount-pattern) | ↔ (archetype) | |

Type handling (`proportion_kind`):

| `DV_PROPORTION.type` | Mapping Behaviour |
|---|---|
| `pk_ratio` | Numerator and denominator map normally |
| `pk_unitary` | Denominator fixed to `1` |
| `pk_percent` | Denominator fixed to `100` |
| `pk_fraction` / `pk_integer_fraction` | Numerator and denominator map normally; rendering hint pending FHIR extension - [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001) |

`DV_PROPORTION` has no unit fields - units come from the archetype. When the FHIR `Ratio` source carries units on `numerator`/`denominator` (e.g., `5 mg / 100 mL`), the openEHR side typically models the value as two separate `DV_QUANTITY` fields. A proposal to extend `DV_PROPORTION` (or add a new `pk_mixedRatio`) to carry units on each side is under discussion.

**Example - openEHR JSON**

```json
{
  "_type": "DV_PROPORTION",
  "numerator": 1,
  "denominator": 2,
  "type": "pk_integer_fraction",
  "precision": 0
}
```

**Example - FHIR JSON**

```json
{
  "valueRatio": {
    "numerator": {
      "value": 1,
      "system": "http://unitsofmeasure.org",
      "code": "1",
      "extension": [
        {
          "url": "http://hl7.org/fhir/StructureDefinition/quantity-precision",
          "valueInteger": 0
        }
      ]
    },
    "denominator": {
      "value": 2,
      "system": "http://unitsofmeasure.org",
      "code": "1"
    }
  }
}
```

The FHIR `Ratio` above does not preserve the openEHR fraction-rendering intent (`pk_integer_fraction`); that remains a gap pending a FHIR extension.

For a unit-bearing FHIR ratio, the openEHR side is normally archetype-specific and may use two `DV_QUANTITY` values rather than a single `DV_PROPORTION`.

**Example - openEHR JSON**

```json
{
  "rate": {
    "numerator": {
      "_type": "DV_QUANTITY",
      "magnitude": 5,
      "units": "mg",
      "units_system": "http://unitsofmeasure.org"
    },
    "denominator": {
      "_type": "DV_QUANTITY",
      "magnitude": 1,
      "units": "h",
      "units_system": "http://unitsofmeasure.org"
    }
  }
}
```

**Example - FHIR JSON**

```json
{
  "resourceType": "MedicationAdministration",
  "status": "completed",
  "medication": {
    "concept": {
      "text": "Example medication"
    }
  },
  "subject": {
    "reference": "Patient/example"
  },
  "dosage": {
    "rateRatio": {
      "numerator": {
        "value": 5,
        "unit": "mg",
        "system": "http://unitsofmeasure.org",
        "code": "mg"
      },
      "denominator": {
        "value": 1,
        "unit": "hour",
        "system": "http://unitsofmeasure.org",
        "code": "h"
      }
    }
  }
}
```

#### MoneyQuantity / Money ↔ DV_QUANTITY

| FHIR Field | openEHR DV_QUANTITY Field | Notes |
|---|---|---|
| `MoneyQuantity.*` | `DV_QUANTITY.*` | Standard Quantity mapping with currency-coded `units` |
| `Money.value` | `magnitude` | Direct |
| `Money.currency` | `units` (ISO 4217 code) + `units_system = urn:iso:std:iso:4217` | Bound to FHIR `currencies` value set |

The mapping is mechanically straightforward; current authoring tooling does not surface the `units_system` binding, so the recommendation is implementation guidance rather than a dedicated cluster archetype.

**Example - openEHR JSON**

```json
{
  "_type": "DV_QUANTITY",
  "magnitude": 125.5,
  "precision": 2,
  "units": "USD",
  "units_system": "urn:iso:std:iso:4217",
  "units_display_name": "US dollar"
}
```

**Example - FHIR JSON**

```json
{
  "valueMoney": {
    "value": 125.50,
    "currency": "USD"
  }
}
```

#### SimpleQuantity ↔ DV_QUANTITY

`SimpleQuantity` is a `Quantity` that prohibits `comparator`. The mapping is identical to `DV_QUANTITY ↔ Quantity`; if a `magnitude_status` is present on an openEHR value targeting a `SimpleQuantity` element, that is a modelling error and should fault the mapping rather than be silently dropped.

**Example - openEHR JSON**

```json
{
  "_type": "DV_QUANTITY",
  "magnitude": 72,
  "units": "kg",
  "units_system": "http://unitsofmeasure.org"
}
```

**Example - FHIR JSON**

```json
{
  "valueQuantity": {
    "value": 72,
    "unit": "kg",
    "system": "http://unitsofmeasure.org",
    "code": "kg"
  }
}
```

An openEHR value such as `"magnitude_status": "<"` should not be mapped to a FHIR `SimpleQuantity` target because the comparator is prohibited by the target type.

#### DV_INTERVAL<DV_QUANTITY> ↔ FHIR Range / Quantity

Numeric `DV_INTERVAL` instances should typically map to `Range`. Single-sided intervals can sometimes map to a `Quantity` with a comparator, but only when that is how the target FHIR element expresses bounds.

**Example - openEHR JSON**

```json
{
  "_type": "DV_INTERVAL",
  "lower": {
    "_type": "DV_QUANTITY",
    "magnitude": 90,
    "units": "mm[Hg]",
    "units_system": "http://unitsofmeasure.org"
  },
  "upper": {
    "_type": "DV_QUANTITY",
    "magnitude": 140,
    "units": "mm[Hg]",
    "units_system": "http://unitsofmeasure.org"
  },
  "lower_included": true,
  "upper_included": true
}
```

**Example - FHIR JSON**

```json
{
  "valueRange": {
    "low": {
      "value": 90,
      "unit": "mmHg",
      "system": "http://unitsofmeasure.org",
      "code": "mm[Hg]"
    },
    "high": {
      "value": 140,
      "unit": "mmHg",
      "system": "http://unitsofmeasure.org",
      "code": "mm[Hg]"
    }
  }
}
```

**Example - openEHR JSON**

```json
{
  "_type": "DV_INTERVAL",
  "lower": {
    "_type": "DV_QUANTITY",
    "magnitude": 5,
    "units": "mg/L",
    "units_system": "http://unitsofmeasure.org"
  },
  "lower_included": false,
  "upper_unbounded": true
}
```

**Example - FHIR JSON**

```json
{
  "valueRange": {
    "high": {
    "value": 5,
    "unit": "mg/L",
    "system": "http://unitsofmeasure.org",
    "code": "mg/L"
    }
  }
}
```

-or-

```json
{
  "valueQuantity": {
    "value": 5,
    "comparator": ">",
    "unit": "mg/L",
    "system": "http://unitsofmeasure.org",
    "code": "mg/L"
  }
}
```


### Temporal Data

#### Overview

openEHR temporal values inherit (in the RM) from `DV_TEMPORAL`: `DV_DATE`, `DV_TIME`, `DV_DATE_TIME`, `DV_DURATION`.

Cross-cutting points:

- **ISO 8601 subset.** Both systems use ISO 8601 but with different allowed forms. openEHR permits compact forms (`20250301`, `T143000`); FHIR requires extended form (`2025-03-01`, `14:30:00`). Compact values must be expanded before mapping to FHIR. A formal subset comparison is acknowledged as ~90% aligned but has not been documented in detail.
- **Implicit precision.** openEHR `accuracy` / `magnitude_status` (inherited from abstract parents) are dropped during mapping. Where the source value is partial (e.g., year-month only), that precision must be preserved by truncating the FHIR lexical form rather than padding (e.g., `202604` → `2026-04`, not `2026-04-01`).
- **Fractional seconds.** FHIR allows up to 9 decimal digits; openEHR restricts to 3. Excess precision is truncated when mapping FHIR → openEHR.
- **Time zones.** FHIR `time` cannot carry a timezone; `dateTime` and `instant` can. When an openEHR `DV_TIME` carries a timezone, the FHIR [timezone](https://hl7.org/fhir/extensions/StructureDefinition-timezone.html) extension is used. In practice, openEHR data without timezone is rare.
- **Split fields.** Some FHIR resources carry the date and time as separate elements - e.g., `Patient.birthDate` is a `date`, with the time conveyed by the [patient-birthTime](https://hl7.org/fhir/extensions/StructureDefinition-patient-birthTime.html) extension. Mapping engines must be aware of these element-specific patterns.
- **DV_INTERVAL.** Date/time intervals map to FHIR `Period`; numeric intervals map to `Range` (covered in [Quantities](#quantities)).

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_DATE` | `date` / `dateTime` | ↔ | Compact forms expanded to extended |
| `DV_TIME` | `time` (+ optional [timezone](https://hl7.org/fhir/extensions/StructureDefinition-timezone.html) extension) | ↔ | |
| `DV_DATE_TIME` | `dateTime` / `instant` | ↔ | `instant` for fully precise UTC values |
| `DV_DURATION` | `Duration` (Quantity, UCUM) | ↔ | ISO 8601 ↔ UCUM conversion required |
| `DV_DURATION` (in scheduling context) | `Timing` | ↔ | Archetype-level mapping (DAILY_TIMING / NON_DAILY_TIMING / SERVICE_DIRECTION / THERAPEUTIC_DIRECTION) |
| `DV_INTERVAL<DV_DATE_TIME>` / `DV_INTERVAL<DV_DATE>` | `Period` | ↔ | Inclusive only on FHIR side |

#### DV_DATE ↔ FHIR date / dateTime

| openEHR DV_DATE | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (0..1 ISO 8601 date) | `date` / `dateTime` | ↔ | Compact form expanded; precision implicit in lexical form |

`accuracy` and `magnitude_status` are dropped. Per-element conventions (e.g., `Patient.birthDate` + `birthTime` extension) take precedence over the generic mapping.

**Example - openEHR JSON**

```json
{
  "_type": "DV_DATE",
  "value": "202604"
}
```

**Example - FHIR JSON**

```json
{
  "valueDate": "2026-04"
}
```

The compact openEHR lexical form is expanded to FHIR's extended form without adding day precision.

#### DV_TIME ↔ FHIR time

| openEHR DV_TIME | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (0..1 ISO 8601 time) | `time` | ↔ | Compact form expanded; truncate fractional seconds beyond 3 digits when importing |
| Timezone offset | [timezone](https://hl7.org/fhir/extensions/StructureDefinition-timezone.html) extension | ↔ | FHIR `time` cannot carry a timezone natively |

**Example - openEHR JSON**

```json
{
  "_type": "DV_TIME",
  "value": "T143000+02:00"
}
```

**Example - FHIR JSON**

```json
{
  "valueTime": "14:30:00",
  "_valueTime": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/timezone",
        "valueCode": "+02:00"
      }
    ]
  }
}
```

#### DV_DATE_TIME ↔ FHIR dateTime / instant

| openEHR DV_DATE_TIME | FHIR Target | Direction | Notes |
|---|---|---|---|
| `value` (0..1 ISO 8601 date-time) | `dateTime` / `instant` | ↔ | Use `instant` for fully precise UTC values; `dateTime` otherwise |

**Example - openEHR JSON**

```json
{
  "_type": "DV_DATE_TIME",
  "value": "2026-04-13T10:15:30.123Z"
}
```

**Example - FHIR JSON**

```json
{
  "valueInstant": "2026-04-13T10:15:30.123Z"
}
```

When importing FHIR values with more than three fractional-second digits, truncate to the openEHR-supported precision.

**Example - openEHR JSON**

```json
{
  "_type": "DV_DATE_TIME",
  "value": "2026-04-13T10:15:30.123Z"
}
```

**Example - FHIR JSON**

```json
{
  "valueDateTime": "2026-04-13T10:15:30.123456789Z"
}
```

Some FHIR elements split date and time across a primitive value and an extension.

**Example - openEHR JSON**

```json
{
  "_type": "DV_DATE_TIME",
  "value": "1980-05-01T03:15:00+01:00"
}
```

**Example - FHIR JSON**

```json
{
  "resourceType": "Patient",
  "birthDate": "1980-05-01",
  "_birthDate": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/patient-birthTime",
        "valueDateTime": "1980-05-01T03:15:00+01:00"
      }
    ]
  }
}
```

#### DV_DURATION ↔ FHIR Duration / Timing

| openEHR DV_DURATION | FHIR Duration | Direction | Notes |
|---|---|---|---|
| `value` (0..1 ISO 8601 string) | `value` + `code` + `system` (UCUM) | ↔ | Conversion required |

ISO 8601 ↔ UCUM common forms (per the [duration-units](https://build.fhir.org/valueset-duration-units.html) value set):

| UCUM | ISO 8601 | Description |
|---|---|---|
| `ms` | `PT0.001S` | Milliseconds |
| `s` | `PT{n}S` | Seconds |
| `min` | `PT{n}M` | Minutes |
| `h` | `PT{n}H` | Hours |
| `d` | `P{n}D` | Days |
| `wk` | `P{n}W` | Weeks |
| `mo` | `P{n}M` | Months |
| `a` | `P{n}Y` | Years |

Calendar-based units (months, years) are not strictly convertible to fixed UCUM durations; see [UCUM §31](https://ucum.org/ucum#para-31). Sub-millisecond ISO 8601 values can lose precision in conversion. A reference conversion library is in progress (Severin).

For complex scheduling (dosage, treatment plans), `DV_DURATION` is one part of a larger archetype-level mapping to FHIR `Timing`. The four openEHR archetypes covering this space are `DAILY_TIMING`, `NON_DAILY_TIMING`, `SERVICE_DIRECTION` (non-medication), and `THERAPEUTIC_DIRECTION` (medication). Full timing/dosage mapping has been deferred to a dedicated session and is outside the scope of data-type-level mapping.

**Example - openEHR JSON**

```json
{
  "_type": "DV_DURATION",
  "value": "PT90M"
}
```

**Example - FHIR JSON**

```json
{
  "valueDuration": {
    "value": 90,
    "unit": "minute",
    "system": "http://unitsofmeasure.org",
    "code": "min"
  }
}
```

Calendar units are represented directly when the target accepts UCUM calendar units, but they are not interchangeable with fixed-length durations.

**Example - openEHR JSON**

```json
{
  "_type": "DV_DURATION",
  "value": "P1M"
}
```

**Example - FHIR JSON**

```json
{
  "valueDuration": {
    "value": 1,
    "unit": "month",
    "system": "http://unitsofmeasure.org",
    "code": "mo"
  }
}
```

For scheduling, `DV_DURATION` contributes to a larger archetype-level pattern rather than mapping by itself.

**Example - openEHR JSON**

```json
{
  "_type": "CLUSTER",
  "archetype_node_id": "openEHR-EHR-CLUSTER.daily_timing.v1",
  "items": [
    {
      "name": {
        "value": "frequency"
      },
      "value": {
        "_type": "DV_COUNT",
        "magnitude": 3
      }
    },
    {
      "name": {
        "value": "period"
      },
      "value": {
        "_type": "DV_DURATION",
        "value": "P1D"
      }
    }
  ]
}
```

**Example - FHIR JSON**

```json
{
  "repeat": {
    "frequency": 3,
    "period": 1,
    "periodUnit": "d"
  }
}
```

#### DV_INTERVAL ↔ FHIR Period (date/time)

| openEHR DV_INTERVAL\<T\> | FHIR Target | Notes |
|---|---|---|
| `lower` / `upper` | `Period.start` / `Period.end` | Mandatory upper time `lower` ≤ `upper` |
| `lower_unbounded` / `upper_unbounded` | Absence of the corresponding boundary value | |
| `lower_included` / `upper_included` | FHIR `Period` is inclusive only | Exclusive boundaries occur only in design-time constraints, not instance data |

Numeric `DV_INTERVAL` mappings (`Range`, multi-element `Quantity` with comparators) are covered in [Quantities](#quantities). The IG `DV_INTERVAL` StructureDefinition is missing the six boundary-related elements (`lower`, `upper`, `*_unbounded`, `*_included`); a rebuild is needed.

**Example - openEHR JSON**

```json
{
  "_type": "DV_INTERVAL",
  "lower": {
    "_type": "DV_DATE_TIME",
    "value": "2026-04-01T00:00:00Z"
  },
  "upper": {
    "_type": "DV_DATE_TIME",
    "value": "2026-04-30T23:59:59Z"
  },
  "lower_included": true,
  "upper_included": true
}
```

**Example - FHIR JSON**

```json
{
  "valuePeriod": {
    "start": "2026-04-01T00:00:00Z",
    "end": "2026-04-30T23:59:59Z"
  }
}
```

**Example - openEHR JSON**

```json
{
  "_type": "DV_INTERVAL",
  "lower_unbounded": true,
  "upper": {
    "_type": "DV_DATE",
    "value": "20260430"
  },
  "upper_included": true
}
```

**Example - FHIR JSON**

```json
{
  "valuePeriod": {
    "end": "2026-04-30"
  }
}
```


### Other Data

This section covers data types that do not fit cleanly into the categories above: encapsulated binary data (`DV_MULTIMEDIA`) and identifiers (`DV_IDENTIFIER`).

#### Type Mappings

| openEHR Type | FHIR Type | Direction | Notes |
|---|---|---|---|
| `DV_MULTIMEDIA` | `Attachment` | ↔ | Several gaps - see below |
| `DV_IDENTIFIER` | `Identifier` | ↔ | `system` vs. `issuer` is the main hurdle |

#### DV_MULTIMEDIA ↔ FHIR Attachment

| openEHR DV_MULTIMEDIA | FHIR Attachment | Direction | Notes |
|---|---|---|---|
| `data` (0..1 base64Binary) | `data` (0..1 base64Binary) | ↔ | Direct |
| `uri` (0..1 DV_URI) | `url` (0..1 url) | ↔ | Direct |
| `media_type` (1..1 CODE_PHRASE) | `contentType` (0..1 code) | ↔ | IANA MIME type |
| `size` (1..1 Integer) | `size` (0..1 integer64) | ↔ | Bytes |
| `language` (inherited) | `language` (0..1 code) | ↔ | Direct |
| `alternate_text` (1..1 string) | `title` (0..1 string) | ↔ | Display fallback |
| `compression_algorithm` (0..1 CODE_PHRASE) | _(no equivalent)_ | → | Gap - [FHIR-56003](https://jira.hl7.org/browse/FHIR-56003); decompress on conversion to avoid loss |
| `integrity_check` (0..1 base64Binary) | `hash` (0..1 base64Binary) | ↔ | FHIR `hash` defaults to SHA-1 |
| `integrity_check_algorithm` (0..1 CODE_PHRASE) | core extension `alternate-hash` (in progress) | → | [FHIR-55422](https://jira.hl7.org/browse/FHIR-55422) - resolved, awaiting publication |
| `thumbnail` (0..1 DV_MULTIMEDIA) | _(none)_ | → | Gap - [FHIR-56002](https://jira.hl7.org/browse/FHIR-56002) |
| `charset` (inherited) | _(MIME type parameter)_ | → | Move into the MIME type when applicable |
| _(none)_ | `creation` (0..1 dateTime) | ← (FHIR only) | Map to `CLUSTER.mediafile.created` archetype field, or drop |
| _(none)_ | `height` / `width` / `frames` / `duration` / `pages` | ← (FHIR only) | Map to a `CLUSTER.mediafile` "Additional details" cluster, or drop |

The `CLUSTER.mediafile` archetype - which wraps `DV_MULTIMEDIA` and adds the FHIR-only fields - is a closer mapping target than the bare `DV_MULTIMEDIA` and is recommended for full-fidelity round-tripping (pending review).

[Extended Media Details Cluster](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJGNlZTVmYjlhZjAyOTQ0YTg5MTIxMTA3OGY0NDNiYzRm)

![CleanShot 2026-04-14 at 15.03.39](https://hackmd.io/_uploads/BkZvYpo3-e.png)

:::spoiler

Below is a snaphshot of the ADL for the Extended Media Details Cluster

```
archetype (adl_version=1.4; uid=b2df064a-95f6-4089-9dcb-4cd0ec4bd450)
	openEHR-EHR-CLUSTER.extended_media_details.v0

concept
	[at0000]

language
	original_language = <[ISO_639-1::en]>

description
	original_author = <
		["date"] = <"2026-04-14">
		["name"] = <"Ian McNicoll">
		["organisation"] = <"freshEHR Clinical Informatics Ltd.">
		["email"] = <"ian@freshehr.com">
	>
	lifecycle_state = <"unmanaged">
	details = <
		["en"] = <
			language = <[ISO_639-1::en]>
		>
	>
	other_details = <
		["licence"] = <"This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/.">
		["custodian_organisation"] = <"openEHR Foundation">
		["original_namespace"] = <"org.openehr">
		["original_publisher"] = <"openEHR Foundation">
		["custodian_namespace"] = <"org.openehr">
		["MD5-CAM-1.0.1"] = <"85035f22f70ad642662d1c37c7c19d53">
		["build_uid"] = <"91bcf255-aca7-3b5c-908f-5ee6c5853de9">
	>

definition
	CLUSTER[at0000] matches {    -- Extended media details
		items cardinality matches {1..*; unordered} matches {
			ELEMENT[at0001] occurrences matches {0..1} matches {    -- Height
				value matches {
					DV_COUNT matches {*}
				}
			}
			ELEMENT[at0002] occurrences matches {0..1} matches {    -- Width
				value matches {
					DV_COUNT matches {*}
				}
			}
			ELEMENT[at0005] occurrences matches {0..1} matches {    -- Duration
				value matches {
					DV_COUNT matches {*}
				}
			}
			ELEMENT[at0004] occurrences matches {0..1} matches {    -- Frames
				value matches {
					DV_COUNT matches {*}
				}
			}
			ELEMENT[at0006] occurrences matches {0..1} matches {    -- Pages
				value matches {
					DV_COUNT matches {*}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Extended media details">
					description = <"Extended media details">
				>
				["at0001"] = <
					text = <"Height">
					description = <"">
				>
				["at0002"] = <
					text = <"Width">
					description = <"">
				>
				["at0004"] = <
					text = <"Frames">
					description = <"">
				>
				["at0005"] = <
					text = <"Duration">
					description = <"">
				>
				["at0006"] = <
					text = <"Pages">
					description = <"">
				>
			>
		>
	>
```

:::

**Example - openEHR JSON**

```json
{
  "_type": "DV_MULTIMEDIA",
  "media_type": {
    "terminology_id": {
      "value": "IANA_media-types"
    },
    "code_string": "image/png"
  },
  "charset": {
    "terminology_id": {
      "value": "IANA_character-sets"
    },
    "code_string": "UTF-8"
  },
  "language": {
    "terminology_id": {
      "value": "ISO_639-1"
    },
    "code_string": "en"
  },
  "alternate_text": "Chest x-ray thumbnail",
  "data": "iVBORw0KGgo=",
  "size": 8,
  "integrity_check": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  "integrity_check_algorithm": {
    "terminology_id": {
      "value": "openehr_integrity_check_algorithms"
    },
    "code_string": "SHA-256"
  },
  "compression_algorithm": {
    "terminology_id": {
      "value": "openehr_compression_algorithms"
    },
    "code_string": "gzip"
  },
  "thumbnail": {
    "_type": "DV_MULTIMEDIA",
    "media_type": {
      "terminology_id": {
        "value": "IANA_media-types"
      },
      "code_string": "image/png"
    },
    "data": "iVBORw0KGgo=",
    "size": 8,
    "alternate_text": "Thumbnail"
  }
}
```

**Example - FHIR JSON**

```json
{
  "contentType": "image/png; charset=UTF-8",
  "language": "en",
  "data": "iVBORw0KGgo=",
  "size": 8,
  "title": "Chest x-ray thumbnail",
  "hash": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  "extension": [
    {
      "url": "http://hl7.org/fhir/StructureDefinition/alternate-hash",
      "extension": [
        {
          "url": "algorithm",
          "valueCode": "SHA-256"
        },
        {
          "url": "hash",
          "valueBase64Binary": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU="
        }
      ]
    }
  ]
}
```

The `compression_algorithm` and `thumbnail` fields have no direct FHIR `Attachment` equivalent in the current mapping; the FHIR example therefore shows the decompressed attachment data and omits the thumbnail unless a `CLUSTER.mediafile` or another profile-level structure is used.





#### DV_IDENTIFIER ↔ FHIR Identifier

openEHR typically relies on internal record identifiers with external mapping, while FHIR uses multiple inline identifiers with categorization (`use`, `period`). Categorization is typically used by the assigner of an identifier (e.g in FHIR Demographics) to clarify its intended period and use, whilst in an openEHR EHR 'consumer of an external identifier', this is generally not required.

The system vs issuer mismatch (URI vs. free-text string) is the primary transformation challenge.


| openEHR DV_IDENTIFIER | FHIR Identifier | Direction | Notes |
|---|---|---|---|
| `id` (1..1 string) | `value` (0..1 string) | ↔ | Direct |
| `issuer` (0..1 string) | `system` (0..1 uri) | ↔ | If `issuer` is not a valid URI, fall back to `http://openehr.org/identifier/{issuer}` (placeholder pending TSMG/TI guidance on URN vs. URI) |
| `assigner` (0..1 string) | `assigner` (0..1 Reference) | ↔ | Encoded as `system::value` in openEHR; FHIR-side prefers `assigner.identifier`, falling back to `Organization.identifier` |
| `type` (0..1 string) | `type` (0..1 CodeableConcept) | ↔ | Encoded as `system::value`; if multiple codings exist, use the `userSelected = true` coding or the first one |
| _(none)_ | `use` (0..1 code) | → (FHIR only) | Categorization; archetype-level handling |
| _(none)_ | `period` (0..1 Period) | → (FHIR only) | Validity; archetype-level handling |

Conventions:

- The `::` separator uses the **last** occurrence in the literal so URLs with embedded `::` (e.g., IPv6 URIs) are unambiguous.
- Skip the `http://openehr.org/identifier/*` placeholder URLs when going FHIR → openEHR (they exist only for the reverse direction).
- If `::` notation is provided, use the embedded system on the FHIR side instead of the placeholder.
- Round-tripping can lose extended identifier metadata (e.g., `Identifier.assigner.display` when no Organization is referenced, additional `coding[]` entries on `Identifier.type`); this should be documented and surfaced to users.
- Where users need full FHIR `Identifier` fidelity (`use`, `period`, multiple types), an extended openEHR `CLUSTER.identifier` archetype is recommended (draft published; awaiting review).

**Example - openEHR JSON**

```json
{
  "_type": "DV_IDENTIFIER",
  "issuer": "https://www.charite.de/fhir/sid/patientenidentifikation",
  "assigner": "https://www.medizininformatik-initiative.de/fhir/core/CodeSystem/core-location-identifier::Charite",
  "id": "147725268",
  "type": "http://terminology.hl7.org/CodeSystem/v2-0203::MR"
}
```

**Example - FHIR JSON**

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
      "value": "Charite"
    },
    "display": "Charite"
  }
}
```

The FHIR `assigner.display` value above is convenient for humans but is not preserved by the bare `DV_IDENTIFIER` round-trip unless it is also represented in `assigner.identifier` or an extended identifier archetype.

**Example - openEHR JSON**

```json
{
  "_type": "DV_IDENTIFIER",
  "issuer": "LocalMRNAuthority",
  "assigner": "http://example.org/fhir/sid/organization::ORG-7",
  "id": "A12345",
  "type": "MR"
}
```

**Example - FHIR JSON**

```json
{
  "type": {
    "coding": [
      {
        "system": "http://openehr.org/identifier/type",
        "code": "MR"
      }
    ]
  },
  "system": "http://openehr.org/identifier/LocalMRNAuthority",
  "value": "A12345",
  "assigner": {
    "identifier": {
      "system": "http://example.org/fhir/sid/organization",
      "value": "ORG-7"
    }
  }
}
```

In normal use in a patient record, as a consumer of an identifer 'use' and 'period' are rarely significant. The major use cases are in handling demographic entities and managing e.g. temporary patient identifiers. Occasionally, where the the EHR is also an assigner/manager of the identifier, it might want to explicitly use the extended Cluster to handle use/period

We provide an example CLUSTER if users require the fields of use and period and want support for several types.

`Draft Extended openEHR Identifier archetype`

![Extended demographics identifier](https://hackmd.io/_uploads/Hkkhd81Jzl.png)

:::spoiler

Following is the ADL for the above draft.

```
archetype (adl_version=1.4; uid=7618e697-b605-4233-b57c-1335b0c86d70)
	openEHR-EHR-CLUSTER.extended_demographics_identifier.v0

concept
	[at0000]

language
	original_language = <[ISO_639-1::en]>

description
	original_author = <
		["date"] = <"2026-05-11">
		["name"] = <"Ian McNicoll">
		["organisation"] = <"freshEHR Clinical Informatics Ltd.">
		["email"] = <"ian@freshehr.com">
	>
	lifecycle_state = <"in_development">
	other_contributors = <"Gino Canessa","Microsoft">
	details = <
		["en"] = <
			language = <[ISO_639-1::en]>
		>
	>
	other_details = <
		["licence"] = <"This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/.">
		["custodian_organisation"] = <"openEHR Foundation">
		["original_namespace"] = <"org.openehr">
		["original_publisher"] = <"openEHR Foundation">
		["custodian_namespace"] = <"org.openehr">
		["MD5-CAM-1.0.1"] = <"dc69dd12bc9627d07a92b37b8060829f">
		["build_uid"] = <"1e4f24ca-3a90-37d4-9b3b-8eeb7c97fde3">
		["revision"] = <"0.0.1">
	>

definition
	CLUSTER[at0000] matches {    -- Extended Demographics Identifier
		items cardinality matches {0..*; unordered} matches {
			ELEMENT[at0003] occurrences matches {0..1} matches {    -- ID
				value matches {
					DV_IDENTIFIER matches {*}
				}
			}
			ELEMENT[at0002] occurrences matches {0..1} matches {    -- Use
				value matches {
					DV_CODED_TEXT matches {*}
				}
			}
			ELEMENT[at0001] occurrences matches {0..1} matches {    -- Period
				value matches {
					DV_INTERVAL<DV_DATE_TIME> matches {*}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Extended Demographics Identifier">
					description = <"Example cluster showing extended mapping for FHIR patient identifiers">
				>
				["at0003"] = <
					text = <"ID">
					description = <"Actual system, value, and type of FHIR identifier.">
				>
				["at0002"] = <
					text = <"Use">
					description = <"The purpose of this identifier.">
				>
				["at0001"] = <
					text = <"Period">
					description = <"Time period when id is/was valid for use">
				>
			>
		>
	>
```

:::



# Remaining - mapping

The workgroup still has several open questions and/or items that need to be finalized.

## openEHR

- **Cluster archetypes referenced inline.** The mapping doc carries direct links and screenshots for the supporting archetypes; the draft only names them.
    - [Draft Extended openEHR Identifier archetype](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJDRlODYxNzUwNjkwMzQ5MThhNmViNTIwNmNlOTRlMDE0) - draft only says "extended `CLUSTER.identifier` archetype is recommended".
    - [Draft FHIR Narrative Cluster archetype](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJDM1ZTlmZjQzZjA0YjQ1NGNiYTUyNzVmYzEwMzNjODU3) - draft mentions the cluster but does not link it.
    - `CLUSTER.mediafile` - [Media File archetype viewer](https://tools.openehr.org/designer/#/viewer/shared/Pz9zaGFyZWRJZD0xJGNlZTVmYjlhZjAyOTQ0YTg5MTIxMTA3OGY0NDNiYzRm) - draft names it but does not link it.
- **Null flavour code-mapping detail.**
    - L1/L2 inheritance table for `null_flavours` → `data-absent-reason` (the L2 codes that inherit from each L1, e.g. `asked-unknown`, `temp-unknown`, `not-asked`, `negative-infinity`, `positive-infinity` → 253; `asked-declined`, `not-permitted` → 272). The draft only carries a 4-row L1 summary.
    - HL7 `iso21090-nullFlavor` ↔ `null_flavours` table (NI, INV, MSK, NA, UNK, NP and inheriting children). The draft notes the legacy extension exists but does not enumerate the mapping.
    - Field-level `data-absent-reason` extension and `Observation.dataAbsentReason` mapping tables (e.g., `defining_code.code_string` → `extension.valueCode`; `defining_code.terminology_id` → fixed extension URL). The draft assumes these without spelling them out.
- **DV_PROPORTION worked examples.** The draft now includes a `pk_integer_fraction` example and a MedicationAdministration `rateRatio` example with an openEHR `mg/h` `DV_QUANTITY` equivalent. The Medication Details strength presentation and Service Timings worked examples from the mapping doc are still not reproduced.
- **Coded-data binding-and-expectations table.** The "Bindings and Expectations / To FHIR" matrix (binding strength × cardinality interaction for `code` / `Coding`) from the mapping doc is not in the draft.
- **CodeSystem inventory.** The "Key openEHR CodeSystems" table (`null_flavours`, `normal_statuses`, `proportion_kind`, `term_mapping_purpose`, `compression_algorithms`, `integrity_check_algorithms`, `character_sets`) appears in the mapping doc but not the draft.
- **Supporting types `REFERENCE_RANGE<T>` and `LINK` definitions.** The mapping doc lists their fields in the "Supporting Types" table; the draft mentions them in prose only.
- **`DV_DURATION` → FHIR `Timing` archetype example.** The draft now includes a compact `DAILY_TIMING` JSON example, but not the annotated screenshot or the full four-archetype composition from the mapping doc.
- **TERM_MAPPING.purpose discussion.** The draft now includes a `coding-purpose` JSON example, but still does not enumerate all open options (add openEHR purposes to `coding-purpose`, use the openEHR CodeSystem directly, [alternate-codes](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-alternate-codes.html) extension).
- **`defining_code` semantics options.** Mapping doc lists three explicit options (`coding.userSelected`, `coding-purpose#original`, request `#defining_code` via [HTA-170](https://jira.hl7.org/browse/HTA-170)); the draft summarizes only the working consensus.
- **IG issues called out.** Mapping doc enumerates known openEHR IG StructureDefinition gaps (e.g., `DV_INTERVAL` missing six boundary fields, `DV_ENCAPSULATED` parenting `DV_AMOUNT`, `DV_TIME` / `DV_DATE_TIME` parenting `DV_ORDERED`, copy-paste description errors). The draft mentions one or two of these in passing.

## FHIR

- **Validation expectations and "no value + extension".** The draft now includes primitive examples with extension-only absent values and value-plus-extension cases, but the explicit decision to treat structural validation as out-of-scope is still not summarized.
- **`Quantity.comparator` value `ad`.** Mapping doc carries a clarification ("a quantity is sufficient as part of a sum to meet an understood need"). The draft includes the row but with a less precise gloss.
- **`~` comparator status detail.** Mapping doc records the FHIR-I outcome ([FHIR-56000](https://jira.hl7.org/browse/FHIR-56000)): `~` is added in R6 with default ±10% tolerance and a pointer to [quantity-confidenceInterval](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-confidenceInterval.html). The draft notes ±10% but not the confidence-interval extension link.
- **`Identifier.assigner` round-trip rules.** Mapping doc spells out the lookup order (`reference.identifier`, then `Organization.identifier`) and the documented data loss for `assigner.display`. Draft summarizes but loses these rules.
- **Identifier placeholder URI options.** Mapping doc captures the open question on `http://openehr.org/identifier/...` vs. `urn:openehr:identifier:...` (URN preferred per TSMG/TI guidance). Draft only mentions the placeholder.
- **`system` + `version` ↔ `terminology_id` candidates.** Mapping doc lists three candidates (`|`, `(version)`, `#`) with the rationale for each; draft lists only the candidates.
- **Open Action Items tables.** Mapping doc maintains FHIR-side, openEHR-side, and documentation/tooling action tables with owners, priorities, and linked tickets ([FHIR-56000](https://jira.hl7.org/browse/FHIR-56000), [FHIR-56001](https://jira.hl7.org/browse/FHIR-56001), [FHIR-56002](https://jira.hl7.org/browse/FHIR-56002), [FHIR-56003](https://jira.hl7.org/browse/FHIR-56003), [FHIR-55422](https://jira.hl7.org/browse/FHIR-55422), [HTA-170](https://jira.hl7.org/browse/HTA-170)). The draft does not carry any of this tracking.
- **Cross-Cutting Concerns section.** The standalone summaries in the mapping doc - Terminology URI ↔ Terminology ID, Character Encoding, ISO 8601 subset, DV_AMOUNT pattern - are scattered across the relevant sections in the draft but not collected as a cross-cutting summary.
- **Gap tables.** Mapping doc carries explicit "Gaps: openEHR → FHIR" and "Gaps: FHIR → openEHR" tables with status (Open / Decision made / Under discussion / Not discussed). Draft conveys gaps in prose only.
- **ConceptMaps.** Mapping doc records the plan to author formal FHIR `ConceptMap` resources for `null_flavours` ↔ `data-absent-reason` and `null_flavours` ↔ `iso21090-nullFlavor`, plus `normal_statuses` ↔ HL7 v2 `Interpretation`. Draft mentions ConceptMaps in passing for the null flavour case only.

---

# Remaining - not discussed

Data types defined in the openEHR Foundation Types / Reference Model or in the FHIR R6 datatypes page that have not been addressed in either the working mapping doc or this draft. Listed for completeness; not all warrant a mapping.

## openEHR

### Concrete types not yet mapped

- `DV_GENERAL_TIME_SPECIFICATION` - free-text scheduling expression (e.g., HL7 GTS-style); deferred with the FHIR `Timing` archetype-level mapping work.
- `DV_PERIODIC_TIME_SPECIFICATION` - structured periodic schedule; same deferral.

### Supporting / RM-level constructs

These appear as fields of mapped types but are not themselves the subject of a per-type mapping.

- `REFERENCE_RANGE<T>` - referenced as the type of `other_reference_ranges`; field mapping (`meaning`, `range`) only described inline under DV_QUANTITY.
- `CODE_PHRASE` - covered as a building block under DV_CODED_TEXT; no standalone mapping section.
- `OBJECT_REF` / `LOCATABLE_REF` - flagged in the LINK / PARTY_IDENTIFIED discussion as the candidate target of a future RM unification; not mapped today.
- `PARTY_REF` - referenced from `PARTY_IDENTIFIED.external_ref`; not separately mapped.
- `ARCHETYPED`, `LOCATABLE`, `PATHABLE`, `LINK` (Common IM), `FEEDER_AUDIT*` - structural Common-IM types that appear in the IG package but are out of scope for data-type-level mapping.

### Foundation Types

- The structure types (`List<T>`, `Set<T>`, `Hash<K,V>`, etc.) are out of scope at the data-type level; they correspond to repetitions/cardinality at the FHIR element level.

## FHIR

### Primitives not separately discussed

- `id` - opaque resource/element identifier; not a `DV_` mapping target.
- `base64Binary` - implicit in `DV_MULTIMEDIA.data` ↔ `Attachment.data`; not discussed as a standalone primitive.

### General-purpose datatypes not discussed

- `Address` - structured postal address. No openEHR data-type counterpart; carried at archetype level (e.g., demographic clusters).
- `HumanName` - structured personal name; archetype-level concern in openEHR.
- `ContactPoint` - phone, email, etc.; archetype-level in openEHR.
- `Annotation` - `text` + `author[x]` + `time`; partially overlaps with `DV_TEXT` plus authoring metadata, but no mapping has been considered.
- `Signature` - cryptographic signature with `who`, `when`, `data`, `targetFormat`; no openEHR data-type equivalent (signatures live in `AUDIT_DETAILS` / `ATTESTATION` at the RM level).
- `SampledData` - sampled waveform data. openEHR typically conveys this via specific archetypes (e.g., `OBSERVATION.waveform`); no data-type-level mapping.
- `RatioRange` - new in R5; combines `Ratio` and `Range` semantics. Could relate to `DV_INTERVAL<DV_PROPORTION>` but no `DV_PROPORTION`-typed interval is currently used in openEHR.
- `RelativeTime` - new in R6 (anchored relative time). No openEHR counterpart identified.
- `Age` - `Quantity` constrained to age units. Not separately mapped; subsumed under `DV_QUANTITY` ↔ `Quantity` with archetype-level constraints.
- `Distance` - `Quantity` constrained to distance units. Same treatment as `Age`.
- `Dosage` - dosing instructions composite. Deferred with the FHIR `Timing` / openEHR timing-archetype mapping work.

### Special-purpose / metadata datatypes not discussed

These are largely confined to `MetadataResource` / definitional contexts and are unlikely to have data-type-level openEHR counterparts; listed for completeness.

- `Meta` - resource metadata header.
- `Narrative` - `Resource.text`. Touched on indirectly via the FHIR Narrative cluster archetype discussion; not mapped as a datatype.
- Metadata types: `Availability`, `ContactDetail`, `ExtendedContactDetail`, `DataRequirement`, `Expression`, `MonetaryComponent`, `ParameterDefinition`, `RelatedArtifact`, `TriggerDefinition`, `UsageContext`, `VirtualServiceDetail`.
- Framework types: `Element`, `BackboneElement`, `BackboneType`, `DataType`, `PrimitiveType` - structural/abstract; not user-facing datatypes.
- `Extension` - the extensibility mechanism. Used throughout the draft as a target for many openEHR attributes (precision, accuracy, language, timezone, mimeType, etc.) but not itself a "datatype mapping".