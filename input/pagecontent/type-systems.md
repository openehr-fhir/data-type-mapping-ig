### Two type systems, two shapes

A mapping between openEHR and FHIR is a claim about **two external
standards**. Neither is redefined here. This page describes each type system as
its own specification describes it, so that the mapping pages can be read
without holding both specifications open.

### The openEHR type system

openEHR splits its type system across two specifications.

- The [Foundation Types](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html)
  specification, in the BASE component, defines the low-level **primitive**
  types (`Boolean`, `String`, `Integer`, `Integer64`, `Real`, `Double`), the
  **structure** types (`List<T>`, `Set<T>`, and friends), the **`Interval<T>`**
  family, and the **ISO 8601 time** types (`Iso8601_date`, `Iso8601_time`,
  `Iso8601_date_time`, `Iso8601_duration`). These are not themselves data
  values. They are the building blocks the `DV_` classes are defined in terms
  of, and in the temporal cases they are direct ancestors of the corresponding
  `DV_` type.
- The [Data Types Information Model](https://specifications.openehr.org/releases/RM/latest/data_types.html),
  in the Reference Model, defines the clinical and scientific `DV_`
  **data-value** hierarchy built on top of them.

The root of the data-value hierarchy is the abstract class `DATA_VALUE`. It
defines no attributes of its own; it is the common ancestor of every type that
can be carried in an `ELEMENT.value` slot. Concrete classes are named with the
`DV_` prefix in `UPPER_SNAKE_CASE`, and their attributes in `lower_snake_case`.

Beneath `DATA_VALUE`, abstract intermediate classes — `DV_ORDERED`,
`DV_QUANTIFIED`, `DV_AMOUNT`, `DV_TEMPORAL`, `DV_ENCAPSULATED`, and others —
establish semantics that groups of concrete types inherit. Those inherited
attributes are the reason an openEHR value is often structurally larger than the
FHIR type it maps to: a `DV_QUANTITY` brings a magnitude, units, precision,
accuracy, magnitude status, a normal range, other reference ranges, and a normal
status, most of them inherited rather than declared on `DV_QUANTITY` itself.

openEHR draws **no structural distinction between categories of data type**.
Every `DV_` value is a class with one or more attributes, and a value that
semantically wraps a single primitive — `DV_BOOLEAN`, `DV_URI` — still inherits
whatever structure its abstract ancestors define. Generic types such as
`DV_INTERVAL<T : DV_ORDERED>` are parameterised by an ordered data-value type.

Alongside the `DV_` hierarchy the RM defines **supporting types** that are not
data values but are referenced by them:

| Type | Role |
|-|-|
| `CODE_PHRASE` | A `terminology_id` + `code_string` pair, with an optional `preferred_term`, anchoring coded data. |
| `TERM_MAPPING` | A mapping from a term to an equivalent, broader, or narrower term in another terminology. |
| `REFERENCE_RANGE<T>` | A named range with a `meaning` (`DV_TEXT`) and a `range` (`DV_INTERVAL<T>`). |
| `LINK` | Defined in the [Common Information Model](https://specifications.openehr.org/releases/RM/latest/common.html); a logical relationship between archetype nodes. |

Above the data types, openEHR layers Reference Model classes — `ELEMENT`,
`CLUSTER`, `OBSERVATION`, `COMPOSITION` — that carry data values in their
`value` slots, and **archetypes** and operational templates that constrain those
structures for a clinical or jurisdictional use case. Archetypes play a role
broadly comparable to FHIR profiles: permitted units, value sets, reference
ranges, and cardinalities are expressed there rather than at the data-type
level.

### The FHIR type system

FHIR defines its type system on the
[Data Types](https://hl7.org/fhir/R5/datatypes.html) page of the core
specification.

- `Base` is the abstract root and defines no characteristics.
- `Element` inherits from `Base` and defines `id` and `extension`, common to
  every data element in FHIR save a few that prohibit them.
- `DataType` inherits from `Element` and separates data types from the elements
  of the specification itself.

The concrete types derived from `DataType` fall into two families.

**Primitive types** inherit from `PrimitiveType`, are defined as
`StructureDefinition` resources with `kind` = `primitive-type`, carry a single
value, cannot have child elements, and are camelCased — `boolean`, `integer`,
`string`, `dateTime`. In JSON a primitive is a JSON value, so its `id` and
`extension` live in an implicitly declared sibling property: `"valueDateTime"`
alongside `"_valueDateTime": { "id": … }`.

**Complex types** inherit from `DataType` directly, are defined with `kind` =
`complex-type`, have child elements, and are PascalCased — `Coding`,
`CodeableConcept`, `Quantity`, `Period`, `Identifier`, `Reference`. In JSON a
complex type is a JSON object, so `id` and `extension` are ordinary properties
of it.

Above the data types, FHIR defines **Resources** composed of elements, and
**Profiles** that constrain resources for a use case or jurisdiction.

### Conceptual differences

Three differences account for most of the fidelity loss this guide records.

**The word *primitive* means different things.** A FHIR `string` is a single
textual value with optional `id` and `extension`. An openEHR `DV_TEXT` is a
class with `value`, `formatting`, `hyperlink`, `language`, `encoding`, and
`mappings`. The two are not the same kind of thing, and a `DV_TEXT` carrying
anything beyond `value` cannot land in a FHIR `string` without loss.

**Context that openEHR carries in the value, FHIR carries in the resource.**
`normal_range`, `other_reference_ranges`, and `normal_status` are attributes of
an openEHR value. Their FHIR counterparts — `Observation.referenceRange`,
`Observation.interpretation` — are elements of a *resource*. A mapping for one
of these is only expressible at archetype/resource scope, and this guide marks
such rows accordingly.

**Structure that openEHR carries in the value, FHIR carries in the type
choice.** `DV_TEXT.formatting` says *what kind* of content the string holds;
FHIR expresses the same thing by choosing the `markdown` type instead of
`string` — except where the element predates `markdown` and is typed `string`
with a narrative description saying it holds markdown. The two mechanisms do not
line up one-to-one.

### Where to go next

- **[Conventions](conventions.html)** — how to read the mapping tables, and what
  each fidelity and maturity value means.
- **[Data Type Mapping](mapping.html)** — the mappings themselves, by category.
- **[Cross-Cutting Concerns](cross-cutting.html)** — the questions that are not
  about any one type.
